/** Helpers extra que se añaden al socket de Baileys */
export function addHelpers(sock) {
  sock.sendFile = async (jid, buffer, filename = '', caption = '', quoted, options = {}) => {
    const head = buffer.slice(0, 12).toString('hex')
    let type = { image: buffer }
    if (buffer.slice(4, 8).toString() === 'ftyp') type = { video: buffer }
    else if (head.startsWith('52494646') && buffer.slice(8, 12).toString() === 'WEBP') type = { sticker: buffer }
    else if (head.startsWith('494433') || head.startsWith('fffb') || head.startsWith('4f676753')) type = { audio: buffer, mimetype: 'audio/mpeg' }
    return sock.sendMessage(jid, { ...type, caption: caption || undefined, ...options }, { quoted })
  }

  sock.sendText = (jid, text, quoted, options = {}) =>
    sock.sendMessage(jid, { text, ...options }, { quoted })

  return sock
}
