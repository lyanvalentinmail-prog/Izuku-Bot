export default {
  command: ['add', 'agregar', 'invitar'],
  category: 'grupos',
  desc: 'Agrega a alguien al grupo',
  group: true, admin: true, botAdmin: true,
  async run({ sock, m, text, usedPrefix, command }) {
    const num = text.replace(/\D/g, '')
    if (!num) return m.reply(`➕ Uso: *${usedPrefix}${command} 5212345678901*`)
    const jid = `${num}@s.whatsapp.net`
    const res = await sock.groupParticipantsUpdate(m.chat, [jid], 'add')
    if (res[0]?.status === '200') return m.reply('✅ Usuario agregado.')
    await m.reply(`⚠️ No se pudo agregar (código ${res[0]?.status}). Puede tener la privacidad activada; envíale el link con *${usedPrefix}link*.`)
  }
}
