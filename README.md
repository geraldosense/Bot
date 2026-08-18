# Bac Bo Bot

Fork completo inspirado no [moneytix01.com/Dashboard](https://moneytix01.com/Dashboard) com robô de análise Bac Bo em tempo real.

## Funcionalidades

- **Robô de análise** — 5 estratégias: reversão de streak, momentum, alternância, pós-empate, underdog
- **Sinais em tempo real** — estados: analyzing → confirmed → gale → result
- **Catalogador** — grid visual com histórico Player/Banker/Tie
- **Dashboard** — placar, win rate, seleção de jogos
- **WebSocket** — atualizações instantâneas
- **Proteções** — gale automático e cobertura de empate

## Instalação

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend + WebSocket: http://localhost:3001

## Produção

```bash
npm run build
npm start
```

## Autenticação e VIP

1. **Login** → `/login` (primeira página ao entrar no site)
2. **Registo** → `/register` (aderir com email)
3. **Aguardar aprovação** → admin aprova VIP manualmente
4. **Acesso IA** → só utilizadores VIP+ veem sinais

### Hierarquia

| Role | Permissões |
|------|------------|
| **member** | Conta criada, sem acesso IA |
| **vip** | Sinais + Perfil + Suporte |
| **admin** | + aprovar VIP (se autorizado) + ver IA activa |
| **super_admin** | Chef Máximo — gere admins e todas permissões |

### Chef Máximo (primeiro arranque)

Variáveis de ambiente (recomendado alterar):

```bash
SUPER_ADMIN_EMAIL=teu@email.com
SUPER_ADMIN_PASSWORD= tua_password_segura
JWT_SECRET=chave-secreta-longa
```

Por defeito na primeira execução: `senseoliveira6@gmail.com` / `12sense12`

### Painel Admin

- `/Admin` — aprovar emails para VIP
- Ver **quantos utilizadores estão a usar a IA** em tempo real
- Chef Máximo pode promover admins e definir quem pode aprovar VIP

## Configuração casino

Variáveis de ambiente opcionais:

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | 3001 | Porta do servidor |
| `DATA_MODE` | casino | Sempre Evolution (Supabase) — simulador removido |
| `SUPABASE_URL` | moneytix Supabase | URL dos rounds ao vivo |
| `SUPABASE_KEY` | chave publishable | API do casino |

## Estratégias do Robô

1. **Streak Reversal** — após 3+ resultados iguais, aposta na reversão
2. **Momentum** — segue tendência quando 65%+ nos últimos 15 rounds
3. **Alternation** — detecta padrão zig-zag e continua
4. **Post Tie** — após empate, segue tendência imediata
5. **Underdog** — aposta no lado menos frequente com desequilíbrio ≥6

## Estrutura

```
server/
  analyzer.js      — motor de análise
  signalEngine.js  — gestão de sinais e gales
  dataProvider.js  — fonte de dados (simulador/supabase)
  index.js         — Express + WebSocket
src/
  pages/           — Dashboard, BacBo
  components/      — UI de sinais, catalogador, mesa
```
# Bot
