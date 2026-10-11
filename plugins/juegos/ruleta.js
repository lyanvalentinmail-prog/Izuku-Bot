import { randomInt } from '../../lib/functions.js'
export default {
  command: ['ruleta', 'apostar', 'casino'],
  category: 'juegos',
  desc: 'Apuesta monedas en la ruleta',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const apuesta = parseInt(args[0])
    if (!apuesta || apuesta < 50) return m.reply(`🎰 Uso: *${usedPrefix}${command} <monedas>* (mínimo 50)`)
    if (apuesta > user.coins) return m.reply(`💸 Solo tienes *${user.coins}* monedas.`)
    const n = randomInt(1, 100)
    let txt
    if (n <= 5) { user.coins += apuesta * 5; txt = `💎 ¡JACKPOT! Ganaste *${apuesta * 5}* monedas` }
    else if (n <= 40) { user.coins += apuesta; txt = `🎉 Ganaste *${apuesta}* monedas` }
    else { user.coins -= apuesta; txt = `😢 Perdiste *${apuesta}* monedas` }
    await m.reply(`🎰 *RULETA*\n\n🔢 Número: ${n}\n${txt}\n💰 Saldo: *${user.coins}*`)
  }
}
