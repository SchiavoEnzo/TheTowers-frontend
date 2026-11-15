import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attributes, naturals, resources, readDossier, withDossier, rollDice } from '../ui/components/character.js';

const agent = JSON.parse(readFileSync(new URL('../examples/agent.json', import.meta.url)));

test('circle covers all five main and three natural model fields without replacing willpower', () => {
  assert.deepEqual(new Set(attributes.map(([key]) => key)), new Set(Object.keys(agent.habilities.main)));
  assert.deepEqual(new Set(naturals.map(([key]) => key)), new Set(Object.keys(agent.habilities.naturals)));
  assert.ok(attributes.some(([key, label]) => key === 'willing' && label === 'Vontade'));
  assert.ok(!attributes.some(([key]) => key === 'vigor'));
});

test('native resource values take priority over legacy extras, including explicit zero and negative values', () => {
  const data = structuredClone(agent);
  data.atributes = { ...data.atributes, pv: 100, 'current-pv': 0, shield: 30, 'current-shield': 12,
    defense: 20, 'current-defense': 6, sanity: 50, 'current-sanity': -2, ammo: 8, 'current-ammo': 10 };
  data.habilities.extras.dossier = { maxLife: 999, life: 999 };
  const sheet = readDossier(data);
  assert.deepEqual(sheet.resources.pv, { maximum: 100, current: 0 });
  assert.deepEqual(sheet.resources.shield, { maximum: 30, current: 12 });
  assert.deepEqual(sheet.resources.defense, { maximum: 20, current: 6 });
  assert.deepEqual(sheet.resources.sanity, { maximum: 50, current: -2 });
  assert.deepEqual(sheet.resources.ammo, { maximum: 8, current: 10 });
});

test('legacy sheets fall back to maxima and migrate old dossier values when native current fields are absent', () => {
  const data = structuredClone(agent);
  for (const [key] of resources) delete data.atributes[`current-${key}`];
  delete data.atributes.defense;
  const defaults = readDossier(data);
  assert.equal(defaults.resources.pv.current, data.atributes.pv);
  assert.deepEqual(defaults.resources.defense, { maximum: 0, current: 0 });
  data.habilities.extras.dossier = { maxLife: 100, life: 0, maxDetermination: 50, determination: 20 };
  const migrated = withDossier(data, readDossier(data));
  assert.equal(migrated.atributes.pv, 100);
  assert.equal(migrated.atributes['current-pv'], 0);
  assert.equal(migrated.atributes.dp, 50);
  assert.equal(migrated.atributes['current-dp'], 20);
  assert.equal(Object.hasOwn(migrated.habilities.extras.dossier, 'life'), false);
});

test('saving writes all six native resources and preserves character fields, references and unknown extras', () => {
  const data = structuredClone(agent);
  data.caractheristics.wishes = 'Encontrar a torre';
  data.rank = 'Veterano';
  data.habilities.extras.custom = { note: 'preserve' };
  data.habilities.extras.dossier = { custom: 'preserve', vigor: 7 };
  data.habilities.money = ['a'.repeat(24)];
  data.habilities.lasts.fight = 15;
  const sheet = readDossier(data);
  for (const [key] of resources) sheet.resources[key] = { maximum: 30, current: 0 };
  sheet.skills.fight.other = 5;
  sheet.attacks.push({ name: 'Espada', damage: '2d6+3', bonus: 20, description: 'Corpo a corpo' });
  const saved = withDossier(data, sheet);
  for (const [key] of resources) {
    assert.equal(saved.atributes[key], 30);
    assert.equal(saved.atributes[`current-${key}`], 0);
  }
  assert.deepEqual(saved.habilities.main, data.habilities.main);
  assert.deepEqual(saved.habilities.naturals, data.habilities.naturals);
  assert.deepEqual(saved.habilities.money, data.habilities.money);
  assert.deepEqual(saved.habilities.extras.custom, { note: 'preserve' });
  assert.equal(saved.habilities.extras.dossier.custom, 'preserve');
  assert.equal(saved.habilities.extras.dossier.vigor, 7);
  assert.equal(saved.caractheristics.wishes, data.caractheristics.wishes);
  assert.equal(saved.rank, data.rank);
  assert.equal(saved.habilities.lasts.fight, 20);
  assert.equal(data.habilities.lasts.fight, 15);
  assert.deepEqual(readDossier(saved), sheet);
});

test('native skill totals win over stale bonus splits and malformed optional extras do not break rendering', () => {
  const data = structuredClone(agent);
  data.habilities.lasts.fight = 20;
  data.habilities.extras.dossier = { skills: { fight: { training: 15, other: 99 } },
    attacks: [null, 42, { name: 'Ataque' }], rituals: 'invalid' };
  const sheet = readDossier(data);
  assert.deepEqual(sheet.skills.fight, { training: 15, other: 5 });
  assert.equal(sheet.attacks.length, 1);
  assert.equal(sheet.attacks[0].bonus, 0);
  assert.deepEqual(sheet.rituals, []);
});

test('dice support modifiers and reject unbounded or invalid expressions', () => {
  assert.deepEqual(rollDice('2d6+3', () => 0), { dice: [1, 1], bonus: 3, total: 5 });
  assert.equal(rollDice('1d20-2', () => 0.999).total, 18);
  for (const expression of ['0d20', '51d20', '2d1001', '1d1', 'Infinity', '1d20+alert(1)'])
    assert.throws(() => rollDice(expression));
});
