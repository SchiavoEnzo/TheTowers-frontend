import { redirect } from "react-router";

export async function api(path, method = "GET", body) {
  const token = sessionStorage.getItem("torres.session");
  const publicRoute = ["auth/login", "auth/register"].includes(path);
  if (!publicRoute && !token) throw redirect("/");
  const headers = {};
  if (token && !publicRoute) headers.Authorization = "Bearer " + token;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch("/api/" + path, {
    method,
    headers,
    body: body && JSON.stringify(body),
  });
  if (!publicRoute && response.status === 401) {
    sessionStorage.removeItem("torres.session");
    throw redirect("/");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null)
    throw new Error(data?.error || "Não foi possível consultar a API.");
  return data;
}
export const catalogs = {
  agents: "Agentes",
  threats: "Ameaças",
  campaigns: "Campanhas",
  homebrews: "Homebrew",
};
export function checkKind(kind) {
  if (!Object.hasOwn(catalogs, kind))
    throw new Response("Arquivo desconhecido", { status: 404 });
}
export function recordName(data) {
  return data.caractheristics?.name || data.name || "Sem nome";
}
