export default {
  command: ['link', 'enlace', 'linkgrupo'],
  category: 'grupos',
  desc: 'Obtiene el enlace de invitación del grupo',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, groupMetadata }) {
    const code = await sock.groupInviteCode(m.chat)
    await m.reply(`🔗 *${groupMetadata?.subject}*\n\nhttps://chat.whatsapp.com/${code}`)
  }
}
