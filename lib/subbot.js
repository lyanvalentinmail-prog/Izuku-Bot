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

const logger = pino({ level: 'silent' })
export const SUBBOT_DIR = path.join(process.cwd(), 'subbots')

/** Sub-bots activos: jid -> socket */
export const subBots = new Map()

/**
 * Inicia un sub-bot.
 * @param {object} opts
 * @param {string} opts.id      carpeta de sesion (numero del sub-bot)
 * @param {object} opts.parent  socket del bot principal (para mandar el codigo/QR)
 * @param {string} opts.chat    chat donde responder
 * @param {object} opts.m       mensaje original (para citar)
 * @param {boolean} opts.useCode true = codigo de 8 digitos, false = QR
 */
export async function startSubBot({ id, parent, chat, m, useCode = true, silent = false }) {
  if (subBots.size >= config.maxSubBots) {
    if (parent && chat) await parent.sendMessage(chat, { text: '⚠️ Se alcanzó el límite de sub-bots activos.' })
    return null
  }

  const dir = path.join(SUBBOT_DIR, id)
  fs.mkdirSync(dir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: useCode ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: 'Izuku Sub-Bot' })
  })

  addHelpers(sock)
  sock.isSubBot = true

  // Codigo de vinculacion de 8 digitos
  if (useCode && !sock.authState.creds.registered && parent && chat) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(id.replace(/\D/g, ''))
        const pretty = code?.match(/.{1,4}/g)?.join('-') || code
        await parent.sendMessage(chat, {
          text: `🤖 *SUB-BOT — CÓDIGO DE VINCULACIÓN*\n\n` +
                `Tu código: *${pretty}*\n\n` +
                `1. Abre WhatsApp en el número ${id}\n` +
                `2. Ajustes > Dispositivos vinculados\n` +
                `3. Vincular con número de teléfono\n` +
                `4. Escribe el código\n\n_El código expira en 60 segundos._`
        }, { quoted: m })
      } catch (e) {
        await parent.sendMessage(chat, { text: `❌ No se pudo generar el código: ${e.message}` })
      }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !useCode) {
      if (!silent) QR.generate(qr, { small: true })
      if (parent && chat) {
        try {
          const { default: axios } = await import('axios')
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`
          const img = await axios.get(url, { responseType: 'arraybuffer' })
          await parent.sendMessage(chat, {
            image: Buffer.from(img.data),
            caption: '🤖 *SUB-BOT*\n\nEscanea este QR desde\nWhatsApp > Dispositivos vinculados.\n\n_Expira en 60 segundos._'
          }, { quoted: m })
        } catch {}
      }
    }

    if (connection === 'open') {
      subBots.set(id, sock)
      console.log(`[subbot] ${id} conectado (${subBots.size} activos)`)
      if (parent && chat && !silent) {
        await parent.sendMessage(chat, { text: `✅ *Sub-bot conectado*\n\nYa eres un bot de ${config.botName}. Usa *${config.prefix[0]}menu* en tu propio número.` }, { quoted: m })
      }
      await sock.sendMessage(sock.user.id, { text: `✅ Conectado como sub-bot de *${config.botName}*.` }).catch(() => {})
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      subBots.delete(id)
      if (code === DisconnectReason.loggedOut || code === 401) {
        fs.rmSync(dir, { recursive: true, force: true })
        console.log(`[subbot] ${id} cerró sesión, carpeta eliminada`)
      } else {
        setTimeout(() => startSubBot({ id, parent: null, useCode, silent: true }).catch(() => {}), 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', (update) => handler(sock, update))

  return sock
}

/** Detiene un sub-bot y borra su sesion */
export async function stopSubBot(id) {
  const sock = subBots.get(id)
  if (sock) {
    await sock.logout().catch(() => {})
    subBots.delete(id)
  }
  const dir = path.join(SUBBOT_DIR, id)
  fs.rmSync(dir, { recursive: true, force: true })
  return true
}

/** Reconecta todos los sub-bots guardados al arrancar el bot principal */
export async function startSubBots(parent) {
  if (!fs.existsSync(SUBBOT_DIR)) return
  const dirs = fs.readdirSync(SUBBOT_DIR).filter((d) =>
    fs.existsSync(path.join(SUBBOT_DIR, d, 'creds.json'))
  )
  if (!dirs.length) return
  console.log(`[subbot] restaurando ${dirs.length} sub-bot(s)...`)
  for (const id of dirs) {
    await startSubBot({ id, parent, silent: true }).catch(() => {})
  }
}
