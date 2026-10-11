export default {
  command: ['nivel', 'level', 'lvl'],
  category: 'perfil',
  desc: 'Consulta tu nivel y experiencia',
  async run({ m, user }) {
    const need = user.level * 100
    const pct = Math.min(100, Math.floor((user.exp / need) * 100))
    const bar = '█'.repeat(Math.floor(pct / 5)).padEnd(20, '░')
    await m.reply(`🏅 *TU NIVEL*\n\nNivel: *${user.level}*\nXP: *${user.exp}/${need}*\n\n[${bar}] ${pct}%`)
  }
}
