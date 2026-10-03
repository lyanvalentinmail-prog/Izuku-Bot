export default {
  command: ['base64', 'debase64', 'b64'],
  category: 'tecnico',
  desc: 'Codifica o decodifica texto en Base64',
  async run({ m, text, command, usedPrefix }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`🔐 Uso: *${usedPrefix}${command} hola mundo*`)
    const decodificar = command === 'debase64'
    try {
      const out = decodificar
        ? Buffer.from(q, 'base64').toString('utf-8')
        : Buffer.from(q, 'utf-8').toString('base64')
      await m.reply(`🔐 *BASE64 (${decodificar ? 'decodificado' : 'codificado'})*\n\n${out}`)
    } catch { await m.reply('❌ No pude procesar ese texto.') }
  }
}
