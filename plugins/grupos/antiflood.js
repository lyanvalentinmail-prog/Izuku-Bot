export default {
  command: ['antiflood', 'antispam'],
  category: 'grupos',
  desc: 'Advierte a quien envíe mensajes muy seguido',
  group: true, admin: true,
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(opt)) {
      return m.reply(`🚦 Uso: *${usedPrefix}${command} on|off*\nEstado actual: *${chat.antiflood ? 'activado' : 'desactivado'}*\n\n_Avisa (y a la tercera expulsa) a quien mande más de 6 mensajes en 8 segundos._`)
    }
    chat.antiflood = opt === 'on'
    await m.reply(`🚦 Antiflood *${chat.antiflood ? 'activado' : 'desactivado'}*.`)
  }
}
