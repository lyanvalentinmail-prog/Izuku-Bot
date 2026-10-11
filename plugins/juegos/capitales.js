import db from '../../lib/database.js'
import { getJson, random } from '../../lib/functions.js'
import { apiCache } from '../../lib/cache.js'

const activas = new Map()

export default {
  command: ['capitales', 'capital', 'geografia'],
  category: 'juegos',
  desc: 'Adivina la capital de un país',
  async run({ sock, m }) {
    if (activas.has(m.chat)) return m.reply('⚠️ Ya hay una pregunta activa.')

    let paises = apiCache.get('paises')
    if (!paises) {
      paises = (await getJson('https://restcountries.com/v3.1/all?fields=name,capital,translations,flags'))
        .filter((p) => p.capital?.length)
      apiCache.set('paises', paises, 86400)
    }

    const p = random(paises)
    const nombre = p.translations?.spa?.common || p.name.common
    const correcta = p.capital[0]
    const opciones = [correcta, ...[...paises].sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.capital[0])]
      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).sort(() => Math.random() - 0.5)
    const idx = opciones.indexOf(correcta) + 1
    activas.set(m.chat, idx)

    const letras = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']
    await m.reply(`🌍 *CAPITALES*\n\n¿Cuál es la capital de *${nombre}*?\n\n${opciones.map((o, i) => `${letras[i]} ${o}`).join('\n')}\n\n⏱️ 25 segundos · 💰 200 monedas`)

    const listener = async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.remoteJid !== m.chat) return
      const t = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
      if (!/^[1-4]$/.test(t)) return
      if (parseInt(t) === idx) {
        limpiar()
        const jid = msg.key.participant || msg.key.remoteJid
        db.user(jid).coins += 200
        await sock.sendMessage(m.chat, { text: `🎉 ¡Correcto! La capital de ${nombre} es *${correcta}*.\n💰 +200 monedas`, mentions: [jid] }, { quoted: msg })
      }
    }
    const timer = setTimeout(async () => {
      limpiar()
      await sock.sendMessage(m.chat, { text: `⏰ ¡Tiempo! Era *${correcta}*.` })
    }, 25000)
    function limpiar() { clearTimeout(timer); activas.delete(m.chat); sock.ev.off('messages.upsert', listener) }
    sock.ev.on('messages.upsert', listener)
  }
}
