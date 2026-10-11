import db from '../../lib/database.js'
import { random } from '../../lib/functions.js'

const ADIVINANZAS = [
  ['Oro parece, plata no es. ¿Qué es?', 'platano'],
  ['Tiene dientes y no come, tiene cabeza y no es hombre.', 'ajo'],
  ['Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.', 'pera'],
  ['Vuela sin alas, silba sin boca.', 'viento'],
  ['Cuanto más le quitas, más grande es.', 'agujero'],
  ['Tengo agujas pero no sé coser, tengo números pero no sé leer.', 'reloj'],
  ['Siempre quietas, siempre inquietas, durmiendo de día, de noche despiertas.', 'estrellas'],
  ['Todos pasan por mí, yo nunca paso por nadie.', 'calle']
]

const activas = new Map()

export default {
  command: ['adivinanza', 'acertijo'],
  category: 'juegos',
  desc: 'Resuelve una adivinanza (30 s)',
  async run({ sock, m }) {
    if (activas.has(m.chat)) return m.reply('⚠️ Ya hay una adivinanza activa.')
    const [texto, respuesta] = random(ADIVINANZAS)
    activas.set(m.chat, respuesta)

    await m.reply(`🧩 *ADIVINANZA*\n\n${texto}\n\n⏱️ Tienes 30 segundos\n💰 Premio: 300 monedas`)

    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.remoteJid !== m.chat) return
      const t = norm(msg.message.conversation || msg.message.extendedTextMessage?.text || '')
      if (!t) return
      if (t === respuesta || t === `la ${respuesta}` || t === `el ${respuesta}`) {
        limpiar()
        const jid = msg.key.participant || msg.key.remoteJid
        db.user(jid).coins += 300
        await sock.sendMessage(m.chat, { text: `🎉 ¡Correcto! Era *${respuesta}*.\n💰 +300 monedas`, mentions: [jid] }, { quoted: msg })
      }
    }
    const timer = setTimeout(async () => {
      limpiar()
      await sock.sendMessage(m.chat, { text: `⏰ ¡Tiempo! La respuesta era *${respuesta}*.` })
    }, 30000)
    function limpiar() { clearTimeout(timer); activas.delete(m.chat); sock.ev.off('messages.upsert', listener) }
    sock.ev.on('messages.upsert', listener)
  }
}
