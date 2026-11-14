import React from "react";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useActionData,
  useNavigation,
} from "react-router";
import { api, recordName } from "../api";
export const loader = () => api("agents");
export async function action({ request }) {
  const f = await request.formData();
  const body = {
    name: f.get("name"),
    desc: f.get("desc"),
    start: new Date(f.get("start")).toISOString(),
    end: new Date(f.get("end")).toISOString(),
    dificulty: {
      level: Number(f.get("level")),
      "rolling-minimum-level": Number(f.get("minimum")),
    },
    users: f.getAll("agents"),
    enemies: [],
    locals: [],
  };
  try {
    const { _id } = await api("campaigns", "POST", body);
    return redirect("/mesa/" + _id);
  } catch (e) {
    if (e instanceof Response) throw e;
    return e.message;
  }
}
export default function NewCampaign() {
  const agents = useLoaderData(),
    error = useActionData(),
    busy = useNavigation().state !== "idle";
  return (
    <>
      <Link to="/arquivo/campaigns">← Campanhas</Link>
      <h1>Nova campanha</h1>
      <Form method="post">
        <label>
          Nome
          <input name="name" required />
        </label>
        <label>
          Descrição
          <input name="desc" required />
        </label>
        <label>
          Início
          <input type="datetime-local" name="start" required />
        </label>
        <label>
          Fim
          <input type="datetime-local" name="end" required />
        </label>
        <label>
          Dificuldade
          <input type="number" name="level" defaultValue="1" required />
        </label>
        <label>
          Mínimo da rolagem
          <input type="number" name="minimum" defaultValue="5" required />
        </label>
        <fieldset>
          <legend>Agentes iniciais</legend>
          {agents.map((a) => (
            <label key={a._id}>
              <input type="checkbox" name="agents" value={a._id} />
              {recordName(a.data)}
            </label>
          ))}
          {!agents.length && "Nenhum agente cadastrado."}
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <button disabled={busy}>Criar campanha</button>
      </Form>
    </>
  );
}
