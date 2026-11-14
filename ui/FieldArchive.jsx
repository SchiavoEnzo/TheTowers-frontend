import { createBrowserRouter, Link, Outlet, useRouteError } from "react-router";
import { RouterProvider } from "react-router/dom";
import * as login from "./routes/login";
import * as hub from "./routes/hub";
import * as profile from "./routes/profile";
import * as catalog from "./routes/catalog";
import * as campaign from "./routes/new-campaign";
import * as table from "./routes/table";
import * as agent from "./routes/new-agent";
import * as detail from "./routes/detail";

function Layout() {
  return <div lang="pt-BR"><header><Link to="/central">♜　THE TOWERS</Link><span>ARQUIVO DE CAMPO</span></header><main><Outlet /></main></div>;
}

function ErrorView() {
  const error = useRouteError();
  return <main><h1>Acesso interrompido</h1><p role="alert">{error.message || error.statusText || "Página indisponível."}</p><Link to="/central">Voltar à central</Link></main>;
}

function screen(path, { default: Component, loader, action }) {
  return { path, Component, loader, action };
}

const router = createBrowserRouter([{
  Component: Layout,
  ErrorBoundary: ErrorView,
  HydrateFallback: () => <p>Carregando arquivo…</p>,
  children: [
    screen("/", login), screen("/central", hub), screen("/perfil", profile),
    screen("/arquivo/:kind", catalog), screen("/campanhas/nova", campaign),
    screen("/mesa/:id", table), screen("/agentes/novo", agent),
    screen("/ficha/:kind/:id", detail),
  ],
}]);

export default function FieldArchive() {
  return <RouterProvider router={router} />;
}
