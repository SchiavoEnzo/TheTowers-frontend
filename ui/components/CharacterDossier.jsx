import React, { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api';
import { attributes, skills, tabs, readDossier, withDossier, rollDice } from './character.js';

function Field({ label, value, onChange, type = 'text', min, max, required = false }) {
  return <label className="dossier-field"><span>{label}</span><input type={type} value={value ?? ''}
    min={min} max={max} required={required} maxLength={type === 'text' ? 8192 : undefined}
    onChange={(event) => onChange(type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)} /></label>;
}

function Resource({ label, value, max, color, onChange, disabled }) {
  return <div className={'dossier-resource ' + color}>
    <span>{label}</span>
    <div className="resource-controls" style={{ '--fill': `${max > 0 ? value / max * 100 : 0}%` }}>
      <button type="button" aria-label={`Zerar ${label}`} disabled={disabled || value === 0} onClick={() => onChange(0)}>«</button>
      <button type="button" aria-label={`Diminuir ${label}`} disabled={disabled || value === 0} onClick={() => onChange(value - 1)}>−</button>
      <strong>{value} <span>/ {max}</span></strong>
      <button type="button" aria-label={`Aumentar ${label}`} disabled={disabled || value === max} onClick={() => onChange(value + 1)}>+</button>
      <button type="button" aria-label={`Restaurar ${label}`} disabled={disabled || value === max} onClick={() => onChange(max)}>»</button>
    </div>
  </div>;
}

function Editor({ data, kind, onSave, onCancel, busy }) {
  const [draft, setDraft] = useState(() => structuredClone(data));
  const [sheet, setSheet] = useState(() => readDossier(data));
  function field(group, key, value) {
    setDraft((previous) => ({ ...previous, [group]: { ...previous[group], [key]: value } }));
  }
  const set = (key, value) => setSheet((previous) => ({ ...previous, [key]: value }));
  return <form className="dossier-editor" onSubmit={(event) => {
    event.preventDefault();
    const next = withDossier(draft, sheet);
    for (const key of ['origin', 'personality', 'history']) {
      if (!next.caractheristics[key]?.trim()) delete next.caractheristics[key];
    }
    if (!next.class?.trim()) delete next.class;
    if (!next.species?.trim()) delete next.species;
    onSave(next);
  }}>
    <div className="dossier-section-heading"><h2>Personalizar dossiê</h2><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button></div>
    <fieldset disabled={busy}>
      <legend>Identificação</legend>
      {Object.entries({ name: 'Personagem', 'player-name': 'Jogador', age: 'Idade', formation: 'Formação', origin: 'Origem' }).map(([key, label]) =>
        <Field key={key} label={label} value={draft.caractheristics[key]} required={key !== 'origin'} onChange={(value) => field('caractheristics', key, value)} />)}
      <Field label={kind === 'threats' ? 'Espécie' : 'Classe'} value={kind === 'threats' ? draft.species : draft.class} onChange={(value) => setDraft((previous) => ({ ...previous, [kind === 'threats' ? 'species' : 'class']: value }))} />
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Atributos</legend>
      {attributes.map(([key, label]) => <Field key={key} label={label} type="number" required
        value={key === 'vigor' ? sheet.vigor : draft.habilities.main[key]}
        onChange={(value) => key === 'vigor' ? set(key, value) : setDraft((previous) => ({ ...previous,
          habilities: { ...previous.habilities, main: { ...previous.habilities.main, [key]: value } } }))} />)}
      <p className="dossier-hint">Vigor é um campo novo. Os atributos anteriores, incluindo Vontade, continuam preservados.</p>
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Recursos e defesa</legend>
      {Object.entries({ level: 'Nível', sanity: 'Sanidade', shield: 'Defesa', pary: 'Bloqueio', dodge: 'Esquiva', ammo: 'Munição' }).map(([key, label]) =>
        <Field key={key} label={label} type="number" required value={draft.atributes[key] ?? 0} onChange={(value) => field('atributes', key, value)} />)}
      {Object.entries({ nex: 'NEX (%)', perTurn: 'PD por turno', maxLife: 'Vida máxima', life: 'Vida atual',
        maxDetermination: 'Determinação máxima', determination: 'Determinação atual' }).map(([key, label]) =>
        <Field key={key} label={label} type="number" min={0} max={key === 'nex' ? 100 : key === 'life' ? sheet.maxLife : key === 'determination' ? sheet.maxDetermination : undefined}
          required value={sheet[key]} onChange={(value) => set(key, value)} />)}
      {Object.entries({ movement: 'Deslocamento', protection: 'Proteção', resistances: 'Resistências', proficiencies: 'Proficiências' }).map(([key, label]) =>
        <Field key={key} label={label} value={sheet[key]} onChange={(value) => set(key, value)} />)}
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Perícias · treino e outros bônus</legend>
      {skills.map(([key, label]) => <div className="skill-editor-row" key={key}><strong>{label}</strong>
        {['training', 'other'].map((part) => <Field key={part} label={part === 'training' ? 'Treino' : 'Outros'} type="number" required
          value={sheet.skills[key][part]} onChange={(value) => setSheet((previous) => ({ ...previous,
            skills: { ...previous.skills, [key]: { ...previous.skills[key], [part]: value } } }))} />)}
      </div>)}
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Descrição</legend>
      {Object.entries({ personality: 'Personalidade', history: 'História' }).map(([key, label]) =>
        <label key={key}>{label}<textarea maxLength={8192} rows={5} value={draft.caractheristics[key] || ''} onChange={(event) => field('caractheristics', key, event.target.value)} /></label>)}
    </fieldset>
    <button disabled={busy}>{busy ? 'Salvando…' : 'Salvar dossiê'}</button>
  </form>;
}

function EntryForm({ tab, onAdd, onCancel, busy }) {
  return <form className="dossier-entry-form" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onAdd({ name: form.get('name').trim(), description: form.get('description').trim(),
      ...(tab === 'attacks' ? { damage: form.get('damage').trim(), bonus: Number(form.get('bonus')) } : {}) });
  }}>
    <label>Nome<input name="name" required maxLength={120} /></label>
    {tab === 'attacks' && <div className="dossier-inline-fields"><label>Dano (ex.: 2d6+3)<input name="damage" maxLength={60} /></label>
      <label>Bônus de ataque<input name="bonus" type="number" required defaultValue={0} /></label></div>}
    <label>Descrição<textarea name="description" maxLength={8192} rows={4} /></label>
    <div className="dossier-actions"><button disabled={busy}>Salvar</button><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button></div>
  </form>;
}

