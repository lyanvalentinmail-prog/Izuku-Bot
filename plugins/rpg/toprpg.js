import db from '../../lib/database.js'
import { CLASES } from '../../lib/rpg.js'

export default {
  command: ['toprpg', 'ranking', 'topnivel'],
  category: 'rpg',
  desc: 'Ranking de los mejores aventureros',
  async run({ sock, m }) {
    const lista = Object.entries(db.data.users)
      .filter(([, u]) => u.rpg)
      .map(([jid, u]) => ({ jid, ...u.rpg }))
      .sort((a, b) => b.level - a.level || b.xp - a.xp || b.wins - a.wins)
      .slice(0, 10)

    if (!lista.length) return m.reply('📭 Todavía no hay aventureros. ¡Sé el primero con *.crear*!')

    const medallas = ['🥇', '🥈', '🥉']
    let txt = '🏆 *RANKING DE AVENTUREROS*\n'
    lista.forEach((p, i) => {
      const c = CLASES[p.clase]
      txt += `\n${medallas[i] || `${i + 1}.`} ${c.emoji} @${p.jid.split('@')[0]}\n   🏅 Nv.${p.level} · ✅ ${p.wins}V / ❌ ${p.loses}D`
    })
    await sock.sendMessage(m.chat, { text: txt, mentions: lista.map((p) => p.jid) }, { quoted: m })
  }
}
