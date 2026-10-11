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
import NodeCache from 'node-cache'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import readline from 'readline'

import config from './config.js'
import handler from './handler.js'
import db from './lib/database.js'
import { loadPlugins, watchPlugins, plugins } from './lib/loader.js'
import { restoreRepos } from './lib/repos.js'
import { groupCache } from './lib/cache.js'
import { addHelpers } from './lib/helpers.js'
import { applySavedSettings } from './lib/config.js'
import { startPanel, setPanelHandlers } from './lib/panel.js'
import { ensureDirs, isRegistered, wipeDir, SESSIONS_DIR, TEMP_DIR } from './lib/paths.js'
import {
  STATUS, log, session, setSession, setQr, clearQr,
  setPairing, clearPairing, setMe, snapshot, sleep
} from './lib/session.js'
import {
  startSubBots, startSubBot, requestSubBotCode, stopSubBot, SUBBOTS_DIR
} from './lib/subbot.js'

const logger = pino({ level: 'silent' })
const msgRetryCounterCache = new NodeCache()

// ------------------------------------------------------------------
//  Entorno
// ------------------------------------------------------------------

const argv = process.argv.slice(2)
const sinPanel = ['0', 'false', 'off', 'no'].includes(String(process.env.PANEL_ENABLED ?? 'true').toLowerCase())
const PANEL_ENABLED = !sinPanel
const PORT = Number(process.env.PORT || process.env.PANEL_PORT || 3000)
const CONSOLA_QR = process.stdout.isTTY && String(process.env.TERMINAL_QR ?? 'true') === 'true'
const EN_SERVIDOR = !process.stdin.isTTY // Render, Docker, pm2...

/** Estado interno de la conexión */
const estado = {
  sock: null,
  method: null,
  phone: null,
  stop: false,
  starting: false,
  gen: 0, // generación: sirve para ignorar eventos de sockets viejos
  reconexion: null, // temporizador de reintento pendiente
  // WhatsApp limita los pedidos de código seguidos: contamos los automáticos
  pairingAuto: { count: 0, lastAt: 0 }
}

// ------------------------------------------------------------------
//  Consola
// ------------------------------------------------------------------

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

let rl = null
function consola() {
  if (!rl && process.stdin.isTTY) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  }
  return rl
}
const pregunta = (texto) => new Promise((resolve) => {
  const c = consola()
  if (!c) return resolve('')
  c.question(texto, (r) => resolve(r || ''))
})
function cerrarConsola() {
  try { rl?.close() } catch {}
  rl = null
}

// ------------------------------------------------------------------
//  Vinculación: QR y código de 8 dígitos (siempre reales)
// ------------------------------------------------------------------

const soloDigitos = (n) => String(n ?? '').replace(/\D/g, '')

/** Valida el número antes de pedirle nada a WhatsApp */
function validarNumero(numero) {
  const n = soloDigitos(numero)
  if (n.length < 8 || n.length > 15) {
    throw new Error('Número inválido. Escríbelo completo con código de país, sin + ni espacios (ej: 59896719709).')
  }
  if (n.startsWith('0')) {
    throw new Error('El número no puede empezar con 0. Usa el formato internacional sin el 0 inicial (ej: 598...).')
  }
  return n
}

/** Llega el QR real desde WhatsApp */
async function alRecibirQr(qr, gen) {
  if (gen !== estado.gen) return // socket viejo
  // WhatsApp deja vivir el primer QR 60 s y los siguientes 20 s
  const ttl = (session.qr?.count || 0) === 0 ? 60_000 : 20_000
  await setQr(qr, ttl)
  const n = session.qr?.count || 1
  log(n === 1
    ? '📷 WhatsApp envió el QR. Escanéalo desde el panel (o la consola) antes de que expire.'
    : `📷 QR renovado (#${n}). El anterior ya no sirve.`)
  if (CONSOLA_QR && n === 1) {
    console.log(chalk.yellow('\n📷 Escanea este QR desde WhatsApp > Dispositivos vinculados\n'))
    qrcode.generate(qr, { small: true })
  }
}

/**
 * Pide a WhatsApp el código de vinculación de 8 dígitos.
 * El código que se muestra es EXACTAMENTE el que devuelve WhatsApp:
 * si falla, se muestra el error y no un código inventado.
 */
