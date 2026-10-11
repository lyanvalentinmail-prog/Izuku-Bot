export default {
  command: ['grupo', 'group'],
  category: 'grupos',
  desc: 'Abre o cierra el grupo — uso: grupo abrir|cerrar',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, args, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (!['abrir', 'cerrar', 'open', 'close'].includes(opt)) {
      return m.reply(`🔐 Uso: *${usedPrefix}${command} abrir* o *${usedPrefix}${command} cerrar*`)
    }
    const close = ['cerrar', 'close'].includes(opt)
    await sock.groupSettingUpdate(m.chat, close ? 'announcement' : 'not_announcement')
    await m.reply(close ? '🔒 Grupo cerrado. Solo admins pueden escribir.' : '🔓 Grupo abierto. Todos pueden escribir.')
  }
}
