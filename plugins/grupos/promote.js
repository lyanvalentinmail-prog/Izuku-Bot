export default {
  command: ['promote', 'promover', 'daradmin', 'demote', 'quitaradmin'],
  category: 'grupos',
  desc: 'Da o quita administrador a un miembro',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, command, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`👑 Uso: *${usedPrefix}${command} @usuario*`)
    const promote = ['promote', 'promover', 'daradmin'].includes(command)
    await sock.groupParticipantsUpdate(m.chat, [target], promote ? 'promote' : 'demote')
    await sock.sendMessage(m.chat, {
      text: `${promote ? '👑 Ahora' : '📉 Ya no'} @${target.split('@')[0]} es administrador.`,
      mentions: [target]
    }, { quoted: m })
  }
}
