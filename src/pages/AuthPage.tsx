import React, { useState } from 'react';
import { Icon } from '../components/Common';
import { supabase } from '../lib/supabase';

export const AuthPage = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white border border-border-light/50 rounded-[40px] w-full max-w-md p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative z-10">
        <div className="flex justify-center mb-8">
          <span className="text-[32px] font-extrabold text-brand tracking-tighter" style={{ fontFamily: 'Plus Jakarta Sans' }}>Sprintly</span>
        </div>

        <div className="text-center mb-8">
          <div className="text-[28px] font-extrabold text-text-main tracking-tight mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </div>
          <div className="text-[14px] text-text-3 font-medium">
            {isLogin ? 'Enter your details to access your workspace.' : 'Sign up to start managing your projects.'}
          </div>
        </div>

        {/* Error / success banners */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-2xl">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-[13px] font-semibold rounded-2xl">
            {successMsg}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-[13px] font-bold text-text-3 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-3">
                  <Icon name="team" size={18} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-bg border border-border-light rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder-text-3"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-text-3 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-3">
                <Icon name="mail" size={18} />
              </div>
              <input
                required
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg border border-border-light rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder-text-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-text-3 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-3">
                <Icon name="settings" size={18} />
              </div>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-bg border border-border-light rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-semibold text-text-main focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder-text-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl py-4 text-[15px] font-bold transition-all shadow-[0_8px_24px_rgba(92,79,229,0.3)] hover:-translate-y-0.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-[14px] font-medium text-text-3">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-brand font-bold hover:underline ml-1">
            {isLogin ? 'Register here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};
