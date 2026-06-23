import { createClient } from '@supabase/supabase-js';

// ── Trage deine Werte aus: Supabase Dashboard → Settings → API ──
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Fehlende Supabase-Umgebungsvariablen.\n' +
    'Erstelle eine .env Datei mit:\n' +
    '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=dein-anon-key'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ── Hilfsfunktionen ──────────────────────────────────────────

/** Alle Spiele mit Statistiken laden */
export async function fetchGames({ category = null, search = '', limit = 60, offset = 0 } = {}) {
  let query = supabase
    .from('game_stats')
    .select('*')
    .order('online_players', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (search)   query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Featured / Trending Spiele */
export async function fetchFeaturedGames(limit = 20) {
  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('is_featured', true)
    .order('online_players', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Ein einzelnes Spiel */
export async function fetchGame(id) {
  const { data, error } = await supabase
    .from('game_stats')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** Profil laden */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/** Profil aktualisieren */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Spiel starten (Session öffnen) */
export async function startGameSession(gameId, userId) {
  const { error } = await supabase
    .from('game_sessions')
    .upsert({ game_id: gameId, user_id: userId, ended_at: null }, { onConflict: 'game_id,user_id' });
  if (error) throw error;
}

/** Spiel beenden (Session schließen) */
export async function endGameSession(gameId, userId) {
  const { error } = await supabase
    .from('game_sessions')
    .update({ ended_at: new Date().toISOString() })
    .match({ game_id: gameId, user_id: userId });
  if (error) throw error;
}

/** Like togglen */
export async function toggleLike(gameId, userId) {
  const { data: existing } = await supabase
    .from('game_likes')
    .select('game_id')
    .match({ game_id: gameId, user_id: userId })
    .maybeSingle();

  if (existing) {
    await supabase.from('game_likes').delete().match({ game_id: gameId, user_id: userId });
    return false;
  } else {
    await supabase.from('game_likes').insert({ game_id: gameId, user_id: userId });
    return true;
  }
}

/** Bewertung abgeben */
export async function rateGame(gameId, userId, stars) {
  const { error } = await supabase
    .from('game_ratings')
    .upsert({ game_id: gameId, user_id: userId, stars }, { onConflict: 'game_id,user_id' });
  if (error) throw error;
}

/** Prüfen ob User ein Spiel geliked hat */
export async function checkUserLike(gameId, userId) {
  const { data } = await supabase
    .from('game_likes')
    .select('game_id')
    .match({ game_id: gameId, user_id: userId })
    .maybeSingle();
  return !!data;
}

/** Spiel erstellen */
export async function createGame(gameData, creatorId) {
  const { data, error } = await supabase
    .from('games')
    .insert({ ...gameData, creator_id: creatorId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Realtime: Online-Spieler für ein Spiel beobachten */
export function subscribeToOnlinePlayers(gameId, callback) {
  return supabase
    .channel(`game-players-${gameId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_sessions',
      filter: `game_id=eq.${gameId}`,
    }, callback)
    .subscribe();
}
