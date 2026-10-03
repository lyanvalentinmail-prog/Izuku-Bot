// ===============================================
//  CATALOGO DE LA TIENDA
//  Para añadir un objeto solo agrega una entrada aqui.
//  type: 'tool'      -> herramienta (se necesita para minar/pescar)
//        'item'      -> objeto normal, se puede vender
//        'consumable'-> se gasta al usarlo
// ===============================================

export const ITEMS = {
  pico:     { emoji: '⛏️', name: 'Pico',        price: 5000, sell: 2500, type: 'tool', desc: 'Necesario para minar' },
  caña:     { emoji: '🎣', name: 'Caña',        price: 3000, sell: 1500, type: 'tool', desc: 'Necesaria para pescar' },
  cebo:     { emoji: '🪱', name: 'Cebo',        price: 100,  sell: 40,   type: 'consumable', desc: 'Mejora tu pesca' },
  pocion:   { emoji: '🧪', name: 'Poción',      price: 1200, sell: 600,  type: 'consumable', desc: 'Reinicia el tiempo de espera de .work' },

  // Minerales (se obtienen minando)
  carbon:   { emoji: '🪨', name: 'Carbón',      price: 0, sell: 120,  type: 'item', desc: 'Mineral común' },
  hierro:   { emoji: '⚙️', name: 'Hierro',      price: 0, sell: 350,  type: 'item', desc: 'Mineral útil' },
  oro:      { emoji: '🥇', name: 'Oro',         price: 0, sell: 900,  type: 'item', desc: 'Mineral valioso' },
  diamante: { emoji: '💎', name: 'Diamante',    price: 0, sell: 3000, type: 'item', desc: 'Mineral rarísimo' },

  // Peces (se obtienen pescando)
  sardina:  { emoji: '🐟', name: 'Sardina',     price: 0, sell: 100,  type: 'item', desc: 'Pez común' },
  pulpo:    { emoji: '🐙', name: 'Pulpo',       price: 0, sell: 450,  type: 'item', desc: 'Pez poco común' },
  tiburon:  { emoji: '🦈', name: 'Tiburón',     price: 0, sell: 1800, type: 'item', desc: 'Captura rara' },
  ballena:  { emoji: '🐋', name: 'Ballena',     price: 0, sell: 5000, type: 'item', desc: 'La captura legendaria' }
}

/** Objetos que se pueden comprar (tienen precio) */
export const BUYABLE = Object.entries(ITEMS).filter(([, i]) => i.price > 0)

/** Busca un objeto por su clave o por su nombre */
export function findItem(query) {
  if (!query) return null
  const q = query.toLowerCase().trim()
  const key = Object.keys(ITEMS).find(
    (k) => k === q || ITEMS[k].name.toLowerCase() === q
  )
  return key ? { key, ...ITEMS[key] } : null
}

/** Tabla de probabilidades: devuelve una clave al azar segun su peso */
export function roll(table) {
  const total = Object.values(table).reduce((a, b) => a + b, 0)
  let n = Math.random() * total
  for (const [key, weight] of Object.entries(table)) {
    if ((n -= weight) < 0) return key
  }
  return Object.keys(table)[0]
}
