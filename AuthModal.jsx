import { useState } from 'react';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(5,5,20,0.85)',
    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#12122A', border: '1px solid #2A2A60', borderRadius: 16,
    width: 400, maxWidth: '92vw', padding: 32,
  },
  title: { color: '#E0E0FF', fontSize: 22, fontWeight: 800, margin: '0 0 4px', fontFamily: 'sans-serif' },
  sub:   { color: '#6060A0', fontSize: 13, margin: '0 0 24px', fontFamily: 'sans-serif' },
  label: { display: 'block', color: '#9090C0', fontSize: 12, marginBottom: 6, fontFamily: 'sans-serif' },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A60',
    borderRadius: 8, padding: '10px 12px', color: '#E0E0FF',
    fontSize: 14, fontFamily: 'sans-serif', marginBottom: 16, outline: 'none',
  },
  btn: {
    width: '100%', background: 'linear-gradient(135deg, #6C63FF, #9B59B6)',
    border: 'none', borderRadius: 10, color: '#fff',
    fontSize: 15, fontWeight: 700, padding: 14, cursor: 'pointer',
    fontFamily: 'sans-serif', marginTop: 4,
  },
  err: { color: '#FF6B6B', fontSize: 12, margin: '-8px 0 12px', fontFamily: 'sans-serif' },
  switch: { textAlign: 'center', marginTop: 16, color: '#6060A0', fontSize: 13, fontFamily: 'sans-serif' },
  switchBtn: { background: 'none', border: 'none', color: '#9090FF', cursor: 'pointer', fontSize: 13 },
};

export function AuthModal({ onClose, signIn, signUp }) {
  const [mode, setMode]   = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [name, setName]   = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, pass);
      } else {
        if (!name.trim()) { setError('Bitte gib einen Benutzernamen ein.'); setBusy(false); return; }
        await signUp(email, pass, name.trim());
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h2 style={S.title}>{mode === 'login' ? '👋 Willkommen zurück' : '🚀 Account erstellen'}</h2>
        <p style={S.sub}>{mode === 'login' ? 'Melde dich bei GameVerse an' : 'Erstelle deinen kostenlosen Account'}</p>

        {mode === 'register' && (
          <div>
            <label style={S.label}>Benutzername</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)}
              placeholder="z.B. ProGamer99" autoFocus />
          </div>
        )}

        <label style={S.label}>E-Mail</label>
        <input style={S.input} type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="deine@email.de"
          autoFocus={mode === 'login'} />

        <label style={S.label}>Passwort</label>
        <input style={S.input} type="password" value={pass}
          onChange={e => setPass(e.target.value)} placeholder="••••••••"
          onKeyDown={e => e.key === 'Enter' && submit()} />

        {error && <p style={S.err}>⚠ {error}</p>}

        <button style={{ ...S.btn, opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>
          {busy ? 'Einen Moment...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
        </button>

        <p style={S.switch}>
          {mode === 'login' ? 'Noch kein Account?' : 'Bereits registriert?'}{' '}
          <button style={S.switchBtn} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Jetzt registrieren' : 'Einloggen'}
          </button>
        </p>
      </div>
    </div>
  );
}