async function pedirCodigo(sock, numero, gen, { espera = 3200, intentos = 2 } = {}) {
  let ultimoError = null

  for (let intento = 1; intento <= intentos; intento++) {
    const n = validarNumero(numero)
    log(`⏳ Pidiendo el código de vinculación a WhatsApp para +${n}${intento > 1 ? ` (intento ${intento})` : ''}...`)
    setSession({ status: STATUS.PAIRING, method: 'pairing', phone: n })
    setPairing({ phone: n })

    try {
      await sleep(espera)
      // Otro socket tomó el control: este intento ya no vale, salimos sin tocar nada
      if (gen !== estado.gen) return null
      if (!sock || sock.ws?.isClosed || sock.ws?.isClosing) {
        throw new Error('Se cortó la conexión con WhatsApp antes de pedir el código. Espera unos segundos y prueba de nuevo.')
      }

      const crudo = await sock.requestPairingCode(n)
      const limpio = String(crudo ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()

      // Nunca mostramos algo que no tenga pinta de código real
      if (limpio.length !== 8) {
        throw new Error(`WhatsApp devolvió un código con un formato inesperado (${crudo}). Vuelve a intentarlo.`)
      }

      const pretty = limpio.match(/.{1,4}/g).join('-')
      setPairing({ phone: n, code: limpio, pretty })
      setSession({ status: STATUS.PAIRING, phone: n, error: null })
      log(`🔗 CÓDIGO DE VINCULACIÓN para +${n}: ${pretty}`, 'ok')
      log('   WhatsApp > Dispositivos vinculados > Vincular con número de teléfono', 'info')
      return { phone: n, code: limpio, pretty }
    } catch (e) {
      if (gen !== estado.gen) return null
      ultimoError = e
      log(`✖ No se pudo generar el código: ${e.message}`, 'error')
      if (intento < intentos && !sock?.ws?.isClosed) await sleep(2500)
    }
  }

  setPairing({ phone: soloDigitos(numero), error: ultimoError?.message || 'Error desconocido' })
  setSession({
    status: estado.sock && !estado.sock.ws?.isClosed ? STATUS.PAIRING : STATUS.CLOSED,
    error: `No se pudo generar el código de vinculación: ${ultimoError?.message || 'error desconocido'}`
  })
  throw ultimoError || new Error('No se pudo generar el código de vinculación.')
}

// ------------------------------------------------------------------
//  Conexión principal
// ------------------------------------------------------------------

async function startBot({ method = null, phone = null, nueva = false } = {}) {
  if (estado.starting) return { yaIniciando: true }

  estado.starting = true
  estado.stop = false
  const gen = ++estado.gen
  if (method) estado.method = method
  if (phone) estado.phone = soloDigitos(phone)

  const registrado = isRegistered(SESSIONS_DIR)
  const usarCodigo = estado.method === 'pairing'

  setSession({
    status: STATUS.STARTING,
    method: estado.method,
    phone: estado.phone,
    registered: registrado,
    logoutRequested: false,
    ...(nueva ? { error: null } : {})
  })
  if (!registrado) clearQr()

  log(registrado
    ? '🔐 Encontré una sesión guardada, abriendo WhatsApp...'
    : `🔓 Sin sesión guardada: preparando vinculación por ${usarCodigo ? 'código de 8 dígitos' : 'código QR'}...`)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: usarCodigo ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
      linkPreviewImageThumbnailWidth: 192,
      msgRetryCounterCache,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      shouldIgnoreJid: (jid) => jid === 'status@broadcast',
      cachedGroupMetadata: async (jid) => groupCache.get(jid),
      getMessage: async () => ({ conversation: config.botName })
    })

    estado.sock = sock
    addHelpers(sock)

    // ---- credenciales ----
    sock.ev.on('creds.update', saveCreds)

    // ---- estado de la conexión ----
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      if (gen !== estado.gen) return

      if (qr && !usarCodigo) await alRecibirQr(qr, gen)
      if (connection === 'connecting') {
        if (session.status !== STATUS.QR && session.status !== STATUS.PAIRING) setSession({ status: STATUS.CONNECTING })
      }

      if (connection === 'open') {
        estado.starting = false
        estado.stop = false
        setMe(sock.user)
        setSession({ status: STATUS.OPEN, error: null, restarts: 0 })
        const numero = soloDigitos(sock.user?.id)
        clearPairing()
        log(`✅ ${config.botName} conectado${numero ? ` como +${numero}` : ''} 🎉`, 'ok')
        cerrarConsola()
        await startSubBots(sock).catch(() => {})
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        estado.starting = false
        if (estado.sock === sock) estado.sock = null

        if (code === DisconnectReason.loggedOut || code === 401) {
          const fuePedido = session.logoutRequested
          wipeDir(SESSIONS_DIR)
          clearQr()
          clearPairing()
          setMe(null)
          setSession({
            status: fuePedido ? STATUS.IDLE : STATUS.LOGGED_OUT,
            registered: false,
            logoutRequested: false,
            error: fuePedido ? null : 'La sesión se cerró desde el teléfono. Vincula el bot de nuevo por QR o con código.'
          })
          log(fuePedido ? '👋 Sesión cerrada desde el panel.' : '⚠️ La sesión se cerró desde el teléfono.', fuePedido ? 'ok' : 'warn')
          return
        }

        if (estado.stop) {
          setSession({ status: STATUS.CLOSED })
          log('⏹️ Conexión detenida.', 'warn')
          return
        }

        const intentos = (session.restarts || 0) + 1
        // Espera creciente: 3 s, 5 s, 7 s... hasta 30 s (no martilla los servidores de WhatsApp)
        const espera = Math.min(3000 + (intentos - 1) * 2000, 30000)
        setSession({ status: STATUS.RECONNECTING, restarts: intentos })
        log(`🔄 Se cortó la conexión (código ${code ?? 'desconocido'}). Reintento ${intentos} en ${Math.round(espera / 1000)} s...`, 'warn')
        programarReconexion(espera)
      }
    })

    // ---- mensajes ----
    sock.ev.on('messages.upsert', (update) => handler(sock, update))

    // ---- cache de grupos ----
    sock.ev.on('groups.update', ([ev]) => { if (ev?.id) groupCache.del(ev.id) })

    // ---- bienvenida / despedida / antifake ----
    sock.ev.on('group-participants.update', async (ev) => {
      try {
        groupCache.del(ev.id)
        const chat = db.chat(ev.id)
        if (!chat.welcome) return
        const meta = await sock.groupMetadata(ev.id)

        for (const jid of ev.participants) {
          const tag = `@${jid.split('@')[0]}`

          if (ev.action === 'add' && chat.antifake && chat.prefijosPermitidos?.length) {
            const numero = jid.split('@')[0]
            if (!chat.prefijosPermitidos.some((p) => numero.startsWith(p))) {
              await sock.sendMessage(ev.id, {
                text: `🛂 *ANTIFAKE*\n${tag} tiene un prefijo no permitido (+${numero.slice(0, 3)}...) y será expulsado.`,
                mentions: [jid]
              })
              await sock.groupParticipantsUpdate(ev.id, [jid], 'remove').catch(() => {})
              continue
            }
          }

          const render = (txt) => txt
            .replace(/@user/g, tag)
            .replace(/@grupo/g, meta.subject)
            .replace(/@desc/g, meta.desc || '')
            .replace(/@miembros/g, String(meta.participants.length))

          if (ev.action === 'add') {
            const texto = chat.textoWelcome
              ? render(chat.textoWelcome)
              : `👋 ¡Bienvenido ${tag} a *${meta.subject}*!\n\nYa somos *${meta.participants.length}*.\nEscribe *${config.prefix[0]}menu* para ver los comandos.`
            await sock.sendMessage(ev.id, { text: texto, mentions: [jid] })
          } else if (ev.action === 'remove') {
            const texto = chat.textoBye ? render(chat.textoBye) : `👋 ${tag} salió del grupo.`
            await sock.sendMessage(ev.id, { text: texto, mentions: [jid] })
          }
        }
      } catch {}
    })

    // ---- anti llamadas ----
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

    // ---- código de vinculación (si toca) ----
    let pairing = null
    if (usarCodigo && !sock.authState.creds.registered && !estado.phone) {
      log('ℹ️ Falta tu número: escríbelo en el panel (o usa: npm run code -- 59896719709) para pedir el código de 8 dígitos.', 'warn')
      setSession({ status: STATUS.IDLE })
    }
    if (usarCodigo && !sock.authState.creds.registered && estado.phone) {
      const { count, lastAt } = estado.pairingAuto
      const muchos = count >= 5 && Date.now() - lastAt < 120_000
      if (muchos) {
        log('⏸️ Se pidieron varios códigos seguidos. WhatsApp limita los intentos: toca «Pedir código» en el panel cuando quieras volver a probar.', 'warn')
        setSession({ status: STATUS.IDLE })
      } else {
        estado.pairingAuto = { count: count + 1, lastAt: Date.now() }
        pairing = await pedirCodigo(sock, estado.phone, gen).catch(() => null)
      }
      if (!pairing) estado.starting = false
    }

    estado.starting = false
    return { sock, pairing }
  } catch (e) {
    estado.starting = false
    setSession({ status: STATUS.CLOSED, error: e.message })
    log(`✖ No se pudo iniciar la conexión: ${e.message}`, 'error')
    throw e
  }
}

