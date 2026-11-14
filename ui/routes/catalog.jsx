import React from "react";
import {
  Form,
  Link,
  useLoaderData,
  useParams,
  useSearchParams,
} from "react-router";
import { api, catalogs, checkKind, recordName } from "../api";
export async function loader({ params, request }) {
  checkKind(params.kind);
  return api(params.kind + new URL(request.url).search);
}
export default function Catalog() {
  const { kind } = useParams(),
    rows = useLoaderData(),
    [query] = useSearchParams();
  const next = new URLSearchParams(query);
  if (rows.length) next.set("before", rows.at(-1)._id);
  return (
    <>
      <Link to="/central">← Central</Link>
      <h1>{catalogs[kind]}</h1>
      <Form method="get">
        <label>
          Pesquisar por nome
          <input name="q" defaultValue={query.get("q") || ""} />
        </label>
        <button>Pesquisar</button>
      </Form>
      {kind === "campaigns" && (
        <p>
          <Link to="/campanhas/nova">+ Criar campanha</Link>
        </p>
      )}
      {kind === "agents" && (
        <p>
          <Link to="/agentes/novo">+ Criar agente</Link>
        </p>
      )}
      <nav>
        {rows.map(({ _id, data }) => (
          <Link key={_id} to={"/ficha/" + kind + "/" + _id}>
            <small>
              {data.class || data.element || data.category || catalogs[kind]}
            </small>
            <h2>{recordName(data)}</h2>Abrir dossiê →
          </Link>
        ))}
      </nav>
      {!rows.length && <p>Nenhum registro encontrado.</p>}
      {rows.length === 100 && <Link to={"?" + next}>Próxima página →</Link>}
    </>
  );
}
