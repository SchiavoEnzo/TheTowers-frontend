import React from "react";
import { Form, Link, useLoaderData, useActionData } from "react-router";
import { api } from "../api";
export const loader = () => api("profile");
export async function action({ request }) {
  const { name, image } = Object.fromEntries(await request.formData());
  try {
    await api("profile", "PATCH", {
      name: name.trim() || undefined,
      image: image.trim() || null,
    });
    return "Perfil atualizado.";
  } catch (e) {
    if (e instanceof Response) throw e;
    return e.message;
  }
}
export default function Profile() {
  const { email, profile } = useLoaderData();
  const msg = useActionData();
  return (
    <>
      <Link to="/central">← Central</Link>
      <h1>Meu perfil</h1>
      <p>{email}</p>
      {profile.image && (
        <img
          width="80"
          height="80"
          alt="Avatar do perfil"
          src={profile.image}
        />
      )}
      <Form method="post">
        <label>
          Nome
          <input name="name" defaultValue={profile.name} />
        </label>
        <label>
          Imagem (URL HTTPS)
          <input
            name="image"
            type="url"
            pattern="https://.+"
            defaultValue={profile.image}
          />
        </label>
        <button>Salvar perfil</button>
        <p role="status">{msg}</p>
      </Form>
    </>
  );
}
