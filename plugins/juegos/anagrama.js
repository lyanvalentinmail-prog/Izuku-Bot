import db from '../../lib/database.js'
import { random } from '../../lib/functions.js'

const PALABRAS = ['murcielago', 'computadora', 'telefono', 'ventana', 'guitarra', 'elefante', 'biblioteca', 'chocolate', 'aventura', 'relampago', 'mariposa', 'bicicleta']
const activas = new Map()

export default {
  command: ['anagrama', 'palabra'],
  category: 'juegos',
  desc: 'Ordena las letras y forma la palabra',
  async run({ sock, m }) {
    if (activas.has(m.chat)) return m.reply('⚠️ Ya hay un anagrama activo.')
    const palabra = random(PALABRAS)
    let mezclada
    do { mezclada = [...palabra].sort(() => Math.random() - 0.5).join('') } while (mezclada === palabra)
    activas.set(m.chat, palabra)

    await m.reply(`🔤 *ANAGRAMA*\n\nOrdena estas letras:\n\n*${mezclada.toUpperCase().split('').join(' ')}*\n\n💡 Pista: ${palabra.length} letras, empieza por *${palabra[0].toUpperCase()}*\n⏱️ 40 segundos · 💰 250 monedas`)

    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.remoteJid !== m.chat) return
      const t = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim()
      if (t === palabra) {
        limpiar()
        const jid = msg.key.participant || msg.key.remoteJid
        db.user(jid).coins += 250
        await sock.sendMessage(m.chat, { text: `🎉 ¡Correcto! Era *${palabra}*.\n💰 +250 monedas`, mentions: [jid] }, { quoted: msg })
      }
    }
    const timer = setTimeout(async () => {
      limpiar()
      await sock.sendMessage(m.chat, { text: `⏰ ¡Tiempo! Era *${palabra}*.` })
    }, 40000)
    function limpiar() { clearTimeout(timer); activas.delete(m.chat); sock.ev.off('messages.upsert', listener) }
    sock.ev.on('messages.upsert', listener)
  }
}