/** Vincula por QR o por código desde el panel */
async function conectar({ method = 'qr', phone = '' } = {}) {
  if (session.status === STATUS.OPEN) {
    throw new Error('El bot ya está conectado a WhatsApp. Para vincular otro número, cierra la sesión primero.')
  }
  if (isRegistered(SESSIONS_DIR)) {
    throw new Error('Ya hay una sesión guardada. Si quieres vincular otro número, bórrala con "Borrar sesión guardada".')
  }
  if (method === 'pairing') {
    const numero = validarNumero(phone)
    estado.phone = numero
    estado.method = 'pairing'
  } else {
    estado.method = 'qr'
    estado.phone = null
  }

  await cerrarSocket()
  const r = await startBot({ method: estado.method, phone: estado.phone, nueva: true })
  return { method: estado.method, phone: estado.phone, pairing: r?.pairing || null }
}

/** Programa un reintento (se puede cancelar cerrando la sesión) */
function programarReconexion(espera) {
  cancelarReconexion()
  estado.reconexion = setTimeout(() => {
    estado.reconexion = null
    startBot({}).catch(() => {})
  }, espera)
}

function cancelarReconexion() {
  if (estado.reconexion) { clearTimeout(estado.reconexion); estado.reconexion = null }
}

/** Cierra el socket actual sin borrar credenciales */
async function cerrarSocket() {
  cancelarReconexion()
  const sock = estado.sock
  if (!sock) return
  estado.gen++           // ignora los eventos que lleguen tarde
  estado.sock = null
  estado.starting = false
  try { sock.ev.removeAllListeners('connection.update') } catch {}
  try { await sock.end(new Error('reinicio solicitado')) } catch {}
  try { sock.ws?.close() } catch {}
}

