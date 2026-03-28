import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/Api';
import { useAuth } from '../context/Auth';
import type { AuthResponse } from '../models/Models';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post<AuthResponse>('/login', { email, password });
      await login(response.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen page-transition">
      <main className="flex-grow flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[420px] flex flex-col items-center">

          <div className="mb-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dim rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <span className="material-symbols-outlined text-on-primary text-3xl">draw</span>
            </div>
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface mb-4">Pady</h1>
            <span className="text-on-surface-variant font-medium tracking-wide bg-surface-container-high px-4 py-1.5 rounded-full text-xs uppercase">
              Focus on ideas, we handle the rest
            </span>
          </div>

          <div className="w-full bg-surface-container-lowest rounded-2xl p-8 sm:p-10 shadow-[0_40px_60px_-5px_rgba(45,51,56,0.04)] ring-1 ring-surface-container-highest/50 relative overflow-hidden">
            <header className="mb-8">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Welcome back</h2>
              <p className="text-on-surface-variant text-sm mt-1">Please enter your details to sign in.</p>
            </header>

            {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none font-medium"
                  id="email" type="email" placeholder="name@company.com" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">Password</label>
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 pr-12 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none font-medium"
                    id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-on-surface-variant text-sm font-medium">
              Don't have an account?
              <Link to="/signup" className="text-on-surface font-bold hover:text-primary hover:underline decoration-primary/30 underline-offset-4 ml-1 transition-all">Sign Up</Link>
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1/2 z-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-tertiary-fixed opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[30%] h-[40%] rounded-full bg-primary-fixed opacity-20 blur-[100px]"></div>
      </div>

      <footer className="py-8 px-12 text-center relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-outline-variant uppercase tracking-widest">
          <div>© 2026 Pady Inc.</div>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-on-surface transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-on-surface transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
