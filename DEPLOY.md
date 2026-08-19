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

4. **Variáveis de ambiente** (Render → sense-bot → Environment):

   | Variável | Valor |
   |----------|--------|
   | `SUPER_ADMIN_EMAIL` | teu email |
   | `SUPER_ADMIN_PASSWORD` | password segura |
   | `SUPABASE_URL` | `https://btyescbddoopbbuacyhd.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave **service_role** do Supabase (Settings → API) |

5. **Criar tabela de contas** (uma vez só):
   - Supabase Dashboard → **SQL Editor** → New query
   - Copia o conteúdo de `supabase/sense_bot_users.sql` e clica **Run**

6. **Deploy** — Manual sync no Render
   ```
   https://sense-bot-xxxx.onrender.com
   ```

6. **Partilha no WhatsApp** — envia esse link. Funciona em **qualquer telemóvel** com internet.

### Domínio personalizado (opcional)

No Render: **Settings → Custom Domain** → podes ligar `sensebot.pt` ou similar.

### Contas persistentes

As contas ficam guardadas na **base de dados Supabase** (`sense_bot_users`), não num ficheiro temporário. Assim, reinícios do Render **não apagam** utilizadores registados.

Verificar ligação localmente: `npm run db:check`

### Nota sobre o plano grátis Render

## Alternativa local (só mesma Wi‑Fi)

```bash
npm run go-live
```

Partilha `http://SEU_IP_LOCAL:3001/login` (ex: `http://192.168.8.152:3001/login`) — **não** uses `localhost` no WhatsApp.

## Desactivar a Vercel

Remove ou pausa o projecto `seven.vercel.app` no dashboard Vercel para evitar confusão. Usa só o URL do Render.
