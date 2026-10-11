import { getBuffer } from '../../lib/functions.js'
export default {
  command: ['tts', 'voz', 'decir'],
  category: 'herramientas',
  desc: 'Convierte texto a voz — uso: tts es Hola',
  async run({ sock, m, args, usedPrefix, command }) {
    let lang = 'es'
    let text = args.join(' ')
    if (args[0] && /^[a-z]{2}$/.test(args[0])) { lang = args[0]; text = args.slice(1).join(' ') }
    if (!text) text = m.quoted?.text || ''
    if (!text) return m.reply(`🔊 Uso: *${usedPrefix}${command} es Hola a todos*`)
    if (text.length > 200) return m.reply('⚠️ Máximo 200 caracteres.')
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
    const buf = await getBuffer(url)
    await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
  }
}
