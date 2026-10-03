import config from '../../config.js'
import { formatTime } from '../../lib/functions.js'
export default {
  command: ['daily', 'diario', 'cofre'],
  category: 'economia',
  desc: 'Reclama tu recompensa diaria',
  register: true,
  async run({ m, user }) {
    const wait = 86400000 - (Date.now() - user.lastDaily)
    if (wait > 0) return m.reply(`⏳ Ya reclamaste tu recompensa.\nVuelve en *${formatTime(wait)}*.`)
    const premio = config.economy.dailyReward
    user.coins += premio
    user.lastDaily = Date.now()
    await m.reply(`🎁 *RECOMPENSA DIARIA*\n\n+${premio} monedas\n💰 Saldo: *${user.coins}*`)
  }
}
