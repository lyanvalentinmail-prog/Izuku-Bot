import { getBuffer } from '../../lib/functions.js'
export default {
  command: ['ss', 'ssweb', 'captura'],
  category: 'herramientas',
  desc: 'Captura de pantalla de una página web',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/^https?:\/\//.test(text)) return m.reply(`📸 Uso: *${usedPrefix}${command} https://google.com*`)
    const buf = await getBuffer(`https://image.thum.io/get/width/1280/crop/900/${text}`)
    await sock.sendMessage(m.chat, { image: buf, caption: `📸 ${text}` }, { quoted: m })
  }
}
