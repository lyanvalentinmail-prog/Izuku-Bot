import axios from 'axios'
import { apiCache } from '../../lib/cache.js'

export default {
  command: ['noticias', 'news'],
  category: 'actualidad',
  desc: 'Últimas noticias (puedes filtrar por tema)',
  async run({ m, text, usedPrefix, command }) {
    await m.react('📰')
    const tema = text.trim()
    const clave = `news:${tema || 'general'}`
    let items = apiCache.get(clave)

    if (!items) {
      const url = tema
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(tema)}&hl=es&gl=ES&ceid=ES:es`
        : 'https://news.google.com/rss?hl=es&gl=ES&ceid=ES:es'
      const { data } = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } })
      items = [...data.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8).map((x) => {
        const b = x[1]
        const limpiar = (s) => (s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()
        return {
          titulo: limpiar(b.match(/<title>([\s\S]*?)<\/title>/)?.[1]),
          link: limpiar(b.match(/<link>([\s\S]*?)<\/link>/)?.[1]),
          fuente: limpiar(b.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]),
          fecha: limpiar(b.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1])
        }
      })
      apiCache.set(clave, items, 600)
    }

    if (!items.length) return m.reply('❌ No encontré noticias ahora mismo.')

    let txt = `📰 *NOTICIAS${tema ? ` — ${tema.toUpperCase()}` : ''}*\n_Actualizado: ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}_\n`
    items.forEach((n, i) => {
      txt += `\n*${i + 1}.* ${n.titulo}\n    📡 ${n.fuente || '—'}\n    🔗 ${n.link}\n`
    })
    txt += `\n💡 Filtra por tema: *${usedPrefix}${command} tecnología*`
    await m.reply(txt)
  }
}
