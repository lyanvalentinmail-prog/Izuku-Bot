import { getJson } from '../../lib/functions.js'
export default {
  command: ['google', 'buscar'],
  category: 'busqueda',
  desc: 'Busca en la web',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🔎 Uso: *${usedPrefix}${command} qué es node.js*`)
    await m.react('🔎')
    const data = await getJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(text)}&format=json&no_html=1`)
    let out = `🔎 *BÚSQUEDA:* _${text}_\n`
    if (data.AbstractText) out += `\n📝 ${data.AbstractText}\n🔗 ${data.AbstractURL}\n`
    const topics = (data.RelatedTopics || []).filter((t) => t.Text).slice(0, 5)
    topics.forEach((t, i) => { out += `\n*${i + 1}.* ${t.Text}\n   🔗 ${t.FirstURL}` })
    if (!data.AbstractText && !topics.length) out += '\n❌ Sin resultados directos. Intenta con otras palabras.'
    await m.reply(out)
  }
}
