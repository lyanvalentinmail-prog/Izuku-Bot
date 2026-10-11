// Validacion de los ajustes editables desde el panel (node --test test/)
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { validateSettings } from '../lib/settings.js'

test('acepta valores correctos y los normaliza', () => {
  const v = validateSettings({
    botName: '  Izuku  ',
    owner: ['+598 96 719 709', '59896719709', '521234567890'],
    prefix: ['.', '!', '.'],
    maxSubBots: '5',
    economy: { dailyReward: 1000, workMin: 100, workMax: 900, robChance: '0.5' }
  })
  assert.equal(v.botName, 'Izuku')
  assert.deepEqual(v.owner, ['59896719709', '521234567890'])
  assert.deepEqual(v.prefix, ['.', '!'])
  assert.equal(v.maxSubBots, 5)
  assert.equal(v.economy.robChance, 0.5)
})

test('prefijos vacios significan sin prefijo', () => {
  assert.deepEqual(validateSettings({ prefix: [] }).prefix, [''])
})

test('rechaza datos invalidos con mensaje claro', () => {
  assert.throws(() => validateSettings({ owner: ['123'] }), /no es válido/)
  assert.throws(() => validateSettings({ botName: '   ' }), /no puede estar vacío/)
  assert.throws(() => validateSettings({ maxSubBots: 500 }), /entre 0 y 100/)
  assert.throws(() => validateSettings({ economy: { dailyReward: 1, workMin: 900, workMax: 100, robChance: 0.1 } }), /mínimo no puede ser mayor/)
  assert.throws(() => validateSettings({ economy: { dailyReward: 1, workMin: 1, workMax: 2, robChance: 1.5 } }), /entre 0 y 1/)
  assert.throws(() => validateSettings({ prefix: ['toolong'] }), /demasiado largo/)
  assert.throws(() => validateSettings({ notAField: 1 }), /no es un ajuste editable/)
  assert.throws(() => validateSettings({ self: 'yes' }), /sí o no/)
})

test('la imagen del menu solo puede ser URL o un archivo dentro de media/', () => {
  assert.equal(validateSettings({ menuImage: 'https://example.com/a.jpg' }).menuImage, 'https://example.com/a.jpg')
  assert.equal(validateSettings({ menuImage: './media/banner.jpg' }).menuImage, './media/banner.jpg')
  assert.equal(validateSettings({ menuImage: '' }).menuImage, '')
  assert.throws(() => validateSettings({ menuImage: '/etc/passwd' }), /dentro de la carpeta media/)
  assert.throws(() => validateSettings({ menuImage: './media/../package.json' }), /dentro de la carpeta media/)
})
