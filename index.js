import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import chalk from 'chalk'
import fs from 'fs'
import NodeCache from 'node-cache'
import path from 'path'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import readline from 'readline'

import config from './config.js'
import handler from './handler.js'
import db from './lib/database.js'
import { loadPlugins, watchPlugins } from './lib/loader.js'
import { addHelpers } from './lib/helpers.js'
import { startSubBots } from './lib/subbot.js'

const logger = pino({ level: 'silent' })
const msgRetryCounterCache = new NodeCache()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// Metodo de vinculacion: --code (codigo de 8 digitos) o --qr
const argv = process.argv.slice(2)
let method = argv.includes('--code') ? 'code' : argv.includes('--qr') ? 'qr' : null

function banner() {
  console.log(chalk.green(`
 ██╗███████╗██╗   ██╗██╗  ██╗██╗   ██╗
 ██║╚══███╔╝██║   ██║██║ ██╔╝██║   ██║
 ██║  ███╔╝ ██║   ██║█████╔╝ ██║   ██║
 ██║ ███╔╝  ██║   ██║██╔═██╗ ██║   ██║
 ██║███████╗╚██████╔╝██║  ██╗╚██████╔╝
 ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
            ${chalk.cyan('B O T   D E   W H A T S A P P')}
`))
}

async function start() {
  banner()

  const sessionDir = path.join(process.cwd(), 'sessions')
  const registered = fs.existsSync(path.join(sessionDir, 'creds.json'))

  if (!registered && !method) {
    console.log(chalk.yellow('¿Cómo quieres vincular tu WhatsApp?\n'))
    console.log('  1. Código QR')
    console.log('  2. Código de 8 dígitos (pairing code)\n')
    const opt = await question(chalk.cyan('Elige 1 o 2: '))
    method = opt.trim() === '2' ? 'code' : 'qr'
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: method === 'code' ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    msgRetryCounterCache,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: 'Izuku Bot' })
  })

  addHelpers(sock)

  // ---- Pairing code (codigo de 8 digitos) ----
  if (method === 'code' && !sock.authState.creds.registered) {
    let number = argv.find((a) => /^\d{8,15}$/.test(a))
    if (!number) {
      number = await question(chalk.cyan('\n📱 Escribe tu número con código de país (ej: 5212345678901): '))
    }
    number = number.replace(/\D/g, '')
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(number)
        const pretty = code?.match(/.{1,4}/g)?.join('-') || code
        console.log(chalk.greenBright(`\n🔗 TU CÓDIGO DE VINCULACIÓN: ${chalk.bold(pretty)}\n`))
        console.log(chalk.gray('WhatsApp > Dispositivos vinculados > Vincular con número de teléfono\n'))
      } catch (e) {
        console.error(chalk.red('No se pudo generar el código:'), e.message)
      }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && method !== 'code') {
      console.log(chalk.yellow('\n📷 Escanea este QR desde WhatsApp > Dispositivos vinculados\n'))
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log(chalk.green(`\n✅ ${config.botName} conectado como ${sock.user?.name || sock.user?.id}\n`))
      try { rl.close() } catch {}
      await startSubBots(sock)
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        console.log(chalk.red('❌ Sesión cerrada. Borra la carpeta "sessions" y vuelve a vincular.'))
        process.exit(0)
      }
      console.log(chalk.yellow('🔄 Reconectando...'))
      setTimeout(start, 3000)
    }
  })

  // Mensajes
  sock.ev.on('messages.upsert', (update) => handler(sock, update))

  // Bienvenida / despedida
  sock.ev.on('group-participants.update', async (ev) => {
    try {
      const chat = db.chat(ev.id)
      if (!chat.welcome) return
      const meta = await sock.groupMetadata(ev.id)
      for (const jid of ev.participants) {
        const tag = `@${jid.split('@')[0]}`
        if (ev.action === 'add') {
          await sock.sendMessage(ev.id, {
            text: `👋 ¡Bienvenido ${tag} a *${meta.subject}*!\n\nEscribe *${config.prefix[0]}menu* para ver los comandos.`,
            mentions: [jid]
          })
        } else if (ev.action === 'remove') {
          await sock.sendMessage(ev.id, { text: `👋 ${tag} salió del grupo.`, mentions: [jid] })
        }
      }
    } catch {}
  })

  // Anti llamadas
  sock.ev.on('call', async (calls) => {
    if (!config.antiCall) return
    for (const call of calls) {
      if (call.status !== 'offer') continue
      await sock.rejectCall(call.id, call.from).catch(() => {})
      await sock.sendMessage(call.from, {
        text: '📵 Las llamadas no están permitidas. Tu llamada fue rechazada automáticamente.'
      }).catch(() => {})
    }
  })

  return sock
}

await loadPlugins()
watchPlugins()
await start()

process.on('uncaughtException', (e) => console.error('[uncaught]', e.message))
process.on('unhandledRejection', (e) => console.error('[unhandled]', e?.message || e))
process.on('SIGINT', () => { db.save(); process.exit(0) })
