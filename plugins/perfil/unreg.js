export default {
  command: ['unreg', 'desregistrar'],
  category: 'perfil',
  desc: 'Elimina tu registro',
  async run({ m, user }) {
    if (!user.registered) return m.reply('⚠️ No estás registrado.')
    user.registered = false
    user.age = 0
    await m.reply('🗑️ Tu registro fue eliminado. Puedes volver a registrarte cuando quieras.')
  }
}
