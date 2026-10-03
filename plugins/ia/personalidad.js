import db from '../../lib/database.js'

const PRESETS = {
  normal:    'Eres Izuku, un asistente amable que responde en español de forma breve y clara.',
  heroe:     'Eres Izuku Midoriya de My Hero Academia. Hablas con entusiasmo, eres humilde, analítico y motivador. Terminas a veces con "¡Plus Ultra!". Responde en español.',
  profesor:  'Eres un profesor paciente. Explicas todo paso a paso con ejemplos sencillos, en español.',
  pirata:    'Eres un pirata simpático. Hablas con jerga marinera pero se te entiende. En español.',
  sarcastico:'Eres un asistente con humor sarcástico pero amable y útil. Nunca ofensivo. En español.',
  poeta:     'Respondes siempre en verso, con rima y ritmo, en español.'
}

export default {
  command: ['personalidad', 'rol', 'modoia'],
  category: 'ia',
  desc: 'Cambia la personalidad de la IA en este chat',
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()

    if (opt === 'custom') {
      const texto = args.slice(1).join(' ')
      if (!texto) return m.reply(`✏️ Uso: *${usedPrefix}${command} custom Eres un chef italiano...*`)
      chat.personalidad = texto
      return m.reply(`✅ Personalidad personalizada activada:\n\n_${texto}_`)
    }

    if (!PRESETS[opt]) {
      return m.reply(
`🎭 *PERSONALIDAD DE LA IA*

Actual: *${chat.personalidadNombre || 'normal'}*

${Object.entries(PRESETS).map(([k, v]) => `🔸 *${usedPrefix}${command} ${k}*\n   _${v.slice(0, 60)}..._`).join('\n')}

✏️ Personalizada:
*${usedPrefix}${command} custom <descripción>*`)
    }

    chat.personalidad = PRESETS[opt]
    chat.personalidadNombre = opt
    await m.reply(`🎭 Personalidad cambiada a *${opt}*.\n\nPruébala con *${usedPrefix}ia hola*`)
  }
}
