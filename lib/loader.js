import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const PLUGIN_DIR = path.join(process.cwd(), 'plugins')

/** Mapa: ruta del archivo -> plugin */
export const plugins = new Map()

function listFiles(dir) {
  let out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out = out.concat(listFiles(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

/** Carga (o recarga) un plugin individual */
export async function loadPlugin(file) {
  try {
    const mod = await import(`${pathToFileURL(file).href}?update=${Date.now()}`)
    const plugin = mod.default
    if (!plugin || typeof plugin.run !== 'function') {
      console.log(`[plugins] ${path.basename(file)} ignorado (sin export default .run)`)
      return
    }
    plugin.file = file
    plugin.category = plugin.category || path.basename(path.dirname(file))
    plugin.command = Array.isArray(plugin.command) ? plugin.command : [plugin.command].filter(Boolean)
    plugins.set(file, plugin)
  } catch (e) {
    console.error(`[plugins] Error cargando ${path.basename(file)}:`, e.message)
  }
}

/** Carga todos los plugins de /plugins */
export async function loadPlugins() {
  plugins.clear()
  if (!fs.existsSync(PLUGIN_DIR)) return plugins
  for (const file of listFiles(PLUGIN_DIR)) await loadPlugin(file)
  console.log(`[plugins] ${plugins.size} comandos cargados`)
  return plugins
}

/** Recarga automatica al editar un archivo (hot reload) */
export function watchPlugins() {
  if (!fs.existsSync(PLUGIN_DIR)) return
  fs.watch(PLUGIN_DIR, { recursive: true }, async (event, filename) => {
    if (!filename || !filename.endsWith('.js')) return
    const file = path.join(PLUGIN_DIR, filename)
    if (fs.existsSync(file)) {
      await loadPlugin(file)
      console.log(`[plugins] recargado: ${filename}`)
    } else {
      plugins.delete(file)
      console.log(`[plugins] eliminado: ${filename}`)
    }
  })
}
