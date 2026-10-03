import { ytSearch } from '../../lib/downloader.js'
export default {
  command: ['ytsearch', 'yts', 'buscaryt'],
  category: 'busqueda',
  desc: 'Busca videos en YouTube',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🔎 Uso: *${usedPrefix}${command} lofi hip hop*`)
    await m.react('🔎')
    const results = await ytSearch(text, 6)
    if (!results.length) return m.reply('❌ Sin resultados.')
    let out = `🔎 *RESULTADOS DE YOUTUBE*\n_${text}_\n`
    results.forEach((v, i) => {
      out += `\n╭─ *${i + 1}. ${v.title}*\n│ 👤 ${v.author}\n│ ⏱️ ${v.duration}  👁️ ${v.views}\n│ 🔗 ${v.url}\n╰────────────`
    })
    out += `\n\n💡 Descárgalo con *${usedPrefix}play <nombre>*`
    await m.reply(out)
  }
}
