import crypto from 'crypto'
export default {
  command: ['password', 'contrasena', 'genpass'],
  category: 'tecnico',
  desc: 'Genera una contraseña segura',
  async run({ m, args }) {
    const largo = Math.min(64, Math.max(8, parseInt(args[0]) || 16))
    const abc = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?-_'
    let pass = ''
    for (let i = 0; i < largo; i++) pass += abc[crypto.randomInt(abc.length)]
    const fuerza = largo >= 20 ? '🟢 Muy fuerte' : largo >= 14 ? '🟡 Fuerte' : '🟠 Aceptable'
    await m.reply(`🔑 *CONTRASEÑA GENERADA*\n\n\`\`\`${pass}\`\`\`\n\n📏 Longitud: *${largo}*\n💪 Fuerza: ${fuerza}\n\n_Cópiala y bórrala del chat._`)
  }
}
