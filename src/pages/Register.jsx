import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/api';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage('❌ Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('✓ Registration successful! Welcome to Urban Threads! 🎉');
        
        // 1.5 saniye sonra products sayfasına git
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      }
    } catch (error) {
      console.error('Register error:', error);
      setMessage(
        error.response?.data?.message || 
        '❌ Registration failed. Please try again.'
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
          <p style={styles.brandTagline}>Join Our Fashion Community</p>
          <div style={styles.brandFeatures}>
            <div style={styles.feature}>
              <span style={styles.icon}>🎁</span>
              <p>Welcome Bonus</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🚚</span>
              <p>Free Shipping</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>⭐</span>
              <p>Exclusive Deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div style={styles.rightSide}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Start your style journey today</p>
          
          <form onSubmit={handleRegister} style={styles.form} noValidate>
            {/* NAME INPUT */}
            <div style={styles.formGroup}>
              <label style={styles.label}>FULL NAME</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                style={styles.input}
                required
              />
            </div>

            {/* EMAIL INPUT */}
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                style={styles.input}
                required
              />
            </div>

            {/* PASSWORD INPUT */}
            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                style={styles.input}
                required
              />
            </div>

            {/* CONFIRM PASSWORD INPUT */}
            <div style={styles.formGroup}>
              <label style={styles.label}>CONFIRM PASSWORD</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
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
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
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
              Already have an account?{' '}
              <a href="/login" style={styles.link}>Sign in</a>
            </p>
          </div>

          <div style={styles.terms}>
            <p style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <a href="/terms" style={styles.termsLink}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" style={styles.termsLink}>Privacy Policy</a>
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
    gap: '1.2rem',
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
    animation: 'slideDown 0.3s ease-out',
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
  terms: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  termsText: {
    fontSize: '0.75rem',
    color: '#999',
    lineHeight: '1.5',
  },
  termsLink: {
    color: '#666',
    textDecoration: 'underline',
  },
};

export default Register;