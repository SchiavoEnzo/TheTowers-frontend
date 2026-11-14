# The Towers · Frontend

Interface do Arquivo de Campo, separada do backend `TheTowers`. Usa Next.js e React Router e mantém as telas de cadastro/login, central, agentes, campanhas, mesa, ameaças, homebrews e perfil.

## Executar

Use Node.js 24.x. Inicie o backend na porta 3000 e, neste repositório:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3001. A interface pode abrir sem banco; autenticação e operações de jogo exigem o backend conectado ao MongoDB.

## Comunicação com a API

Configure `BACKEND_URL` com a origem do backend, por exemplo `http://localhost:3000` ou `https://api.example.com`, sem `/api`. O padrão local é a porta 3000. O servidor Next.js encaminha `/api/:path*` para o backend antes da rota de telas. O cliente mantém URLs relativas e envia o token Bearer, sem precisar de CORS no navegador.

Não configure MongoDB nem copie segredos do backend para este repositório. O frontend depende apenas da API HTTP; não importa arquivos do outro repositório.

## Estrutura

- `pages/`: entrada Next.js, estilos globais e acesso direto às telas.
- `ui/`: navegação React Router, telas, estilos e cliente HTTP.
- `examples/agent.json`: modelo local usado pelo formulário e pela mesa. Mantenha compatível com os contratos do backend.
- `next.config.mjs`: encaminhamento de `/api` para `BACKEND_URL`.

## Produção

Configure `BACKEND_URL` com a origem HTTPS do backend **antes do build** e execute:

```sh
npm run build
npm start
```

O servidor local de produção usa a porta 3001. Para outra porta, execute `npx next start --port 4000`.
Publique este repositório como um projeto Next.js separado. Alterar `BACKEND_URL` requer novo build/deploy. O encaminhamento exige um servidor Next.js; exportação estática não é suportada por esta configuração.

Após iniciar os dois projetos, valide cadastro/login, edição de perfil, criação de agente/campanha e rolagem na mesa. Recarregue uma URL interna para conferir o acesso direto às telas.
