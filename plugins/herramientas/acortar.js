import { getJson } from '../../lib/functions.js'
import axios from 'axios'
export default {
  command: ['acortar', 'short', 'tinyurl'],
  category: 'herramientas',
  desc: 'Acorta un enlace largo',
  async run({ m, text, usedPrefix, command }) {
    if (!/^https?:\/\//.test(text)) return m.reply(`🔗 Uso: *${usedPrefix}${command} https://ejemplo.com/url-muy-larga*`)
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`)
    await m.reply(`🔗 *Enlace acortado*\n\n${data}`)
  }
}
