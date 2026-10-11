import { getJson } from '../../lib/functions.js'
export default {
  command: ['temporada', 'season'],
  category: 'anime',
  desc: 'Animes que están saliendo esta temporada',
  async run({ m }) {
    await m.react('🔎')
    const res = await getJson('https://api.jikan.moe/v4/seasons/now?limit=15&sfw=true')
    const lista = (res.data || []).slice(0, 15)
    if (!lista.length) return m.reply('❌ No pude obtener la temporada.')
    let txt = '🎌 *ANIMES DE ESTA TEMPORADA*\n'
    lista.forEach((a, i) => {
      txt += `\n*${i + 1}.* ${a.title}\n    ⭐ ${a.score || '—'} · 📺 ${a.episodes || '?'} eps · ${a.type}`
    })
    await m.reply(txt)
  }
}
