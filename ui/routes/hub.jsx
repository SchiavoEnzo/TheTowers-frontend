import React from "react";
import { Form, Link, redirect, useLoaderData } from "react-router";
import { api, catalogs } from "../api";
export const loader = () => api("profile");
export async function action() {
  await api("auth/logout", "POST");
  sessionStorage.removeItem("torres.session");
  return redirect("/");
}
export default function Hub() {
  const { profile, email } = useLoaderData();
  return (
    <>
      <small>CENTRAL　/　OPERAÇÕES</small>
      <h1>Arquivo de campo</h1>
      <p>Operador · {profile.name || email}</p>
      <nav>
        {Object.entries(catalogs).map(([key, label], i) => (
          <Link key={key} to={"/arquivo/" + key}>
            <small>DOSSIÊ　0{i + 1}</small>
            <h2>{label}</h2>Abrir arquivo →
          </Link>
        ))}
      </nav>
      <footer>
        <Link to="/perfil">Meu perfil</Link>
        <Form method="post">
          <button className="secondary">Encerrar sessão</button>
        </Form>
      </footer>
    </>
  );
}
