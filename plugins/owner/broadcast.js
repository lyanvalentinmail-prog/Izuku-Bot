import { sleep } from '../../lib/functions.js'
export default {
  command: ['bc', 'broadcast', 'difusion'],
  category: 'owner',
  desc: 'Envía un mensaje a todos los grupos',
  owner: true,
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`📢 Uso: *${usedPrefix}${command} mensaje para todos*`)
    const groups = Object.keys(await sock.groupFetchAllParticipating())
    await m.reply(`📢 Enviando a *${groups.length}* grupos...`)
    let ok = 0
    for (const jid of groups) {
      try {
        await sock.sendMessage(jid, { text: `📢 *MENSAJE DEL DUEÑO*\n\n${text}` })
        ok++
        await sleep(1500)
      } catch {}
    }
    await m.reply(`✅ Enviado a *${ok}/${groups.length}* grupos.`)
  }
}
