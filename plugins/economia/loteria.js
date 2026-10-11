import { randomInt } from '../../lib/functions.js'
export default {
  command: ['loteria', 'lottery'],
  category: 'economia',
  desc: 'Compra un billete y prueba suerte',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const PRECIO = 1000
    const n = parseInt(args[0])
    if (!n || n < 1 || n > 50) {
      return m.reply(
`🎟️ *LOTERÍA*

Elige un número del *1 al 50* y compra tu billete.
💸 Billete: *${PRECIO}* monedas

🎯 Número exacto → *x30* (30 000 🪙)
🔥 Fallas por 1 → *x3*
🌟 Fallas por 2-3 → recuperas el billete

Uso: *${usedPrefix}${command} 27*`)
    }
    if (user.coins < PRECIO) return m.reply(`💸 El billete cuesta *${PRECIO}* y tienes *${user.coins}*.`)
    user.coins -= PRECIO

    const ganador = randomInt(1, 50)
    const dif = Math.abs(ganador - n)
    let premio = 0, txt
    if (dif === 0) { premio = PRECIO * 30; txt = '🎊 *¡PREMIO MAYOR!*' }
    else if (dif === 1) { premio = PRECIO * 3; txt = '🔥 *¡Casi casi!*' }
    else if (dif <= 3) { premio = PRECIO; txt = '🌟 *Recuperas el billete*' }
    else txt = '😢 *No hubo suerte*'

    user.coins += premio
    await m.reply(
`🎟️ *LOTERÍA*

🎯 Tu número: *${n}*
🎰 Número ganador: *${ganador}*

${txt}
${premio ? `💰 Ganaste *${premio}* monedas` : `💸 Perdiste *${PRECIO}* monedas`}
💰 Saldo: *${user.coins}*`)
  }
}
