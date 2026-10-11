import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import QR from 'qrcode-terminal'

import config from '../config.js'
import handler from '../handler.js'
import { addHelpers } from './helpers.js'
import { SUBBOTS_DIR, wipeDir } from './paths.js'
import { log, notificar } from './session.js'

const logger = pino({ level: 'silent' })

export { SUBBOTS_DIR }

/** Sub-bots activos: jid -> socket (se mantiene por compatibilidad) */
export const subBots = new Map()

/**
 * Ficha completa de cada sub-bot (estado, QR, código de vinculación...)
 * Es lo que muestra el panel web.
 */
export const subBotInfo = new Map()

/** Genera el QR en imagen para el panel (sin inventar nada: es el QR de WhatsApp) */
async function qrToImage(data) {
  try {
    const { default: QRCode } = await import('qrcode')
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M', margin: 2, width: 420,
      color: { dark: '#0b1220', light: '#ffffff' }
    })
  } catch { return null }
}

/** Números válidos (con código de país, sin + ni espacios) */
const soloDigitos = (n) => String(n ?? '').replace(/\D/g, '')

/** Vista pública (sin socket) para el panel */
export function listSubBots() {
  return [...subBotInfo.values()].map(({ socket, ...resto }) => ({
    ...resto,
    activo: subBots.has(resto.id),
    now: Date.now()
  }))
}

export function getSubBot(id) {
  const info = subBotInfo.get(soloDigitos(id))
  if (!info) return null
  const { socket, ...resto } = info
  return { ...resto, activo: subBots.has(resto.id), now: Date.now() }
}

/**
 * Pide el código de vinculación REAL de un sub-bot.
 * Si WhatsApp no lo da, se guarda el error y NUNCA se muestra un código falso.
 */
