// ===============================================
//  PANEL WEB DE IZUKU BOT
//
//  Un servidor HTTP chiquito y sin dependencias
//  externas (solo el módulo http de Node) que sirve:
//
//    /            -> el panel (página web)
//    /healthz     -> "ok" para Render / Docker / uptime
//    /api/...     -> estado, QR, código de vinculación,
//                    ajustes, comandos, sub-bots, logs
//
//  Está pensado para Render.com: escucha en 0.0.0.0,
//  usa el puerto que da el host (PORT) y arranca el bot
//  solo, sin necesidad de consola.
//
//  SEGURIDAD: todas las rutas /api piden la clave del
//  panel (PANEL_PASSWORD, o una generada que aparece en
//  los logs). El panel NO queda abierto para cualquiera.
// ===============================================

import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../config.js'
import db from './database.js'
import { plugins } from './loader.js'
import { bus, session, snapshot, getLogs, clearLogs, log, STATUS } from './session.js'
import { fieldsForPanel, saveFromPanel, resetSettings, settingsSummary } from './config.js'
import { listSubBots } from './subbot.js'
import { BANNER_FILE, DATABASE_DIR, MEDIA_DIR, SESSIONS_DIR } from './paths.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PANEL_DIR = path.join(__dirname, '..', 'panel')
const KEY_FILE = path.join(DATABASE_DIR, 'panel.key')
const MAX_BANNER = 8 * 1024 * 1024 // 8 MB
const MAX_BODY = 1024 * 1024       // 1 MB para JSON

/** Acciones que le pasa el bot al panel (las define index.js) */
let handlers = {}
export function setPanelHandlers(h) { handlers = { ...handlers, ...h } }

// ------------------------------------------------------------------
//  Clave del panel
// ------------------------------------------------------------------

let CLAVE = null
let CLAVE_ORIGEN = 'generada'

function cargarClave() {
  const delEntorno = process.env.PANEL_PASSWORD || process.env.PANEL_KEY || process.env.PANEL_PASS
  if (delEntorno) {
    CLAVE = String(delEntorno)
    CLAVE_ORIGEN = 'variable de entorno'
    return CLAVE
  }
  try {
    if (fs.existsSync(KEY_FILE)) {
      const guardada = fs.readFileSync(KEY_FILE, 'utf-8').trim()
      if (guardada.length >= 8) { CLAVE = guardada; CLAVE_ORIGEN = 'generada'; return CLAVE }
    }
  } catch {}
  CLAVE = crypto.randomBytes(9).toString('base64url') // 12 caracteres
  CLAVE_ORIGEN = 'generada'
  try {
    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true })
    fs.writeFileSync(KEY_FILE, CLAVE, { mode: 0o600 })
  } catch {}
  return CLAVE
}

export const panelKey = () => CLAVE

function claveValida(recibida) {
  if (!CLAVE || typeof recibida !== 'string' || recibida.length !== CLAVE.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(recibida), Buffer.from(CLAVE))
  } catch { return false }
}

function autorizado(req, url) {
  const cabecera = req.headers['x-panel-key'] || req.headers['authorization']
  const deQuery = url.searchParams.get('k')
  const deCookie = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith('panel_key='))
  const candidatas = [
    cabecera && String(cabecera).replace(/^Bearer\s+/i, ''),
    deQuery,
    deCookie && decodeURIComponent(deCookie.slice('panel_key='.length))
  ].filter(Boolean)
  return candidatas.some(claveValida)
}

// ------------------------------------------------------------------
//  Utilidades HTTP
// ------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
}

function json(res, code, data) {
  const cuerpo = JSON.stringify(data)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-store'
  })
  res.end(cuerpo)
}

function archivo(res, ruta, { cache = 'no-store' } = {}) {
  try {
    const datos = fs.readFileSync(ruta)
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(ruta).toLowerCase()] || 'application/octet-stream',
      'Content-Length': datos.length,
      'Cache-Control': cache
    })
    res.end(datos)
    return true
  } catch {
    return false
  }
}

function leerCuerpo(req, limite = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const trozos = []
    let total = 0
    req.on('data', (c) => {
      total += c.length
      if (total > limite) { reject(new Error('El archivo es demasiado grande.')); req.destroy(); return }
      trozos.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(trozos)))
    req.on('error', reject)
  })
}

