import db from '../../lib/database.js'

export default {
  command: ['nota', 'notas', 'apunte'],
  category: 'productividad',
  desc: 'Guarda notas personales — nota add/ver/borrar',
  async run({ m, args, user, usedPrefix, command }) {
    user.notas = user.notas || []
    const accion = (args[0] || 'ver').toLowerCase()
    const contenido = args.slice(1).join(' ')

    if (['add', 'agregar', 'guardar', 'nueva'].includes(accion)) {
      if (!contenido) return m.reply(`📝 Uso: *${usedPrefix}${command} add Comprar pan*`)
      if (user.notas.length >= 30) return m.reply('⚠️ Máximo 30 notas. Borra alguna primero.')
      user.notas.push({ texto: contenido, fecha: Date.now() })
      return m.reply(`✅ Nota *#${user.notas.length}* guardada.\n\n📝 ${contenido}`)
    }

    if (['del', 'borrar', 'eliminar'].includes(accion)) {
      if (contenido.toLowerCase() === 'all' || contenido.toLowerCase() === 'todo') {
        const n = user.notas.length
        user.notas = []
        return m.reply(`🗑️ ${n} notas eliminadas.`)
      }
      const i = parseInt(contenido) - 1
      if (isNaN(i) || !user.notas[i]) return m.reply(`⚠️ Uso: *${usedPrefix}${command} borrar 2* (o *all*)`)
      const [borrada] = user.notas.splice(i, 1)
      return m.reply(`🗑️ Nota eliminada:\n_${borrada.texto}_`)
    }

    if (!user.notas.length) return m.reply(`📭 No tienes notas.\n\nCrea una con *${usedPrefix}${command} add Mi primera nota*`)
    const lista = user.notas.map((n, i) =>
      `*${i + 1}.* ${n.texto}\n     _${new Date(n.fecha).toLocaleDateString('es')}_`).join('\n\n')
    await m.reply(`📒 *TUS NOTAS* (${user.notas.length})\n\n${lista}\n\n💡 *${usedPrefix}${command} borrar <número>*`)
  }
}
