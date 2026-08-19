import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Crown, Clock } from 'lucide-react';
import WhatsAppGroupCard from './WhatsAppGroupCard';

export function VipStatusBanner({ user, compact = false }) {
  const pending = user?.vipRequest?.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        pending
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-zinc-900/60 border-zinc-700/50'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            pending ? 'bg-amber-500/20' : 'bg-zinc-800'
          }`}
        >
          {pending ? (
            <Clock className="w-5 h-5 text-amber-400" />
          ) : (
            <Lock className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm">
            {pending ? 'Verificação VIP em análise' : 'Conta ainda não é VIP'}
          </p>
          <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
            {pending
              ? 'O Proprietário irá confirmar o teu acesso aos robôs dos casinos em breve.'
              : 'Explora o site normalmente. Os robôs de sinais só ficam disponíveis após aprovação VIP.'}
          </p>
          {!compact && (
            <Link
              to="/Support"
              className="inline-block mt-2 text-emerald-400 text-xs font-bold hover:underline"
            >
              Suporte WhatsApp →
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function VipLockedPanel({ title = 'Robôs dos casinos' }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
        <Crown className="w-8 h-8 text-amber-400/80" />
      </div>
      <div>
        <p className="text-white font-black text-sm uppercase tracking-wide">{title}</p>
        <p className="text-zinc-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
          Área exclusiva VIP. Após o Proprietário aprovar a tua conta, terás acesso completo aos
          robôs e sinais ao vivo.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
        <Lock className="w-3.5 h-3.5" />
        Aguarda verificação VIP
      </div>
      <div className="pt-2">
        <WhatsAppGroupCard
          compact
          title="Precisas de ajuda ou VIP?"
          description="Entra no grupo WhatsApp oficial para suporte e pedido de acesso VIP."
          buttonLabel="Grupo WhatsApp — Sense Bot"
          showHint={false}
        />
      </div>
    </div>
  );
}
