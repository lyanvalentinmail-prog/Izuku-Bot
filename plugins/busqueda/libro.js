import { getJson } from '../../lib/functions.js'

export default {
  command: ['libro', 'book'],
  category: 'busqueda',
  desc: 'Busca información de un libro',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`📚 Uso: *${usedPrefix}${command} Cien años de soledad*`)
    await m.react('📚')
    const d = await getJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(text)}&maxResults=1&langRestrict=es`)
    const v = d.items?.[0]?.volumeInfo
    if (!v) return m.reply('❌ No encontré ese libro.')

    const caption =
`📚 *${v.title}*${v.subtitle ? `\n_${v.subtitle}_` : ''}

✍️ Autor: *${(v.authors || ['—']).join(', ')}*
🏢 Editorial: ${v.publisher || '—'}
📅 Publicado: ${v.publishedDate || '—'}
📄 Páginas: ${v.pageCount || '—'}
⭐ Valoración: ${v.averageRating ? `${v.averageRating}/5 (${v.ratingsCount} votos)` : '—'}
🏷️ ${(v.categories || []).join(', ') || '—'}

📖 *Sinopsis:*
${(v.description || 'Sin descripción.').replace(/<[^>]+>/g, '').slice(0, 800)}

${v.previewLink ? `🔗 ${v.previewLink}` : ''}`

    const img = v.imageLinks?.thumbnail?.replace('http:', 'https:')
    if (img) await sock.sendMessage(m.chat, { image: { url: img }, caption }, { quoted: m })
    else await m.reply(caption)
  }
}
