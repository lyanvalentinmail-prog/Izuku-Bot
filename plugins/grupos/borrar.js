export default {
  command: ['delete', 'borrar', 'del'],
  category: 'grupos',
  desc: 'Borra un mensaje del bot',
  group: true, admin: true,
  async run({ sock, m, usedPrefix, command }) {
    if (!m.quoted) return m.reply(`🗑️ Responde al mensaje que quieres borrar con *${usedPrefix}${command}*`)
    await sock.sendMessage(m.chat, { delete: m.quoted.key })
  }
}
