import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Loader2, KeyRound, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Send Request, Step 2: Input Code & Reset
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        toast.success('Reset code generated successfully!');
        if (res.code) {
          setSimulatedCode(res.code); // Store simulated code in front-end state for display
        }
        setStep(2);
      } else {
        throw new Error(res.error || 'Failed to request reset token');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error requesting reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/reset-password', { token: code, newPassword: password });
      if (res.success) {
        toast.success('Password reset completed successfully!');
        navigate('/login');
      } else {
        throw new Error(res.error || 'Failed to reset password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Incorrect or expired reset token code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F5F7FA] dark:bg-[#0B1220] items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-xl p-8 relative z-10">
        <div className="mb-4 flex justify-center">
          <img src={logoSvg} alt="TransitOps" className="h-14 w-auto object-contain" />
        </div>
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#0F766E] hover:text-[#115E59] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">Reset Password</h1>
              <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                Provide email address associated with your profile
              </p>
            </div>

            <form onSubmit={handleRequestToken} className="space-y-4">
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
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#475569] focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-bold text-sm bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white transition-all shadow-lg shadow-[#0F766E]/15 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Request Reset Code'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">Enter Reset Code</h1>
              <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                Input the code and choose a new password
              </p>
            </div>

            {/* Simulated sandbox notice */}
            {simulatedCode && (
              <div className="p-3.5 bg-[#0F766E]/5 dark:bg-[#14B8A6]/10 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/20 rounded-xl text-[11px] font-semibold text-center">
                🔑 Simulated Reset Token Code: <span className="font-mono font-extrabold select-all">{simulatedCode}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Reset Token Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm font-mono font-bold tracking-[0.25em] text-center border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#475569] focus:bg-white dark:focus:bg-[#111827] focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-bold text-sm bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white transition-all shadow-lg shadow-[#0F766E]/15 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
