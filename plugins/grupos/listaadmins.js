export default {
  command: ['admins', 'listaadmins', 'staff'],
  category: 'grupos',
  desc: 'Lista los administradores del grupo',
  group: true,
  async run({ sock, m, participants, groupMetadata }) {
    const admins = participants.filter((p) => p.admin)
    const dueno = admins.find((p) => p.admin === 'superadmin')
    await sock.sendMessage(m.chat, {
      text:
`👑 *ADMINISTRADORES*
🏷️ ${groupMetadata.subject}

${dueno ? `🔱 *Creador:* @${dueno.id.split('@')[0]}\n\n` : ''}*Admins (${admins.length}):*
${admins.map((p) => `• @${p.id.split('@')[0]}`).join('\n')}

👥 Total de miembros: *${participants.length}*`,
      mentions: admins.map((p) => p.id)
    }, { quoted: m })
  }
}