/** Pide (o vuelve a pedir) el código de vinculación */
async function pedirCodigoPanel(phone) {
  const numero = validarNumero(phone)
  estado.phone = numero
  estado.method = 'pairing'
  estado.pairingAuto = { count: 1, lastAt: Date.now() } // el pedido manual siempre se hace

  // Si no hay conexión en curso, la creamos en modo código
  if (!estado.sock || estado.sock.authState.creds.registered || session.status === STATUS.OPEN || session.method !== 'pairing') {
    await conectar({ method: 'pairing', phone: numero })
    return session.pairing
  }
  if (!estado.sock.authState.creds.registered) {
    return pedirCodigo(estado.sock, numero, estado.gen, { espera: 600, intentos: 2 })
  }
  throw new Error('El bot ya está vinculado. Si quieres vincular otro número, cierra la sesión primero.')
}

/** Cierra la sesión de WhatsApp (logout real) */
async function cerrarSesion() {
  setSession({ logoutRequested: true })
  estado.stop = true
  cancelarReconexion()
  const sock = estado.sock
  if (sock) {
    await sock.logout().catch(() => {})
    await sleep(500)
    estado.sock = null
  }
  estado.gen++
  wipeDir(SESSIONS_DIR)
  clearQr()
  clearPairing()
  setMe(null)
  setSession({ status: STATUS.IDLE, registered: false, logoutRequested: false, error: null, method: null, phone: null })
  log('👋 Sesión cerrada y borrada. Ya puedes vincular de nuevo.', 'ok')
}

/** Borra la sesión guardada sin estar conectado */
async function borrarSesion() {
  if (session.status === STATUS.OPEN) throw new Error('El bot está conectado: cierra la sesión antes de borrarla.')
  estado.stop = true
  cancelarReconexion()
  await cerrarSocket()
  wipeDir(SESSIONS_DIR)
  clearQr()
  clearPairing()
  setMe(null)
  setSession({ status: STATUS.IDLE, registered: false, error: null, method: null, phone: null, restarts: 0 })
  log('🗑️ Sesión guardada borrada. El bot queda listo para vincularse de nuevo.', 'ok')
  return true
}

