import { getBuffer } from '../../lib/functions.js'
export default {
  command: ['qr', 'qrcode', 'generarqr'],
  category: 'herramientas',
  desc: 'Genera un código QR con un texto o enlace',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🔳 Uso: *${usedPrefix}${command} texto o enlace*`)
    const buf = await getBuffer(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`)
    await sock.sendMessage(m.chat, { image: buf, caption: `🔳 QR generado para:\n${text}` }, { quoted: m })
  }
}
