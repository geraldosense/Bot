# Publicar o Sense Bot na internet (qualquer telemóvel)

## Porque `seven.vercel.app` não funciona

A **Vercel** só publica páginas estáticas. O Sense Bot precisa de:

- **API** (`/api/auth/login`, registo, admin…)
- **WebSocket** (sinais da IA ao vivo)
- **Servidor Node.js** sempre ligado

Por isso o login no telemóvel dava **404 NOT_FOUND** — a página abria, mas a API não existia na Vercel.

## Solução: Render.com (grátis)

Um único link público serve **tudo** (site + API + IA), como qualquer site normal.

### Passo a passo

1. **GitHub** — garante que o código está em https://github.com/geraldosense/Bot (já está)

2. **Render** — entra em https://render.com e regista-te (podes usar conta GitHub)

3. **New → Blueprint** — escolhe o repositório `geraldosense/Bot`
   - O Render lê o ficheiro `render.yaml` automaticamente
   - Clica **Apply**

4. **Variáveis de ambiente** (no painel Render → sense-bot → Environment):
   | Variável | Valor |
   |----------|--------|
   | `SUPER_ADMIN_EMAIL` | teu email (Chef Máximo) |
   | `SUPER_ADMIN_PASSWORD` | password segura |
   | `JWT_SECRET` | string longa aleatória (ou deixa o Render gerar) |
   | `SUPABASE_URL` | (opcional) URL do casino |
   | `SUPABASE_KEY` | (opcional) chave Supabase |

5. **Deploy** — espera 3–5 minutos. Ficas com um URL tipo:
   ```
   https://sense-bot-xxxx.onrender.com
   ```

6. **Partilha no WhatsApp** — envia esse link. Funciona em **qualquer telemóvel** com internet.

### Domínio personalizado (opcional)

No Render: **Settings → Custom Domain** → podes ligar `sensebot.pt` ou similar.

### Nota sobre o plano grátis

- O site “adormece” após ~15 min sem visitas — a primeira abertura pode demorar ~30 s
- Para produção séria, usa plano pago (~7 USD/mês) para ficar sempre ligado

## Alternativa local (só mesma Wi‑Fi)

```bash
npm run go-live
```

Partilha `http://SEU_IP_LOCAL:3001/login` (ex: `http://192.168.8.152:3001/login`) — **não** uses `localhost` no WhatsApp.

## Desactivar a Vercel

Remove ou pausa o projecto `seven.vercel.app` no dashboard Vercel para evitar confusão. Usa só o URL do Render.
