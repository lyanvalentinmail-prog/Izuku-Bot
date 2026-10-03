export default {
  command: ['setppgrupo', 'fotogrupo'],
  category: 'grupos',
  desc: 'Cambia la foto del grupo',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, usedPrefix, command }) {
    const target = m.quoted?.mtype === 'imageMessage' ? m.quoted : (m.mtype === 'imageMessage' ? m : null)
    if (!target) return m.reply(`🖼️ Envía o responde a una imagen con *${usedPrefix}${command}*`)
    await m.react('⏳')
    await sock.updateProfilePicture(m.chat, await target.download())
    await m.reply('✅ Foto del grupo actualizada.')
  }
}
