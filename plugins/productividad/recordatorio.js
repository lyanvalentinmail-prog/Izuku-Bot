import { formatTime } from '../../lib/functions.js'

const UNIDADES = { s: 1000, m: 60000, h: 3600000, d: 86400000 }

export default {
  command: ['recordatorio', 'recordar', 'remind'],
  category: 'productividad',
  desc: 'Te avisa pasado un tiempo — recordar 10m sacar la basura',
  async run({ sock, m, args, usedPrefix, command }) {
    const tiempo = args[0]
    const texto = args.slice(1).join(' ')
    const match = /^(\d+)([smhd])$/i.exec(tiempo || '')
    if (!match || !texto) {
      return m.reply(
`⏰ Uso: *${usedPrefix}${command} <tiempo> <mensaje>*

Ejemplos:
• *${usedPrefix}${command} 30s* revisar el horno
• *${usedPrefix}${command} 10m* sacar la basura
• *${usedPrefix}${command} 2h* estudiar
• *${usedPrefix}${command} 1d* felicitar a mamá`)
    }

    const ms = parseInt(match[1]) * UNIDADES[match[2].toLowerCase()]
    if (ms < 5000) return m.reply('⚠️ El mínimo son 5 segundos.')
    if (ms > 7 * 86400000) return m.reply('⚠️ El máximo son 7 días.')

    await m.reply(`⏰ *RECORDATORIO PROGRAMADO*\n\n📝 ${texto}\n⏳ Te aviso en *${formatTime(ms)}*`)

    setTimeout(async () => {
      await sock.sendMessage(m.chat, {
        text: `🔔 *¡RECORDATORIO!*\n\n@${m.sender.split('@')[0]}\n📝 ${texto}\n\n_Programado hace ${formatTime(ms)}_`,
        mentions: [m.sender]
      }, { quoted: m }).catch(() => {})
    }, ms)
  }
}
