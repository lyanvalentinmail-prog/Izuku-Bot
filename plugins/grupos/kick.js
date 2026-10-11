export default {
  command: ['kick', 'echar', 'expulsar'],
  category: 'grupos',
  desc: 'Expulsa a un miembro del grupo',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, usedPrefix, command }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`👢 Uso: *${usedPrefix}${command} @usuario* (o responde a su mensaje)`)
    await sock.groupParticipantsUpdate(m.chat, [target], 'remove')
    await sock.sendMessage(m.chat, { text: `👢 @${target.split('@')[0]} fue expulsado.`, mentions: [target] }, { quoted: m })
  }
}
