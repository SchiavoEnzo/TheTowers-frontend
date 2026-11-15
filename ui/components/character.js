export const attributes = [
  ['agility', 'Agilidade', 'AGI'], ['strengh', 'Força', 'FOR'],
  ['intelect', 'Intelecto', 'INT'], ['charisma', 'Carisma', 'CAR'],
  ['willing', 'Vontade', 'VON'],
];

export const naturals = [
  ['inteligence', 'Inteligência', 'INL'], ['wisdom', 'Sabedoria', 'SAB'],
  ['existance', 'Existência', 'EXI'],
];

export const resources = [
  ['pv', 'Vida', 'life'], ['dp', 'Determinação', 'determination'],
  ['shield', 'Armadura', 'armor'], ['defense', 'Defesa', 'defense'],
  ['sanity', 'Sanidade', 'sanity'], ['ammo', 'Munição', 'ammo'],
];

export const skills = [
  ['acrobacy', 'Acrobacia'], ['training', 'Adestramento'],
  ['art', 'Artes'], ['atlethics', 'Atletismo'],
  ['currents', 'Atualidades'], ['science', 'Ciências'],
  ['crime', 'Crime'], ['diplomacy', 'Diplomacia'],
  ['decieving', 'Enganação'], ['fortitude', 'Fortitude'],
  ['furtivity', 'Furtividade'], ['initiative', 'Iniciativa'],
  ['intimidating', 'Intimidação'], ['intuition', 'Intuição'],
  ['investigation', 'Investigação'], ['fight', 'Luta'], ['medicine', 'Medicina'],
  ['ocultism', 'Ocultismo'], ['misticism', 'Misticismo'],
  ['perception', 'Percepção'], ['piloting', 'Pilotagem'],
  ['acuracy', 'Pontaria'], ['profession', 'Profissão'],
  ['reflex', 'Reflexos'], ['religion', 'Religião'],
  ['surviving', 'Sobrevivência'], ['tatics', 'Tática'],
  ['technology', 'Tecnologia'], ['force', 'Vontade'],
];

export const tabs = [
  ['attacks', 'Combate'], ['abilities', 'Habilidades'], ['rituals', 'Rituais'],
  ['inventory', 'Inventário'], ['description', 'Descrição'],
];

const number = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const string = (value) => typeof value === 'string' ? value : '';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

// The model owns resource values. Legacy extras are migrated only when native
// current-* fields are absent; explicit zeroes and out-of-range values survive.
export function readResources(data) {
  const saved = object(data.habilities?.extras?.dossier);
  const legacy = { pv: ['maxLife', 'life'], dp: ['maxDetermination', 'determination'] };
  return Object.fromEntries(resources.map(([key]) => {
    const nativeCurrent = data.atributes[`current-${key}`];
    const hasNativeCurrent = typeof nativeCurrent === 'number' && Number.isFinite(nativeCurrent);
    const [maxKey, currentKey] = legacy[key] || [];
    const maximum = !hasNativeCurrent && maxKey
      ? number(saved[maxKey], number(data.atributes[key])) : number(data.atributes[key]);
    const current = hasNativeCurrent ? nativeCurrent : currentKey ? number(saved[currentKey], maximum) : maximum;
    return [key, { maximum, current }];
  }));
}

export function readDossier(data) {
  const saved = object(data.habilities?.extras?.dossier);
  const sheet = {
    ...saved,
    nex: number(saved.nex), perTurn: number(saved.perTurn),
    movement: string(saved.movement), protection: string(saved.protection),
    resistances: string(saved.resistances), proficiencies: string(saved.proficiencies),
    resources: readResources(data), skills: { ...object(saved.skills) },
  };
  for (const key of ['maxLife', 'life', 'maxDetermination', 'determination']) delete sheet[key];
  for (const [key] of skills) {
    const savedSkill = object(object(saved.skills)[key]);
    const total = number(data.habilities.lasts[key]);
    const training = number(savedSkill.training, total);
    sheet.skills[key] = { training, other: total - training };
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
  const { resources: values, ...extraSheet } = structuredClone(sheet);
  copy.habilities.extras = { ...copy.habilities.extras, dossier: extraSheet };
  for (const [key] of resources) {
    copy.atributes[key] = values[key].maximum;
    copy.atributes[`current-${key}`] = values[key].current;
  }
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
