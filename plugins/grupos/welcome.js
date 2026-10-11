export default {
  command: ['welcome', 'bienvenida'],
  category: 'grupos',
  desc: 'Activa/desactiva la bienvenida — uso: welcome on|off',
  group: true, admin: true,
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(opt)) return m.reply(`👋 Uso: *${usedPrefix}${command} on|off*\nEstado: *${chat.welcome ? 'activado' : 'desactivado'}*`)
    chat.welcome = opt === 'on'
    await m.reply(`👋 Bienvenida *${chat.welcome ? 'activada' : 'desactivada'}*.`)
  }
}
