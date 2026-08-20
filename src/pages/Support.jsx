import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ChevronRight,
  Crown,
  Shield,
  HelpCircle,
  Gamepad2,
  Clock,
  BookOpen,
  Layers,
  Wallet,
  History,
  Play,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import WhatsAppGroupCard from '../components/WhatsAppGroupCard';
import { SITE_GAMES_GUIDE, PLAYING_TUTORIALS } from '../config/gamesGuide';

const TUTORIAL_ICONS = {
  play: Play,
  wallet: Wallet,
  layers: Layers,
  history: History,
};

const FAQ_GERAL = [
  {
    icon: Crown,
    q: 'Como me torno VIP?',
    a: 'Regista-te no site, entra no grupo WhatsApp oficial e aguarda que o Proprietário aprove o teu acesso VIP.',
  },
  {
    icon: Shield,
    q: 'Os sinais são 100% garantidos?',
    a: 'Não. São ferramentas de análise baseadas em dados reais do casino Evolution. Joga sempre com responsabilidade.',
  },
  {
    icon: HelpCircle,
    q: 'Como contactar o suporte?',
    a: 'Usa o botão Suporte WhatsApp. A mensagem é preenchida automaticamente — basta seleccionar o grupo Sense Bot e enviar.',
  },
];

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="flex-1 text-white text-sm font-semibold leading-snug">{item.q}</span>
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-zinc-400 text-xs leading-relaxed border-t border-zinc-800/60 mx-4 pt-3">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameGuideItem({ game, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-zinc-700/80 bg-zinc-800">
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug truncate">
            {game.name}
            <span className="text-zinc-500 font-normal"> — {game.topic}</span>
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-600">{game.category}</span>
            {game.active ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVO
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                EM BREVE
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-4 mx-3 pt-2 space-y-2 border-t border-zinc-800/60">
              {game.content.map((line) => (
                <li key={line} className="flex gap-2 text-zinc-400 text-xs leading-relaxed">
                  <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
              {game.tips?.length > 0 && (
                <>
                  <li className="pt-2 text-[10px] font-black uppercase tracking-wider text-emerald-400/90">
                    Melhores opções ao jogar
                  </li>
                  {game.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-zinc-400 text-xs leading-relaxed">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TutorialItem({ tutorial, index }) {
  const [open, setOpen] = useState(false);
  const Icon = TUTORIAL_ICONS[tutorial.icon] || BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="flex-1 text-white text-sm font-semibold leading-snug">{tutorial.title}</span>
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-4 pb-4 mx-3 pt-2 space-y-2 border-t border-zinc-800/60 list-none"
          >
            {tutorial.steps.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-zinc-400 text-xs leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Support() {
  const [tab, setTab] = useState('jogos');

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(6, 78, 120, 0.3) 0%, transparent 55%), linear-gradient(180deg, #050a12 0%, #030303 50%, #000 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Suporte</h1>
            <p className="text-zinc-500 text-xs">Estamos aqui para ajudar</p>
          </div>
        </div>

        {/* Caixa de contacto rápido */}
        <div
          className="relative overflow-hidden rounded-2xl border border-cyan-500/20 p-4 mb-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(6, 78, 120, 0.25) 0%, rgba(9, 9, 11, 0.9) 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/60 border border-zinc-700/60 mb-3">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                Atendimento 24/7
              </span>
            </div>

            <p className="text-white font-black text-base mb-1">Precisas de ajuda rápida?</p>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
              Contacta-nos pelo WhatsApp para suporte instantâneo e pedidos VIP.
            </p>

            <WhatsAppGroupCard
              mode="support"
              variant="inline"
              buttonLabel="Suporte WhatsApp"
              showHint
            />
          </div>
        </div>

        {/* Central de Ajuda */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <h2 className="text-white font-black text-sm tracking-wide">Central de Ajuda</h2>
          </div>

          <div className="flex gap-1.5 px-3 pb-3 overflow-x-auto">
            {[
              { id: 'geral', label: 'Geral' },
              { id: 'jogos', label: 'Jogos', icon: Gamepad2 },
              { id: 'tutoriais', label: 'Tutoriais', icon: BookOpen },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[88px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                }`}
              >
                {t.icon && <t.icon className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-3 pb-3 space-y-2">
            {tab === 'geral' &&
              FAQ_GERAL.map((item, i) => <FaqItem key={item.q} item={item} index={i} />)}
            {tab === 'jogos' &&
              SITE_GAMES_GUIDE.map((game, i) => (
                <GameGuideItem key={game.id} game={game} index={i} />
              ))}
            {tab === 'tutoriais' &&
              PLAYING_TUTORIALS.map((tutorial, i) => (
                <TutorialItem key={tutorial.id} tutorial={tutorial} index={i} />
              ))}
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[10px] mt-6">
          Sense Bot · {SITE_GAMES_GUIDE.filter((g) => g.active).length} jogo activo · Dados em tempo
          real
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
