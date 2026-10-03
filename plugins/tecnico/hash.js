import crypto from 'crypto'
export default {
  command: ['hash', 'md5', 'sha256'],
  category: 'tecnico',
  desc: 'Genera el hash de un texto',
  async run({ m, args, text, command, usedPrefix }) {
    let algo = command === 'hash' ? (args[0] || '').toLowerCase() : command
    let contenido = command === 'hash' ? args.slice(1).join(' ') : text
    if (!crypto.getHashes().includes(algo)) { contenido = text; algo = 'sha256' }
    if (!contenido) return m.reply(`🔑 Uso:\n*${usedPrefix}md5 texto*\n*${usedPrefix}sha256 texto*\n*${usedPrefix}hash sha1 texto*`)
    const out = crypto.createHash(algo).update(contenido).digest('hex')
    await m.reply(`🔑 *HASH ${algo.toUpperCase()}*\n\n\`\`\`${out}\`\`\``)
  }
}
