// ===============================================
//  BOTS DESDE REPOSITORIOS
//
//  Pegas el enlace de un repositorio de GitHub y
//  el bot clona sus plugins (comandos) para usarlos
//  aquí mismo: "se usa ese bot" sin instalar nada a mano.
//
//  Flujo:
//    installRepo(url) -> git clone --depth 1 en bots/
//                      -> busca archivos plugin (*.js con
//                         export default + run)
//                      -> los carga en el mismo mapa de
//                         plugins del bot
//
//  La lista de repos instalados vive en database/repos.json
//  y se restaura sola cada vez que arranca el bot.
// ===============================================

import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { loadPlugin, plugins } from './loader.js'
import { DATABASE_DIR, REPOS_DIR, ensureDirs } from './paths.js'
import { log, notificar } from './session.js'

const exec = promisify(execFile)
const REPOS_FILE = path.join(DATABASE_DIR, 'repos.json')
const CLONE_TIMEOUT = 180_000 // 3 minutos
const PROFUNDIDAD_MAX = 6

/** En instalación ahora mismo (evita clonar dos veces) */
const instalando = new Set()

// ------------------------------------------------------------------
//  Registro de repositorios instalados
// ------------------------------------------------------------------

let cache = null

function cargar() {
  if (cache) return cache
  try {
    cache = JSON.parse(fs.readFileSync(REPOS_FILE, 'utf-8'))
    if (!Array.isArray(cache)) cache = []
  } catch { cache = [] }
  return cache
}

function guardar() {
  try {
    fs.mkdirSync(DATABASE_DIR, { recursive: true })
    fs.writeFileSync(REPOS_FILE, JSON.stringify(cargar(), null, 2))
  } catch {}
}

/** Cuenta cuántos plugins de ese repo están cargados ahora mismo */
function contarCargados(id) {
  let n = 0
  for (const p of plugins.values()) if (p.repo === id) n++
  return n
}

/** Vista pública para el panel */
export function listRepos() {
  return cargar().map((r) => ({ ...r, cargados: contarCargados(r.id) }))
}

// ------------------------------------------------------------------
//  URL de GitHub -> { owner, repo, branch }
// ------------------------------------------------------------------

export function parsearRepositorio(entrada) {
  let s = String(entrada || '').trim()
  s = s.replace(/^git@github\.com:/i, '')
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, '')
  s = s.replace(/^github\.com\//i, '')
  s = s.replace(/\.git\/?$/i, '')
  s = s.replace(/^\/+|\/+$/g, '')
  const m = s.match(/^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)(?:\/tree\/([A-Za-z0-9._/-]+))?/)
  if (!m) return null
  const [, owner, repo, branch] = m
  if (owner === '.' || repo === '.' || owner.includes('..') || repo.includes('..')) return null
  return { owner, repo, branch: branch || null }
}

// ------------------------------------------------------------------
//  Descubrir y cargar plugins del repositorio
// ------------------------------------------------------------------

const OMITIR = new Set(['node_modules', '.git', '.github', 'test', 'tests', '__tests__', 'docs', 'doc', 'example', 'examples', 'assets', 'img', 'images', 'media', 'locales'])

/** Busca candidatos a plugin: .js dentro de carpetas plugins/commands y .js de la raíz */
function buscarCandidatos(raiz, rel = '', prof = 0, out = []) {
  if (prof > PROFUNDIDAD_MAX) return out
  const abs = path.join(raiz, rel)
  let entradas = []
  try { entradas = fs.readdirSync(abs, { withFileTypes: true }) } catch { return out }
  for (const e of entradas) {
    if (e.name.startsWith('.') || OMITIR.has(e.name.toLowerCase())) continue
    const relHijo = path.join(rel, e.name)
    if (e.isDirectory()) {
      buscarCandidatos(raiz, relHijo, prof + 1, out)
    } else if (e.name.endsWith('.js')) {
      const enCarpetaPlugin = rel.split(path.sep).some((p) => /^(plugins|commands)$/i.test(p))
      if (enCarpetaPlugin || prof === 0) out.push(path.join(raiz, relHijo))
    }
  }
  return out
}

