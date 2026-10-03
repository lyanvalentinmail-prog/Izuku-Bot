export default {
  command: ['setppbot', 'fotobot'],
  category: 'owner',
  desc: 'Cambia la foto de perfil del bot',
  owner: true,
  async run({ sock, m, usedPrefix, command }) {
    const target = m.quoted?.mtype === 'imageMessage' ? m.quoted : (m.mtype === 'imageMessage' ? m : null)
    if (!target) return m.reply(`🖼️ Envía o responde a una imagen con *${usedPrefix}${command}*`)
    await m.react('⏳')
    await sock.updateProfilePicture(sock.user.id, await target.download())
    await m.reply('✅ Foto de perfil del bot actualizada.')
  }
}
