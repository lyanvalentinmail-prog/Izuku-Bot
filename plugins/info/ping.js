export default {
  command: ['ping', 'p'],
  category: 'info',
  desc: 'Mide la velocidad de respuesta del bot',
  async run({ m }) {
    const start = Date.now()
    await m.react('🏓')
    await m.reply(`🏓 *Pong!*\nVelocidad: *${Date.now() - start} ms*`)
  }
}
