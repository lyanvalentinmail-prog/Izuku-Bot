export default {
  command: ['wame', 'wa', 'enlacechat'],
  category: 'herramientas',
  desc: 'Crea un enlace para chatear con un número',
  async run({ m, args, text, usedPrefix, command }) {
    const num = (args[0] || '').replace(/\D/g, '')
    if (!num) return m.reply(`💬 Uso: *${usedPrefix}${command} 59899123456 [mensaje opcional]*`)
    const mensaje = args.slice(1).join(' ')
    const url = `https://wa.me/${num}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
    await m.reply(`💬 *ENLACE DE WHATSAPP*\n\n📱 +${num}\n${mensaje ? `💬 "${mensaje}"\n` : ''}\n🔗 ${url}\n\n_Al abrirlo puedes escribirle sin guardarlo en contactos._`)
  }
}
