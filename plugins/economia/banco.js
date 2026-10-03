export default {
  command: ['dep', 'depositar', 'ret', 'retirar'],
  category: 'economia',
  desc: 'Deposita o retira monedas del banco',
  register: true,
  async run({ m, args, command, user, usedPrefix }) {
    const dep = ['dep', 'depositar'].includes(command)
    const max = dep ? user.coins : user.bank
    let monto = args[0] === 'all' ? max : parseInt(args[0])
    if (!monto || monto < 1) return m.reply(`🏦 Uso: *${usedPrefix}${command} <cantidad|all>*`)
    if (monto > max) return m.reply(`⚠️ No tienes esa cantidad (máx: *${max}*).`)
    if (dep) { user.coins -= monto; user.bank += monto }
    else { user.bank -= monto; user.coins += monto }
    await m.reply(`🏦 *BANCO*\n\n${dep ? 'Depositaste' : 'Retiraste'} *${monto}* monedas.\n👛 Efectivo: *${user.coins}*\n🏦 Banco: *${user.bank}*`)
  }
}
