-- SenseSpot — histórico próprio do robô Sense Bot (separado das contas e do feed externo)
-- Executar no SQL Editor do teu projecto Supabase (SUPABASE_URL)

CREATE TABLE IF NOT EXISTS public.sense_spot_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id TEXT NOT NULL UNIQUE,
  game_id TEXT NOT NULL DEFAULT 'bac_bo',
  result TEXT NOT NULL CHECK (result IN ('green', 'loss')),
  entry_bet TEXT NOT NULL,
  bet_recommendation TEXT,
  result_value TEXT,
  sequence TEXT,
  entry_condition TEXT,
  current_gale INT NOT NULL DEFAULT 0,
  max_gales INT NOT NULL DEFAULT 3,
  tie_protection BOOLEAN NOT NULL DEFAULT false,
  scoreboard_green INT NOT NULL DEFAULT 0,
  scoreboard_red INT NOT NULL DEFAULT 0,
  win_rate NUMERIC,
  played_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sense_spot_plays_game_day_idx
  ON public.sense_spot_plays (game_id, played_at DESC);

CREATE INDEX IF NOT EXISTS sense_spot_plays_signal_id_idx
  ON public.sense_spot_plays (signal_id);

ALTER TABLE public.sense_spot_plays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "server_only" ON public.sense_spot_plays;
CREATE POLICY "server_only" ON public.sense_spot_plays FOR ALL USING (false);
