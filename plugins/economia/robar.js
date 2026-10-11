import config from '../../config.js'
import db from '../../lib/database.js'
import { formatTime, randomInt } from '../../lib/functions.js'
export default {
  command: ['rob', 'robar'],
  category: 'economia',
  desc: 'Intenta robar monedas a otro usuario',
  register: true,
  group: true,
  async run({ m, user, usedPrefix, command }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`🦹 Uso: *${usedPrefix}${command} @usuario*`)
    if (target === m.sender) return m.reply('🤨 No puedes robarte a ti mismo.')
    const wait = 1800000 - (Date.now() - user.lastRob)
    if (wait > 0) return m.reply(`🚓 La policía te vigila. Espera *${formatTime(wait)}*.`)

    const victima = db.user(target)
    if (victima.coins < 100) return m.reply('😕 Esa persona está en la ruina, no vale la pena.')

    user.lastRob = Date.now()
    if (Math.random() < config.economy.robChance) {
      const botin = Math.floor(victima.coins * 0.2)
      victima.coins -= botin
      user.coins += botin
      return m.reply(`🦹 ¡Robo exitoso!\nTe llevaste *${botin}* monedas.\n💰 Saldo: *${user.coins}*`)
    }
    const multa = Math.min(user.coins, 300)
    user.coins -= multa
    await m.reply(`🚔 ¡Te atraparon!\nPagaste una multa de *${multa}* monedas.\n💰 Saldo: *${user.coins}*`)
  }
}
