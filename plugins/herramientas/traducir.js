import { getJson } from '../../lib/functions.js'
export default {
  command: ['traducir', 'translate', 'tr'],
  category: 'herramientas',
  desc: 'Traduce un texto — uso: traducir en Hola mundo',
  async run({ m, args, usedPrefix, command }) {
    let lang = 'es'
    let text = args.join(' ')
    if (args[0] && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(args[0])) { lang = args[0]; text = args.slice(1).join(' ') }
    if (!text) text = m.quoted?.text || ''
    if (!text) return m.reply(`🌐 Uso: *${usedPrefix}${command} <idioma> <texto>*\nEjemplo: *${usedPrefix}${command} en Hola mundo*`)

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
    const data = await getJson(url)
    const out = data[0].map((x) => x[0]).join('')
    await m.reply(`🌐 *TRADUCCIÓN* (${data[2]} ➜ ${lang})\n\n${out}`)
  }
}
