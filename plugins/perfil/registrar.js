export default {
  command: ['reg', 'registrar', 'verificar'],
  category: 'perfil',
  desc: 'Regístrate en el bot — uso: reg nombre.edad',
  async run({ m, text, user, usedPrefix, command }) {
    if (user.registered) return m.reply(`✅ Ya estás registrado como *${user.name}*.\nUsa *${usedPrefix}unreg* para borrar tu registro.`)
    if (!text.includes('.')) return m.reply(`📝 Formato incorrecto.\n\nUso: *${usedPrefix}${command} nombre.edad*\nEjemplo: *${usedPrefix}${command} Izuku.18*`)
    const [name, ageRaw] = text.split('.')
    const age = parseInt(ageRaw)
    if (!name || name.length < 2) return m.reply('⚠️ El nombre debe tener al menos 2 letras.')
    if (isNaN(age) || age < 5 || age > 100) return m.reply('⚠️ Edad inválida (5 - 100).')

    user.registered = true
    user.name = name.trim()
    user.age = age
    user.coins += 1000

    await m.reply(`✅ *REGISTRO COMPLETADO*\n\n👤 Nombre: *${user.name}*\n🎂 Edad: *${age}*\n🎁 Bono de bienvenida: *1000 monedas*\n\n¡Ya puedes usar todos los comandos!`)
  }
}
