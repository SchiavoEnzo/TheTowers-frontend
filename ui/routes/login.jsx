import React from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import { api } from "../api";
export function loader() {
  if (sessionStorage.getItem("torres.session")) throw redirect("/central");
  return null;
}
export async function action({ request }) {
  const { email, password, mode } = Object.fromEntries(
    await request.formData(),
  );
  try {
    if (mode === "register")
      await api("auth/register", "POST", { email, password });
    const { token } = await api("auth/login", "POST", { email, password });
    sessionStorage.setItem("torres.session", token);
  } catch (e) {
    return e.message;
  }
  return redirect("/central");
}
export default function Login() {
  const error = useActionData(),
    busy = useNavigation().state !== "idle";
  return (
    <section>
      <small>PROTOCOLO 01　/　IDENTIFICAÇÃO</small>
      <h1>The Towers</h1>
      <p>Entre para consultar suas fichas e preparar a próxima sessão.</p>
      <Form method="post">
        <label>
          E-mail
          <input required type="email" name="email" autoComplete="username" />
        </label>
        <label>
          Senha
          <input
            required
            type="password"
            name="password"
            minLength={10}
            maxLength={128}
          />
        </label>
        <p>Use de 10 a 128 caracteres no cadastro.</p>
        {error && <p role="alert">{error}</p>}
        <div>
          <button disabled={busy} name="mode" value="login">
            Entrar
          </button>{" "}
          <button
            className="secondary"
            disabled={busy}
            name="mode"
            value="register"
          >
            Criar conta
          </button>
        </div>
      </Form>
    </section>
  );
}
