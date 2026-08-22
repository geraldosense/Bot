import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  Crown,
  Lock,
  MessageCircle,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import SenseBotLogo from './SenseBotLogo';
import BottomNav from './BottomNav';
import { VipStatusBanner } from './VipLockedPanel';

const JOURNEY = [
  {
    id: 'register',
    title: 'Conta criada',
    desc: 'Já tens acesso à plataforma Sense Bot.',
    done: true,
  },
  {
    id: 'request',
    title: 'Pedir acesso VIP',
    desc: 'Solicita aprovação ao Proprietário para desbloquear os robôs dos casinos.',
    done: false,
  },
  {
    id: 'approve',
    title: 'Aprovação do Proprietário',
    desc: 'O Proprietário confirma a tua conta VIP.',
    done: false,
  },
  {
    id: 'unlock',
    title: 'Robôs desbloqueados',
    desc: 'Passas a ver sinais ao vivo, histórico e placar real.',
    done: false,
    highlight: true,
  },
];

const HIGHLIGHTS = [
  {
    icon: Bot,
    title: 'IA Evolution Bac Bo',
    desc: 'Sinais em tempo real da mesa oficial — entrada confirmada, gales e resultado.',
  },
  {
    icon: TrendingUp,
    title: 'Placar & histórico',
    desc: 'Acompanha GREEN/LOSS do dia, assertividade e cada entrada do robô.',
  },
  {
    icon: Radio,
    title: 'Conexão ao vivo',
    desc: 'WebSocket VIP — recebes sinais no exacto momento em que a IA confirma.',
  },
  {
    icon: Shield,
    title: 'Gestão responsável',
    desc: 'Ferramentas de simulador e banca para jogares com disciplina.',
  },
];

const VIP_UNLOCKS = [
  'Robô Bac Bo ao vivo',
  'Histórico completo de entradas',
  'Catalogador de mesa',
  'Alertas GREEN / LOSS',
  'Placar IA do dia',
  'Novos jogos em prioridade',
];

const COMING_GAMES = [
  { name: 'Bac Bo', tag: 'VIP', hot: true, pct: '95%' },
  { name: 'Football Studio', tag: 'Em breve', hot: true, pct: '92%' },
  { name: 'Aviator', tag: 'Em breve', pct: '88%' },
  { name: 'Roleta', tag: 'Em breve', pct: '90%' },
];

function StepIcon({ step, index, vipPending }) {
  if (step.done) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      </div>
    );
  }
  if (vipPending && step.id === 'approve') {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5 text-amber-400" />
      </div>
    );
  }
  if (step.highlight) {
    return (
      <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
        <Crown className="w-5 h-5 text-amber-400" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
      <span className="text-zinc-500 text-xs font-black">{index + 1}</span>
    </div>
  );
}

export default function MemberDashboard({ user }) {
  const vipPending = user?.vipRequest?.status === 'pending';
  const firstName = user?.name?.split(' ')[0] || 'Membro';

  const journeyWithState = JOURNEY.map((step) => {
    if (step.id === 'register') return { ...step, done: true };
    if (vipPending && step.id === 'request') return { ...step, done: true };
    if (vipPending && step.id === 'approve') return { ...step, active: true };
    if (!vipPending && step.id === 'request') return { ...step, active: true };
    return step;
  });

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <div
        className="relative overflow-hidden py-5 px-4 border-b border-indigo-500/20"
        style={{
          background: 'linear-gradient(135deg, #312E81 0%, #4C1D95 50%, #1E1B4B 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="max-w-lg mx-auto flex items-center justify-between relative">
          <SenseBotLogo variant="header" className="h-16 w-16 sm:h-20 sm:w-20" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-900/50 text-zinc-300 border border-zinc-600/50">
            <Lock className="w-3 h-3" />
            Membro
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/80 via-zinc-950/90 to-zinc-950 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
                Bem-vindo
              </p>
              <h1 className="text-white font-black text-xl mt-0.5">Olá, {firstName}</h1>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                Estás na área de membros. Aqui explicamos como funciona o Sense Bot e o caminho
                até desbloqueares os robôs VIP dos casinos.
              </p>
            </div>
          </div>
        </motion.div>

        <VipStatusBanner user={user} />

        {/* Jornada — sequência importante */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-white font-black text-sm uppercase tracking-wide">
              O teu caminho até VIP
            </h2>
          </div>

          <div className="space-y-0">
            {journeyWithState.map((step, index) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon step={step} index={index} vipPending={vipPending} />
                  {index < journeyWithState.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full ${
                        step.done ? 'bg-emerald-500/40' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-5 flex-1 min-w-0 ${index === journeyWithState.length - 1 ? 'pb-0' : ''}`}>
                  <p
                    className={`font-bold text-sm ${
                      step.highlight ? 'text-amber-300' : step.active ? 'text-amber-200' : 'text-white'
                    }`}
                  >
                    {step.title}
                    {step.active && (
                      <span className="ml-2 text-[9px] font-black uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                        Agora
                      </span>
                    )}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* O que é */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-white font-black text-sm uppercase tracking-wide mb-3 px-0.5">
            O que é o Sense Bot?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Desbloqueias com VIP */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 to-zinc-950 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-amber-200 font-black text-sm uppercase tracking-wide">
              Com VIP desbloqueias
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VIP_UNLOCKS.map((label) => (
              <li
                key={label}
                className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/60 rounded-lg px-3 py-2 border border-zinc-800/80"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-zinc-600 text-[10px] mt-3 text-center">
            Após aprovação, o teu Dashboard muda automaticamente para o painel VIP completo.
          </p>
        </motion.section>

        {/* Jogos — preview sem robô */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-black text-sm uppercase tracking-wide mb-3 px-0.5">
            Robôs disponíveis
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {COMING_GAMES.map((game) => (
              <div
                key={game.name}
                className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 overflow-hidden"
              >
                {game.hot && (
                  <span className="absolute top-2 right-2 text-[7px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    HOT
                  </span>
                )}
                <p className="text-white font-bold text-xs pr-8">{game.name}</p>
                <p className="text-emerald-500/80 text-[10px] font-bold mt-1">{game.pct}</p>
                <span
                  className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    game.tag === 'VIP'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {game.tag}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTAs finais */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Link
            to="/Support"
            className="flex items-center justify-between gap-3 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3.5 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Centro de ajuda</p>
                <p className="text-zinc-500 text-xs">Tutoriais, FAQ e guias dos jogos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>

          <Link
            to="/Profile"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-sm font-bold hover:bg-emerald-950/50 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Verificar se já sou VIP
          </Link>
        </motion.div>

        <p className="text-center text-zinc-600 text-[10px] leading-relaxed px-2 pb-2">
          Sense Bot é uma ferramenta de análise — não garante lucros. Joga com responsabilidade.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
