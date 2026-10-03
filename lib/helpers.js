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

  /**
   * Envia un mensaje con botones.
   * Si la version de WhatsApp del usuario no los soporta, cae
   * automaticamente a texto normal para que nunca se pierda el mensaje.
   *
   * @param {Array} botones [{ id: '.menu', texto: '📂 Categorias' }]
   */
  sock.sendButtons = async (jid, texto, pie, botones = [], quoted, opciones = {}) => {
    const buttons = botones.slice(0, 3).map((b) => ({
      buttonId: b.id,
      buttonText: { displayText: b.texto },
      type: 1
    }))

    try {
      return await sock.sendMessage(jid, {
        ...(opciones.image ? { image: opciones.image, caption: texto } : { text: texto }),
        footer: pie,
        buttons,
        headerType: opciones.image ? 4 : 1,
        viewOnce: true,
        ...(opciones.contextInfo ? { contextInfo: opciones.contextInfo } : {})
      }, { quoted })
    } catch {
      // Respaldo: texto plano con las opciones escritas
      const lista = botones.map((b) => `▢ *${b.id}* — ${b.texto}`).join('\n')
      return sock.sendMessage(jid, {
        ...(opciones.image ? { image: opciones.image, caption: `${texto}\n\n${pie || ''}\n\n${lista}` }
                           : { text: `${texto}\n\n${pie || ''}\n\n${lista}` }),
        ...(opciones.contextInfo ? { contextInfo: opciones.contextInfo } : {})
      }, { quoted })
    }
  }

  return sock
}
