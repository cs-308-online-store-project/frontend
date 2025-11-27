// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');  // hata / başarı mesajı
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1) Kullanıcıyı oluştur
      await authAPI.register({ name, email, password });

      // 2) Hemen login ol (backend register'da token dönmüyor)
      const loginRes = await authAPI.login({ email, password });

      localStorage.setItem('token', loginRes.data.token);
      if (loginRes.data.user) {
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      }

      // 3) Ürünlere yönlendir
      navigate('/products');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Registration failed';
      setMessage(`⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSide}>
        <div style={styles.brandSection}>
          <h1 style={styles.brandName}>URBAN THREADS</h1>
          <p style={styles.brandTagline}>Join our community of modern shoppers</p>
        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to start shopping</p>

          {message && (
            <div
              style={{
                ...styles.message,
                backgroundColor: message.startsWith('⚠️')
                  ? '#fff3cd'
                  : '#d4edda',
                color: message.startsWith('⚠️') ? '#856404' : '#155724',
                border: message.startsWith('⚠️')
                  ? '1px solid #ffeaa7'
                  : '1px solid #c3e6cb',
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} style={styles.form} noValidate>
            <div style={styles.formGroup}>
              <label style={styles.label}>FULL NAME</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL ADDRESS</label>
              <input
                type="email"
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                type="password"
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <Link to="/login" style={styles.link}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  leftSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  brandSection: {
    maxWidth: '500px',
  },
  brandName: {
    fontSize: '3.5rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  brandTagline: {
    fontSize: '1.2rem',
    color: '#b0b0b0',
    marginBottom: '3rem',
    letterSpacing: '0.05em',
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#fafafa',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    padding: '3rem 2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#333',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  input: {
    padding: '0.9rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  button: {
    padding: '1rem',
    backgroundColor: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    letterSpacing: '0.1em',
    marginTop: '0.5rem',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
  },
  message: {
    marginBottom: '1rem',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.9rem',
    color: '#666',
  },
  link: {
    color: '#1a1a1a',
    textDecoration: 'none',
    fontWeight: '600',
    borderBottom: '1px solid #1a1a1a',
  },
};

export default Register;