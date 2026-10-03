export default {
  command: ['antifake'],
  category: 'grupos',
  desc: 'Expulsa números de prefijos no permitidos',
  group: true, admin: true,
  async run({ m, args, chat, usedPrefix, command }) {
    const opt = (args[0] || '').toLowerCase()
    if (opt === 'off') { chat.antifake = false; return m.reply('🛂 Antifake *desactivado*.') }
    if (opt === 'on') {
      const prefijos = args.slice(1).map((p) => p.replace(/\D/g, '')).filter(Boolean)
      if (!prefijos.length) return m.reply(`🛂 Uso: *${usedPrefix}${command} on 52 34 598*\n\n_Solo se permitirán números que empiecen por esos prefijos._`)
      chat.antifake = true
      chat.prefijosPermitidos = prefijos
      return m.reply(`🛂 Antifake *activado*.\n\n✅ Prefijos permitidos: ${prefijos.map((p) => `+${p}`).join(', ')}\n\n_Quien entre con otro prefijo será expulsado._`)
    }
    await m.reply(
`🛂 *ANTIFAKE*

Estado: *${chat.antifake ? 'activado' : 'desactivado'}*
${chat.antifake ? `Permitidos: ${(chat.prefijosPermitidos || []).map((p) => `+${p}`).join(', ')}` : ''}

*${usedPrefix}${command} on 52 34 598*
*${usedPrefix}${command} off*`)
  }
}