export default function CharacterDossier({ record, kind, canEdit }) {
  const [data, setData] = useState(record.data);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('attacks');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expression, setExpression] = useState('1d20');
  const [result, setResult] = useState(null);
  const sheet = readDossier(data);
  const identity = data.caractheristics;
  async function save(next) {
    setBusy(true); setError(''); setNotice('');
    try {
      const saved = await api(`${kind}/${encodeURIComponent(record._id)}`, 'PUT', next);
      setData(saved.data); setEditing(false); setAdding(false); setNotice('Dossiê salvo.');
    } catch (failure) {
      setError(failure instanceof Response ? 'Sua sessão expirou. Entre novamente para salvar.' : failure.message);
    } finally { setBusy(false); }
  }
  const saveSheet = (next) => save(withDossier(data, next));
  function roll(label, dice = '1d20', bonus = 0) {
    try {
      const rolled = rollDice(dice);
      setResult({ label, ...rolled, bonus: rolled.bonus + bonus, total: rolled.total + bonus });
      setError('');
    } catch (failure) { setError(failure.message); }
  }
  return <article className="character-dossier" aria-label={`Dossiê de ${identity.name}`}>
    <div className="dossier-toolbar"><Link to={'/arquivo/' + kind}>← Arquivo de {kind === 'agents' ? 'agentes' : 'ameaças'}</Link>
      <div className="dossier-actions"><Link to="/arquivo/campaigns">Campanhas ↗</Link>
        {canEdit && <button type="button" disabled={busy || editing} onClick={() => { setEditing(true); setAdding(false); setNotice(''); }}>Personalização</button>}</div></div>
    <div className="dossier-identity"><div className="dossier-avatar" aria-hidden="true">{identity.name.slice(0, 1)}</div>
      <div><small>Personagem</small><h1>{identity.name}</h1></div>
      <dl>{[['Jogador', identity['player-name']], ['Origem', identity.origin], [kind === 'threats' ? 'Espécie' : 'Classe', data.class || data.species]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value || 'Não informado'}</dd></div>)}</dl></div>
    {error && <p role="alert" className="dossier-message error">{error}</p>}
    <p role="status" className="dossier-message">{notice}</p>
    {!canEdit && <p className="dossier-hint">Ficha compartilhada · somente leitura.</p>}
    {editing ? <Editor data={data} kind={kind} onSave={save} onCancel={() => { setEditing(false); setError(''); }} busy={busy} /> :
      <div className="dossier-layout">
        <aside className="dossier-summary" aria-label="Atributos e recursos">
          <div className="attribute-orbit"><span className="attribute-center">ATRIBUTOS</span>
            {attributes.map(([key, label, abbr], index) => <div className={'attribute-node attribute-' + index} key={key} title={label}>
              <strong>{key === 'vigor' ? sheet.vigor : data.habilities.main[key]}</strong><span>{label}</span><b>{abbr}</b></div>)}
          </div>
          <div className="dossier-metrics">{[['Nível', data.atributes.level], ['NEX', sheet.nex + '%'], ['PD / turno', sheet.perTurn], ['Deslocamento', sheet.movement || '—']].map(([label, value]) =>
            <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <Resource label="Vida" value={sheet.life} max={sheet.maxLife} color="life" disabled={!canEdit || busy}
            onChange={(value) => saveSheet({ ...sheet, life: value })} />
          <Resource label="Determinação" value={sheet.determination} max={sheet.maxDetermination} color="determination" disabled={!canEdit || busy}
            onChange={(value) => saveSheet({ ...sheet, determination: value })} />
          <div className="dossier-defenses">{[['Defesa', data.atributes.shield], ['Bloqueio', data.atributes.pary], ['Esquiva', data.atributes.dodge]].map(([label, value]) =>
            <div key={label}><strong>{value ?? '—'}</strong><span>{label}</span></div>)}</div>
          <dl className="dossier-notes">{[['Proteção', sheet.protection], ['Resistências', sheet.resistances], ['Proficiências', sheet.proficiencies], ['Sanidade', data.atributes.sanity], ['Munição', data.atributes.ammo]].map(([label, value]) =>
            <div key={label}><dt>{label}</dt><dd>{value === '' || value == null ? '—' : value}</dd></div>)}</dl>
        </aside>
        <section className="dossier-skills" aria-labelledby="skills-title"><h2 id="skills-title">Perícias</h2>
          <table><thead><tr><th scope="col">Perícia</th><th scope="col">Atrib.</th><th scope="col">Bônus</th><th scope="col">Treino</th><th scope="col">Outros</th></tr></thead>
            <tbody>{skills.map(([key, label, attr]) => {
              const { training, other } = sheet.skills[key];
              return <tr key={key} className={training >= 15 ? 'skill-expert' : training >= 10 ? 'skill-trained' : ''}>
                <th scope="row"><button type="button" onClick={() => roll(label, '1d20', training + other)} aria-label={`Rolar ${label}: 1d20 com bônus ${training + other}`}><span aria-hidden="true">◇</span> {label}</button></th>
                <td>{attr}</td><td>{training + other}</td><td>{training}</td><td>{other}</td></tr>;
            })}</tbody></table>
          <p className="dossier-hint">Clique em uma perícia para rolar 1d20 + bônus. A coluna de atributo é uma referência e não soma ao resultado.</p>
        </section>
        <section className="dossier-content" aria-label="Detalhes do personagem">
          <div className="dossier-tabs" role="tablist" aria-label="Seções do dossiê">{tabs.map(([key, label]) =>
            <button key={key} id={'tab-' + key} type="button" role="tab" aria-selected={tab === key} aria-controls="dossier-tab-panel" tabIndex={tab === key ? 0 : -1}
              onKeyDown={(event) => {
                const index = tabs.findIndex(([value]) => value === tab);
                const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
                    : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
                if (next !== null) {
                  event.preventDefault(); setTab(tabs[next][0]); setAdding(false);
                  event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
                }
              }}
              onClick={() => { setTab(key); setAdding(false); }}>{label}</button>)}</div>
          <form className="dossier-dice" onSubmit={(event) => { event.preventDefault(); roll(expression, expression); }}>
            <label htmlFor="dice-expression">Rolar dados</label><div><input id="dice-expression" value={expression} maxLength={30} onChange={(event) => setExpression(event.target.value)} required placeholder="2d6+3" />
              <button aria-label="Rolar dados" title="Rolar dados">◇</button></div></form>
          <div className="dossier-roll" aria-live="polite">{result ? <><span>{result.label}</span><strong>{result.total}</strong><small>Dados: {result.dice.join(', ')} · bônus: {result.bonus}</small></> : <span>Seu próximo teste começa aqui.</span>}</div>
          <p className="dossier-hint">Rolagens locais, sem registro na campanha. Use a mesa para registrar testes.</p>
          <div role="tabpanel" id="dossier-tab-panel" aria-labelledby={'tab-' + tab}>
            {tab === 'description' ? <div className="dossier-description">
              {Object.entries({ age: 'Idade', formation: 'Formação', personality: 'Personalidade', history: 'História' }).map(([key, label]) => <div key={key}><h3>{label}</h3><p>{identity[key] || 'Ainda não informado.'}</p></div>)}
              <h3>Outros atributos da ficha</h3><dl>{Object.entries({ ...data.habilities.naturals, willing: data.habilities.main.willing }).map(([key, value]) =>
                <div key={key}><dt>{{ inteligence: 'Inteligência natural', wisdom: 'Sabedoria', existance: 'Existência', willing: 'Vontade (atributo anterior)' }[key] || key}</dt><dd>{value}</dd></div>)}</dl>
            </div> : <>
              <div className="dossier-section-heading"><h2>{tabs.find(([key]) => key === tab)[1]}</h2>{canEdit && !adding && <button type="button" disabled={busy} onClick={() => setAdding(true)}>
                + {{ attacks: 'Novo ataque', abilities: 'Nova habilidade', rituals: 'Novo ritual', inventory: 'Novo item' }[tab]}</button>}</div>
              {adding && <EntryForm key={tab} tab={tab} busy={busy} onCancel={() => setAdding(false)} onAdd={(entry) => saveSheet({ ...sheet, [tab]: [...sheet[tab], entry] })} />}
              {!sheet[tab].length && !adding && <div className="dossier-empty"><span aria-hidden="true">◇</span><h3>{{ attacks: 'Você ainda não possui ataques', abilities: 'Nenhuma habilidade cadastrada', rituals: 'Nenhum ritual cadastrado', inventory: 'Inventário vazio' }[tab]}</h3><p>Os registros do personagem aparecerão aqui.</p></div>}
              <div className="dossier-entries">{sheet[tab].map((entry, index) => <div className="dossier-entry" key={index}><h3>{entry.name}</h3>
                {tab === 'attacks' && <p className="attack-values">Bônus {entry.bonus >= 0 ? '+' : ''}{entry.bonus} · Dano {entry.damage || 'Não informado'}</p>}
                <p>{entry.description}</p><div className="dossier-actions">{tab === 'attacks' && <><button type="button" onClick={() => roll(entry.name, '1d20', entry.bonus)}>Rolar ataque</button>
                  {entry.damage && <button type="button" className="secondary" onClick={() => roll('Dano · ' + entry.name, entry.damage)}>Rolar dano</button>}</>}
                  {canEdit && <button type="button" className="secondary" disabled={busy} onClick={() => {
                    if (window.confirm(`Remover “${entry.name}” do dossiê?`)) saveSheet({ ...sheet, [tab]: sheet[tab].filter((_, position) => position !== index) });
                  }}>Remover</button>}</div></div>)}</div>
              {tab === 'inventory' && data.habilities['atained-objects']?.length > 0 && <div className="dossier-linked"><h3>Objetos vinculados</h3><ul>{data.habilities['atained-objects'].map((id) => <li key={id}><code>{id}</code></li>)}</ul></div>}
            </>}
          </div>
        </section>
      </div>}
  </article>;
}
