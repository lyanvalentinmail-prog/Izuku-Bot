// ===============================================
//  AJUSTES EN CALIENTE (los que edita el panel web)
//
//  Idea: config.js sigue siendo el archivo con los
//  valores por defecto, y acá se guardan los cambios
//  que haces desde el panel (en la base de datos).
//
//  IMPORTANTE: se modifica el MISMO objeto que exporta
//  config.js, así que el cambio se ve al instante en
//  todos los plugins, sin reiniciar el bot ni tocar
//  ningún archivo.
// ===============================================

import config from '../config.js'
import db from './database.js'

/** Copia limpia de los valores por defecto definidos en config.js */
const DEFAULTS = JSON.parse(JSON.stringify(config))

/**
 * Campos que el panel puede modificar.
 * type: text | list | number | bool | banner
 */
export const FIELDS = {
  botName: {
    group: 'General', label: 'Nombre del bot', type: 'text', max: 60,
    help: 'Se muestra en los menús, en las respuestas y al conectarse.'
  },
  ownerName: {
    group: 'General', label: 'Tu nombre (dueño)', type: 'text', max: 40,
    help: 'El nombre que aparece como dueño del bot.'
  },
  owner: {
    group: 'General', label: 'Número(s) del dueño', type: 'list',
    help: 'Con código de país, sin + ni espacios. Ej: 59896719709. Puedes poner varios separados por coma.'
  },
  prefix: {
    group: 'General', label: 'Prefijos', type: 'list',
    help: 'Ej: . ! / #  —  escribe "vacio" para que funcione sin prefijo.'
  },
  menuImage: {
    group: 'General', label: 'Banner del menú', type: 'banner', permiteVacio: true,
    help: 'Imagen que acompaña al menú. Puede ser una URL o una foto subida desde acá (déjalo vacío para enviar el menú solo con texto).'
  },
  newsletter: {
    group: 'General', label: 'Canal de WhatsApp (newsletter)', type: 'text', max: 200,
    help: 'Enlace del canal que aparece en el menú.'
  },

  self: {
    group: 'Modos', label: 'Modo self', type: 'bool',
    help: 'El bot solo responde al dueño.'
  },
  onlyGroups: {
    group: 'Modos', label: 'Solo grupos', type: 'bool',
    help: 'Ignora los mensajes privados.'
  },
  autoRead: {
    group: 'Modos', label: 'Marcar como leído', type: 'bool',
    help: 'Marca los mensajes como leídos automáticamente.'
  },
  antiCall: {
    group: 'Modos', label: 'Rechazar llamadas', type: 'bool',
    help: 'Rechaza las llamadas entrantes y avisa al que llamó.'
  },
  buttons: {
    group: 'Modos', label: 'Botones nativos', type: 'bool',
    help: 'Déjalo apagado: casi ningún WhatsApp muestra los botones y el mensaje podría no verse.'
  },
  maxSubBots: {
    group: 'Modos', label: 'Máximo de sub-bots', type: 'number', min: 0, max: 200,
    help: 'Cuántos números pueden convertirse en bot a la vez.'
  },

  'economy.dailyReward': { group: 'Economía', label: 'Recompensa diaria', type: 'number', min: 0, max: 1000000000 },
  'economy.workMin': { group: 'Economía', label: 'Pago mínimo por trabajar', type: 'number', min: 0, max: 1000000000 },
  'economy.workMax': { group: 'Economía', label: 'Pago máximo por trabajar', type: 'number', min: 0, max: 1000000000 },
  'economy.robChance': { group: 'Economía', label: 'Probabilidad de robar (0 a 1)', type: 'number', min: 0, max: 1, step: 0.05 },

  'apis.openai': {
    group: 'IA', label: 'OpenAI API key', type: 'text', max: 200, secret: true,
    help: 'Opcional. Si la dejas vacía, los comandos de IA usan el servicio público gratuito.'
  },
  'apis.gemini': {
    group: 'IA', label: 'Gemini API key', type: 'text', max: 200, secret: true,
    help: 'Opcional. Se usa como respaldo de la IA.'
  }
}

const EDITABLE_KEYS = Object.keys(FIELDS)

