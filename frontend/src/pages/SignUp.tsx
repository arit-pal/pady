import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/Api';

const SignUp: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/signup', { full_name: fullName, email, password });
      navigate('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Signup failed. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden page-transition">

      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-surface-container-low relative p-16 items-end justify-start overflow-hidden">

        <div className="absolute inset-0 z-0 bg-surface-dim">
          <img
            alt="Minimalist architectural space"
            className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-low via-transparent to-transparent opacity-90"></div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="text-primary-dim font-headline text-sm font-bold tracking-[0.3em] uppercase">PADY</div>
          <h1 className="font-headline text-5xl lg:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.95]">
            The silent <br /> curator for <br /> your thoughts.
          </h1>
          <p className="text-on-surface-variant text-lg max-w-sm leading-relaxed">
            Designed for deep focus. A sophisticated gallery for your personal documents and notes.
          </p>
        </div>

        <div className="absolute top-1/4 right-1/4 w-64 h-80 glass-panel rounded-2xl ghost-shadow hidden lg:block border border-white/20 p-8 transform rotate-6 hover:rotate-3 transition-transform duration-500">
          <div className="w-12 h-1 bg-primary/20 rounded-full mb-6"></div>
          <div className="space-y-4">
            <div className="w-full h-2 bg-on-surface/5 rounded-full"></div>
            <div className="w-4/5 h-2 bg-on-surface/5 rounded-full"></div>
            <div className="w-5/6 h-2 bg-on-surface/5 rounded-full"></div>
            <div className="w-1/2 h-2 bg-on-surface/5 rounded-full"></div>
          </div>
          <div className="mt-24 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container"></div>
            <div className="w-20 h-2 bg-primary/20 rounded-full"></div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-surface-container-lowest relative">
        <div className="absolute top-8 left-8 md:hidden">
          <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">Pady</span>
        </div>

        <div className="w-full max-w-md z-10">
          <header className="mb-12">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-3">Create your account</h2>
            <p className="text-on-surface-variant font-medium">Start capturing your ideas instantly.</p>
          </header>

          {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest text-on-surface-variant uppercase ml-1" htmlFor="full_name">Full Name</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium outline-none"
                id="full_name" type="text" placeholder="John Doe" required
                value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest text-on-surface-variant uppercase ml-1" htmlFor="email">Email Address</label>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium outline-none"
                id="email" type="email" placeholder="name@company.com" required
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-widest text-on-surface-variant uppercase ml-1" htmlFor="password">Password</label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-medium outline-none pr-12"
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-6">
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Creating Account...' : 'Create Account'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>

              <div className="text-center">
                <p className="text-on-surface-variant text-sm font-medium">
                  Already have an account?
                  <Link to="/login" className="text-on-surface font-bold hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all ml-1">Sign In</Link>
                </p>
              </div>
            </div>
          </form>

          <footer className="mt-20 flex flex-wrap gap-x-6 gap-y-2 justify-center text-[10px] font-bold tracking-widest text-outline-variant uppercase">
            <Link to="/privacy" className="hover:text-on-surface transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-on-surface transition-colors">Terms of Service</Link>
          </footer>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-surface-container-high via-primary/10 to-surface-container-high md:hidden"></div>
    </div>
  );
};

export default SignUp;
