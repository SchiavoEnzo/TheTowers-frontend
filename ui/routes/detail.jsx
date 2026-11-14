import React from "react";
import { Link, useLoaderData, useParams } from "react-router";
import { api, catalogs, checkKind, recordName } from "../api";
export function loader({ params }) {
  checkKind(params.kind);
  return api(params.kind + "/" + encodeURIComponent(params.id));
}
const labels = {
  caractheristics: "Identificação",
  atributes: "Atributos",
  habilities: "Habilidades",
  naturals: "Naturais",
  main: "Principais",
  lasts: "Perícias",
  users: "Agentes vinculados",
  enemies: "Ameaças",
  desc: "Descrição",
  name: "Nome",
  "player-name": "Jogador",
  pv: "Pontos de vida",
  sanity: "Sanidade",
  dificulty: "Dificuldade",
};
function Values({ value }) {
  if (Array.isArray(value))
    return value.length ? (
      <ul>
        {value.map((v, i) => (
          <li key={i}>
            <Values value={v} />
          </li>
        ))}
      </ul>
    ) : (
      "Nenhum"
    );
  if (value && typeof value === "object")
    return (
      <dl>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <dt>{labels[k] || k}</dt>
            <dd>
              <Values value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return String(value ?? "—");
}
export default function Detail() {
  const { kind } = useParams(),
    { data, _id: recordId } = useLoaderData();
  return (
    <>
      <Link to={"/arquivo/" + kind}>← {catalogs[kind]}</Link>
      <h1>{recordName(data)}</h1>
      {kind === "campaigns" && (
        <p>
          <Link to={"/mesa/" + recordId}>Abrir mesa de rolagens →</Link>
        </p>
      )}
      <section>
        <Values value={data} />
      </section>
    </>
  );
}
