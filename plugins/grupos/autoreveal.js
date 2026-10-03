export default {
  command: ['autoreveal', 'antivv'],
  category: 'grupos',
  desc: 'Revela automáticamente los "ver una vez" del chat',
  admin: true,
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(opt)) {
      return m.reply(
`👁️ *AUTO-REVELAR*

Estado: *${chat.autoReveal ? 'activado' : 'desactivado'}*

Cuando está activo, cualquier foto o video de *"ver una sola vez"* que se envíe aquí se reenvía automáticamente como mensaje normal.

*${usedPrefix}${command} on*  — activar
*${usedPrefix}${command} off* — desactivar

💡 Para revelar uno suelto: responde con *${usedPrefix}reveal*`)
    }
    chat.autoReveal = opt === 'on'
    await m.reply(`👁️ Auto-revelar *${chat.autoReveal ? 'activado' : 'desactivado'}* en este chat.`)
  }
}
