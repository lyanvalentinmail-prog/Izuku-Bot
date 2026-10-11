export default {
  command: ['binario', 'debinario'],
  category: 'tecnico',
  desc: 'Convierte texto a binario y viceversa',
  async run({ m, text, command, usedPrefix }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`💻 Uso: *${usedPrefix}${command} hola*`)
    if (command === 'debinario') {
      const out = q.trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join('')
      return m.reply(`💻 *TEXTO*\n\n${out}`)
    }
    const out = [...q].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
    await m.reply(`💻 *BINARIO*\n\n${out}`)
  }
}
