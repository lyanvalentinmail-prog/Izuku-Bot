// ===============================================
//  SISTEMA RPG DE IZUKU BOT
//  Clases, monstruos y combate por turnos.
//  Edita las tablas de abajo para balancear el juego.
// ===============================================

import { randomInt } from './functions.js'

/** Clases disponibles al crear el personaje */
export const CLASES = {
  guerrero: { emoji: '⚔️', name: 'Guerrero', hp: 150, atk: 18, def: 14, desc: 'Mucha vida y defensa' },
  mago:     { emoji: '🔮', name: 'Mago',     hp: 100, atk: 26, def: 7,  desc: 'Daño altísimo, muy frágil' },
  arquero:  { emoji: '🏹', name: 'Arquero',  hp: 115, atk: 22, def: 10, desc: 'Equilibrado y con más críticos' },
  clerigo:  { emoji: '✨', name: 'Clérigo',  hp: 130, atk: 15, def: 16, desc: 'Se cura solo durante el combate' }
}

/** Monstruos. "lvl" es el nivel recomendado */
export const MONSTRUOS = [
  { emoji: '🐀', name: 'Rata gigante',   lvl: 1,  hp: 55,  atk: 12, def: 4,  coins: 150,  xp: 25 },
  { emoji: '🦇', name: 'Murciélago',     lvl: 2,  hp: 75,  atk: 17, def: 6,  coins: 240,  xp: 40 },
  { emoji: '🐺', name: 'Lobo salvaje',   lvl: 3,  hp: 105, atk: 23, def: 9,  coins: 380,  xp: 60 },
  { emoji: '🧟', name: 'Zombi',          lvl: 5,  hp: 155, atk: 30, def: 13, coins: 600,  xp: 95 },
  { emoji: '👹', name: 'Ogro',           lvl: 8,  hp: 240, atk: 42, def: 18, coins: 1000, xp: 150 },
  { emoji: '🦂', name: 'Escorpión rey',  lvl: 11, hp: 320, atk: 55, def: 23, coins: 1600, xp: 230 },
  { emoji: '🐉', name: 'Dragón joven',   lvl: 15, hp: 450, atk: 72, def: 30, coins: 2800, xp: 400 },
  { emoji: '💀', name: 'Señor de huesos', lvl: 20, hp: 650, atk: 95, def: 38, coins: 5000, xp: 700 }
]

/** Jefes de mazmorra (más duros, más recompensa) */
export const JEFES = [
  { emoji: '🧛', name: 'Conde Vampiro',  lvl: 10, hp: 400,  atk: 40, def: 22, coins: 4000,  xp: 600 },
  { emoji: '🐲', name: 'Dragón Anciano', lvl: 18, hp: 700,  atk: 60, def: 34, coins: 9000,  xp: 1400 },
  { emoji: '👑', name: 'Rey Demonio',    lvl: 25, hp: 1100, atk: 80, def: 45, coins: 20000, xp: 3000 }
]

/** Equipo que se compra en la tienda y modifica tus estadísticas */
export const EQUIPO = {
  espada:   { atk: 12 },
  arco:     { atk: 9, crit: 0.1 },
  baston:   { atk: 15 },
  armadura: { def: 12 },
  escudo:   { def: 8, hp: 20 }
}

/** Crea la ficha inicial de un personaje */
export function crearPersonaje(clase) {
  const c = CLASES[clase]
  return {
    clase,
    level: 1,
    xp: 0,
    hp: c.hp,
    maxHp: c.hp,
    atk: c.atk,
    def: c.def,
    weapon: null,
    armor: null,
    wins: 0,
    loses: 0,
    lastHunt: 0,
    lastDungeon: 0,
    lastHeal: 0
  }
}

/** XP necesaria para el siguiente nivel */
export const xpNecesaria = (level) => level * 150

