import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

import db from './lib/database.js'
import { loadPlugins, watchPlugins } from './lib/loader.js'
import { loadSettings } from './lib/settings.js'
import { isLinked, resume, startLink } from './lib/connection.js'
import { startPanel } from './panel/server.js'

// Metodo de vinculacion por flag: --code (codigo de 8 digitos) o --qr
const argv = process.argv.slice(2)
const flagMethod = argv.includes('--code') ? 'code' : argv.includes('--qr') ? 'qr' : null

function banner() {
  console.log(chalk.green(`
 ██╗███████╗██╗   ██╗██╗  ██╗██╗   ██╗
 ██║╚══███╔╝██║   ██║██║ ██╔╝██║   ██║
 ██║  ███╔╝ ██║   ██║█████╔╝ ██║   ██║
 ██║ ███╔╝  ██║   ██║██╔═██╗ ██║   ██║
 ██║███████╗╚██████╔╝██║  ██╗╚██████╔╝
 ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
            ${chalk.cyan('B O T   D E   W H A T S A P P')}
`))
}

/** Menu de consola (solo si hay terminal interactiva y no hay cuenta vinculada). */
async function askMethodInConsole() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (text) => new Promise((resolve) => rl.question(text, resolve))
  try {
    console.log(chalk.yellow('¿Cómo quieres vincular tu WhatsApp?\n'))
    console.log('  1. Código QR')
    console.log('  2. Código de 8 dígitos (pairing code)\n')
    const opt = (await ask(chalk.cyan('Elige 1 o 2: '))).trim()
    if (opt !== '2') return { method: 'qr' }
    const phone = await ask(chalk.cyan('\n📱 Escribe tu número con código de país (ej: 5212345678901): '))
    return { method: 'code', phone }
  } finally {
    rl.close()
  }
}

async function boot() {
  banner()

  // Ajustes guardados desde el panel (sobrescriben config.js)
  loadSettings()

  await loadPlugins()
  watchPlugins()

  const panel = startPanel()

  if (isLinked()) {
    await resume().catch((e) => console.error(chalk.red('No se pudo reconectar:'), e.message))
  } else if (flagMethod) {
    const phone = argv.find((a) => /^\d{8,15}$/.test(a))
    await startLink({ method: flagMethod, phone }).catch((e) => console.error(chalk.red(e.message)))
  } else if (process.stdin.isTTY) {
    const choice = await askMethodInConsole()
    await startLink(choice).catch((e) => console.error(chalk.red(e.message)))
  } else {
    console.log(chalk.yellow(`📱 No hay ninguna cuenta vinculada. Vincúlala desde el panel: ${panel.url}`))
  }

  return panel
}

await boot()

// Limpieza automatica de archivos temporales cada 30 minutos
setInterval(() => {
  const dir = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(dir)) return
  const limite = Date.now() - 10 * 60 * 1000
  for (const f of fs.readdirSync(dir)) {
    if (f === '.gitkeep') continue
    const file = path.join(dir, f)
    try { if (fs.statSync(file).mtimeMs < limite) fs.unlinkSync(file) } catch {}
  }
}, 30 * 60 * 1000)

process.on('uncaughtException', (e) => console.error('[uncaught]', e.message))
process.on('unhandledRejection', (e) => console.error('[unhandled]', e?.message || e))
process.on('SIGINT', () => { db.save(true); process.exit(0) })
process.on('SIGTERM', () => { db.save(true); process.exit(0) })
