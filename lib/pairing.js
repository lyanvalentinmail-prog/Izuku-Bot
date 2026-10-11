/**
 * Pedir el codigo de vinculacion de 8 caracteres de forma VERIFICADA.
 *
 * Baileys (sock.requestPairingCode) genera el codigo en tu equipo y lo envia
 * a WhatsApp sin esperar la respuesta del servidor. Si el numero no existe o
 * WhatsApp rechaza la peticion, el codigo que devolveria seria falso.
 *
 * Aqui solo devolvemos el codigo cuando WhatsApp responde al iq sin error.
 * Si responde con error, o no responde a tiempo, lanzamos un error claro
 * y NO se muestra ningun codigo.
 *
 * Importante: llamar solo cuando el socket ya tiene el handshake hecho,
 * es decir, despues del primer evento `qr` de connection.update.
 */
export const formatPairingCode = (code) => (code?.match(/.{1,4}/g)?.join('-') || code || '')

export async function requestVerifiedPairingCode(sock, phone, timeoutMs = 20000) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!/^\d{8,15}$/.test(digits)) {
    throw new Error('Número inválido. Usa solo dígitos con código de país, ej: 5215512345678.')
  }

  let resolveReply
  const reply = new Promise((resolve) => { resolveReply = resolve })
  // Respuesta del servidor WhatsApp a una peticion iq (result o error)
  const onFrame = (node) => {
    if (node?.tag !== 'iq' || node.attrs?.from !== 's.whatsapp.net') return
    if (node.attrs.type === 'result' || node.attrs.type === 'error') resolveReply(node)
  }

  sock.ws.on('frame', onFrame)
  let timer
  try {
    const code = await sock.requestPairingCode(digits)
    const answer = await Promise.race([
      reply,
      new Promise((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs) })
    ])

    if (!answer) {
      throw new Error('WhatsApp no confirmó la solicitud a tiempo. Vuelve a intentarlo.')
    }
    if (answer.attrs.type === 'error') {
      const err = (Array.isArray(answer.content) && answer.content.find((c) => c.tag === 'error'))?.attrs || {}
      const detalle = [err.code && `código ${err.code}`, err.text].filter(Boolean).join(': ')
      throw new Error(
        `WhatsApp rechazó la solicitud${detalle ? ` (${detalle})` : ''}. ` +
        'Revisa que el número sea correcto y tenga WhatsApp.'
      )
    }
    return code
  } finally {
    clearTimeout(timer)
    sock.ws.off('frame', onFrame)
  }
}
