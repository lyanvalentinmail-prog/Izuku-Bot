import { loadPlugins, plugins } from '../../lib/loader.js'
export default {
  command: ['reload', 'recargar'],
  category: 'owner',
  desc: 'Recarga todos los plugins sin reiniciar',
  owner: true,
  async run({ m }) {
    await loadPlugins()
    await m.reply(`♻️ Plugins recargados: *${plugins.size}* comandos activos.`)
  }
}
