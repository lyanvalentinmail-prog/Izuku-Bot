import { askAI } from '../../lib/ai.js'

// Memoria corta por chat (ultimos 6 turnos)
const memoria = new Map()

export default {
  command: ['ia', 'chatgpt', 'gpt', 'izuku'],
  category: 'ia',
  desc: 'Conversa con la inteligencia artificial (recuerda el contexto)',
  async run({ m, text, chat, usedPrefix, command, args }) {
    if (['reset', 'olvidar', 'limpiar'].includes((args[0] || '').toLowerCase())) {
      memoria.delete(m.chat)
      return m.reply('🧹 Memoria de la conversación borrada.')
    }

    const q = text || m.quoted?.text
    if (!q) return m.reply(`🧠 Uso: *${usedPrefix}${command} tu pregunta*\n\nEj: *${usedPrefix}${command} explícame la fotosíntesis*\n\n🧹 *${usedPrefix}${command} reset* para borrar el contexto\n🎭 *${usedPrefix}personalidad* para cambiar su forma de ser`)

    await m.react('🧠')

    const hist = memoria.get(m.chat) || []
    const contexto = hist.length
      ? `Conversación previa:\n${hist.map((h) => `${h.rol}: ${h.texto}`).join('\n')}\n\nNueva pregunta: ${q}`
      : q

    const sistema = chat.personalidad || 'Eres Izuku, un asistente amable que responde en español de forma breve y clara.'
    const answer = await askAI(contexto, sistema)

    hist.push({ rol: 'Usuario', texto: q }, { rol: 'Izuku', texto: answer })
    memoria.set(m.chat, hist.slice(-6))

    await m.reply(`🧠 *IZUKU IA*\n\n${answer}`)
    await m.react('✅')
  }
}
