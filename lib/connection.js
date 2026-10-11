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
import path from 'path'
import pino from 'pino'
import QRCode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import NodeCache from 'node-cache'

import config from '../config.js'
import handler from '../handler.js'
import db from './database.js'
import { groupCache } from './cache.js'
import { ConflictError, ValidationError } from './errors.js'
import { addHelpers } from './helpers.js'
import { formatPairingCode, requestVerifiedPairingCode } from './pairing.js'
import { startSubBots } from './subbot.js'

const logger = pino({ level: 'silent' })
const msgRetryCounterCache = new NodeCache()

export const SESSION_DIR = path.join(process.cwd(), 'sessions')
const CREDS_FILE = path.join(SESSION_DIR, 'creds.json')
const RECONNECT_MS = 3000

/*
 * Estado de la vinculacion. Lo lee el panel (GET /api/status).
 *   idle       -> sin cuenta vinculada y sin vinculacion en curso
 *   connecting -> conectando con WhatsApp (o reconectando)
 *   qr         -> QR listo para escanear
 *   code       -> codigo de 8 digitos listo, WhatsApp lo confirmo
 *   connected  -> cuenta vinculada y en linea
 *   error      -> algo fallo; el mensaje esta en `error`
 */
const state = {
  status: 'idle',
  method: null,        // 'qr' | 'code' | null
  phone: null,         // solo digitos, solo en vinculacion por codigo
  qr: null,            // QR como imagen (data URL PNG)
  pairingCode: null,   // ej: "ABCD-1234"
  note: '',
  error: null,
  user: null,          // { id, name } cuando esta conectado
  updatedAt: Date.now()
}

let sock = null
// Cada socket nuevo incrementa `gen`. Los eventos de sockets viejos se ignoran.
let gen = 0
let reconnectTimer = null

const set = (patch) => Object.assign(state, patch, { updatedAt: Date.now() })

