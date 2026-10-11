import { randomInt } from '../../lib/functions.js'
export default {
  command: ['dado', 'dice'],
  category: 'juegos',
  desc: 'Lanza un dado y apuesta monedas',
  async run({ m, args, user, usedPrefix, command }) {
    const apuesta = parseInt(args[0]) || 0
    if (apuesta > 0 && apuesta > user.coins) return m.reply('💸 No tienes esas monedas.')
    const n = randomInt(1, 6)
    const caras = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    let extra = ''
    if (apuesta > 0) {
      if (n >= 4) { user.coins += apuesta; extra = `\n🎉 ¡Sacaste ${n}! Ganaste *${apuesta}* monedas.` }
      else { user.coins -= apuesta; extra = `\n😢 Sacaste ${n}. Perdiste *${apuesta}* monedas.` }
      extra += `\n💰 Saldo: ${user.coins}`
    } else extra = `\n\n💡 Apuesta con *${usedPrefix}${command} 100*`
    await m.reply(`🎲 *DADO*\n\n${caras[n]}  Salió el *${n}*${extra}`)
  }
}
