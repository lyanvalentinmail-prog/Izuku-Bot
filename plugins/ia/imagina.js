import axios from 'axios'
export default {
  command: ['imagina', 'imagine', 'dalle', 'iaimg'],
  category: 'ia',
  desc: 'Crea una imagen a partir de un texto',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🎨 Uso: *${usedPrefix}${command} un gato astronauta en marte*`)
    await m.react('🎨')
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true&seed=${Date.now() % 99999}`
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 })
    await sock.sendMessage(m.chat, {
      image: Buffer.from(data),
      caption: `🎨 *Imagen generada*\n📝 ${text}`
    }, { quoted: m })
    await m.react('✅')
  }
}
