import { downloadContentFromMessage, getContentType, jidNormalizedUser } from '@whiskeysockets/baileys'

/** Extrae el texto de cualquier tipo de mensaje */
export function getText(msg) {
  if (!msg) return ''
  const type = getContentType(msg)
  const m = msg[type]
  return (
    msg.conversation ||
    m?.text ||
    m?.caption ||
    m?.selectedButtonId ||
    m?.singleSelectReply?.selectedRowId ||
    m?.selectedId ||
    m?.contentText ||
    m?.hydratedContentText ||
    (typeof m === 'string' ? m : '') ||
    ''
  )
}

/** Descarga el media de un mensaje y devuelve un Buffer */
export async function downloadMedia(message) {
  const type = Object.keys(message)[0]
  const map = {
    imageMessage: 'image',
    videoMessage: 'video',
    stickerMessage: 'sticker',
    documentMessage: 'document',
    audioMessage: 'audio'
  }
  const stream = await downloadContentFromMessage(message[type], map[type])
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

/**
 * Convierte el mensaje crudo de Baileys en un objeto comodo de usar.
 * Devuelve: m.chat, m.sender, m.text, m.isGroup, m.quoted, m.reply(), etc.
 */
export async function serialize(sock, msg) {
  if (!msg.message) return msg
  const m = {}

  m.key = msg.key
  m.id = msg.key.id
  m.chat = msg.key.remoteJid
  m.isGroup = m.chat.endsWith('@g.us')
  m.fromMe = msg.key.fromMe
  m.sender = jidNormalizedUser(
    m.fromMe ? sock.user.id : m.isGroup ? msg.key.participant : m.chat
  )
  m.pushName = msg.pushName || ''
  m.message = msg.message.ephemeralMessage?.message || msg.message.viewOnceMessageV2?.message || msg.message
  m.mtype = getContentType(m.message)
  m.msg = m.message[m.mtype]
  m.body = getText(m.message)
  m.text = m.body
  m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

  // Mensaje citado
  const ctx = m.msg?.contextInfo
  if (ctx?.quotedMessage) {
    const q = ctx.quotedMessage.ephemeralMessage?.message || ctx.quotedMessage
    m.quoted = {
      key: {
        remoteJid: m.chat,
        fromMe: jidNormalizedUser(ctx.participant) === jidNormalizedUser(sock.user.id),
        id: ctx.stanzaId,
        participant: ctx.participant
      },
      message: q,
      mtype: getContentType(q),
      sender: jidNormalizedUser(ctx.participant),
      text: getText(q),
      download: () => downloadMedia(q)
    }
  } else m.quoted = null

  m.download = () => downloadMedia(m.message)

  m.reply = (text, options = {}) => {
    if (Buffer.isBuffer(text)) return sock.sendFile(m.chat, text, '', '', m, options)
    return sock.sendMessage(m.chat, { text: String(text), ...options }, { quoted: m })
  }

  m.react = (emoji) => sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } })

  return m
}
