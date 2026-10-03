import db from '../../lib/database.js'
export default {
  command: ['topcomandos', 'topusers', 'masactivos'],
  category: 'info',
  desc: 'Usuarios que más usan el bot',
  async run({ sock, m }) {
    const lista = Object.entries(db.data.users)
      .filter(([, u]) => u.commands > 0)
      .sort((a, b) => b[1].commands - a[1].commands)
      .slice(0, 10)
    if (!lista.length) return m.reply('📭 Todavía no hay estadísticas.')
    const total = Object.values(db.data.users).reduce((a, u) => a + (u.commands || 0), 0)
    await sock.sendMessage(m.chat, {
      text: `📊 *USUARIOS MÁS ACTIVOS*\n\n${lista.map(([j, u], i) =>
        `${['🥇','🥈','🥉'][i] || `${i + 1}.`} @${j.split('@')[0]} — *${u.commands}* cmd`).join('\n')}\n\n🔢 Total de comandos ejecutados: *${total.toLocaleString('es')}*`,
      mentions: lista.map(([j]) => j)
    }, { quoted: m })
  }
}
