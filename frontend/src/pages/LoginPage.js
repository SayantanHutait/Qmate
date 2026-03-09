import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.access_token);
      
      // Parse role to redirect (auth context updates on next tick, so we do it manually here)
      const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
      
      if (tokenPayload.role === 'admin') navigate('/admin/dashboard');
      else if (tokenPayload.role === 'agent') navigate('/agent/dashboard');
      else navigate('/chat');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>🎓 Student Support Login</div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={styles.footer}>
          Seed Accounts: admin@college.edu, agent@college.edu, student@college.edu (password: *123)
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', fontFamily: 'sans-serif' },
  card: { background: '#1e293b', padding: 40, borderRadius: 12, width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' },
  header: { fontSize: 24, color: '#f1f5f9', fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  input: { padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 16 },
  button: { padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'center' },
  footer: { marginTop: 20, fontSize: 12, color: '#64748b', textAlign: 'center' }
};