async function leerJson(req) {
  const buf = await leerCuerpo(req, MAX_BODY)
  if (!buf.length) return {}
  try { return JSON.parse(buf.toString('utf-8')) } catch { throw new Error('JSON inválido.') }
}

/** Datos del sistema para la pestaña "Sistema" */
function stats() {
  const mem = process.memoryUsage()
  const usuarios = Object.keys(db.data.users || {}).length
  const chats = Object.keys(db.data.chats || {}).length
  const subbots = listSubBots()
  return {
    uptime: process.uptime(),
    arrancado: session.startedAt,
    node: process.version,
    plataforma: `${os.platform()} ${os.arch()}`,
    memoriaMB: +(mem.rss / 1048576).toFixed(1),
    heapMB: +(mem.heapUsed / 1048576).toFixed(1),
    cpu: os.cpus()?.[0]?.model || 'desconocido',
    usuarios,
    chats,
    comandos: plugins.size,
    subbots: subbots.length,
    subbotsActivos: subbots.filter((s) => s.activo).length,
    reconexiones: session.restarts,
    entorno: process.env.RENDER ? 'Render' : process.env.DYNO ? 'Heroku' : process.env.FLY_APP_NAME ? 'Fly.io' : process.env.DOCKER ? 'Docker' : 'Local',
    carpetaSesion: SESSIONS_DIR,
    discoPersistente: !SESSIONS_DIR.startsWith(process.cwd()),
    claveOrigen: CLAVE_ORIGEN
  }
}

/** Estado completo que ve el panel */
function estadoCompleto(req) {
  return {
    sesion: snapshot(),
    ajustes: fieldsForPanel(),
    resumen: settingsSummary(),
    stats: stats(),
    subbots: listSubBots(),
    banner: bannerInfo(),
    claveOrigen: CLAVE_ORIGEN,
    url: urlPublica(req)
  }
}

/** URL pública (Render la inyecta sola en RENDER_EXTERNAL_URL) */
function urlPublica(req) {
  if (process.env.PANEL_URL) return process.env.PANEL_URL
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL
  const host = req?.headers?.host
  if (host) return `${req.headers['x-forwarded-proto'] || 'http'}://${host}`
  return null
}

/** ¿Qué imagen usa el menú ahora mismo? */
function bannerInfo() {
  const ruta = config.menuImage || ''
  const esUrl = /^https?:\/\//i.test(ruta)
  let archivo = null
  if (!esUrl && ruta) {
    const abs = path.resolve(process.cwd(), ruta)
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) archivo = abs
  }
  return {
    valor: ruta,
    esUrl,
    // Sin imagen el menú se manda solo con texto (no inventamos ninguno)
    existe: !!archivo,
    esBannerSubido: archivo === BANNER_FILE,
    peso: archivo ? fs.statSync(archivo).size : 0,
    actualizado: archivo ? fs.statSync(archivo).mtimeMs : null
  }
}

/** Tipo real de una imagen mirando sus primeros bytes (no nos fiamos del nombre) */
function mimeDeImagen(buffer) {
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp'
  if (buffer.slice(0, 3).toString() === 'GIF') return 'image/gif'
  return null
}

// ------------------------------------------------------------------
//  Rutas
// ------------------------------------------------------------------

