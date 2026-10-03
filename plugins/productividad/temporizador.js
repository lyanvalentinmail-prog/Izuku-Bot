import { formatTime, sleep } from '../../lib/functions.js'
export default {
  command: ['temporizador', 'timer', 'cuentaatras'],
  category: 'productividad',
  desc: 'Cuenta atrás con aviso al terminar',
  async run({ sock, m, args, usedPrefix, command }) {
    const seg = parseInt(args[0])
    if (!seg || seg < 5 || seg > 600) return m.reply(`⏱️ Uso: *${usedPrefix}${command} 60* (entre 5 y 600 segundos)`)
    const { key } = await sock.sendMessage(m.chat, { text: `⏱️ *TEMPORIZADOR*\n\n⏳ ${formatTime(seg * 1000)} restantes` }, { quoted: m })

    let restante = seg
    const paso = seg > 120 ? 30 : seg > 60 ? 15 : 10
    while (restante > 0) {
      await sleep(Math.min(paso, restante) * 1000)
      restante -= paso
      if (restante > 0) {
        await sock.sendMessage(m.chat, { text: `⏱️ *TEMPORIZADOR*\n\n⏳ ${formatTime(restante * 1000)} restantes`, edit: key }).catch(() => {})
      }
    }
    await sock.sendMessage(m.chat, { text: `🔔 *¡TIEMPO!*\n\n@${m.sender.split('@')[0]} se acabaron los ${formatTime(seg * 1000)}.`, mentions: [m.sender] }, { quoted: m })
  }
}
