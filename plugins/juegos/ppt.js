import { random } from '../../lib/functions.js'
export default {
  command: ['ppt', 'piedra'],
  category: 'juegos',
  desc: 'Piedra, papel o tijera contra el bot',
  async run({ m, args, user, usedPrefix, command }) {
    const opciones = ['piedra', 'papel', 'tijera']
    const yo = (args[0] || '').toLowerCase()
    if (!opciones.includes(yo)) return m.reply(`✂️ Uso: *${usedPrefix}${command} piedra|papel|tijera*`)
    const bot = random(opciones)
    const gana = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' }
    let resultado, premio = 0
    if (yo === bot) resultado = '🤝 ¡Empate!'
    else if (gana[yo] === bot) { resultado = '🎉 ¡Ganaste! +100 monedas'; premio = 100; user.coins += 100 }
    else { resultado = '😢 Perdiste. -50 monedas'; premio = -50; user.coins = Math.max(0, user.coins - 50) }
    await m.reply(`✂️ *PIEDRA, PAPEL O TIJERA*\n\n🧑 Tú: ${yo}\n🤖 Bot: ${bot}\n\n${resultado}\n💰 Monedas: ${user.coins}`)
  }
}
