import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  BookOpen, 
  Briefcase, 
  Zap, 
  Eye, 
  EyeOff,
  ArrowRight
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useApp();
  
  // View mode
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<'student' | 'work' | 'entrepreneur' | 'personal'>('student');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (mode === 'login') {
      const success = login(email.trim().toLowerCase(), password);
      if (!success) {
        setErrorMsg('Invalid email or password. Please try again.');
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('Password must be at least 4 characters.');
        return;
      }
      const success = register(name.trim(), email.trim().toLowerCase(), password, persona);
      if (!success) {
        setErrorMsg('An account with this email already exists.');
      }
    }
  };

  const toggleMode = () => {
    setErrorMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div 
      className="auth-screen-container animate-fade-in"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 70px)', 
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative blurred backgrounds */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(30px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(35px)', zIndex: 0 }} />

      {/* Floating glass container */}
      <div 
        className="glass-panel animate-slide-up"
        style={{ 
          width: '100%', 
          maxWidth: '460px', 
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 5,
          position: 'relative'
        }}
      >
        {/* Branding header inside card */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={28} style={{ color: 'var(--accent-primary)', animation: 'glowPulse 2.5s infinite' }} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-title)', background: 'linear-gradient(135deg, #fff 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FocusAI
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {mode === 'login' ? 'Enter your credentials to unlock focus autopilot.' : 'Create an account to partition your goals.'}
          </p>
        </div>

        {/* Error box */}
        {errorMsg && (
          <div 
            className="glass-card" 
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'rgba(255, 71, 87, 0.08)', 
              borderColor: 'rgba(255, 71, 87, 0.2)', 
              color: 'var(--priority-urgent)', 
              fontSize: '0.8rem', 
              marginBottom: '1.25rem',
              borderRadius: '8px'
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Name Field (Register Mode Only) */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                />
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required
              />
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                required
              />
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Persona selector (Register Mode Only) */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Select Study/Work Persona Profile
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPersona('student')}
                  className="glass-card"
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    textAlign: 'left',
                    background: persona === 'student' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: persona === 'student' ? 'var(--accent-primary)' : 'var(--border-light)',
                    cursor: 'pointer'
                  }}
                >
                  <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Rahul (Student)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Focuses on exams, summary files, and lab tasks.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPersona('work')}
                  className="glass-card"
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    textAlign: 'left',
                    background: persona === 'work' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: persona === 'work' ? 'var(--accent-primary)' : 'var(--border-light)',
                    cursor: 'pointer'
                  }}
                >
                  <Briefcase size={16} style={{ color: 'var(--accent-secondary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Priya (Engineer)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Focuses on Jira syncs, meeting slides, and code reviews.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPersona('entrepreneur')}
                  className="glass-card"
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    textAlign: 'left',
                    background: persona === 'entrepreneur' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: persona === 'entrepreneur' ? 'var(--accent-primary)' : 'var(--border-light)',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={16} style={{ color: 'var(--accent-purple)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Arjun (Founder)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Focuses on client pitches, invoice deals, and syncs.</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Action button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
          >
            <span>{mode === 'login' ? 'Unlock Focus Dashboard' : 'Setup Focus Profile'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <button 
            onClick={toggleMode}
            style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.825rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? "Need a partitioned account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>

      </div>
    </div>
  );
};
