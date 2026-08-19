import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ChevronRight,
  Dice5,
  Crown,
  Shield,
  Zap,
  HelpCircle,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import WhatsAppGroupCard from '../components/WhatsAppGroupCard';
import SenseBotLogo from '../components/SenseBotLogo';

const TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'jogos', label: 'Bac Bo' },
];

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
    a: 'Usa o botão verde do WhatsApp acima. A comunidade Sense Bot responde pedidos de VIP e dúvidas técnicas.',
  },
];

const FAQ_JOGOS = [
  {
    icon: Dice5,
    q: 'Bac Bo — O que significam os sinais?',
    a: 'A IA analisa a mesa Evolution Bac Bo em tempo real. Quando identifica um padrão válido, envia ENTRADA CONFIRMADA com a cor recomendada (Azul, Vermelho ou Empate).',
  },
  {
    icon: Zap,
    q: 'O que são os gales?',
    a: 'Após falhar a entrada inicial, o robô entra em modo gale (1°, 2° e 3°) mantendo a mesma cor. As barras só acendem depois da primeira falha.',
  },
  {
    icon: Dice5,
    q: 'Histórico — Aposta e Seq',
    a: 'Aposta: cor que o robô recomendou. Seq: últimas 3 cores reais da mesa antes da entrada. As esferas ao lado do GREEN/RED mostram o que saiu em cada rodada da jogada.',
  },
];

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

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
            <p className="px-4 pb-4 pt-0 text-zinc-400 text-xs leading-relaxed border-t border-zinc-800/60 mx-4 pt-3">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Support() {
  const [tab, setTab] = useState('geral');
  const faq = tab === 'geral' ? FAQ_GERAL : FAQ_JOGOS;

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden">
      {/* Fundo Sense Bot — diferente do MoneyTix (cyan/emerald vs amarelo) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(6, 78, 120, 0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 40%), linear-gradient(180deg, #050a12 0%, #030303 45%, #000 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-6 pt-2">
          <SenseBotLogo className="mx-auto h-8 w-auto opacity-90 mb-4" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-3">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
              Suporte Sense Bot
            </span>
          </div>
          <h1 className="text-xl font-black text-white">Precisas de ajuda rápida?</h1>
          <p className="text-zinc-500 text-xs mt-1.5 max-w-xs mx-auto">
            Comunidade oficial no WhatsApp — respostas da equipa e pedidos VIP
          </p>
        </div>

        <div className="mb-7">
          <WhatsAppGroupCard
            title="Grupo WhatsApp Sense Bot"
            description="Entra na comunidade para suporte, avisos de sinais e aprovação VIP."
            buttonLabel="Suporte WhatsApp"
          />
        </div>

        {/* Central de Ajuda */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-zinc-800/60">
            <h2 className="text-white font-black text-sm tracking-wide">Central de Ajuda</h2>
            <p className="text-zinc-600 text-[10px] mt-0.5">Perguntas frequentes</p>
          </div>

          {/* Tabs — estilo MoneyTix mas cores Sense Bot */}
          <div className="flex gap-2 p-3 border-b border-zinc-800/40">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-2">
            {faq.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} />
            ))}
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[10px] mt-6">
          Sense Bot · Evolution Bac Bo · Dados em tempo real
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
