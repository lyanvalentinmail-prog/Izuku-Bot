export default {
  command: ['encuesta', 'poll', 'votacion'],
  category: 'productividad',
  desc: 'Crea una encuesta nativa de WhatsApp',
  group: true,
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text.includes('|')) {
      return m.reply(
`📊 Uso: *${usedPrefix}${command} Pregunta | opción 1 | opción 2*

Ejemplo:
*${usedPrefix}${command} ¿Qué cenamos? | Pizza | Sushi | Tacos*

_Mínimo 2 opciones, máximo 12._`)
    }
    const [pregunta, ...opciones] = text.split('|').map((x) => x.trim()).filter(Boolean)
    if (opciones.length < 2) return m.reply('⚠️ Necesitas al menos *2 opciones*.')
    if (opciones.length > 12) return m.reply('⚠️ Máximo *12 opciones*.')

    await sock.sendMessage(m.chat, {
      poll: { name: `📊 ${pregunta}`, values: opciones, selectableCount: 1 }
    })
  }
}
