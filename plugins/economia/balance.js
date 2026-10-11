export default {
  command: ['balance', 'saldo', 'bal', 'monedas'],
  category: 'economia',
  desc: 'Consulta tus monedas',
  async run({ m, user }) {
    await m.reply(`💰 *TU CARTERA*\n\n👛 Efectivo: *${user.coins}*\n🏦 Banco: *${user.bank}*\n📊 Total: *${user.coins + user.bank}*`)
  }
}
