export default {
  command: ['minombre', 'setperfil'],
  category: 'perfil',
  desc: 'Cambia tu nombre en el bot',
  register: true,
  async run({ m, text, user, usedPrefix, command }) {
    if (!text) return m.reply(`✏️ Uso: *${usedPrefix}${command} TuNuevoNombre*`)
    if (text.length > 30) return m.reply('⚠️ Máximo 30 caracteres.')
    user.name = text
    await m.reply(`✅ Tu nombre ahora es *${text}*.`)
  }
}
