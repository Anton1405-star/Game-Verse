import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/AuthModal';
import {
  fetchGames, fetchFeaturedGames,
  toggleLike, checkUserLike,
  startGameSession, endGameSession,
  rateGame,
} from './lib/supabase';

// ── Hilfsfunktionen ─────────────────────────────────────────
function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const CATEGORIES = ['Action','Tycoon','Horror','Racing','Puzzle','Roleplay','Adventure','Simulator'];
const EMOJI_MAP  = { Action:'⚔️', Tycoon:'🏗️', Horror:'👻', Racing:'🏎️', Puzzle:'🧩', Roleplay:'🎭', Adventure:'🌊', Simulator:'🎯' };

// ── GameCard ─────────────────────────────────────────────────
function GameCard({ game, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(game)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 160, flexShrink: 0, cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'transform 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', height: 120, borderRadius: 10,
        background: `linear-gradient(135deg, ${game.color_from || '#6C63FF'}, ${game.color_to || '#9B59B6'})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, position: 'relative', overflow: 'hidden',
        border: hovered ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
        boxSizing: 'border-box',
      }}>
        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          {EMOJI_MAP[game.category] || '🎮'}
        </span>
        {game.is_featured && (
          <div style={{
            position: 'absolute', top: 6, left: 6, background: '#FF6B35',
            borderRadius: 4, fontSize: 9, fontWeight: 700, color: '#fff', padding: '2px 5px',
          }}>🔥 HOT</div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          padding: '16px 8px 6px', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ color: '#FFD700', fontSize: 10 }}>★</span>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>
            {game.avg_rating > 0 ? Number(game.avg_rating).toFixed(1) : '—'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginLeft: 4 }}>
            {formatNumber(game.online_players)} online
          </span>
        </div>
      </div>
      <div style={{ marginTop: 6, padding: '0 2px' }}>
        <div style={{
          color: '#E0E0FF', fontSize: 12, fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{game.name}</div>
        <div style={{ color: '#7070A0', fontSize: 10, marginTop: 2 }}>
          {formatNumber(game.visits)} Besuche
        </div>
      </div>
    </div>
  );
}

// ── CategoryRow ──────────────────────────────────────────────
function CategoryRow({ label, games, onGameClick }) {
  const ref = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 500, behavior: 'smooth' });
  const onScroll = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 0);
    setCanRight(ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 5);
  };

  if (!games.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ color: '#E0E0FF', fontSize: 18, fontWeight: 700, margin: 0 }}>
          {EMOJI_MAP[label] || '🎮'} {label}
        </h2>
      </div>
      <div style={{ position: 'relative' }}>
        {canLeft && (
          <button onClick={() => scroll(-1)} style={{
            position: 'absolute', left: -16, top: '40%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(15,15,35,0.9)', border: '1px solid #3030A0',
            borderRadius: '50%', width: 32, height: 32, color: '#fff',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
        )}
        {canRight && (
          <button onClick={() => scroll(1)} style={{
            position: 'absolute', right: -16, top: '40%', transform: 'translateY(-50%)',
            zIndex: 10, background: 'rgba(15,15,35,0.9)', border: '1px solid #3030A0',
            borderRadius: '50%', width: 32, height: 32, color: '#fff',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        )}
        <div ref={ref} onScroll={onScroll}
          style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {games.map(g => <GameCard key={g.id} game={g} onClick={onGameClick} />)}
        </div>
      </div>
    </div>
  );
}

// ── GameModal ────────────────────────────────────────────────
function GameModal({ game, user, onClose, onRefresh }) {
  const [liked,   setLiked]   = useState(false);
  const [rating,  setRating]  = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !game) return;
    checkUserLike(game.id, user.id).then(setLiked).finally(() => setLoading(false));
  }, [game, user]);

  if (!game) return null;

  const handleLike = async () => {
    if (!user) { alert('Bitte einloggen, um zu liken!'); return; }
    const nowLiked = await toggleLike(game.id, user.id);
    setLiked(nowLiked);
    onRefresh();
  };

  const handleRate = async (stars) => {
    if (!user) { alert('Bitte einloggen, um zu bewerten!'); return; }
    setRating(stars);
    await rateGame(game.id, user.id, stars);
    onRefresh();
  };

  const handlePlay = async () => {
    if (!user) { alert('Bitte einloggen, um zu spielen!'); return; }
    setPlaying(true);
    await startGameSession(game.id, user.id);
    onRefresh();
  };

  const handleStop = async () => {
    setPlaying(false);
    await endGameSession(game.id, user.id);
    onRefresh();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,20,0.85)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12122A', border: '1px solid #2A2A60',
        borderRadius: 16, width: 480, maxWidth: '90vw', overflow: 'hidden',
      }}>
        {/* Thumbnail */}
        <div style={{
          height: 200,
          background: `linear-gradient(135deg, ${game.color_from || '#6C63FF'}, ${game.color_to || '#9B59B6'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64, position: 'relative',
        }}>
          {EMOJI_MAP[game.category] || '🎮'}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
            <div>
              <h2 style={{ color: '#E0E0FF', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{game.name}</h2>
              <span style={{
                background: 'rgba(108,99,255,0.2)', color: '#9090FF',
                fontSize: 11, padding: '3px 8px', borderRadius: 20,
              }}>{game.category}</span>
            </div>
            <button onClick={handleLike} style={{
              background: liked ? 'rgba(255,100,100,0.2)' : 'rgba(255,255,255,0.05)',
              border: liked ? '1px solid #FF6464' : '1px solid #2A2A60',
              borderRadius: 8, padding: '6px 12px', color: liked ? '#FF6464' : '#7070A0',
              cursor: 'pointer', fontSize: 12,
            }}>
              {liked ? '♥' : '♡'} {formatNumber((game.like_count || 0) + (liked ? 1 : 0))}
            </button>
          </div>

          {game.description && (
            <p style={{ color: '#8080B0', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
              {game.description}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Online',   value: formatNumber(game.online_players) },
              { label: 'Besuche',  value: formatNumber(game.visits) },
              { label: 'Bewertung', value: game.avg_rating > 0 ? `⭐ ${Number(game.avg_rating).toFixed(1)}` : '—' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ color: '#E0E0FF', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: '#6060A0', fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Star rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ color: '#6060A0', fontSize: 12 }}>Bewerten:</span>
            {[1,2,3,4,5].map(s => (
              <span key={s} onClick={() => handleRate(s)} style={{
                fontSize: 20, cursor: 'pointer', opacity: s <= rating ? 1 : 0.3,
                transition: 'opacity 0.15s',
              }}>⭐</span>
            ))}
          </div>

          {/* Play button */}
          {!playing ? (
            <button onClick={handlePlay} style={{
              width: '100%', background: 'linear-gradient(135deg, #6C63FF, #9B59B6)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 16, fontWeight: 700, padding: 14, cursor: 'pointer',
            }}>▶ Spielen</button>
          ) : (
            <button onClick={handleStop} style={{
              width: '100%', background: '#1A3A1A', border: '1px solid #2A8A2A',
              borderRadius: 10, color: '#43E97B', fontSize: 16, fontWeight: 700,
              padding: 14, cursor: 'pointer',
            }}>⏹ Spiel beenden</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Haupt-App ────────────────────────────────────────────────
export default function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [search, setSearch]   = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [featured, setFeatured]   = useState([]);
  const [byCategory, setByCategory] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 60;

  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    try {
      const [feat, ...catResults] = await Promise.all([
        fetchFeaturedGames(20),
        ...CATEGORIES.map(cat => fetchGames({ category: cat, limit: 20 })),
      ]);
      setFeatured(feat);
      const map = {};
      CATEGORIES.forEach((cat, i) => { map[cat] = catResults[i]; });
      setByCategory(map);
    } catch (e) {
      console.error('Fehler beim Laden der Spiele:', e);
    } finally {
      setLoadingGames(false);
    }
  }, []);

  useEffect(() => { loadGames(); }, [loadGames]);

  // Suche & Filter
  useEffect(() => {
    if (!search && activeTag === 'All') return;
    const run = async () => {
      const results = await fetchGames({
        category: activeTag !== 'All' ? activeTag : null,
        search,
        limit: page * LIMIT,
      });
      setSearchResults(results);
    };
    run();
  }, [search, activeTag, page]);

  const isFiltering = search || activeTag !== 'All';
  const totalOnline = featured.reduce((s, g) => s + (g.online_players || 0), 0);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6C63FF', fontSize: 32 }}>🎮</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A1E', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(10,10,30,0.95)', borderBottom: '1px solid #1A1A50',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 24 }}>🎮</span>
            <span style={{ color: '#E0E0FF', fontSize: 20, fontWeight: 800 }}>
              Game<span style={{ color: '#6C63FF' }}>Verse</span>
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5050A0' }}>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Spiele suchen..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: '1px solid #2A2A60',
                borderRadius: 8, padding: '8px 12px 8px 36px',
                color: '#E0E0FF', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#E0E0FF', fontSize: 13, fontWeight: 600 }}>{profile?.username || user.email}</div>
                <div style={{ color: '#6060A0', fontSize: 11 }}>Level {profile?.level || 1}</div>
              </div>
              <button onClick={signOut} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid #2A2A60',
                borderRadius: 8, padding: '6px 12px', color: '#9090C0', fontSize: 12, cursor: 'pointer',
              }}>Logout</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{
              background: 'linear-gradient(135deg, #6C63FF, #9B59B6)',
              border: 'none', borderRadius: 8, padding: '8px 16px',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}>Einloggen</button>
          )}
        </div>

        {/* Kategorie-Tags */}
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 20px 10px',
          display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {['All', ...CATEGORIES].map(tag => (
            <button key={tag} onClick={() => { setActiveTag(tag); setPage(1); }} style={{
              flexShrink: 0,
              background: activeTag === tag ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: activeTag === tag ? '1px solid #6C63FF' : '1px solid #1A1A50',
              borderRadius: 20, padding: '5px 14px',
              color: activeTag === tag ? '#A090FF' : '#6060A0',
              fontSize: 12, fontWeight: activeTag === tag ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {tag === 'All' ? 'Alle' : `${EMOJI_MAP[tag]} ${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {loadingGames ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4040A0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
            <div>Lade Spiele...</div>
          </div>
        ) : isFiltering ? (
          <>
            <div style={{ color: '#7070A0', fontSize: 13, marginBottom: 20 }}>
              {searchResults.length} Spiele gefunden
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {searchResults.map(g => <GameCard key={g.id} game={g} onClick={setSelectedGame} />)}
            </div>
          </>
        ) : (
          <>
            {/* Hero */}
            <div style={{
              background: 'linear-gradient(135deg, #1A0A3E, #0A1A3E)',
              border: '1px solid #2A1A60', borderRadius: 16, padding: 32,
              marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              overflow: 'hidden', position: 'relative',
            }}>
              <div>
                <div style={{ color: '#9B8FFF', fontSize: 12, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
                  LIVE AUS DER DATENBANK
                </div>
                <h1 style={{ color: '#E0E0FF', fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
                  Willkommen bei <span style={{ color: '#6C63FF' }}>GameVerse</span>
                </h1>
                <p style={{ color: '#7070A0', fontSize: 13, margin: '0 0 16px' }}>
                  Echte Spieler · Echte Daten · Supabase-powered
                </p>
                {user ? (
                  <div style={{ color: '#43E97B', fontSize: 13 }}>
                    ✓ Eingeloggt als {profile?.username}
                  </div>
                ) : (
                  <button onClick={() => setShowAuth(true)} style={{
                    background: 'linear-gradient(135deg, #6C63FF, #9B59B6)',
                    border: 'none', borderRadius: 8, color: '#fff',
                    fontSize: 13, fontWeight: 700, padding: '8px 20px', cursor: 'pointer',
                  }}>🚀 Kostenlos registrieren</button>
                )}
              </div>
              <div style={{ fontSize: 70, opacity: 0.7, userSelect: 'none' }}>🌌</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
              {[
                { icon: '🎮', label: 'Spiele',        value: Object.values(byCategory).reduce((s, a) => s + a.length, 0) + '+' },
                { icon: '👥', label: 'Spieler Online', value: formatNumber(totalOnline) },
                { icon: '🏆', label: 'Kategorien',    value: CATEGORIES.length },
                { icon: '⚡', label: 'Realtime',       value: 'Live' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1A1A50', borderRadius: 10, padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ color: '#E0E0FF', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: '#5050A0', fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Featured */}
            {featured.length > 0 && (
              <CategoryRow label="Trending" games={featured} onGameClick={setSelectedGame} />
            )}

            {/* Per Kategorie */}
            {CATEGORIES.map(cat => (
              byCategory[cat]?.length > 0 && (
                <CategoryRow key={cat} label={cat} games={byCategory[cat]} onGameClick={setSelectedGame} />
              )
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} signIn={signIn} signUp={signUp} />
      )}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          user={user}
          onClose={() => setSelectedGame(null)}
          onRefresh={loadGames}
        />
      )}
    </div>
  );
}
