import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Loader2, KeyRound, Mail, User, ShieldCheck, Truck } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const validate = () => {
    const tempErrors: { email?: string; password?: string; fullName?: string } = {};
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

    if (!fullName) {
      tempErrors.fullName = 'Full name is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/register', { email, password, fullName, role });
      if (res.success) {
        toast.success('Registration successful! Please sign in.');
        navigate('/login');
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error registering account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F5F7FA] dark:bg-[#0B1220] transition-colors">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F766E]/5 via-[#F5F7FA] to-white dark:from-[#0F766E]/10 dark:via-[#0B1220] dark:to-[#111827] border-r border-[#E2E8F0] dark:border-[#1E293B] items-center justify-center p-12 flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e06_1px,transparent_1px),linear-gradient(to_bottom,#0f766e06_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="space-y-4">
            <span className="px-3 py-1 text-[10px] font-bold bg-[#0F766E]/10 dark:bg-[#14B8A6]/10 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/20 rounded-full inline-block uppercase tracking-wider">
              ERP Systems Suite v1.8
            </span>
            <img src={logoSvg} alt="TransitOps" className="h-20 w-auto object-contain" />
            <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed font-medium">
              Create an operator or manager registry profile to integrate with smart dispatch controls.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-4 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 dark:bg-[#14B8A6]/10 text-[#0F766E] dark:text-[#14B8A6] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#475569] dark:text-[#94A3B8]">Compliance Controls</span>
                  <span className="text-[#0F766E] dark:text-[#14B8A6]">100% Enforced</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-4 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#475569] dark:text-[#94A3B8]">Role-Based Access</span>
                  <span className="text-emerald-600 dark:text-emerald-400">5 Tiers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-xl p-8 relative z-10 transition-colors">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">Create account</h1>
            <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
              Fill in details to set up your profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium border bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#475569] focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 outline-hidden transition-all ${
                    errors.fullName ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400' : 'border-[#E2E8F0] dark:border-[#1E293B] focus:border-[#0F766E]'
                  }`}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              </div>
              {errors.fullName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium border bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#475569] focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 outline-hidden transition-all ${
                    errors.email ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400' : 'border-[#E2E8F0] dark:border-[#1E293B] focus:border-[#0F766E]'
                  }`}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              </div>
              {errors.email && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium border bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#475569] focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 outline-hidden transition-all ${
                    errors.password ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400' : 'border-[#E2E8F0] dark:border-[#1E293B] focus:border-[#0F766E]'
                  }`}
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              </div>
              {errors.password && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Account Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl text-sm font-medium border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
              >
                <option value="DRIVER">Driver</option>
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-bold text-sm bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white transition-all shadow-lg shadow-[#0F766E]/15 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-[#1E293B] text-center text-xs">
            <span className="text-[#64748B] font-medium">Already have an account? </span>
            <Link to="/login" className="text-[#0F766E] hover:text-[#115E59] font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
