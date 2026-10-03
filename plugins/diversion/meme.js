import { getJson } from '../../lib/functions.js'
export default {
  command: ['meme', 'memes'],
  category: 'diversion',
  desc: 'Un meme aleatorio',
  async run({ sock, m }) {
    await m.react('😹')
    // subreddits elegidos por ser siempre aptos para todo publico
    const d = await getJson('https://meme-api.com/gimme/wholesomememes')
    if (d?.nsfw) return m.reply('🔁 Intenta de nuevo.')
    await sock.sendMessage(m.chat, { image: { url: d.url }, caption: `😹 *${d.title}*\n👤 u/${d.author} · 👍 ${d.ups}` }, { quoted: m })
  }
}
