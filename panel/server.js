import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../config.js'
import db from '../lib/database.js'
import { cancelLink, getState, startLink, unlink } from '../lib/connection.js'
import { ValidationError } from '../lib/errors.js'
import { loadPlugins, plugins } from '../lib/loader.js'
import {
  currentSettings, localBannerPath, removeBanner, saveBanner, updateSettings
} from '../lib/settings.js'
import { subBots } from '../lib/subbot.js'

/*
 * Panel web de Izuku Bot.
 *  - Vincular la cuenta por QR o por codigo de 8 digitos
 *  - Cambiar nombre, dueño, prefijos, modos, economia, canal...
 *  - Subir o quitar el banner del menu
 *  - Ver los comandos cargados
 *
 * Esta protegido por la variable de entorno PANEL_PASSWORD.
 * Sin esa variable el panel no deja entrar a nadie.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(here, 'public')
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))

const PASSWORD = (process.env.PANEL_PASSWORD || '').trim()
const COOKIE = 'izuku_panel'
const SESSION_MS = 12 * 60 * 60 * 1000
const MAX_JSON = 64 * 1024
const MAX_IMAGE_BODY = 12 * 1024 * 1024  // la imagen en base64 pesa ~1.37x
const MAX_IMAGE = 8 * 1024 * 1024
const MAX_FAILS = 5
const LOCK_MS = 60 * 1000

const STATIC = {
  '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { file: 'index.html', type: 'text/html; charset=utf-8' },
  '/app.js': { file: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/style.css': { file: 'style.css', type: 'text/css; charset=utf-8' }
}

const sessions = new Map()   // token -> expiresAt
const failures = new Map()   // ip -> { count, until }

const digest = (s) => crypto.createHash('sha256').update(String(s)).digest()

function passwordOk(input) {
  if (!PASSWORD || typeof input !== 'string') return false
  return crypto.timingSafeEqual(digest(input), digest(PASSWORD))
}

function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function isAuthed(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return false
  const exp = sessions.get(token)
  if (!exp) return false
  if (exp < Date.now()) { sessions.delete(token); return false }
  return true
}

const isSecure = (req) => req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https'

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'local'

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  )
}

function sendJson(res, status, body, headers = {}) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    ...headers
  })
  res.end(data)
}

function sendFile(res, file, type, cache = 'no-cache') {
  const data = fs.readFileSync(file)
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Cache-Control': cache })
  res.end(data)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let tooBig = false
    req.on('data', (chunk) => {
      if (tooBig) return
      size += chunk.length
      if (size > limit) {
        tooBig = true
        reject(new ValidationError('Los datos enviados son demasiado grandes.'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => { if (!tooBig) resolve(Buffer.concat(chunks)) })
    req.on('error', reject)
  })
}

async function readJson(req, limit = MAX_JSON) {
  const raw = (await readBody(req, limit)).toString('utf-8')
  if (!raw.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('no es objeto')
    return parsed
  } catch {
    throw new ValidationError('Los datos enviados no son un JSON válido.')
  }
}

/** Devuelve el tipo de imagen real (por firma de bytes), o null si no es JPG/PNG. */
function imageKind(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  return null
}

function statusPayload() {
  return {
    connection: getState(),
    bot: {
      name: config.botName,
      prefix: config.prefix,
      version: pkg.version,
      commands: plugins.size,
      users: Object.keys(db.data.users).length,
      subbots: subBots.size,
      maxSubBots: config.maxSubBots,
      uptimeSec: Math.floor(process.uptime())
    }
  }
}

