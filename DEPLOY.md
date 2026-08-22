# Publicar o Sense Bot na internet

O Sense Bot pode correr na **Vercel** (recomendado) ou no **Render**. Ambos servem site + API num único URL.

---

## Vercel (recomendado)

A Vercel serve o frontend estático e a API como funções serverless. Os sinais VIP usam **polling** (pedidos a cada 3 s) em vez de WebSocket — funciona igual para o utilizador.

### Passo a passo

1. **GitHub** — código em https://github.com/geraldosense/Bot

2. **Vercel** — https://vercel.com → **Add New → Project** → importa o repo `geraldosense/Bot`

3. **Configuração** (a Vercel lê `vercel.json` automaticamente):
   - Framework: **Other**
   - Build: `npm run build`
   - Output: `dist`

4. **Variáveis de ambiente** (Settings → Environment Variables):

   | Variável | Valor |
   |----------|--------|
   | `JWT_SECRET` | string longa aleatória |
   | `SUPER_ADMIN_EMAIL` | teu email |
   | `SUPER_ADMIN_PASSWORD` | password segura |
   | `SUPABASE_URL` | URL do Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave **service_role** |
   | `CASINO_SUPABASE_URL` | URL Supabase do casino |
   | `SUPABASE_KEY` | chave do casino (se diferente) |
   | `VITE_SIGNAL_MODE` | `poll` |

5. **SQL no Supabase** (uma vez):
   - `supabase/sense_bot_users.sql` — contas
   - `supabase/sense_spot_plays.sql` — histórico SenseSpot

6. **Deploy** — cada push para `main` faz deploy automático.

URL exemplo: `https://sense-bot.vercel.app`

### Notas Vercel

- **Sem suspensão por tráfego externo** como no Render Free
- Plano Hobby grátis — limites de invocações serverless são generosos para este uso
- Histórico persistente fica no **Supabase** (`sense_spot_plays`), não no disco do servidor
- Admin → “utilizadores IA activos” depende de WebSocket no Render; na Vercel usa presença via login

---

## Render (alternativa)

Servidor Node.js sempre ligado + WebSocket em tempo real.

Ver `render.yaml` e https://dashboard.render.com

**Atenção:** plano Free pode suspender por horas esgotadas ou tráfego externo (polling casino a cada 3 s).

---

## Local (desenvolvimento)

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
API + WebSocket: http://localhost:3001

---

## Mesma Wi‑Fi (sem cloud)

```bash
npm run go-live
```

Partilha `http://SEU_IP:3001/login` — não uses `localhost` no WhatsApp.

---

## Verificar base de dados

```bash
npm run db:check
```
