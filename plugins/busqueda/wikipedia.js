import { getJson } from '../../lib/functions.js'
export default {
  command: ['wiki', 'wikipedia'],
  category: 'busqueda',
  desc: 'Busca un artículo en Wikipedia',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`📚 Uso: *${usedPrefix}${command} Albert Einstein*`)
    await m.react('📚')
    const search = await getJson(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(text)}&format=json`)
    const first = search.query.search[0]
    if (!first) return m.reply('❌ No encontré ese artículo.')
    const page = await getJson(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title)}`)
    const caption = `📚 *${page.title}*\n\n${page.extract}\n\n🔗 ${page.content_urls?.desktop?.page || ''}`
    if (page.thumbnail?.source) {
      await sock.sendMessage(m.chat, { image: { url: page.thumbnail.source }, caption }, { quoted: m })
    } else await m.reply(caption)
  }
}