/** Estadísticas finales contando el equipo */
export function stats(rpg) {
  const w = EQUIPO[rpg.weapon] || {}
  const a = EQUIPO[rpg.armor] || {}
  return {
    atk: rpg.atk + (w.atk || 0) + (a.atk || 0),
    def: rpg.def + (w.def || 0) + (a.def || 0),
    maxHp: rpg.maxHp + (w.hp || 0) + (a.hp || 0),
    crit: 0.15 + (w.crit || 0) + (rpg.clase === 'arquero' ? 0.1 : 0)
  }
}

/** Sube de nivel si corresponde. Devuelve cuántos niveles subió */
export function revisarNivel(rpg) {
  let subidas = 0
  while (rpg.xp >= xpNecesaria(rpg.level)) {
    rpg.xp -= xpNecesaria(rpg.level)
    rpg.level++
    rpg.maxHp += 15
    rpg.atk += 4
    rpg.def += 3
    rpg.hp = rpg.maxHp
    subidas++
  }
  return subidas
}

/** Calcula el daño de un golpe */
function golpe(atk, def, critChance = 0.15) {
  const variacion = 0.85 + Math.random() * 0.3
  const critico = Math.random() < critChance
  let dmg = atk * variacion - def * 0.35
  if (critico) dmg *= 1.7
  return { dmg: Math.max(1, Math.round(dmg)), critico }
}

/**
 * Combate automático por turnos.
 * Devuelve { ganador, log, hpJugador, turnos }
 */
export function combate(rpg, enemigo) {
  const s = stats(rpg)
  let hpJugador = rpg.hp
  let hpEnemigo = enemigo.hp
  const log = []
  let turnos = 0

  while (hpJugador > 0 && hpEnemigo > 0 && turnos < 25) {
    turnos++

    // Turno del jugador
    const a = golpe(s.atk, enemigo.def, s.crit)
    hpEnemigo -= a.dmg
    log.push(`${a.critico ? '💥' : '🗡️'} Golpeas por *${a.dmg}*${a.critico ? ' ¡CRÍTICO!' : ''}`)
    if (hpEnemigo <= 0) break

    // Turno del enemigo
    const b = golpe(enemigo.atk, s.def)
    hpJugador -= b.dmg
    log.push(`${b.critico ? '💢' : '🩸'} ${enemigo.name} te hace *${b.dmg}*${b.critico ? ' ¡CRÍTICO!' : ''}`)

    // El clérigo se regenera
    if (rpg.clase === 'clerigo' && hpJugador > 0) {
      const cura = Math.round(s.maxHp * 0.06)
      hpJugador = Math.min(s.maxHp, hpJugador + cura)
      log.push(`✨ Tu fe te cura *${cura}* PV`)
    }
  }

  return {
    ganador: hpEnemigo <= 0 && hpJugador > 0 ? 'jugador' : 'enemigo',
    log,
    hpJugador: Math.max(0, hpJugador),
    hpEnemigo: Math.max(0, hpEnemigo),
    turnos
  }
}

/**
 * Elige un monstruo acorde a tu nivel.
 * Prioriza enemigos cercanos a tu nivel para que el juego no se vuelva trivial.
 */
export function monstruoPara(level) {
  let posibles = MONSTRUOS.filter((mo) => mo.lvl <= level + 2 && mo.lvl >= level - 3)
  if (!posibles.length) posibles = MONSTRUOS.filter((mo) => mo.lvl <= level + 2)
  if (!posibles.length) posibles = [MONSTRUOS[0]]
  const base = posibles[randomInt(0, posibles.length - 1)]

  // Pequeño escalado para que los monstruos acompañen tu progreso
  const escala = 1 + Math.max(0, level - base.lvl) * 0.12
  return {
    ...base,
    hp: Math.round(base.hp * escala),
    atk: Math.round(base.atk * escala),
    def: Math.round(base.def * escala)
  }
}

/** Barra de vida visual */
export function barraVida(actual, max, largo = 12) {
  const pct = Math.max(0, Math.min(1, actual / max))
  const llenos = Math.round(pct * largo)
  return `${'█'.repeat(llenos)}${'░'.repeat(largo - llenos)} ${actual}/${max}`
}
