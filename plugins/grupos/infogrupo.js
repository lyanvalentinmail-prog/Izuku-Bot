export default {
  command: ['infogrupo', 'groupinfo'],
  category: 'grupos',
  desc: 'Información del grupo',
  group: true,
  async run({ sock, m, groupMetadata, participants }) {
    const admins = participants.filter((p) => p.admin)
    let pp
    try { pp = await sock.profilePictureUrl(m.chat, 'image') } catch {}
    const caption =
`╭──「 👥 *INFO DEL GRUPO* 」
│ 🏷️ Nombre: ${groupMetadata.subject}
│ 🆔 ID: ${m.chat}
│ 👤 Creador: ${groupMetadata.owner?.split('@')[0] || '—'}
│ 👥 Miembros: ${participants.length}
│ 👑 Admins: ${admins.length}
│ 🔐 Solo admins: ${groupMetadata.announce ? 'Sí' : 'No'}
╰────────────────

📝 *Descripción:*
${groupMetadata.desc || 'Sin descripción'}`
    if (pp) await sock.sendMessage(m.chat, { image: { url: pp }, caption }, { quoted: m })
    else await m.reply(caption)
  }
}
