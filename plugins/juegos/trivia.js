import db from '../../lib/database.js'
import { getJson, random } from '../../lib/functions.js'

const activos = new Map()

export default {
  command: ['trivia', 'preguntados'],
  category: 'juegos',
  desc: 'Pregunta de cultura general (30 s para responder)',
  async run({ sock, m }) {
    if (activos.has(m.chat)) return m.reply('⚠️ Ya hay una trivia activa en este chat.')

    const data = await getJson('https://opentdb.com/api.php?amount=1&type=multiple')
    const q = data.results?.[0]
    if (!q) return m.reply('❌ No pude obtener una pregunta, intenta de nuevo.')

    const decode = (t) => t.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&eacute;/g, 'é').replace(/&uuml;/g, 'ü')
    const opciones = [...q.incorrect_answers.map(decode), decode(q.correct_answer)].sort(() => Math.random() - 0.5)
    const correcta = opciones.indexOf(decode(q.correct_answer)) + 1

    activos.set(m.chat, correcta)
    const letras = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

    await m.reply(
`🧠 *TRIVIA*
📂 Categoría: ${decode(q.category)}
⭐ Dificultad: ${q.difficulty}

❓ ${decode(q.question)}

${opciones.map((o, i) => `${letras[i]} ${o}`).join('\n')}

⏱️ Responde con el *número* (30 s)
💰 Premio: 250 monedas`)

    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.remoteJid !== m.chat) return
      const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if (!/^[1-4]$/.test(txt)) return
      const jid = msg.key.participant || msg.key.remoteJid
      if (parseInt(txt) === correcta) {
        cleanup()
        db.user(jid).coins += 250
        await sock.sendMessage(m.chat, { text: `🎉 ¡Correcto! La respuesta era *${decode(q.correct_answer)}*.\n💰 +250 monedas`, mentions: [jid] }, { quoted: msg })
      }
    }
    const timer = setTimeout(async () => {
      cleanup()
      await sock.sendMessage(m.chat, { text: `⏰ ¡Tiempo! La respuesta correcta era *${decode(q.correct_answer)}*.` })
    }, 30000)
    function cleanup() { clearTimeout(timer); activos.delete(m.chat); sock.ev.off('messages.upsert', listener) }
    sock.ev.on('messages.upsert', listener)
  }
}