function readCreds() {
  try { return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf-8')) } catch { return null }
}

/** true si hay una cuenta vinculada guardada en sessions/ */
export function isLinked() {
  return !!readCreds()?.registered
}

function wipeSession() {
  fs.rmSync(SESSION_DIR, { recursive: true, force: true })
}

function stopSocket() {
  gen++
  clearTimeout(reconnectTimer)
  reconnectTimer = null
  if (sock) {
    try { sock.end(undefined) } catch {}
    sock = null
  }
}

/** Estado para el panel (sin datos sensibles de la sesion). */
export function getState() {
  return { ...state, linked: isLinked() }
}

/**
 * Arranque automatico: si ya hay una cuenta vinculada, la reconecta.
 * Si no, no hace nada (la vinculacion se inicia desde el panel o la consola).
 */
export async function resume() {
  if (!isLinked()) {
    set({ status: 'idle' })
    return false
  }
  set({ status: 'connecting', note: 'Conectando con tu cuenta vinculada…', error: null })
  await open()
  return true
}

/**
 * Inicia una vinculacion nueva.
 * @param {{method: 'qr'|'code', phone?: string}} opts
 */
export async function startLink({ method, phone } = {}) {
  if (method !== 'qr' && method !== 'code') {
    throw new ValidationError('Elige cómo vincular: QR o código de 8 dígitos.')
  }
  let number = null
  if (method === 'code') {
    number = String(phone || '').replace(/\D/g, '')
    if (!/^\d{8,15}$/.test(number)) {
      throw new ValidationError('Escribe tu número completo con código de país, solo dígitos (ej: 5215512345678).')
    }
  }
  if (isLinked()) {
    throw new ConflictError('Ya hay una cuenta vinculada. Desvincúlala antes de vincular otra.')
  }

  // Empezamos limpio: una vinculacion a medias no debe mezclarse con una nueva
  stopSocket()
  wipeSession()
  set({
    status: 'connecting',
    method,
    phone: number,
    qr: null,
    pairingCode: null,
    error: null,
    user: null,
    note: method === 'qr' ? 'Preparando el código QR…' : 'Conectando para pedir tu código…'
  })
  console.log(chalk.cyan(`\n🔗 Vinculación iniciada (${method === 'qr' ? 'QR' : 'código de 8 dígitos'})`))
  await open()
}

/** Cancela una vinculacion en curso (no toca una cuenta ya vinculada). */
export function cancelLink() {
  if (isLinked()) throw new ConflictError('Hay una cuenta vinculada. Usa "Desvincular" para cerrar la sesión.')
  stopSocket()
  wipeSession()
  set({ status: 'idle', method: null, phone: null, qr: null, pairingCode: null, error: null, user: null, note: 'Vinculación cancelada.' })
}

/** Cierra la sesion de WhatsApp de esta cuenta y borra las credenciales. */
export async function unlink() {
  const current = sock
  gen++
  clearTimeout(reconnectTimer)
  reconnectTimer = null
  sock = null
  if (current?.ws?.isOpen) {
    // logout avisa a WhatsApp para que la sesion aparezca como cerrada en el telefono
    await Promise.race([
      current.logout().catch(() => {}),
      new Promise((r) => setTimeout(r, 10000))
    ])
  } else if (current) {
    try { current.end(undefined) } catch {}
  }
  wipeSession()
  set({
    status: 'idle', method: null, phone: null, qr: null, pairingCode: null,
    error: null, user: null, note: 'Cuenta desvinculada. Puedes volver a vincular.'
  })
  console.log(chalk.yellow('🔌 Cuenta desvinculada.'))
}

async function open() {
  stopSocket()
  const myGen = gen
  const isCurrent = () => myGen === gen

  const { state: auth, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  if (!isCurrent()) return
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))
  if (!isCurrent()) return

  const useCode = state.method === 'code'
  const socket = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: useCode ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
    auth: {
      creds: auth.creds,
      keys: makeCacheableSignalKeyStore(auth.keys, logger)
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    linkPreviewImageThumbnailWidth: 192,
    msgRetryCounterCache,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    // No guardamos en memoria mensajes que no nos interesan
    shouldIgnoreJid: (jid) => jid === 'status@broadcast',
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async () => ({ conversation: 'Izuku Bot' })
  })
  sock = socket
  addHelpers(socket)

  socket.ev.on('creds.update', (update) => { if (isCurrent()) saveCreds(update) })

  let codeRequested = false
  socket.ev.on('connection.update', async (update) => {
    if (!isCurrent()) return
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Llega cuando el handshake con WhatsApp ya esta hecho: aqui se puede pedir el codigo
      if (state.method === 'qr') {
        const img = await QRCode.toDataURL(qr, { margin: 2, width: 320, errorCorrectionLevel: 'M' }).catch(() => null)
        if (!isCurrent()) return
        set({
          status: 'qr',
          qr: img,
          error: null,
          note: 'Escanea el QR desde WhatsApp › Dispositivos vinculados › Vincular un dispositivo. El QR cambia solo cada ~20 segundos.'
        })
        qrcodeTerminal.generate(qr, { small: true })
        console.log(chalk.yellow('📷 Escanea este QR desde WhatsApp > Dispositivos vinculados'))
      } else if (state.method === 'code' && !codeRequested && !isLinked()) {
        codeRequested = true
        await requestCode(socket, isCurrent)
      }
    }

    if (connection === 'open') {
      set({
        status: 'connected',
        qr: null,
        pairingCode: null,
        error: null,
        note: 'Conectado a WhatsApp.',
        user: { id: socket.user?.id || '', name: socket.user?.name || '' }
      })
      console.log(chalk.green(`\n✅ ${config.botName} conectado como ${socket.user?.name || socket.user?.id}\n`))
      await startSubBots(socket).catch(() => {})
    }

    if (connection === 'close') {
      await onClose(lastDisconnect, isCurrent)
    }
  })

  // Mensajes
  socket.ev.on('messages.upsert', (update) => { if (isCurrent()) handler(socket, update) })

  // Mantener el cache de grupos al dia
  socket.ev.on('groups.update', ([ev]) => { if (ev?.id) groupCache.del(ev.id) })

  // Bienvenida / despedida / antifake
  socket.ev.on('group-participants.update', (ev) => { if (isCurrent()) onGroupParticipants(socket, ev) })

  // Anti llamadas
  socket.ev.on('call', async (calls) => {
    if (!config.antiCall || !isCurrent()) return
    for (const call of calls) {
      if (call.status !== 'offer') continue
      await socket.rejectCall(call.id, call.from).catch(() => {})
      await socket.sendMessage(call.from, {
        text: '📵 Las llamadas no están permitidas. Tu llamada fue rechazada automáticamente.'
      }).catch(() => {})
    }
  })
}