async function api(req, res, url, ruta) {
  const sock = handlers.getSocket?.() || null

  // ---- Estado ----
  if (ruta === '/api/status' && req.method === 'GET') {
    return json(res, 200, { ok: true, ...estadoCompleto(req), logs: getLogs().slice(-80) })
  }

  if (ruta === '/api/logs' && req.method === 'GET') {
    const desde = Number(url.searchParams.get('since') || 0)
    return json(res, 200, { ok: true, logs: getLogs(desde) })
  }

  if (ruta === '/api/logs' && req.method === 'DELETE') {
    clearLogs()
    return json(res, 200, { ok: true })
  }

  // ---- Stream en vivo (Server-Sent Events) ----
  if (ruta === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    })
    const enviar = (evento, datos) => {
      try { res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`) } catch {}
    }
    enviar('hola', { sesion: snapshot(), stats: stats(), subbots: listSubBots(), banner: bannerInfo() })

    const alEvento = ({ tipo, payload }) => {
      if (tipo === 'log') enviar('log', payload)
      else if (tipo === 'session') enviar('sesion', { sesion: snapshot(), stats: stats() })
      else enviar('cambio', { tipo, payload })
    }
    bus.on('event', alEvento)
    const ping = setInterval(() => { try { res.write(': ping\n\n') } catch {} }, 20000)
    req.on('close', () => { clearInterval(ping); bus.off('event', alEvento) })
    return
  }

  // ---- Vinculación ----
  if (ruta === '/api/connect' && req.method === 'POST') {
    const { method = 'qr', phone = '' } = await leerJson(req)
    if (!['qr', 'pairing'].includes(method)) return json(res, 400, { ok: false, error: 'Método inválido.' })
    if (!handlers.connect) return json(res, 503, { ok: false, error: 'El bot todavía se está iniciando, espera unos segundos.' })
    try {
      const r = await handlers.connect({ method, phone: String(phone).replace(/\D/g, '') })
      return json(res, 200, { ok: true, ...r, sesion: snapshot() })
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message, sesion: snapshot() })
    }
  }

  if (ruta === '/api/pairing' && req.method === 'POST') {
    const { phone = '' } = await leerJson(req)
    const numero = String(phone).replace(/\D/g, '')
    if (numero.length < 8 || numero.length > 15) {
      return json(res, 400, { ok: false, error: 'Escribe el número con código de país, sin + ni espacios (ej: 59896719709).' })
    }
    if (!handlers.requestPairing) return json(res, 503, { ok: false, error: 'El bot todavía se está iniciando.' })
    try {
      const paring = await handlers.requestPairing(numero)
      return json(res, 200, { ok: true, pairing: paring, sesion: snapshot() })
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message, sesion: snapshot() })
    }
  }

  if (ruta === '/api/logout' && req.method === 'POST') {
    if (!handlers.logout) return json(res, 503, { ok: false, error: 'Nada que cerrar.' })
    try {
      await handlers.logout()
      return json(res, 200, { ok: true, sesion: snapshot() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message }) }
  }

  if (ruta === '/api/restart' && req.method === 'POST') {
    try {
      await handlers.restart?.()
      return json(res, 200, { ok: true, sesion: snapshot() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message }) }
  }

  if (ruta === '/api/session' && req.method === 'DELETE') {
    if (session.status === STATUS.OPEN) {
      return json(res, 400, { ok: false, error: 'El bot está conectado. Primero cierra la sesión (Cerrar sesión) y después bórrala.' })
    }
    try {
      await handlers.wipeSession?.()
      return json(res, 200, { ok: true, mensaje: 'Sesión borrada. Ya puedes vincular de nuevo.', sesion: snapshot() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message }) }
  }

  // ---- Ajustes ----
  if (ruta === '/api/settings' && req.method === 'GET') {
    return json(res, 200, { ok: true, ajustes: fieldsForPanel(), resumen: settingsSummary() })
  }

  if (ruta === '/api/settings' && req.method === 'POST') {
    const patch = await leerJson(req)
    const r = saveFromPanel(patch)
    if (r.ok) log(`⚙️ Ajustes actualizados desde el panel: ${r.cambios.join(', ')}`, 'ok')
    return json(res, r.ok ? 200 : 400, { ...r, ajustes: fieldsForPanel(), resumen: settingsSummary(), config: undefined })
  }

  if (ruta === '/api/settings/reset' && req.method === 'POST') {
    resetSettings()
    log('⚙️ Ajustes restaurados a los valores de config.js', 'warn')
    return json(res, 200, { ok: true, ajustes: fieldsForPanel(), resumen: settingsSummary() })
  }

  // ---- Banner del menú ----
  if (ruta === '/api/banner' && req.method === 'GET') {
    const info = bannerInfo()
    if (info.esUrl) return json(res, 200, { ok: true, tipo: 'url', url: config.menuImage, ...info })
    if (!info.existe) return json(res, 404, { ok: false, error: 'No hay banner configurado.' })
    const img = path.resolve(process.cwd(), config.menuImage)
    const bytes = fs.readFileSync(img)
    res.writeHead(200, {
      // tipo real de la imagen (no nos fiamos de la extensión del archivo)
      'Content-Type': mimeDeImagen(bytes) || MIME[path.extname(img).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Length': bytes.length
    })
    return res.end(bytes)
  }

  if (ruta === '/api/banner' && req.method === 'POST') {
    const tipo = (req.headers['content-type'] || '').split(';')[0].trim()
    if (!/^image\//.test(tipo)) return json(res, 400, { ok: false, error: 'Sube una imagen (JPG, PNG o WEBP).' })
    let buf
    try { buf = await leerCuerpo(req, MAX_BANNER) } catch (e) { return json(res, 413, { ok: false, error: e.message }) }
    if (!buf.length) return json(res, 400, { ok: false, error: 'La imagen llegó vacía, intenta de nuevo.' })
    try {
      fs.mkdirSync(MEDIA_DIR, { recursive: true })
      fs.writeFileSync(BANNER_FILE, buf)
      const r = saveFromPanel({ menuImage: './media/banner.jpg' })
      if (!r.ok) return json(res, 400, { ok: false, error: r.errores.join(' ') })
      log(`🖼️ Banner del menú actualizado desde el panel (${(buf.length / 1024).toFixed(0)} KB)`, 'ok')
      return json(res, 200, { ok: true, banner: bannerInfo(), ajustes: fieldsForPanel() })
    } catch (e) {
      return json(res, 500, { ok: false, error: `No se pudo guardar el banner: ${e.message}` })
    }
  }

  if (ruta === '/api/banner' && req.method === 'DELETE') {
    const r = saveFromPanel({ menuImage: '' })
    if (!r.ok) return json(res, 400, { ok: false, error: r.errores.join(' ') })
    try { fs.rmSync(BANNER_FILE, { force: true }) } catch {}
    log('🖼️ Banner del menú quitado desde el panel', 'warn')
    return json(res, 200, { ok: true, banner: bannerInfo(), ajustes: fieldsForPanel() })
  }

  // ---- Comandos ----
  if (ruta === '/api/commands' && req.method === 'GET') {
    const lista = [...plugins.values()].map((p) => ({
      command: p.command,
      category: p.category || 'info',
      desc: p.desc || '',
      owner: !!p.owner,
      rowner: !!p.rowner,
      admin: !!p.admin,
      botAdmin: !!p.botAdmin,
      group: !!p.group,
      private: !!p.private,
      register: !!p.register,
      hidden: !!p.hidden
    }))
    return json(res, 200, { ok: true, total: lista.length, comandos: lista })
  }

  if (ruta === '/api/commands/run' && req.method === 'POST') {
    const { command = '', args = [] } = await leerJson(req)
    if (!command) return json(res, 400, { ok: false, error: 'Falta el comando.' })
    if (!handlers.runCommand) return json(res, 503, { ok: false, error: 'El bot no está conectado a WhatsApp todavía.' })
    try {
      const salida = await handlers.runCommand({ command: String(command).replace(/^\W+/, ''), args: Array.isArray(args) ? args : String(args).split(/\s+/).filter(Boolean) })
      return json(res, 200, { ok: true, ...salida })
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message })
    }
  }

  // ---- Sub-bots ----
  if (ruta === '/api/subbots' && req.method === 'GET') {
    return json(res, 200, { ok: true, subbots: listSubBots(), limite: config.maxSubBots })
  }

  if (ruta === '/api/subbots' && req.method === 'POST') {
    const { phone = '', method = 'qr' } = await leerJson(req)
    const numero = String(phone).replace(/\D/g, '')
    if (numero.length < 8 || numero.length > 15) return json(res, 400, { ok: false, error: 'Número inválido: escríbelo con código de país, sin + ni espacios.' })
    if (!handlers.startSubBot) return json(res, 503, { ok: false, error: 'El bot principal todavía no está conectado.' })
    try {
      await handlers.startSubBot({ phone: numero, method })
      return json(res, 200, { ok: true, subbots: listSubBots() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message, subbots: listSubBots() }) }
  }

  if (ruta === '/api/subbots/code' && req.method === 'POST') {
    const { phone = '' } = await leerJson(req)
    try {
      const paring = await handlers.subBotCode?.(String(phone).replace(/\D/g, ''))
      if (!paring) return json(res, 400, { ok: false, error: 'No se pudo generar el código todavía. Espera unos segundos y vuelve a intentar.' })
      return json(res, 200, { ok: true, pairing: paring, subbots: listSubBots() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message, subbots: listSubBots() }) }
  }

  if (ruta === '/api/subbots' && req.method === 'DELETE') {
    const phone = String(url.searchParams.get('phone') || '').replace(/\D/g, '')
    if (!phone) return json(res, 400, { ok: false, error: 'Falta el número del sub-bot.' })
    try {
      await handlers.stopSubBot?.(phone)
      log(`🤖 Sub-bot +${phone} detenido desde el panel`, 'warn')
      return json(res, 200, { ok: true, subbots: listSubBots() })
    } catch (e) { return json(res, 400, { ok: false, error: e.message }) }
  }

  // ---- Difusión y base de datos ----
  if (ruta === '/api/broadcast' && req.method === 'POST') {
    const { text = '', target = 'groups' } = await leerJson(req)
    if (!String(text).trim()) return json(res, 400, { ok: false, error: 'Escribe el mensaje a enviar.' })
    if (!sock) return json(res, 503, { ok: false, error: 'El bot no está conectado a WhatsApp.' })
    try {
      const salida = await handlers.broadcast?.({ text: String(text), target })
      return json(res, 200, { ok: true, ...salida })
    } catch (e) { return json(res, 400, { ok: false, error: e.message }) }
  }

  if (ruta === '/api/database/save' && req.method === 'POST') {
    db.save(true)
    log('💾 Base de datos guardada desde el panel', 'ok')
    return json(res, 200, { ok: true, guardado: true })
  }

  if (ruta === '/api/database/compact' && req.method === 'POST') {
    const borrados = db.compactar(60)
    log(`🧹 Base de datos compactada: ${borrados} usuario(s) inactivo(s) fuera`, 'ok')
    return json(res, 200, { ok: true, borrados })
  }

  return json(res, 404, { ok: false, error: 'Ruta no encontrada.' })
}

// ------------------------------------------------------------------
//  Servidor
// ------------------------------------------------------------------

const intentos = new Map() // IP -> { n, hasta }

function limitarIntentos(ip) {
  const ahora = Date.now()
  const reg = intentos.get(ip)
  if (!reg || ahora > reg.hasta) { intentos.set(ip, { n: 1, hasta: ahora + 60_000 }); return true }
  reg.n++
  return reg.n <= 20
}

export function startPanel({ port = process.env.PORT || process.env.PANEL_PORT || 3000, host = '0.0.0.0' } = {}) {
  cargarClave()

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const ruta = url.pathname.replace(/\/+$/, '') || '/'

    // CORS para poder usar el panel desde otro dominio (por ejemplo un proxy)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Panel-Key, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

    try {
      // ---- Público ----
      if (ruta === '/healthz') return json(res, 200, { ok: true, estado: session.status, conectado: session.status === STATUS.OPEN, uptime: Math.round(process.uptime()) })

      if (ruta === '/' || ruta === '/panel' || ruta === '/index.html') {
        if (archivo(res, path.join(PANEL_DIR, 'index.html'))) return
        return json(res, 500, { ok: false, error: 'No se encontró panel/index.html' })
      }

      if (ruta === '/app.js' || ruta === '/style.css' || ruta === '/favicon.svg') {
        if (archivo(res, path.join(PANEL_DIR, ruta.slice(1)))) return
        res.writeHead(404); return res.end()
      }

      // ---- Todo lo demás necesita la clave ----
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local').split(',')[0].trim()
      if (!autorizado(req, url)) {
        if (!limitarIntentos(ip)) return json(res, 429, { ok: false, error: 'Demasiados intentos. Espera un minuto.' })
        return json(res, 401, { ok: false, error: 'Clave incorrecta o ausente.', necesitaClave: true })
      }

      if (ruta.startsWith('/api/')) return await api(req, res, url, ruta)

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404')
    } catch (e) {
      log(`Error en el panel: ${e.message}`, 'error')
      if (!res.headersSent) json(res, 500, { ok: false, error: e.message })
      else { try { res.end() } catch {} }
    }
  })

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') log(`El puerto ${port} está ocupado: cambia PORT o PANEL_PORT. El bot sigue funcionando.`, 'error')
    else log(`No se pudo encender el panel web: ${e.message}`, 'error')
  })

  server.listen(port, host, () => {
    const base = urlPublica(null)?.replace(/\/$/, '')
    log(`🌐 Panel web escuchando en ${host}:${port}`, 'ok')
    if (base) {
      const enlace = CLAVE_ORIGEN === 'generada' ? `${base}/?k=${CLAVE}` : base
      log(`🔗 Abre tu panel: ${enlace}`, 'ok')
    }
    log(`🔐 Clave del panel (${CLAVE_ORIGEN}): ${CLAVE_ORIGEN === 'generada' ? CLAVE : 'la que pusiste en PANEL_PASSWORD'}`, 'info')
  })

  return server
}

export default { startPanel, setPanelHandlers, panelKey }