// ------------------------------------------------------------------
//  Acciones que usa el panel web
// ------------------------------------------------------------------

/** Prepara un mensaje falso (pero funcional) para correr comandos desde el panel */
function mensajeDelPanel(sock, command, args = []) {
  const dueno = soloDigitos(config.owner?.[0] || '') || soloDigitos(sock.user?.id)
  const chat = `${dueno}@s.whatsapp.net`
  const prefijo = config.prefix?.[0] ?? '.'
  const salida = []
  const usuario = db.user(chat)

  const m = {
    chat,
    from: chat,
    sender: chat,
    isGroup: false,
    fromMe: true,
    key: { remoteJid: chat, fromMe: true, id: `PANEL${Date.now()}` },
    message: {},
    mtype: 'text',
    type: 'text',
    body: `${prefijo}${command}${args.length ? ' ' + args.join(' ') : ''}`,
    text: args.join(' '),
    pushName: config.ownerName || 'Panel',
    mentionedJid: [],
    quoted: null,
    args,
    reply: async (texto, opciones) => {
      const t = typeof texto === 'string' ? texto : (texto?.text || '')
      salida.push(t)
      return sock.sendMessage(chat, typeof texto === 'string' ? { text: texto } : texto, opciones).catch(() => {})
    },
    react: async () => {},
    download: async () => {
      throw new Error('Este comando necesita que le respondas a una foto, video o audio en WhatsApp.')
    }
  }
  return { m, chat, usuario, salida, prefijo }
}

/** Corre un comando del bot desde el panel (en tu propio chat de WhatsApp) */
async function ejecutarComando({ command, args = [] }) {
  const sock = estado.sock
  if (!sock || session.status !== STATUS.OPEN) throw new Error('El bot no está conectado a WhatsApp todavía.')

  const plugin = [...plugins.values()].find((p) => p.command?.includes(String(command).toLowerCase()))
  if (!plugin) throw new Error(`No existe el comando "${command}".`)

  const { m, chat, usuario, salida, prefijo } = mensajeDelPanel(sock, command, args)
  log(`⌨️ Ejecutando desde el panel: ${prefijo}${command} ${args.join(' ')}`.trim())

  await plugin.run({
    sock, m, args, text: args.join(' '), command: plugin.command[0],
    usedPrefix: prefijo,
    isOwner: true, isROwner: true, isAdmin: false, isBotAdmin: false,
    groupMetadata: null, participants: [],
    user: usuario, chat: db.chat(chat), db, plugins, config
  })

  usuario.commands = (usuario.commands || 0) + 1
  usuario.cmdStats = usuario.cmdStats || {}
  usuario.cmdStats[plugin.command[0]] = (usuario.cmdStats[plugin.command[0]] || 0) + 1

  return { comando: plugin.command[0], destino: chat, salida }
}

/** Difusión (se manda en segundo plano para no cortar la petición HTTP) */
async function difundir({ text, target = 'groups' }) {
  const sock = estado.sock
  if (!sock || session.status !== STATUS.OPEN) throw new Error('El bot no está conectado a WhatsApp.')

  let destinos = []
  if (target === 'users') {
    destinos = Object.keys(db.data.users || {}).filter((j) => j.endsWith('@s.whatsapp.net'))
  } else {
    const grupos = await sock.groupFetchAllParticipating().catch(() => ({}))
    destinos = Object.keys(grupos || {})
  }

  if (!destinos.length) throw new Error(target === 'users' ? 'Todavía no hay usuarios que hayan usado el bot.' : 'El bot no está en ningún grupo.')

  log(`📢 Difusión iniciada: ${destinos.length} destino(s) (${target === 'users' ? 'usuarios' : 'grupos'}).`)

  ;(async () => {
    let ok = 0, fallidos = 0
    for (const jid of destinos) {
      try {
        await sock.sendMessage(jid, { text })
        ok++
      } catch { fallidos++ }
      await sleep(1200 + Math.random() * 800) // ritmo humano, evita bloqueos
      if ((ok + fallidos) % 10 === 0) log(`📢 Difusión: ${ok + fallidos}/${destinos.length} enviados...`)
    }
    log(`📢 Difusión terminada: ${ok} enviados, ${fallidos} fallidos.`, ok ? 'ok' : 'warn')
  })().catch((e) => log(`✖ Difusión interrumpida: ${e.message}`, 'error'))

  return { iniciado: true, total: destinos.length, destino: target }
}