async function pedirCodigo(sock, info, { espera = 3000, reintentos = 2 } = {}) {
  for (let intento = 1; intento <= reintentos; intento++) {
    try {
      if (espera) await new Promise((r) => setTimeout(r, espera))
      if (sock.ws?.isClosed || sock.ws?.isClosing) throw new Error('La conexión se cerró antes de pedir el código.')
      const crudo = await sock.requestPairingCode(info.id)
      const limpio = String(crudo || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      if (limpio.length !== 8) throw new Error(`WhatsApp devolvió un código inesperado: ${crudo}`)
      info.pairing = {
        phone: info.id,
        code: limpio,
        pretty: limpio.match(/.{1,4}/g).join('-'),
        createdAt: Date.now(),
        expiresAt: Date.now() + 60_000,
        error: null
      }
      info.error = null
      info.status = 'pairing'
      log(`🔗 Sub-bot +${info.id}: código ${info.pairing.pretty}`, 'ok')
      notificar('subbots')
      return info.pairing
    } catch (e) {
      info.error = e.message
      notificar('subbots')
      if (intento === reintentos) {
        log(`✖ Sub-bot +${info.id}: no se pudo generar el código (${e.message})`, 'error')
        throw e
      }
      log(`Sub-bot +${info.id}: reintentando el código (${e.message})`, 'warn')
      await new Promise((r) => setTimeout(r, 2500))
    }
  }
}

/**
 * Inicia un sub-bot.
 * @param {object} opts
 * @param {string}  opts.id       carpeta de sesión (número del sub-bot)
 * @param {object}  opts.parent   socket del bot principal (para mandarle el código/QR)
 * @param {string}  opts.chat     chat donde responder
 * @param {object}  opts.m        mensaje original (para citar)
 * @param {boolean} opts.useCode  true = código de 8 dígitos, false = QR
 * @param {string}  opts.method   'qr' | 'pairing' (tiene prioridad sobre useCode)
 * @param {boolean} opts.silent   no mandar nada por WhatsApp
 */
export async function startSubBot({ id, parent, chat, m, useCode = true, method = null, silent = false }) {
  id = soloDigitos(id)

  if (!id || id.length < 8 || id.length > 15) {
    if (parent && chat) await parent.sendMessage(chat, { text: '⚠️ Número inválido. Escríbelo con código de país, sin + ni espacios.' })
    return null
  }

  // Si ese sub-bot ya está conectado no abrimos otra conexión (pasaría lo mismo que
  // abrir WhatsApp Web dos veces: WhatsApp cierra la anterior). Devolvemos la que hay.
  if (subBots.has(id)) {
    log(`🤖 El sub-bot +${id} ya estaba conectado.`, 'warn')
    return subBots.get(id)
  }

  if (subBots.size >= config.maxSubBots) {
    if (parent && chat) await parent.sendMessage(chat, { text: `⚠️ Se alcanzó el límite de sub-bots activos (${config.maxSubBots}).` })
    return null
  }

  const modo = method || (useCode ? 'pairing' : 'qr')

  const dir = path.join(SUBBOTS_DIR, id)
  fs.mkdirSync(dir, { recursive: true })

  const info = subBotInfo.get(id) || { id, phone: id, createdAt: Date.now() }
  Object.assign(info, { id, phone: id, method: modo, status: 'starting', error: null, parent, qr: null })
  subBotInfo.set(id, info)

  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: modo === 'pairing' ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: `${config.botName} Sub-Bot` })
  })

  addHelpers(sock)
  sock.isSubBot = true
  info.socket = sock

  // ---- Código de 8 dígitos real ----
  if (modo === 'pairing' && !sock.authState.creds.registered) {
    // Se guarda la promesa para que el panel pueda esperarla si la pide enseguida
    info.codigoPendiente = pedirCodigo(sock, info)
    info.codigoPendiente.then(async (paring) => {
      if (parent && chat && !silent && paring) {
        await parent.sendMessage(chat, {
          text: `🤖 *SUB-BOT — CÓDIGO DE VINCULACIÓN*\n\n` +
                `Tu código: *${paring.pretty}*\n\n` +
                `1. Abre WhatsApp en el número +${id}\n` +
                `2. Ajustes > Dispositivos vinculados\n` +
                `3. Vincular con número de teléfono\n` +
                `4. Escribe el código\n\n_El código expira en 60 segundos._`
        }, { quoted: m }).catch(() => {})
      }
    }).catch(async (e) => {
      if (parent && chat && !silent) {
        await parent.sendMessage(chat, { text: `❌ No se pudo generar el código de vinculación.\n\n_${e.message}_\n\nVuelve a intentar con *${config.prefix[0]}jadibot ${id}*` }).catch(() => {})
      }
    }).finally(() => { info.codigoPendiente = null })
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // ---- QR real de WhatsApp ----
    if (qr && modo === 'qr') {
      info.qr = {
        data: qr,
        image: await qrToImage(qr),
        receivedAt: Date.now(),
        // el primer QR vive 60 s y los siguientes 20 s (igual que en el bot principal)
        expiresAt: Date.now() + ((info.qr?.count || 0) === 0 ? 60_000 : 20_000),
        count: (info.qr?.count || 0) + 1
      }
      info.status = 'qr'
      notificar('subbots')
      if (!silent) {
        try { QR.generate(qr, { small: true }) } catch {}
        if (parent && chat) {
          try {
            const { default: axios } = await import('axios')
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`
            const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
            await parent.sendMessage(chat, {
              image: Buffer.from(img.data),
              caption: '🤖 *SUB-BOT*\n\nEscanea este QR desde\nWhatsApp > Dispositivos vinculados.\n\n_Expira en 60 segundos._'
            }, { quoted: m })
          } catch {}
        }
      }
    }

    if (connection === 'connecting') { info.status = 'connecting'; notificar('subbots') }

    if (connection === 'open') {
      subBots.set(id, sock)
      Object.assign(info, { status: 'open', connectedAt: Date.now(), error: null, qr: null, pairing: null })
      notificar('subbots')
      log(`🤖 Sub-bot +${id} conectado (${subBots.size} activos)`, 'ok')
      if (parent && chat && !silent) {
        await parent.sendMessage(chat, { text: `✅ *Sub-bot conectado*\n\nYa eres un bot de ${config.botName}. Usa *${config.prefix[0]}menu* en tu propio número.` }, { quoted: m }).catch(() => {})
      }
      if (sock.user?.id) await sock.sendMessage(sock.user.id, { text: `✅ Conectado como sub-bot de *${config.botName}*.` }).catch(() => {})
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      subBots.delete(id)
      if (code === DisconnectReason.loggedOut || code === 401) {
        wipeDir(dir)
        info.status = 'loggedOut'
        log(`Sub-bot +${id} cerró sesión, carpeta eliminada`, 'warn')
      } else {
        info.status = 'reconnecting'
        notificar('subbots')
        log(`Sub-bot +${id} se desconectó, reintentando en 5s`, 'warn')
        setTimeout(() => startSubBot({ id, parent: null, method: modo, silent: true }).catch(() => {}), 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', (update) => handler(sock, update))

  return sock
}

/** Vuelve a pedir el código de vinculación de un sub-bot (o lo arranca si no existe) */
export async function requestSubBotCode(id) {
  id = soloDigitos(id)
  const info = subBotInfo.get(id)

  // Si el código se está pidiendo justo ahora, esperamos ese resultado en vez de pedir otro
  if (info?.codigoPendiente) {
    try { return await info.codigoPendiente } catch { /* seguimos abajo */ }
    const paring = subBotInfo.get(id)?.pairing
    if (paring?.code) return paring
  }

  const sock = subBots.get(id) || info?.socket
  if (!sock) {
    await startSubBot({ id, method: 'pairing', silent: true })
    const nuevo = subBotInfo.get(id)
    if (nuevo?.codigoPendiente) { try { return await nuevo.codigoPendiente } catch {} }
    return subBotInfo.get(id)?.pairing || null
  }
  const paring = await pedirCodigo(sock, info, { espera: 500, reintentos: 1 })
  return paring
}

/** Detiene un sub-bot y borra su sesión */
export async function stopSubBot(id) {
  id = soloDigitos(id)
  const sock = subBots.get(id) || subBotInfo.get(id)?.socket
  if (sock) await sock.logout().catch(() => {})
  subBots.delete(id)
  subBotInfo.delete(id)
  wipeDir(path.join(SUBBOTS_DIR, id))
  return true
}

/** Reconecta todos los sub-bots guardados al arrancar el bot principal */
export async function startSubBots(parent) {
  if (!fs.existsSync(SUBBOTS_DIR)) return
  const dirs = fs.readdirSync(SUBBOTS_DIR).filter((d) =>
    fs.existsSync(path.join(SUBBOTS_DIR, d, 'creds.json'))
  )
  if (!dirs.length) return
  log(`Restaurando ${dirs.length} sub-bot(s)...`)
  for (const id of dirs) {
    await startSubBot({ id, parent, silent: true }).catch(() => {})
  }
}
