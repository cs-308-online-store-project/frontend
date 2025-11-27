import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/api';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setMessage('❌ Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.login({ email, password });
      
      // Token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('✓ Login successful! Redirecting...');
        
        // 1 saniye sonra products sayfasına git
        setTimeout(() => {
          navigate('/products');
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(
        error.response?.data?.message || 
        '❌ Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left side - Brand/Image */}
      <div style={styles.leftSide}>
        <div style={styles.brandSection}>
          <h1 style={styles.brandName}>URBAN THREADS</h1>
          <p style={styles.brandTagline}>Premium Clothing for Modern Life</p>
          <div style={styles.brandFeatures}>
            <div style={styles.feature}>
              <span style={styles.icon}>👕</span>
              <p>Premium T-Shirts</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🧥</span>
              <p>Cozy Sweatshirts</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>👖</span>
              <p>Stylish Jeans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={styles.rightSide}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue shopping</p>
          
          <form onSubmit={handleLogin} style={styles.form} noValidate>
            {/* EMAIL INPUT - EKLENDİ */}
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={styles.input}
                required
              />
            </div>

            {/* PASSWORD INPUT - EKLENDİ */}
            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          {message && (
            <div style={{
              ...styles.message,
              backgroundColor: message.includes('✓') ? '#d4edda' : '#fff3cd',
              color: message.includes('✓') ? '#155724' : '#856404',
              border: message.includes('✓') ? '1px solid #c3e6cb' : '1px solid #ffeaa7'
            }}>
              {message}
            </div>
          )}

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{' '}
              <a href="/register" style={styles.link}>Sign up</a>
            </p>
            <a href="/forgot-password" style={styles.forgotLink}>Forgot password?</a>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>New to Urban Threads?</span>
          </div>

          <div style={styles.benefits}>
            <p style={styles.benefitItem}>✓ Exclusive member discounts</p>
            <p style={styles.benefitItem}>✓ Early access to new collections</p>
            <p style={styles.benefitItem}>✓ Free shipping on orders over $50</p>
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
    position: 'relative',
    overflow: 'hidden',
  },
  brandSection: {
    zIndex: 1,
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
  brandFeatures: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  feature: {
    textAlign: 'center',
  },
  icon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '0.5rem',
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
    marginTop: '1.5rem',
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
    marginBottom: '0.5rem',
  },
  link: {
    color: '#1a1a1a',
    textDecoration: 'none',
    fontWeight: '600',
    borderBottom: '1px solid #1a1a1a',
  },
  forgotLink: {
    fontSize: '0.85rem',
    color: '#999',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '0.5rem',
  },
  divider: {
    position: 'relative',
    margin: '2rem 0',
    textAlign: 'center',
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 1rem',
    color: '#999',
    fontSize: '0.85rem',
    position: 'relative',
    zIndex: 1,
  },
  benefits: {
    marginTop: '1rem',
  },
  benefitItem: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.5rem',
    paddingLeft: '0.5rem',
  },
};

export default Login;