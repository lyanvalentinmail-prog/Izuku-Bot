export default {
  command: ['setname', 'setnombre', 'setdesc', 'setdescripcion'],
  category: 'grupos',
  desc: 'Cambia el nombre o la descripción del grupo',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, text, command, usedPrefix }) {
    if (!text) return m.reply(`✏️ Uso: *${usedPrefix}${command} <texto>*`)
    if (command.includes('desc')) {
      await sock.groupUpdateDescription(m.chat, text)
      return m.reply('✅ Descripción actualizada.')
    }
    await sock.groupUpdateSubject(m.chat, text)
    await m.reply('✅ Nombre del grupo actualizado.')
  }
}
