import config from '../../config.js'
export default {
  command: ['donar', 'donate', 'apoyar'],
  category: 'info',
  desc: 'Apoya el proyecto',
  async run({ m }) {
    await m.reply(`💖 *Apoya a ${config.botName}*\n\nSi el bot te es útil puedes apoyar al creador para pagar el servidor.\n\n☕ Contacta a *${config.ownerName}* con el comando *owner*.`)
  }
}
