import { random, randomInt } from '../../lib/functions.js'

export default {
  command: ['decidir', 'elegir', 'random', 'caraocruz', 'sorteo'],
  category: 'herramientas',
  desc: 'Elige al azar: decidir, random, caraocruz, sorteo',
  async run({ sock, m, args, text, command, usedPrefix, participants }) {
    if (command === 'caraocruz') {
      const cara = Math.random() < 0.5
      return m.reply(`🪙 *MONEDA AL AIRE*\n\nSalió: *${cara ? '👑 CARA' : '🔢 CRUZ'}*`)
    }

    if (command === 'random') {
      const min = parseInt(args[0]) || 1
      const max = parseInt(args[1]) || 100
      if (min >= max) return m.reply(`🎲 Uso: *${usedPrefix}${command} 1 100*`)
      return m.reply(`🎲 *NÚMERO ALEATORIO*\n\nEntre ${min} y ${max}:\n\n🔢 *${randomInt(min, max)}*`)
    }

    if (command === 'sorteo') {
      if (!m.isGroup) return m.reply('👥 El sorteo solo funciona en grupos.')
      const candidatos = participants.map((p) => p.id)
      const ganador = random(candidatos)
      return sock.sendMessage(m.chat, {
        text: `🎉 *SORTEO*\n\n👥 Participantes: *${candidatos.length}*\n${text ? `🎁 Premio: *${text}*\n` : ''}\n🥁 El ganador es...\n\n🏆 @${ganador.split('@')[0]}\n\n¡Felicidades! 🎊`,
        mentions: [ganador]
      }, { quoted: m })
    }

    // decidir / elegir
    const opciones = text.split(/\s*[|,]\s*/).filter(Boolean)
    if (opciones.length < 2) return m.reply(`🤔 Uso: *${usedPrefix}${command} pizza | sushi | tacos*`)
    await m.reply(`🤔 *DECISIÓN TOMADA*\n\n${opciones.map((o) => `   • ${o}`).join('\n')}\n\n👉 Yo elijo: *${random(opciones)}*`)
  }
}
