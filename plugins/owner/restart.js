import db from '../../lib/database.js'
export default {
  command: ['restart', 'reiniciar'],
  category: 'owner',
  desc: 'Reinicia el bot (requiere start.sh o pm2)',
  owner: true,
  async run({ m }) {
    await m.reply('♻️ Reiniciando el bot...\n\n_Si lo iniciaste con `npm start` tendrás que encenderlo a mano. Usa `./start.sh` o pm2 para que vuelva solo._')
    db.save()
    setTimeout(() => process.exit(0), 1500)
  }
}
