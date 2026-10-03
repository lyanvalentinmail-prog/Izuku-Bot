import config from '../config.js'

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
   * Envia un mensaje con "botones".
   *
   * WhatsApp dejo de renderizar los botones clasicos en la mayoria de
   * versiones, asi que por defecto se envia un mensaje NORMAL con las
   * opciones escritas (siempre se ve bien). Si quieres probar los botones
   * nativos, pon `buttons: true` en config.js.
   *
   * IMPORTANTE: nunca se usa viewOnce, para que el menu no llegue
   * como "foto de una sola vez".
   *
   * @param {Array} botones [{ id: '.menu', texto: '📂 Categorias' }]
   */
  sock.sendButtons = async (jid, texto, pie, botones = [], quoted, opciones = {}) => {
    const atajos = botones.length
      ? `\n\n${botones.map((b) => `▢ ${b.texto}  →  *${b.id}*`).join('\n')}`
      : ''

    const contenido = opciones.image
      ? { image: opciones.image, caption: texto + atajos }
      : { text: texto + atajos }

    if (opciones.contextInfo) contenido.contextInfo = opciones.contextInfo

    // Botones nativos solo si el dueño los activa a mano
    if (config.buttons && botones.length) {
      try {
        return await sock.sendMessage(jid, {
          ...(opciones.image ? { image: opciones.image, caption: texto } : { text: texto }),
          footer: pie,
          buttons: botones.slice(0, 3).map((b) => ({
            buttonId: b.id,
            buttonText: { displayText: b.texto },
            type: 1
          })),
          headerType: opciones.image ? 4 : 1,
          ...(opciones.contextInfo ? { contextInfo: opciones.contextInfo } : {})
        }, { quoted })
      } catch {
        // si falla, seguimos con el envio normal de abajo
      }
    }

    try {
      return await sock.sendMessage(jid, contenido, { quoted })
    } catch {
      // Ultimo recurso: solo texto
      return sock.sendMessage(jid, { text: texto + atajos }, { quoted })
    }
  }

  return sock
}
