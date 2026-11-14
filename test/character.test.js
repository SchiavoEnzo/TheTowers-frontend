import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readDossier, withDossier, rollDice } from '../ui/components/character.js';

const agent = JSON.parse(readFileSync(new URL('../examples/agent.json', import.meta.url)));

test('legacy sheets retain resources, bonuses, attributes and unknown extras after editing', () => {
  const data = structuredClone(agent);
  delete data.habilities.lasts.investigation;
  data.habilities.lasts.fight = 15;
  data.habilities.extras.custom = { note: 'preserve' };
  const sheet = readDossier(data);
  assert.equal(sheet.life, data.atributes.pv);
  assert.equal(sheet.maxLife, data.atributes.pv);
  assert.equal(sheet.skills.fight.training, 15);
  assert.equal(sheet.vigor, 0);
  sheet.skills.fight.other = 5;
  sheet.vigor = 4;
  sheet.life = 0;
  sheet.attacks.push({ name: 'Espada', damage: '2d6+3', bonus: 20, description: 'Corpo a corpo' });
  const saved = withDossier(data, sheet);
  assert.deepEqual(saved.habilities.main, data.habilities.main);
  assert.deepEqual(saved.habilities.extras.custom, { note: 'preserve' });
  assert.equal(saved.habilities.lasts.fight, 20);
  assert.equal(data.habilities.lasts.fight, 15);
  assert.deepEqual(readDossier(saved), sheet);
});

test('resource values stay within maximum and malformed optional extras do not break the sheet', () => {
  const data = structuredClone(agent);
  data.habilities.extras.dossier = { maxLife: 10, life: 30, maxDetermination: 5, determination: -2,
    skills: { fight: null }, attacks: [null, 42, { name: 'Ataque' }], rituals: 'invalid' };
  const sheet = readDossier(data);
  assert.equal(sheet.life, 10);
  assert.equal(sheet.determination, 0);
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
