export default {
  command: ['mayus', 'minus', 'alreves', 'contarpalabras', 'sintildes'],
  category: 'herramientas',
  desc: 'Transforma texto: mayus, minus, alreves, contarpalabras, sintildes',
  async run({ m, text, command, usedPrefix }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`✏️ Uso: *${usedPrefix}${command} tu texto*\n_También puedes responder a un mensaje._`)

    switch (command) {
      case 'mayus':  return m.reply(q.toUpperCase())
      case 'minus':  return m.reply(q.toLowerCase())
      case 'alreves':return m.reply([...q].reverse().join(''))
      case 'sintildes': return m.reply(q.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      case 'contarpalabras': {
        const palabras = q.trim().split(/\s+/).filter(Boolean).length
        const sinEspacios = q.replace(/\s/g, '').length
        const lineas = q.split('\n').length
        const frases = q.split(/[.!?]+/).filter((x) => x.trim()).length
        return m.reply(
`🔢 *CONTADOR DE TEXTO*

📝 Palabras: *${palabras}*
🔤 Caracteres: *${q.length}* (${sinEspacios} sin espacios)
📄 Líneas: *${lineas}*
💬 Frases: *${frases}*
⏱️ Lectura aprox: *${Math.max(1, Math.ceil(palabras / 200))} min*`)
      }
    }
  }
}
