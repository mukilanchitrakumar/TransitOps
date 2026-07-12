import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, KeyRound, Mail } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const tempErrors: { email?: string; password?: string } = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Invalid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">TransitOps</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Log in to manage smart transport operations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              />
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
            </div>
            {errors.email && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.email}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all ${
                  errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              />
              <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
            </div>
            {errors.password && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:disabled:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            For testing use the seeded admin credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
export default Login;