/** ¿Este archivo tiene pinta de plugin? (evita importar el index.js de un bot entero) */
function parecePlugin(file) {
  try {
    const src = fs.readFileSync(file, 'utf-8')
    return /export\s+default/.test(src) && /\brun\b\s*[:(=]/.test(src)
  } catch { return false }
}

/** Carga los plugins del repo y los marca con su repoId */
async function cargarPluginsDelRepo(dir, repoId) {
  const candidatos = buscarCandidatos(dir).filter(parecePlugin)
  let cargados = 0
  for (const file of candidatos) {
    try {
      await loadPlugin(file)
      const p = plugins.get(file)
      if (p) {
        p.repo = repoId
        if (!p.category) p.category = 'repo'
        cargados++
      }
    } catch { /* loadPlugin ya lo registra */ }
  }
  return { encontrados: candidatos.length, cargados }
}

/** Quita del mapa de plugins todo lo que venga de ese repo */
export function descargarPluginsDelRepo(repoId) {
  const prefijo = path.join(REPOS_DIR, repoId) + path.sep
  for (const file of [...plugins.keys()]) {
    if (file.startsWith(prefijo) || file === path.join(REPOS_DIR, repoId)) plugins.delete(file)
  }
}

// ------------------------------------------------------------------
//  Acciones principales
// ------------------------------------------------------------------

/** Instala un bot desde GitHub: clona el repo y usa sus comandos. */
export async function installRepo(url, branch = '') {
  const info = parsearRepositorio(url)
  if (!info) throw new Error('Enlace no válido. Usa https://github.com/usuario/repositorio')
  const rama = String(branch || info.branch || '').trim() || null
  const id = `${info.owner}__${info.repo}`
  const dir = path.join(REPOS_DIR, id)

  if (instalando.has(id)) throw new Error('Ese repositorio ya se está instalando, espera unos segundos.')
  if (cargar().some((r) => r.id === id) && fs.existsSync(dir)) {
    throw new Error('Ese repositorio ya está instalado. Usa «Recargar» o «Quitar».')
  }

  instalando.add(id)
  try {
    ensureDirs()
    fs.rmSync(dir, { recursive: true, force: true })

    const args = ['clone', '--depth', '1', '--single-branch']
    if (rama) args.push('--branch', rama)
    args.push(`https://github.com/${info.owner}/${info.repo}.git`, dir)

    try {
      await exec('git', args, { timeout: CLONE_TIMEOUT, maxBuffer: 8 * 1024 * 1024 })
    } catch (e) {
      fs.rmSync(dir, { recursive: true, force: true })
      if (e.code === 'ENOENT') throw new Error('El servidor no tiene git instalado. Instala git para usar bots por repositorio.')
      const msg = String(e.stderr || e.message || '').trim().split('\n').filter(Boolean).slice(-2).join(' ')
      throw new Error(`No se pudo clonar el repositorio: ${msg}`)
    }

    const { encontrados, cargados } = await cargarPluginsDelRepo(dir, id)

    if (!cargados) {
      descargarPluginsDelRepo(id)
      fs.rmSync(dir, { recursive: true, force: true })
      throw new Error(encontrados
        ? 'El repositorio se clonó pero sus plugins no son compatibles (necesitan export default con run).'
        : 'El repositorio no tiene plugins (carpetas plugins/ o commands/ con comandos).')
    }

    const registro = {
      id,
      owner: info.owner,
      repo: info.repo,
      branch: rama,
      url: `https://github.com/${info.owner}/${info.repo}`,
      instalado: Date.now(),
      comandos: cargados
    }
    cache = [...cargar().filter((r) => r.id !== id), registro]
    guardar()

    log(`📦 Bot ${info.owner}/${info.repo} instalado desde GitHub: ${cargados} comando(s)`, 'ok')
    notificar('repos')
    return registro
  } finally {
    instalando.delete(id)
  }
}

/** Recarga los plugins de un repo ya instalado (por si cambió algo) */
export async function reloadRepo(id) {
  const registro = cargar().find((r) => r.id === id)
  if (!registro) throw new Error('Ese repositorio no está instalado.')
  const dir = path.join(REPOS_DIR, id)
  if (!fs.existsSync(dir)) {
    // Se perdió la carpeta (redespliegue sin disco): se clona otra vez
    return installRepo(registro.url, registro.branch || '')
  }
  descargarPluginsDelRepo(id)
  const { cargados } = await cargarPluginsDelRepo(dir, id)
  registro.comandos = cargados
  guardar()
  log(`📦 Bot ${registro.owner}/${registro.repo} recargado: ${cargados} comando(s)`, 'ok')
  notificar('repos')
  return registro
}

/** Quita un bot por repositorio: borra sus comandos y su carpeta */
export async function removeRepo(id) {
  const registro = cargar().find((r) => r.id === id)
  if (!registro) throw new Error('Ese repositorio no está instalado.')
  descargarPluginsDelRepo(id)
  fs.rmSync(path.join(REPOS_DIR, id), { recursive: true, force: true })
  cache = cargar().filter((r) => r.id !== id)
  guardar()
  log(`📦 Bot ${registro.owner}/${registro.repo} quitado del panel`, 'warn')
  notificar('repos')
  return true
}

/** Restaura los repos instalados al arrancar el bot */
export async function restoreRepos() {
  const lista = cargar()
  if (!lista.length) return
  log(`📦 Restaurando ${lista.length} bot(s) por repositorio...`)
  for (const registro of lista) {
    try {
      const dir = path.join(REPOS_DIR, registro.id)
      if (!fs.existsSync(dir)) {
        await installRepo(registro.url, registro.branch || '')
        continue
      }
      const { cargados } = await cargarPluginsDelRepo(dir, registro.id)
      registro.comandos = cargados
    } catch (e) {
      registro.error = e.message
      log(`✖ No se pudo restaurar ${registro.owner}/${registro.repo}: ${e.message}`, 'error')
    }
  }
  guardar()
}

export default { listRepos, installRepo, reloadRepo, removeRepo, restoreRepos, parsearRepositorio }
