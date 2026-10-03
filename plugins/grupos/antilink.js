export default {
  command: ['antilink'],
  category: 'grupos',
  desc: 'Activa/desactiva el antilink — uso: antilink on|off',
  group: true, admin: true,
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(opt)) return m.reply(`🛡️ Uso: *${usedPrefix}${command} on* o *${usedPrefix}${command} off*\nEstado actual: *${chat.antilink ? 'activado' : 'desactivado'}*`)
    chat.antilink = opt === 'on'
    await m.reply(`🛡️ Antilink *${chat.antilink ? 'activado' : 'desactivado'}*.`)
  }
}
