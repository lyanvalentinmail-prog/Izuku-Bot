// ===============================================
//  ESTADO DE LA SESIÓN DE WHATSAPP
//
//  Acá se guarda TODO lo que necesita el panel web:
//  en qué estado está la conexión, el QR real que
//  mandó WhatsApp, el código de vinculación real,
//  la sesión de la que colgamos y las últimas líneas
//  de la consola.
//
//  Regla de oro: el QR y el código que se muestran son
//  SIEMPRE los que devuelve WhatsApp/Baileys. Nunca se
//  inventa ni se simula uno.
// ===============================================

import { EventEmitter } from 'events'

/** Bus de eventos: el panel lo usa para el stream en vivo (SSE) */
export const bus = new EventEmitter()
bus.setMaxListeners(0)

/** Estados posibles de la conexión */
export const STATUS = {
  IDLE: 'idle',                 // sin iniciar
  STARTING: 'starting',         // creando el socket
  QR: 'qr',                     // esperando que escanees el QR
  PAIRING: 'pairing',           // esperando que escribas el código de 8 dígitos
  CONNECTING: 'connecting',     // WhatsApp está validando
  OPEN: 'open',                 // conectado y funcionando
  RECONNECTING: 'reconnecting', // se cayó y está volviendo
  CLOSED: 'closed',             // cerrado
  LOGGED_OUT: 'loggedOut'       // sesión cerrada en el teléfono
}

const MAX_LOGS = 250

export const session = {
  status: STATUS.IDLE,
  method: null,        // 'qr' | 'pairing'
  phone: null,         // número que se está vinculando
  qr: null,            // { data, image, receivedAt, expiresAt, count }
  pairing: null,       // { phone, code, pretty, createdAt, expiresAt, error }
  me: null,            // { id, phone, name }
  error: null,
  registered: false,
  startedAt: Date.now(),
  connectedAt: null,
  restarts: 0,
  attempts: 0,
  logoutRequested: false
}

const logs = []

/** Agrega una línea a la consola del panel (y a la consola real) */
export function log(texto, level = 'info') {
  const linea = { t: Date.now(), level, text: String(texto) }
  logs.push(linea)
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS)
  const prefijo = { info: '▸', ok: '✔', warn: '!', error: '✖' }[level] || '▸'
  if (level === 'error') console.error(`${prefijo} ${linea.text}`)
  else console.log(`${prefijo} ${linea.text}`)
  emit('log', linea)
  return linea
}

export function getLogs(since = 0) {
  return logs.filter((l) => l.t > since)
}

export function clearLogs() {
  logs.length = 0
  emit('log', { t: Date.now(), level: 'info', text: '— consola limpia —' })
}

function emit(tipo, payload) {
  bus.emit('event', { tipo, payload, at: Date.now() })
}

/** Avisa al panel que algo cambió (por ejemplo, el QR de un sub-bot) */
export function notificar(tipo, payload = null) {
  emit(tipo, payload)
}

/** Cambia el estado de la sesión y avisa al panel al instante */
export function setSession(patch = {}) {
  const cambios = {}
  for (const [k, v] of Object.entries(patch)) {
    if (JSON.stringify(session[k]) === JSON.stringify(v)) continue
    session[k] = v
    cambios[k] = v
  }
  if (Object.keys(cambios).length) emit('session', cambios)
  return session
}

/**
 * Guarda el QR que envió WhatsApp.
 * El `image` es un PNG en base64 (data URL) generado localmente con la
 * librería `qrcode`: se puede escanear desde el navegador.
 */
export async function setQr(data, ttl = 60_000) {
  let image = null
  try {
    const { default: QRCode } = await import('qrcode')
    image = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 460,
      color: { dark: '#0b1220', light: '#ffffff' }
    })
  } catch (e) {
    log(`No se pudo dibujar el QR en el panel (${e.message}). Igual sirve el código de texto.`, 'warn')
  }
  const anterior = session.qr
  setSession({
    status: STATUS.QR,
    qr: {
      data,
      image,
      receivedAt: Date.now(),
      // WhatsApp deja vivir cada QR un rato y después lo invalida:
      // el primero 60 s y los siguientes 20 s (Baileys los renueva solo)
      expiresAt: Date.now() + ttl,
      count: (anterior?.count || 0) + 1
    },
    pairing: null,
    error: null
  })
  return session.qr
}

export function clearQr() {
  setSession({ qr: null })
}

/**
 * Guarda el código de vinculación REAL que devolvió WhatsApp.
 * Si algo falla se guarda el error tal cual, nunca un código inventado.
 */
export function setPairing({ phone, code = null, pretty = null, error = null, expiresAt = null } = {}) {
  setSession({
    pairing: {
      phone,
      code,
      pretty,
      error,
      createdAt: Date.now(),
      expiresAt: expiresAt || (code ? Date.now() + 60_000 : null)
    }
  })
  return session.pairing
}

export function clearPairing() {
  setSession({ pairing: null, phone: null })
}

/** Datos del usuario conectado */
export function setMe(user, phone = null) {
  if (!user) return setSession({ me: null })
  const numero = phone || String(user.id || '').split(/[:@]/)[0]
  setSession({
    me: { id: user.id, phone: numero, name: user.name || user.verifiedName || null },
    connectedAt: Date.now(),
    error: null
  })
  return session.me
}

/** ¿Está conectado el bot principal? */
export function isConnected() {
  return session.status === STATUS.OPEN
}

/** Copia segura (sin el socket) para mandar por HTTP */
export function snapshot() {
  return {
    ...session,
    qr: session.qr ? { ...session.qr } : null,
    pairing: session.pairing ? { ...session.pairing } : null,
    now: Date.now()
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default { session, STATUS, bus, log, notificar, setSession, setQr, clearQr, setPairing, clearPairing, setMe, isConnected, snapshot, getLogs, clearLogs, sleep }
