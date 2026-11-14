export const attributes = [
  ['agility', 'Agilidade', 'AGI'], ['strengh', 'Força', 'FOR'],
  ['intelect', 'Intelecto', 'INT'], ['charisma', 'Presença', 'PRE'],
  ['vigor', 'Vigor', 'VIG'],
];

export const skills = [
  ['acrobacy', 'Acrobacia', 'AGI'], ['training', 'Adestramento', 'PRE'],
  ['art', 'Artes', 'PRE'], ['atlethics', 'Atletismo', 'FOR'],
  ['currents', 'Atualidades', 'INT'], ['science', 'Ciências', 'INT'],
  ['crime', 'Crime', 'AGI'], ['diplomacy', 'Diplomacia', 'PRE'],
  ['decieving', 'Enganação', 'PRE'], ['fortitude', 'Fortitude', 'VIG'],
  ['furtivity', 'Furtividade', 'AGI'], ['initiative', 'Iniciativa', 'AGI'],
  ['intimidating', 'Intimidação', 'PRE'], ['intuition', 'Intuição', 'PRE'],
  ['investigation', 'Investigação', 'INT'], ['fight', 'Luta', 'FOR'], ['medicine', 'Medicina', 'INT'],
  ['ocultism', 'Ocultismo', 'INT'], ['misticism', 'Misticismo', 'INT'],
  ['perception', 'Percepção', 'PRE'], ['piloting', 'Pilotagem', 'AGI'],
  ['acuracy', 'Pontaria', 'AGI'], ['profession', 'Profissão', 'INT'],
  ['reflex', 'Reflexos', 'AGI'], ['religion', 'Religião', 'PRE'],
  ['surviving', 'Sobrevivência', 'INT'], ['tatics', 'Tática', 'INT'],
  ['technology', 'Tecnologia', 'INT'], ['force', 'Vontade', 'PRE'],
];

export const tabs = [
  ['attacks', 'Combate'], ['abilities', 'Habilidades'], ['rituals', 'Rituais'],
  ['inventory', 'Inventário'], ['description', 'Descrição'],
];

const number = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const string = (value) => typeof value === 'string' ? value : '';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

// New sheet fields live in extras; legacy fields and unknown extras remain intact.
export function readDossier(data) {
  const saved = object(data.habilities?.extras?.dossier);
  const maxLife = Math.max(0, number(saved.maxLife, data.atributes.pv));
  const maxDetermination = Math.max(0, number(saved.maxDetermination, data.atributes.dp));
  const sheet = {
    ...saved,
    vigor: number(saved.vigor), nex: number(saved.nex), perTurn: number(saved.perTurn),
    movement: string(saved.movement), protection: string(saved.protection),
    resistances: string(saved.resistances), proficiencies: string(saved.proficiencies),
    maxLife, maxDetermination,
    life: Math.max(0, Math.min(maxLife, number(saved.life, data.atributes.pv))),
    determination: Math.max(0, Math.min(maxDetermination, number(saved.determination, data.atributes.dp))),
    skills: { ...object(saved.skills) },
  };
  for (const [key] of skills) {
    const savedSkill = object(object(saved.skills)[key]);
    const training = number(savedSkill.training, data.habilities.lasts[key]);
    const other = number(savedSkill.other);
    sheet.skills[key] = { training, other };
  }
  for (const key of ['attacks', 'abilities', 'rituals', 'inventory']) {
    sheet[key] = (Array.isArray(saved[key]) ? saved[key] : [])
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.name === 'string')
      .map((entry) => ({ ...entry, name: entry.name, description: string(entry.description),
        ...(key === 'attacks' ? { damage: string(entry.damage), bonus: number(entry.bonus) } : {}) }));
  }
  return sheet;
}

export function withDossier(data, sheet) {
  const copy = structuredClone(data);
  copy.habilities.extras = { ...copy.habilities.extras, dossier: structuredClone(sheet) };
  for (const [key] of skills) {
    const { training, other } = sheet.skills[key];
    copy.habilities.lasts[key] = training + other;
  }
  return copy;
}

export function rollDice(expression, random = Math.random) {
  const match = /^(\d{1,2})d(\d{1,4})([+-]\d{1,4})?$/i.exec(expression.replace(/\s/g, ''));
  if (!match) throw new Error('Use dados como 1d20, 2d6 ou 2d6+3.');
  const count = Number(match[1]), sides = Number(match[2]), bonus = Number(match[3] || 0);
  if (count < 1 || count > 50 || sides < 2 || sides > 1000)
    throw new Error('Use de 1 a 50 dados, com 2 a 1000 faces.');
  const dice = Array.from({ length: count }, () => Math.floor(random() * sides) + 1);
  return { dice, bonus, total: dice.reduce((sum, die) => sum + die, bonus) };
}
