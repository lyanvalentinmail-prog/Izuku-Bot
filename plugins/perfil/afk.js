export default {
  command: ['afk', 'ausente'],
  category: 'perfil',
  desc: 'Avisa que estás ausente — uso: afk durmiendo',
  async run({ m, text, user }) {
    user.afk = { reason: text || 'Sin motivo', time: Date.now() }
    await m.reply(`💤 *${m.pushName || 'Usuario'}* está ahora AFK\n📝 Motivo: ${user.afk.reason}\n\n_Avisaré a quien te mencione. Escribe cualquier mensaje para volver._`)
  }
}
