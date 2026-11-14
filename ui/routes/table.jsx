import React from "react";
import {
  Form,
  Link,
  useLoaderData,
  useActionData,
  useNavigation,
} from "react-router";
import { api, recordName } from "../api";
import template from "../../examples/agent.json";
export async function loader({ params }) {
  const path = "campaigns/" + encodeURIComponent(params.id);
  const [campaign, rolls, profile] = await Promise.all([
    api(path),
    api(path + "/rolls"),
    api("profile"),
  ]);
  const agents = await Promise.all(
    campaign.data.users.map((id) => api("agents/" + id)),
  );
  return {
    campaign,
    rolls,
    agents: agents.filter(
      (a) => campaign.owner === profile._id || a.owner === profile._id,
    ),
  };
}
export async function action({ request, params }) {
  const f = await request.formData(),
    [group, key] = f.get("skill").split(".");
  try {
    await api("campaigns/" + encodeURIComponent(params.id) + "/rolls", "POST", {
      agent: f.get("agent"),
      group,
      key,
    });
    return null;
  } catch (e) {
    if (e instanceof Response) throw e;
    return e.message;
  }
}
export default function Table() {
  const { campaign, rolls, agents } = useLoaderData(),
    error = useActionData(),
    busy = useNavigation().state !== "idle";
  return (
    <>
      <Link to="/arquivo/campaigns">← Campanhas</Link>
      <h1>{campaign.data.name}</h1>
      <h2>Mesa de rolagens</h2>
      {agents.length ? (
        <Form method="post">
          <label>
            Agente
            <select name="agent">
              {agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {recordName(a.data)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Habilidade
            <select name="skill">
              {["naturals", "main", "lasts", "attack"].map((g) => (
                <optgroup
                  key={g}
                  label={
                    {
                      naturals: "Naturais",
                      main: "Principais",
                      lasts: "Perícias",
                      attack: "Ataque",
                    }[g]
                  }
                >
                  {(g === "attack"
                    ? ["fight", "acuracy"]
                    : Object.keys(template.habilities[g])
                  ).map((k) => (
                    <option key={k} value={g + "." + k}>
                      {k}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button disabled={busy}>Rolar 1d20</button>
          {error && <p role="alert">{error}</p>}
        </Form>
      ) : (
        <p>Nenhum agente disponível para rolar nesta mesa.</p>
      )}
      <h2>Histórico</h2>
      {!rolls.length && <p>Nenhuma rolagem registrada.</p>}
      <ol>
        {rolls.map((r) => (
          <li key={r._id}>
            {r.key} · dado {r.die} + bônus {r.bonus} ={" "}
            <strong>{r.total}</strong>
          </li>
        ))}
      </ol>
    </>
  );
}
