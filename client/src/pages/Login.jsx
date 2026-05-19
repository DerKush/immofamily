import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--sand)',
    }}>
      <div style={{ width: 380 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏘</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>
            ImmoFamily
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Gestion du patrimoine locatif · Abidjan</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Connectez-vous à votre espace famille
          </div>

          {error && (
            <div style={{ background: '#fdecea', border: '1px solid #f5c6c4', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@immofamily.ci" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', padding: '10px', fontSize: 14, marginTop: 8 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '12px', background: 'var(--sand)', borderRadius: 7, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-2)' }}>Comptes de démonstration :</strong><br />
            👑 Admin : admin@immofamily.ci / admin123<br />
            👤 Membre : famille@immofamily.ci / famille123
          </div>
        </div>
      </div>
    </div>
  );
}
