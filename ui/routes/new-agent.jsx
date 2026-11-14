import React from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import template from "../../examples/agent.json";
import { api } from "../api";
const fields = {
  name: "Nome do agente",
  "player-name": "Nome do jogador",
  age: "Idade",
  formation: "Formação",
};
export async function action({ request }) {
  const form = await request.formData(),
    agent = structuredClone(template);
  for (const key of Object.keys(fields))
    agent.caractheristics[key] = form.get(key);
  agent.class = form.get("class");
  for (const key of Object.keys(agent.atributes))
    agent.atributes[key] = Number(form.get(key));
  try {
    const { _id } = await api("agents", "POST", agent);
    return redirect("/ficha/agents/" + _id);
  } catch (e) {
    if (e instanceof Response) throw e;
    return e.message;
  }
}
export default function NewAgent() {
  const error = useActionData(),
    busy = useNavigation().state !== "idle";
  return (
    <>
      <Link to="/arquivo/agents">← Agentes</Link>
      <h1>Novo agente</h1>
      <Form method="post">
        {Object.entries(fields).map(([key, label]) => (
          <label key={key}>
            {label}
            <input name={key} required />
          </label>
        ))}
        <label>
          Classe
          <input name="class" defaultValue={template.class} required />
        </label>
        <fieldset>
          <legend>Recursos iniciais</legend>
          {Object.entries(template.atributes).map(([key, value]) => (
            <label key={key}>
              {
                {
                  level: "Nível",
                  dp: "DP",
                  sanity: "Sanidade",
                  pv: "PV",
                  shield: "Escudo",
                  ammo: "Munição",
                }[key]
              }
              <input type="number" required name={key} defaultValue={value} />
            </label>
          ))}
        </fieldset>
        <p>
          A ficha começa com habilidades naturais em 1, principais em 2 e
          perícias em 0.
        </p>
        {error && <p role="alert">{error}</p>}
        <button disabled={busy}>Registrar agente</button>
      </Form>
    </>
  );
}
