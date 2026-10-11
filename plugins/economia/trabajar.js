import config from '../../config.js'
import { formatTime, random, randomInt } from '../../lib/functions.js'
export default {
  command: ['work', 'trabajar'],
  category: 'economia',
  desc: 'Trabaja para ganar monedas',
  register: true,
  async run({ m, user }) {
    const wait = 600000 - (Date.now() - user.lastWork)
    if (wait > 0) return m.reply(`😴 Estás cansado. Descansa *${formatTime(wait)}*.`)
    const trabajos = ['repartidor de pizza', 'programador', 'músico callejero', 'paseador de perros', 'barista', 'diseñador', 'héroe profesional', 'youtuber']
    const pago = randomInt(config.economy.workMin, config.economy.workMax)
    user.coins += pago
    user.lastWork = Date.now()
    await m.reply(`💼 *TRABAJO*\n\nTrabajaste como *${random(trabajos)}*\n💵 Ganaste: *${pago}* monedas\n💰 Saldo: *${user.coins}*`)
  }
}
