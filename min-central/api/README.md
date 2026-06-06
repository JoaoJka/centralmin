# CentralMin API

Backend Express com Firebase Realtime Database para o frontend em `web`.

## Configuracao

1. Copie `.env.example` para `.env`.
2. Ajuste `ALLOWED_ORIGIN` para a origem real do frontend.
3. Rode:

```bash
npm install
npm run dev
```

Por padrao, a API sobe em `http://localhost:4000` e o web deve usar:

```env
VITE_API_URL=http://localhost:4000
```

## Firebase

Este backend usa o Firebase Web SDK com Realtime Database. A chave `FIREBASE_API_KEY` identifica o projeto Firebase, mas nao deve ser tratada como senha. A protecao real vem de:

- regras do Realtime Database no console Firebase;
- frontend acessando dados pela API em vez de escrever direto no banco;
- CORS restrito, rate limit, validacao de entrada e respostas de erro sem stack trace.

Rotas disponiveis:

- `GET /health`
- `GET|POST /funcoes`
- `PUT|DELETE /funcoes/:id`
- `GET|POST /escalas`
- `PUT|DELETE /escalas/:id`
- `GET|POST /members`
- `PUT|DELETE /members/:id`
- `GET|PUT /config`
