import { randomInt } from '../../lib/functions.js'
const activos = new Map()
export default {
  command: ['math', 'matematicas', 'mate'],
  category: 'juegos',
  desc: 'Resuelve una operación contra el reloj',
  async run({ sock, m, user }) {
    if (activos.has(m.chat)) return m.reply('⚠️ Ya hay una operación pendiente en este chat.')
    const a = randomInt(2, 50), b = randomInt(2, 20)
    const op = ['+', '-', '*'][randomInt(0, 2)]
    const res = op === '+' ? a + b : op === '-' ? a - b : a * b
    activos.set(m.chat, res)

    await m.reply(`🧮 *RETO MATEMÁTICO*\n\n¿Cuánto es *${a} ${op} ${b}*?\n⏱️ Tienes 20 segundos.\n💰 Premio: 200 monedas`)

    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.remoteJid !== m.chat) return
      const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if (parseInt(txt) === res) {
        cleanup()
        const jid = msg.key.participant || msg.key.remoteJid
        const db = (await import('../../lib/database.js')).default
        db.user(jid).coins += 200
        await sock.sendMessage(m.chat, { text: `🎉 ¡Correcto! La respuesta era *${res}*.\n💰 +200 monedas`, mentions: [jid] }, { quoted: msg })
      }
    }
    const timer = setTimeout(async () => {
      cleanup()
      await sock.sendMessage(m.chat, { text: `⏰ ¡Se acabó el tiempo! La respuesta era *${res}*.` })
    }, 20000)
    function cleanup() { clearTimeout(timer); activos.delete(m.chat); sock.ev.off('messages.upsert', listener) }
    sock.ev.on('messages.upsert', listener)
  }
}