// ------------------------------------------------------------------
//  Arranque
// ------------------------------------------------------------------

ensureDirs()
applySavedSettings()
await loadPlugins()
await restoreRepos().catch((e) => log(`No se pudieron restaurar los bots por repositorio: ${e.message}`, 'warn'))
watchPlugins()

banner()
log(`${config.botName} v2 encendiendo...`, 'ok')
log(`📁 Sesión: ${SESSIONS_DIR}`)
log(`📁 Sub-bots: ${SUBBOTS_DIR}`)
if (PANEL_ENABLED) {
  setPanelHandlers({
    getSocket: () => estado.sock,
    connect: conectar,
    requestPairing: pedirCodigoPanel,
    logout: cerrarSesion,
    restart: async () => { await cerrarSocket(); return startBot({ nueva: false }) },
    wipeSession: borrarSesion,
    runCommand: ejecutarComando,
    broadcast: difundir,
    startSubBot: ({ phone, method }) => {
      if (session.status !== STATUS.OPEN) throw new Error('El bot principal tiene que estar conectado para crear un sub-bot.')
      return startSubBot({ id: phone, method, parent: estado.sock, chat: null, silent: true })
    },
    subBotCode: (phone) => requestSubBotCode(phone),
    stopSubBot: (phone) => stopSubBot(phone)
  })
  startPanel({ port: PORT })
} else {
  log('ℹ️ Panel web desactivado (PANEL_ENABLED=false).', 'warn')
}

// ---- Primera conexión ----
const numeroArg = argv.find((a) => /^\+?\d{8,15}$/.test(a))
const sessionGuardada = isRegistered(SESSIONS_DIR)

if (sessionGuardada) {
  await startBot({}).catch(() => {})
} else if (argv.includes('--qr')) {
  await startBot({ method: 'qr' }).catch(() => {})
} else if (argv.includes('--code')) {
  let numero = numeroArg
  if (!numero) {
    numero = (await pregunta(chalk.cyan('\n📱 Tu número con código de país (ej: 59896719709): '))).trim()
  }
  await startBot({ method: 'pairing', phone: numero }).catch((e) => log(`✖ ${e.message}`, 'error'))
} else if (EN_SERVIDOR || argv.includes('--panel')) {
  // Servidor (Render, Docker, pm2) o modo panel explícito: se vincula desde el navegador
  setSession({ status: STATUS.IDLE })
  log('👋 Todo listo. Entra al panel web y vincula el bot por QR o con código de 8 dígitos.', 'ok')
} else {
  // Consola interactiva (Termux / PC)
  console.log(chalk.yellow('¿Cómo quieres vincular tu WhatsApp?\n'))
  console.log('  1. Código QR')
  console.log('  2. Código de 8 dígitos (pairing code)\n')
  const opt = (await pregunta(chalk.cyan('Elige 1 o 2: '))).trim()
  if (opt === '2') {
    const numero = (await pregunta(chalk.cyan('📱 Tu número con código de país (ej: 59896719709): '))).trim()
    await startBot({ method: 'pairing', phone: numero }).catch((e) => log(`✖ ${e.message}`, 'error'))
  } else {
    await startBot({ method: 'qr' }).catch((e) => log(`✖ ${e.message}`, 'error'))
  }
}

// ------------------------------------------------------------------
//  Limpieza y cierre ordenado
// ------------------------------------------------------------------

setInterval(() => {
  if (!fs.existsSync(TEMP_DIR)) return
  const limite = Date.now() - 10 * 60 * 1000
  for (const f of fs.readdirSync(TEMP_DIR)) {
    if (f === '.gitkeep') continue
    const file = path.join(TEMP_DIR, f)
    try { if (fs.statSync(file).mtimeMs < limite) fs.unlinkSync(file) } catch {}
  }
}, 30 * 60 * 1000)

function apagar(senal) {
  log(`\n${senal}: guardando datos y cerrando...`, 'warn')
  try { db.save(true) } catch {}
  try { estado.sock?.end(new Error('apagando')) } catch {}
  setTimeout(() => process.exit(0), 400)
}

process.on('uncaughtException', (e) => log(`[uncaught] ${e.message}`, 'error'))
process.on('unhandledRejection', (e) => log(`[unhandled] ${e?.message || e}`, 'error'))
process.on('SIGINT', () => apagar('SIGINT'))
process.on('SIGTERM', () => apagar('SIGTERM'))
