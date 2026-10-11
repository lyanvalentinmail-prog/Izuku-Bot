import db from '../../lib/database.js'
export default {
  command: ['top', 'ricos', 'leaderboard'],
  category: 'economia',
  desc: 'Top 10 usuarios más ricos',
  async run({ sock, m }) {
    const lista = Object.entries(db.data.users)
      .map(([jid, u]) => ({ jid, total: u.coins + u.bank, name: u.name, level: u.level }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    if (!lista.length) return m.reply('📭 Aún no hay datos.')
    const medallas = ['🥇', '🥈', '🥉']
    let txt = '🏆 *TOP 10 MÁS RICOS*\n'
    lista.forEach((u, i) => {
      txt += `\n${medallas[i] || `${i + 1}.`} @${u.jid.split('@')[0]}\n   💰 ${u.total} · 🏅 Nv.${u.level}`
    })
    await sock.sendMessage(m.chat, { text: txt, mentions: lista.map((u) => u.jid) }, { quoted: m })
  }
}
