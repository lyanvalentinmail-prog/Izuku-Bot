import db from '../../lib/database.js'
export default {
  command: ['statsgrupo', 'estadisticas'],
  category: 'info',
  desc: 'Estadísticas de los miembros del grupo',
  group: true,
  async run({ sock, m, participants, groupMetadata }) {
    const datos = participants
      .map((p) => ({ jid: p.id, u: db.data.users[p.id] }))
      .filter((x) => x.u)

    const registrados = datos.filter((x) => x.u.registered).length
    const conRpg = datos.filter((x) => x.u.rpg).length
    const monedas = datos.reduce((a, x) => a + (x.u.coins || 0) + (x.u.bank || 0), 0)
    const topNivel = [...datos].sort((a, b) => (b.u.level || 0) - (a.u.level || 0)).slice(0, 3)
    const topCmd = [...datos].sort((a, b) => (b.u.commands || 0) - (a.u.commands || 0)).slice(0, 3)

    await sock.sendMessage(m.chat, {
      text:
`📊 *ESTADÍSTICAS DEL GRUPO*
🏷️ ${groupMetadata.subject}

👥 Miembros: *${participants.length}*
🤖 Usan el bot: *${datos.length}*
📝 Registrados: *${registrados}*
🗡️ Con personaje RPG: *${conRpg}*
💰 Monedas totales: *${monedas.toLocaleString('es')}*

🏅 *Mayor nivel:*
${topNivel.map((x, i) => `${i + 1}. @${x.jid.split('@')[0]} — Nv.${x.u.level}`).join('\n') || '—'}

⚡ *Más activos:*
${topCmd.map((x, i) => `${i + 1}. @${x.jid.split('@')[0]} — ${x.u.commands || 0} cmd`).join('\n') || '—'}`,
      mentions: [...topNivel, ...topCmd].map((x) => x.jid)
    }, { quoted: m })
  }
}
