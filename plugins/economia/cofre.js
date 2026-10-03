import { ITEMS, roll } from '../../lib/shop.js'
import { formatTime, randomInt } from '../../lib/functions.js'

export default {
  command: ['cofre', 'chest', 'caja'],
  category: 'economia',
  desc: 'Abre un cofre misterioso cada 2 horas',
  register: true,
  async run({ m, user }) {
    user.lastCofre = user.lastCofre || 0
    const wait = 7200000 - (Date.now() - user.lastCofre)
    if (wait > 0) return m.reply(`📦 El próximo cofre aparece en *${formatTime(wait)}*.`)
    user.lastCofre = Date.now()

    const rareza = roll({ comun: 60, raro: 28, epico: 10, legendario: 2 })
    const config = {
      comun:      { emoji: '📦', nombre: 'Cofre común',      coins: [200, 800],    objetos: 1 },
      raro:       { emoji: '🎁', nombre: 'Cofre raro',       coins: [800, 2500],   objetos: 2 },
      epico:      { emoji: '💼', nombre: 'Cofre épico',      coins: [2500, 7000],  objetos: 3 },
      legendario: { emoji: '🏆', nombre: 'Cofre legendario', coins: [8000, 20000], objetos: 4 }
    }[rareza]

    const coins = randomInt(...config.coins)
    user.coins += coins
    user.inventory = user.inventory || {}

    const botin = []
    const posibles = ['carbon', 'hierro', 'oro', 'diamante', 'vendaje', 'cebo', 'pocion']
    for (let i = 0; i < config.objetos; i++) {
      const k = posibles[randomInt(0, posibles.length - 1)]
      const n = randomInt(1, 3)
      user.inventory[k] = (user.inventory[k] || 0) + n
      botin.push(`${ITEMS[k].emoji} ${ITEMS[k].name} x${n}`)
    }

    await m.reply(
`${config.emoji} *${config.nombre.toUpperCase()}*

💰 +${coins.toLocaleString('es')} monedas
🎒 Objetos:
${botin.map((b) => `   • ${b}`).join('\n')}

💰 Saldo: *${user.coins}*`)
  }
}
