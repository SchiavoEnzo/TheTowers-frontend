import React, { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api';
import { attributes, naturals, resources, skills, tabs, readDossier, withDossier, rollDice } from './character.js';

function Field({ label, value, onChange, type = 'text', min, max, required = false }) {
  return <label className="dossier-field"><span>{label}</span><input type={type} value={value ?? ''}
    min={min} max={max} required={required} maxLength={type === 'text' ? 8192 : undefined}
    onChange={(event) => onChange(type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)} /></label>;
}

function Resource({ label, value, max, color, onChange, disabled }) {
  return <div className={'dossier-resource ' + color}>
    <span>{label}</span>
    <div className="resource-controls" style={{ '--fill': `${max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0}%` }}>
      <button type="button" aria-label={`Zerar ${label}`} disabled={disabled || value === 0} onClick={() => onChange(0)}>«</button>
      <button type="button" aria-label={`Diminuir ${label}`} disabled={disabled} onClick={() => onChange(value - 1)}>−</button>
      <strong>{value} <span>/ {max}</span></strong>
      <button type="button" aria-label={`Aumentar ${label}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
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
    for (const key of ['origin', 'personality', 'history', 'wishes']) {
      if (!next.caractheristics[key]?.trim()) delete next.caractheristics[key];
    }
    if (!next.class?.trim()) delete next.class;
    for (const key of ['species', 'rank', 'element', 'size']) {
      if (!next[key]?.trim()) delete next[key];
    }
    for (const key of ['pary', 'dodge']) {
      if (next.atributes[key] === '') delete next.atributes[key];
    }
    if (next.vd === '') delete next.vd;
    onSave(next);
  }}>
    <div className="dossier-section-heading"><h2>Personalizar dossiê</h2><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button></div>
    <fieldset disabled={busy}>
      <legend>Identificação</legend>
      {Object.entries({ name: 'Personagem', 'player-name': 'Jogador', age: 'Idade', formation: 'Formação', origin: 'Origem' }).map(([key, label]) =>
        <Field key={key} label={label} value={draft.caractheristics[key]} required={key !== 'origin'} onChange={(value) => field('caractheristics', key, value)} />)}
      {(kind === 'threats'
        ? [['species', 'Espécie'], ['element', 'Elemento'], ['size', 'Tamanho']]
        : [['class', 'Classe'], ['rank', 'Patente']]).map(([key, label]) =>
        <Field key={key} label={label} value={draft[key]} onChange={(value) => setDraft((previous) => ({ ...previous, [key]: value }))} />)}
      {kind === 'threats' && <Field label="VD" type="number" min={0} value={draft.vd} onChange={(value) => setDraft((previous) => ({ ...previous, vd: value }))} />}
    </fieldset>
    {[['main', 'Habilidades principais', attributes], ['naturals', 'Habilidades naturais', naturals]].map(([group, label, entries]) =>
      <fieldset key={group} disabled={busy}>
        <legend>{label}</legend>
        {entries.map(([key, name]) => <Field key={key} label={name} type="number" required
          value={draft.habilities[group][key]}
          onChange={(value) => setDraft((previous) => ({ ...previous,
            habilities: { ...previous.habilities, [group]: { ...previous.habilities[group], [key]: value } } }))} />)}
      </fieldset>)}
    <fieldset disabled={busy}>
      <legend>Atributos atuais e máximos</legend>
      <Field label="Nível" type="number" required value={draft.atributes.level} onChange={(value) => field('atributes', 'level', value)} />
      {resources.map(([key, label]) => <div className="resource-editor-row" key={key}><strong>{label}</strong>
        {[['current', 'Atual'], ['maximum', 'Máximo']].map(([part, name]) =>
          <Field key={part} label={label + ' · ' + name} type="number" required value={sheet.resources[key][part]}
            onChange={(value) => setSheet((previous) => ({ ...previous, resources: { ...previous.resources,
              [key]: { ...previous.resources[key], [part]: value } } }))} />)}
      </div>)}
      {[['pary', 'Bloqueio'], ['dodge', 'Esquiva']].map(([key, label]) =>
        <Field key={key} label={label} type="number" value={draft.atributes[key]} onChange={(value) => field('atributes', key, value)} />)}
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Informações complementares</legend>
      <Field label="NEX (%)" type="number" min={0} max={100} required value={sheet.nex} onChange={(value) => set('nex', value)} />
      <Field label="PD por turno" type="number" required value={sheet.perTurn} onChange={(value) => set('perTurn', value)} />
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
      {Object.entries({ wishes: 'Desejos', personality: 'Personalidade', history: 'História' }).map(([key, label]) =>
        <label key={key}>{label}<textarea aria-label={label} maxLength={8192} rows={5} value={draft.caractheristics[key] || ''} onChange={(event) => field('caractheristics', key, event.target.value)} /></label>)}
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
      <dl>{[['Jogador', identity['player-name']], ['Origem', identity.origin], ['Idade', identity.age], ['Formação', identity.formation],
        ...(kind === 'threats' ? [['Espécie', data.species], ['Elemento', data.element], ['VD', data.vd], ['Tamanho', data.size]]
          : [['Classe', data.class], ['Patente', data.rank]])].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value == null || value === '' ? 'Não informado' : value}</dd></div>)}</dl></div>
    {error && <p role="alert" className="dossier-message error">{error}</p>}
    <p role="status" className="dossier-message">{notice}</p>
    {!canEdit && <p className="dossier-hint">Ficha compartilhada · somente leitura.</p>}
    {editing ? <Editor data={data} kind={kind} onSave={save} onCancel={() => { setEditing(false); setError(''); }} busy={busy} /> :
      <div className="dossier-layout">
        <aside className="dossier-summary" aria-label="Atributos e recursos">
          <h2 className="sigil-heading">Habilidades do personagem</h2>
          <div className="attribute-orbit" role="group" aria-label="Cinco habilidades principais e três naturais">
            <img className="attribute-sigil" src="/images/character-circle.png" alt="" width="1254" height="1254" />
            {[[attributes, 'main', 'Principal'], [naturals, 'naturals', 'Natural']].flatMap(([entries, group, category]) =>
              entries.map(([key, label, abbr], index) => <button type="button" className={`sigil-node sigil-${group}-${index}`}
                key={key} title={`${label} · ${category}`} aria-label={`${label} (${category}): ${data.habilities[group][key]}. Rolar 1d20 com bônus ${data.habilities[group][key]}`}
                onClick={() => roll(label, '1d20', data.habilities[group][key])}>
                <strong>{data.habilities[group][key]}</strong><span>{label}</span><b>{abbr}</b>
              </button>))}
          </div>
          <p className="sigil-caption"><span>Externas · Principais</span><span>Internas · Naturais</span></p>
          <div className="dossier-metrics">{[['Nível', data.atributes.level], ['NEX', sheet.nex + '%'], ['PD / turno', sheet.perTurn], ['Deslocamento', sheet.movement || '—']].map(([label, value]) =>
            <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <div className="dossier-resource-list" aria-label="Recursos atuais e máximos">
            {resources.map(([key, label, color]) => <Resource key={key} label={label} value={sheet.resources[key].current}
              max={sheet.resources[key].maximum} color={color} disabled={!canEdit || busy}
              onChange={(value) => saveSheet({ ...sheet, resources: { ...sheet.resources, [key]: { ...sheet.resources[key], current: value } } })} />)}
          </div>
          <div className="dossier-defenses">{[['Bloqueio', data.atributes.pary], ['Esquiva', data.atributes.dodge]].map(([label, value]) =>
            <div key={label}><strong>{value ?? '—'}</strong><span>{label}</span></div>)}</div>
          <dl className="dossier-notes">{[['Proteção', sheet.protection], ['Resistências', sheet.resistances], ['Proficiências', sheet.proficiencies]].map(([label, value]) =>
            <div key={label}><dt>{label}</dt><dd>{value === '' || value == null ? '—' : value}</dd></div>)}</dl>
        </aside>
        <section className="dossier-skills" aria-labelledby="skills-title"><h2 id="skills-title">Perícias</h2>
          <table><thead><tr><th scope="col">Perícia</th><th scope="col">Bônus</th><th scope="col">Treino</th><th scope="col">Outros</th></tr></thead>
            <tbody>{skills.map(([key, label]) => {
              const { training, other } = sheet.skills[key];
              return <tr key={key} className={training >= 15 ? 'skill-expert' : training >= 10 ? 'skill-trained' : ''}>
                <th scope="row"><button type="button" onClick={() => roll(label, '1d20', training + other)} aria-label={`Rolar ${label}: 1d20 com bônus ${training + other}`}><span aria-hidden="true">◇</span> {label}</button></th>
                <td>{training + other}</td><td>{training}</td><td>{other}</td></tr>;
            })}</tbody></table>
          <p className="dossier-hint">Clique em uma perícia para rolar 1d20 + bônus. Os bônus seguem os valores registrados na ficha.</p>
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
              {Object.entries({ age: 'Idade', formation: 'Formação', wishes: 'Desejos', personality: 'Personalidade', history: 'História' }).map(([key, label]) => <div key={key}><h3>{label}</h3><p>{identity[key] || 'Ainda não informado.'}</p></div>)}
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
              {tab === 'inventory' && [['atained-objects', 'Objetos vinculados'], ['money', 'Dinheiro vinculado']].map(([key, label]) =>
                <div className="dossier-linked" key={key}><h3>{label} · {data.habilities[key]?.length || 0}</h3>
                  {!data.habilities[key]?.length ? <p>Nenhum registro vinculado.</p> : <ul>{data.habilities[key].map((id) => <li key={id}><code>{id}</code></li>)}</ul>}
                </div>)}
            </>}
          </div>
        </section>
      </div>}
  </article>;
}
