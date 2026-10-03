import axios from 'axios'
import { createSticker } from '../../lib/sticker.js'

export default {
  command: ['qc', 'cita'],
  category: 'stickers',
  desc: 'Convierte un texto en sticker tipo cita de chat',
  async run({ sock, m, text, usedPrefix, command }) {
    const contenido = text || m.quoted?.text
    if (!contenido) return m.reply(`💬 Uso: *${usedPrefix}${command} Hola a todos*\n_O responde a un mensaje._`)
    await m.react('⏳')

    const autor = m.quoted ? (m.quoted.sender?.split('@')[0] || 'Usuario') : (m.pushName || 'Usuario')
    let avatar = 'https://i.imgur.com/HQnLLfu.png'
    try { avatar = await sock.profilePictureUrl(m.quoted?.sender || m.sender, 'image') } catch {}

    const payload = {
      type: 'quote', format: 'png', backgroundColor: '#1b1429', width: 600, height: 900, scale: 2,
      messages: [{
        entities: [], avatar: true,
        from: { id: 1, name: autor, photo: { url: avatar } },
        text: contenido.slice(0, 500), replyMessage: {}
      }]
    }

    try {
      const { data } = await axios.post('https://bot.lyo.su/quote/generate', payload, { timeout: 60000 })
      const buffer = Buffer.from(data.result.image, 'base64')
      await sock.sendMessage(m.chat, { sticker: await createSticker(buffer) }, { quoted: m })
      await m.react('✅')
    } catch {
      await m.reply('❌ El generador de citas no respondió. Inténtalo más tarde.')
    }
  }
}