/** Lee un valor usando la ruta "economy.dailyReward" */
function getPath(obj, ruta) {
  return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

/** Escribe un valor usando la ruta "economy.dailyReward" */
function setPath(obj, ruta, valor) {
  const partes = ruta.split('.')
  let actual = obj
  for (const k of partes.slice(0, -1)) {
    if (typeof actual[k] !== 'object' || actual[k] === null) actual[k] = {}
    actual = actual[k]
  }
  actual[partes.at(-1)] = valor
}

/** Clona un valor simple (evita compartir arrays entre objetos) */
const clonar = (v) => JSON.parse(JSON.stringify(v))

/** Lista de prefijos "sin prefijo" que la gente suele escribir */
const SIN_PREFIJO = ['vacio', 'vacío', 'vacio', 'ninguno', 'sin', 'none', 'no', 'nada', '']

/**
 * Valida y normaliza un valor que viene del panel.
 * Devuelve { valor } o { error }.
 */
function validar(clave, valor) {
  const def = FIELDS[clave]
  if (!def) return { error: `El campo "${clave}" no se puede editar.` }

  switch (def.type) {
    case 'bool':
      return { valor: valor === true || valor === 'true' || valor === 1 || valor === '1' }

    case 'number': {
      const n = Number(valor)
      if (!Number.isFinite(n)) return { error: `"${def.label}": tiene que ser un número.` }
      let v = n
      if (def.min !== undefined && v < def.min) v = def.min
      if (def.max !== undefined && v > def.max) v = def.max
      return { valor: v }
    }

    case 'list': {
      let lista = Array.isArray(valor) ? valor : String(valor ?? '').split(/[\s,;\n]+/)
      lista = lista
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0)

      if (clave === 'owner') {
        const numeros = lista
          .map((n) => n.replace(/\D/g, ''))
          .filter((n) => n.length >= 8 && n.length <= 15)
        if (!numeros.length) return { error: '"Número del dueño": escribe el número con código de país, ejemplo 59896719709.' }
        return { valor: [...new Set(numeros)] }
      }

      if (!lista.length || (lista.length === 1 && SIN_PREFIJO.includes(lista[0].toLowerCase()))) {
        return { valor: [''] } // sin prefijo
      }
      const prefijos = [...new Set(lista.map((p) => p.slice(0, 3)))]
      return { valor: prefijos }
    }

    default: {
      let texto = String(valor ?? '').trim()
      if (def.max) texto = texto.slice(0, def.max)
      if (!texto && !def.permiteVacio) return { error: `"${def.label}" no puede quedar vacío.` }
      return { valor: texto }
    }
  }
}

/** Ajustes guardados (solo lo que el usuario cambió) */
export function savedSettings() {
  if (!db.data.settings || typeof db.data.settings !== 'object' || Array.isArray(db.data.settings)) {
    db.data.settings = {}
  }
  return db.data.settings
}

/** Aplica los ajustes guardados sobre el objeto de config vivo */
export function applySavedSettings() {
  const mezclado = clonar(DEFAULTS)
  const guardados = savedSettings()
  for (const clave of EDITABLE_KEYS) {
    if (guardados[clave] === undefined) continue
    const { valor } = validar(clave, guardados[clave])
    if (valor !== undefined) setPath(mezclado, clave, valor)
  }
  // Una sola mutación: todos los módulos que importan config.js ven el cambio
  Object.assign(config, mezclado)
  return config
}

/** Valores actuales de los campos editables (para dibujar el panel) */
export function currentSettings() {
  const salida = {}
  for (const clave of EDITABLE_KEYS) salida[clave] = getPath(config, clave)
  return salida
}

/** Lista de campos con metadatos + valor actual (lo que consume el panel) */
export function fieldsForPanel() {
  const valores = currentSettings()
  return Object.entries(FIELDS).map(([clave, def]) => ({
    key: clave,
    group: def.group,
    label: def.label,
    type: def.type,
    help: def.help || '',
    secret: !!def.secret,
    min: def.min,
    max: def.max,
    step: def.step,
    value: valores[clave]
  }))
}

/**
 * Guarda cambios que vienen del panel.
 * @returns {{ ok: boolean, errores: string[], cambios: object[], config: object }}
 */
export function saveFromPanel(patch = {}) {
  if (!patch || typeof patch !== 'object') return { ok: false, errores: ['Datos inválidos.'], cambios: [] }

  const guardados = savedSettings()
  const errores = []
  const cambios = []

  for (const [clave, valor] of Object.entries(patch)) {
    if (!FIELDS[clave]) { errores.push(`Campo desconocido: ${clave}`); continue }
    const { valor: v, error } = validar(clave, valor)
    if (error) { errores.push(error); continue }
    guardados[clave] = v
    cambios.push(clave)
  }

  if (errores.length) return { ok: false, errores, cambios: [] }

  applySavedSettings()
  db.save(true)
  return { ok: true, errores: [], cambios, config: currentSettings() }
}

/** Vuelve todo a los valores de config.js */
export function resetSettings() {
  db.data.settings = {}
  applySavedSettings()
  db.save(true)
  return currentSettings()
}

/** Resumen cortito para logs / panel */
export function settingsSummary() {
  return {
    botName: config.botName,
    prefix: config.prefix,
    owner: config.owner,
    ownerName: config.ownerName,
    menuImage: config.menuImage,
    self: config.self,
    onlyGroups: config.onlyGroups,
    autoRead: config.autoRead,
    antiCall: config.antiCall,
    buttons: config.buttons,
    maxSubBots: config.maxSubBots,
    defaultFile: 'config.js',
    savedFile: 'database.json (ajustes del panel)'
  }
}

export default { FIELDS, applySavedSettings, currentSettings, fieldsForPanel, saveFromPanel, resetSettings, settingsSummary, savedSettings }
