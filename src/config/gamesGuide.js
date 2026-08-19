/** Guias e tutoriais dos jogos Sense Bot */
export const SITE_GAMES_GUIDE = [
  {
    id: 'bac-bo',
    name: 'Bac Bo',
    image: '/games/bac-bo.png',
    topic: 'O que significam os sinais?',
    active: true,
    category: 'Cartas',
    content: [
      'O Bac Bo Evolution tem 3 resultados: Azul (Jogador), Vermelho (Casa) e Empate (Amarelo).',
      'ANALISANDO — a IA está a estudar a mesa. Aguarda até aparecer ENTRADA CONFIRMADA.',
      'ENTRADA CONFIRMADA — entra na cor indicada (PREVISÃO). As barras de gale ficam cinzas.',
      'GALES — só após falhar a entrada: 1°, 2° e 3° gale mantendo a mesma cor do robô.',
      'GREEN / RED — resultado final. Aposta = cor que o robô mandou. Seq = padrão da mesa.',
    ],
    tips: [
      'Entra apenas quando o robô confirmar — nunca antes do sinal ENTRADA CONFIRMADA.',
      'Usa sempre a mesma cor em todos os gales (martingale do robô).',
      'Define um limite diário de perda e para quando o atingires.',
      'Evita entrar manualmente contra o sinal do robô.',
      'Observa o histórico: Aposta mostra a cor exacta que o robô enviou.',
    ],
  },
  {
    id: 'football-studio',
    name: 'Football Studio Dice',
    image: '/games/football-studio.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Cartas',
    content: [
      'Jogo estilo futebol: Casa vs Visitante com dados Evolution.',
      'O robô analisará padrões de sequência antes de confirmar entradas.',
      'Em breve para membros VIP — segue o grupo WhatsApp para novidades.',
    ],
    tips: [
      'Aguarda o lançamento oficial antes de apostar com o robô.',
      'Enquanto isso, pratica gestão de banca no Bac Bo.',
    ],
  },
  {
    id: 'aviator',
    name: 'Aviator',
    image: '/games/aviator.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Crash',
    content: [
      'Crash game — multiplicador sobe até o avião partir.',
      'O módulo Aviator terá sinais de saída baseados em padrões estatísticos.',
      'VIP terá acesso prioritário quando estiver activo.',
    ],
    tips: [
      'Nunca persigas perdas — define meta de ganho e stop loss.',
      'Crash exige disciplina: segue só sinais confirmados pelo robô.',
    ],
  },
  {
    id: 'roulette',
    name: 'Roleta',
    image: '/games/roleta.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Roleta',
    content: [
      'Roleta Evolution com zonas quentes/frias e tendências.',
      'Robô em desenvolvimento para sinais de cor/setor.',
      'Membros VIP serão avisados no WhatsApp quando lançar.',
    ],
    tips: [
      'Roleta requer paciência — evita apostas impulsivas entre rondas.',
      'Combina apenas estratégias validadas pelo Sense Bot.',
    ],
  },
];

export const PLAYING_TUTORIALS = [
  {
    id: 'start',
    title: 'Como começar com o Sense Bot',
    icon: 'play',
    steps: [
      'Regista-te no site e entra no grupo WhatsApp oficial.',
      'Aguarda aprovação VIP pelo Proprietário.',
      'Abre Sinais → Bac Bo com conta VIP activa.',
      'Lê ENTRADA CONFIRMADA e entra na cor PREVISÃO.',
      'Acompanha gales só se o robô activar após falha da entrada.',
    ],
  },
  {
    id: 'bankroll',
    title: 'Gestão de banca (melhor prática)',
    icon: 'wallet',
    steps: [
      'Define um valor máximo por sessão — nunca uses dinheiro que não podes perder.',
      'Divide a banca em unidades (ex: 1% por entrada).',
      'Após 3 RED seguidos, faz pausa e analisa o mercado.',
      'Não aumentes apostas manualmente fora do plano do robô.',
      'Regista resultados no histórico do site para avaliar desempenho.',
    ],
  },
  {
    id: 'gales',
    title: 'Sistema de gales — como jogar',
    icon: 'layers',
    steps: [
      'Entrada inicial NÃO é gale — é a primeira aposta confirmada.',
      'Se falhar, o robô entra no 1° GALE (mesma cor).',
      'Máximo 3 gales após falha da entrada.',
      'Barras no ecrã só acendem depois da primeira falha.',
      'GREEN em qualquer tentativa = vitória. RED final = perda total da sequência.',
    ],
  },
  {
    id: 'history',
    title: 'Ler o histórico correctamente',
    icon: 'history',
    steps: [
      'GREEN / RED = resultado final do robô.',
      'Aposta = cor exacta que o robô mandou entrar.',
      'Seq = últimas 3 cores reais da mesa antes da entrada.',
      'Esferas ao lado = tentativas (entrada + gales) na cor apostada.',
      'Horário com segundos — cada linha é uma jogada única do robô.',
    ],
  },
];
