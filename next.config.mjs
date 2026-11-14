const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
const origin = new URL(backendUrl);
if (!["http:", "https:"].includes(origin.protocol) || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error("BACKEND_URL deve ser uma origem HTTP(S), sem /api, credenciais, query ou fragmento.");
}

export default {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${origin.origin}/api/:path*` },
      ],
    };
  },
};