/** Pide el codigo de 8 digitos y lo muestra SOLO si WhatsApp lo confirmo. */
async function requestCode(socket, isCurrent) {
  set({ status: 'connecting', qr: null, note: 'Pidiendo tu código de vinculación a WhatsApp…' })
  try {
    const code = await requestVerifiedPairingCode(socket, state.phone)
    if (!isCurrent()) return
    const pretty = formatPairingCode(code)
    set({
      status: 'code',
      pairingCode: pretty,
      qr: null,
      error: null,
      note: 'En tu teléfono: WhatsApp › Dispositivos vinculados › Vincular con número de teléfono, y escribe este código.'
    })
    console.log(chalk.greenBright(`\n🔗 TU CÓDIGO DE VINCULACIÓN: ${chalk.bold(pretty)}\n`))
  } catch (e) {
    if (!isCurrent()) return
    console.error(chalk.red('No se pudo obtener el código:'), e.message)
    set({ status: 'error', pairingCode: null, error: e.message, note: '' })
  }
}

async function onClose(lastDisconnect, isCurrent) {
  if (!isCurrent()) return
  const code = lastDisconnect?.error?.output?.statusCode

  if (code === DisconnectReason.loggedOut || code === 401) {
    wipeSession()
    sock = null
    set({
      status: 'idle', method: null, phone: null, qr: null, pairingCode: null, user: null,
      error: 'La sesión se cerró desde WhatsApp. Vuelve a vincular la cuenta.', note: ''
    })
    console.log(chalk.red('❌ Sesión cerrada desde WhatsApp. Vincula de nuevo desde el panel.'))
    return
  }

  // Sin cuenta ni vinculacion en curso: no hay nada que reconectar
  if (state.status === 'idle' && !state.method && !isLinked()) return

  const restart = code === DisconnectReason.restartRequired
  set({
    status: 'connecting',
    qr: restart ? state.qr : null,
    pairingCode: null,
    user: null,
    note: restart ? 'Vinculación completada. Reiniciando conexión…' : 'Conexión perdida. Reconectando…'
  })
  if (!restart && lastDisconnect?.error?.message) {
    console.log(chalk.yellow(`🔄 Reconectando... (${lastDisconnect.error.message})`))
  }
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    if (!isLinked() && !state.method) return
    open().catch((e) => set({ status: 'error', error: e.message }))
  }, restart ? 500 : RECONNECT_MS)
}

async function onGroupParticipants(socket, ev) {
  try {
    groupCache.del(ev.id)
    const chat = db.chat(ev.id)
    if (!chat.welcome) return
    const meta = await socket.groupMetadata(ev.id)

    for (const jid of ev.participants) {
      const tag = `@${jid.split('@')[0]}`

      // ---- Antifake: expulsa prefijos no permitidos ----
      if (ev.action === 'add' && chat.antifake && chat.prefijosPermitidos?.length) {
        const numero = jid.split('@')[0]
        if (!chat.prefijosPermitidos.some((p) => numero.startsWith(p))) {
          await socket.sendMessage(ev.id, {
            text: `🛂 *ANTIFAKE*\n${tag} tiene un prefijo no permitido (+${numero.slice(0, 3)}...) y será expulsado.`,
            mentions: [jid]
          })
          await socket.groupParticipantsUpdate(ev.id, [jid], 'remove').catch(() => {})
          continue
        }
      }

      // Reemplaza las variables del mensaje personalizado
      const render = (txt) => txt
        .replace(/@user/g, tag)
        .replace(/@grupo/g, meta.subject)
        .replace(/@desc/g, meta.desc || '')
        .replace(/@miembros/g, String(meta.participants.length))

      if (ev.action === 'add') {
        const texto = chat.textoWelcome
          ? render(chat.textoWelcome)
          : `👋 ¡Bienvenido ${tag} a *${meta.subject}*!\n\nYa somos *${meta.participants.length}*.\nEscribe *${config.prefix[0]}menu* para ver los comandos.`
        await socket.sendMessage(ev.id, { text: texto, mentions: [jid] })
      } else if (ev.action === 'remove') {
        const texto = chat.textoBye ? render(chat.textoBye) : `👋 ${tag} salió del grupo.`
        await socket.sendMessage(ev.id, { text: texto, mentions: [jid] })
      }
    }
  } catch {}
}