function commandsPayload() {
  const list = [...plugins.values()]
    .map((p) => ({
      category: p.category || 'info',
      commands: p.command,
      desc: p.desc || '',
      hidden: !!p.hidden,
      owner: !!p.owner,
      rowner: !!p.rowner,
      admin: !!p.admin,
      botAdmin: !!p.botAdmin,
      group: !!p.group,
      private: !!p.private,
      register: !!p.register
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.commands[0].localeCompare(b.commands[0]))
  return { total: plugins.size, prefix: config.prefix, commands: list }
}

async function handleApi(req, res, url) {
  const p = url.pathname
  const m = req.method

  if (p === '/api/session' && m === 'GET') {
    return sendJson(res, 200, { passwordConfigured: !!PASSWORD, authenticated: isAuthed(req) })
  }

  if (p === '/api/login' && m === 'POST') {
    if (!PASSWORD) {
      return sendJson(res, 503, { error: 'Falta la variable PANEL_PASSWORD en el servidor. Defínela y reinicia el bot.' })
    }
    const ip = clientIp(req)
    const f = failures.get(ip) || { count: 0, until: 0 }
    if (f.until > Date.now()) {
      const wait = Math.ceil((f.until - Date.now()) / 1000)
      return sendJson(res, 429, { error: `Demasiados intentos. Espera ${wait} segundos.` })
    }
    const body = await readJson(req)
    if (!passwordOk(body.password)) {
      f.count++
      if (f.count >= MAX_FAILS) { f.count = 0; f.until = Date.now() + LOCK_MS }
      failures.set(ip, f)
      return sendJson(res, 401, { error: 'Contraseña incorrecta.' })
    }
    failures.delete(ip)
    const token = crypto.randomBytes(32).toString('base64url')
    sessions.set(token, Date.now() + SESSION_MS)
    const cookie = `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${isSecure(req) ? '; Secure' : ''}`
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie })
  }

  if (p === '/api/logout' && m === 'POST') {
    const token = parseCookies(req.headers.cookie)[COOKIE]
    if (token) sessions.delete(token)
    return sendJson(res, 200, { ok: true }, {
      'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isSecure(req) ? '; Secure' : ''}`
    })
  }

  // Desde aqui todo requiere sesion
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' })

  if (p === '/api/status' && m === 'GET') {
    return sendJson(res, 200, statusPayload())
  }

  if (p === '/api/link' && m === 'POST') {
    const body = await readJson(req)
    await startLink({ method: body.method, phone: body.phone })
    return sendJson(res, 200, statusPayload())
  }

  if (p === '/api/link/cancel' && m === 'POST') {
    cancelLink()
    return sendJson(res, 200, statusPayload())
  }

  if (p === '/api/unlink' && m === 'POST') {
    await unlink()
    return sendJson(res, 200, statusPayload())
  }

  if (p === '/api/settings' && m === 'GET') {
    return sendJson(res, 200, { settings: currentSettings() })
  }

  if (p === '/api/settings' && m === 'PUT') {
    const body = await readJson(req)
    return sendJson(res, 200, { settings: updateSettings(body) })
  }

  if (p === '/api/banner' && m === 'GET') {
    const file = localBannerPath()
    if (file) {
      const type = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
      return sendFile(res, file, type)
    }
    return sendJson(res, 404, { error: 'No hay banner local.', url: config.menuImage || null })
  }

  if (p === '/api/banner' && m === 'POST') {
    const body = await readJson(req, MAX_IMAGE_BODY)
    const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(body.data || ''))
    if (!match) throw new ValidationError('Sube una imagen JPG o PNG.')
    const buffer = Buffer.from(match[2], 'base64')
    if (buffer.length > MAX_IMAGE) throw new ValidationError('La imagen es muy pesada (máximo 8 MB).')
    const kind = imageKind(buffer)
    if (!kind) throw new ValidationError('El archivo no es una imagen JPG o PNG válida.')
    const ref = saveBanner(buffer, kind)
    return sendJson(res, 200, { ok: true, menuImage: ref, settings: currentSettings() })
  }

  if (p === '/api/banner/remove' && m === 'POST') {
    removeBanner()
    return sendJson(res, 200, { ok: true, settings: currentSettings() })
  }

  if (p === '/api/commands' && m === 'GET') {
    return sendJson(res, 200, commandsPayload())
  }

  if (p === '/api/commands/reload' && m === 'POST') {
    await loadPlugins()
    return sendJson(res, 200, commandsPayload())
  }

  return sendJson(res, 404, { error: 'Ruta no encontrada.' })
}

async function handle(req, res) {
  securityHeaders(res)
  const url = new URL(req.url, 'http://panel')
  const p = url.pathname

  try {
    if (p === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
      return res.end('ok')
    }

    if (req.method === 'GET' && STATIC[p]) {
      return sendFile(res, path.join(PUBLIC_DIR, STATIC[p].file), STATIC[p].type)
    }

    if (p.startsWith('/api/')) return await handleApi(req, res, url)

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('No encontrado')
  } catch (e) {
    if (e.statusCode) return sendJson(res, e.statusCode, { error: e.message })
    console.error('[panel]', e)
    if (!res.headersSent) return sendJson(res, 500, { error: `Error interno: ${e.message}` })
    res.end()
  }
}

/** Arranca el panel web. Devuelve la url local y el servidor. */
export function startPanel() {
  const port = Number(process.env.PORT) || 3000
  const host = process.env.HOST || '0.0.0.0'
  const url = `http://localhost:${port}`

  if (process.env.PANEL === 'false') return { url, server: null }

  const server = http.createServer((req, res) => { handle(req, res) })
  server.on('error', (e) => console.error(`[panel] No se pudo iniciar en el puerto ${port}: ${e.message}`))
  server.listen(port, host, () => {
    console.log(`🌐 Panel de control: ${url}`)
    if (!PASSWORD) console.log('⚠️  Define PANEL_PASSWORD para poder entrar al panel.')
  })
  return { url, server }
}
