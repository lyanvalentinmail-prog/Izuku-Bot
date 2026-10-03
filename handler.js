import config from './config.js'
import db from './lib/database.js'
import { plugins } from './lib/loader.js'
import { formatTime } from './lib/functions.js'
import { serialize } from './lib/serialize.js'

const cooldown = new Map()
const flood = new Map()

/** Normaliza un numero a jid */
const toJid = (n) => `${String(n).replace(/\D/g, '')}@s.whatsapp.net`

export default async function handler(sock, update) {
  try {
    const raw = update.messages?.[0]
    if (!raw || !raw.message) return
    if (raw.key.remoteJid === 'status@broadcast') return

    const m = await serialize(sock, raw)
    if (!m.chat) return

    if (config.autoRead) await sock.readMessages([m.key]).catch(() => {})

    const user = db.user(m.sender)
    const chat = db.chat(m.chat)
    if (m.pushName) user.name = m.pushName

    const owners = [...config.owner.map(toJid), sock.user?.id?.split(':')[0] + '@s.whatsapp.net']
    const isOwner = owners.includes(m.sender) || m.fromMe
    const isROwner = config.owner.map(toJid).includes(m.sender)

    if (user.banned && !isOwner) return
    if (config.self && !isOwner) return
    if (config.onlyGroups && !m.isGroup && !isOwner) return

    // Datos del grupo
    let groupMetadata = null
    let participants = []
    let isAdmin = false
    let isBotAdmin = false
    if (m.isGroup) {
      groupMetadata = await sock.groupMetadata(m.chat).catch(() => null)
      participants = groupMetadata?.participants || []
      const me = participants.find((p) => p.id.split('@')[0] === sock.user.id.split(':')[0])
      const sd = participants.find((p) => p.id === m.sender)
      isBotAdmin = !!me?.admin
      isAdmin = !!sd?.admin
    }

    // XP pasiva
    user.exp += 1
    if (user.exp >= user.level * 100) {
      user.level++
      user.exp = 0
      user.coins += user.level * 50
      await sock.sendMessage(m.chat, {
        text: `🎉 *¡SUBISTE DE NIVEL!*\n\n@${m.sender.split('@')[0]} ahora es nivel *${user.level}*\n💰 Recompensa: *${user.level * 50}* monedas`,
        mentions: [m.sender]
      }).catch(() => {})
    }

    // ---- AFK: el usuario vuelve ----
    if (user.afk) {
      const tiempo = formatTime(Date.now() - user.afk.time)
      const motivo = user.afk.reason
      user.afk = null
      await m.reply(`👋 *Bienvenido de vuelta!*\n\n📝 Motivo: ${motivo}\n⏱️ Estuviste ausente: *${tiempo}*`)
    }

    // ---- AFK: alguien menciona a un ausente ----
    const mencionados = [...m.mentionedJid, m.quoted?.sender].filter(Boolean)
    for (const jid of mencionados) {
      const u = db.data.users[jid]
      if (!u?.afk) continue
      await sock.sendMessage(m.chat, {
        text: `💤 @${jid.split('@')[0]} está AFK\n📝 Motivo: ${u.afk.reason}\n⏱️ Desde hace: *${formatTime(Date.now() - u.afk.time)}*`,
        mentions: [jid]
      }, { quoted: m })
    }

    // ---- Antiflood ----
    if (m.isGroup && chat.antiflood && !isAdmin && !isOwner) {
      const key = `${m.chat}:${m.sender}`
      const hist = (flood.get(key) || []).filter((t) => Date.now() - t < 8000)
      hist.push(Date.now())
      flood.set(key, hist)
      if (hist.length > 6) {
        flood.set(key, [])
        user.warn++
        if (user.warn >= 3 && isBotAdmin) {
          user.warn = 0
          await sock.sendMessage(m.chat, { text: `🚦 @${m.sender.split('@')[0]} fue expulsado por spam.`, mentions: [m.sender] })
          await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
          return
        }
        await sock.sendMessage(m.chat, {
          text: `🚦 *ANTIFLOOD*\n@${m.sender.split('@')[0]}, estás enviando mensajes muy rápido.\n⚠️ Advertencia *${user.warn}/3*`,
          mentions: [m.sender]
        })
        return
      }
    }

    // Antilink
    if (m.isGroup && chat.antilink && !isAdmin && !isOwner && /chat\.whatsapp\.com\/[0-9A-Za-z]{20,}/.test(m.body)) {
      const link = await sock.groupInviteCode(m.chat).catch(() => null)
      if (!link || !m.body.includes(link)) {
        await sock.sendMessage(m.chat, { text: `🛡️ *ANTILINK*\n@${m.sender.split('@')[0]} envió un enlace de grupo y será expulsado.`, mentions: [m.sender] })
        await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})
        if (isBotAdmin) await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})
        return
      }
    }

    // Prefijo
    const prefixes = config.prefix.length ? config.prefix : ['']
    const usedPrefix = prefixes.find((p) => p === '' || m.body.startsWith(p))
    if (usedPrefix === undefined) return
    const withoutPrefix = usedPrefix ? m.body.slice(usedPrefix.length) : m.body
    const [cmdRaw, ...argsRaw] = withoutPrefix.trim().split(/\s+/)
    const command = (cmdRaw || '').toLowerCase()
    if (!command) return

    const args = argsRaw
    const text = args.join(' ')

    for (const plugin of plugins.values()) {
      if (!plugin.command.includes(command)) continue

      // Restricciones
      if (plugin.owner && !isOwner) return m.reply('🚫 Solo el dueño del bot puede usar esto.')
      if (plugin.rowner && !isROwner) return m.reply('🚫 Solo el dueño principal puede usar esto.')
      if (plugin.group && !m.isGroup) return m.reply('👥 Este comando solo funciona en grupos.')
      if (plugin.private && m.isGroup) return m.reply('💬 Este comando solo funciona en el chat privado.')
      if (plugin.admin && !isAdmin && !isOwner) return m.reply('⚠️ Necesitas ser *admin* del grupo.')
      if (plugin.botAdmin && !isBotAdmin) return m.reply('⚠️ Necesito ser *admin* para hacer eso.')
      if (plugin.register && !user.registered) {
        return m.reply(`📝 Debes registrarte primero:\n\n*${usedPrefix}reg nombre.edad*`)
      }
      if (chat.mute && !isAdmin && !isOwner) return

      // Anti-spam (3 segundos por usuario)
      const last = cooldown.get(m.sender) || 0
      if (Date.now() - last < 3000 && !isOwner) return
      cooldown.set(m.sender, Date.now())

      try {
        await plugin.run({
          sock, m, args, text, command, usedPrefix,
          isOwner, isROwner, isAdmin, isBotAdmin,
          groupMetadata, participants,
          user, chat, db, plugins, config
        })
        user.commands++
      } catch (e) {
        console.error(`[${command}]`, e)
        await m.reply(`❌ Ocurrió un error ejecutando *${command}*\n\n${e.message}`)
      }
      break
    }
  } catch (e) {
    console.error('[handler]', e)
  }
}
