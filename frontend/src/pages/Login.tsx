import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Loader2,
  KeyRound,
  Mail,
  Brain,
  Activity,
  Settings,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
} from 'lucide-react';
import logoSvg from '../assets/logo.svg';

/* ── Animated Counter Component ── */
function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`text-center transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
      <p className="text-[11px] text-teal-200/80 font-medium mt-1">{label}</p>
    </div>
  );
}

export function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminMode = location.pathname.includes('/admin/login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const executeLogin = async (targetEmail: string, targetPassword: string) => {
    try {
      setIsSubmitting(true);
      const user = await login(targetEmail, targetPassword);
      
      if (isAdminMode && user.role !== 'SUPER_ADMIN') {
        await logout();
        toast.error('Access Denied. Your account does not have administrator privileges.');
        setIsSubmitting(false);
        return;
      }
      
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await executeLogin(email, password);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Fleet Intelligence',
      desc: 'Predictive analytics powered by deterministic reasoning and live fleet telemetry.',
    },
    {
      icon: Activity,
      title: 'Real-Time Operations',
      desc: 'Live dispatch monitoring with 5-second polling and instant alert escalation.',
    },
    {
      icon: Settings,
      title: 'Predictive Maintenance',
      desc: 'Automated service scheduling based on odometer trends and compliance windows.',
    },
  ];

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: '#F5F7FA' }}>
      {/* ═══════════════════════════════════════════════
          LEFT PANEL — Enterprise Brand Landing
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Deep emerald gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A5C55] via-[#0F766E] to-[#115E59]" />
        
        {/* Geometric pattern overlay — professional, not distracting */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hexGrid" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15Z" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexGrid)" />
          </svg>
        </div>

        {/* Floating gradient orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-emerald-300/8 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top: Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-bold tracking-wide">TransitOps</p>
                <p className="text-teal-200/60 text-[10px] font-medium tracking-widest uppercase">Enterprise Fleet ERP</p>
              </div>
            </div>
          </div>

          {/* Middle: Hero content */}
          <div className="space-y-10 max-w-lg">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                <span className="text-[11px] font-semibold text-teal-100/90 tracking-wide">Systems Operational</span>
              </div>

              <h1 className="text-[44px] xl:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight">
                Enterprise Fleet
                <br />
                Operations Platform
              </h1>
              <p className="text-base text-teal-100/70 leading-relaxed max-w-md font-medium">
                Unified command center for vehicle management, driver compliance, smart dispatch, and financial oversight.
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] transition-all duration-500 hover:bg-white/[0.12] ${
                      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${200 + i * 120}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <Icon className="w-5 h-5 text-teal-200" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{f.title}</p>
                      <p className="text-[11px] text-teal-200/60 leading-relaxed mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Stats bar */}
          <div className="flex items-center gap-8 pt-8 border-t border-white/10">
            <AnimatedStat value="98.8%" label="Fleet Availability" delay={400} />
            <AnimatedStat value="12,000+" label="Trips Managed" delay={600} />
            <AnimatedStat value="99.99%" label="System Uptime" delay={800} />
            <AnimatedStat value="24/7" label="Monitoring" delay={1000} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT PANEL — Login Form
          ═══════════════════════════════════════════════ */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 xl:p-16 relative">
        {/* Subtle top-right accent for light mode */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full pointer-events-none dark:from-teal-950/10" />

        <div
          className={`w-full max-w-[440px] relative z-10 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Logo for mobile / right panel */}
          <div className="flex items-center gap-3 mb-10">
            <img src={logoSvg} alt="TransitOps" className="h-14 w-auto" />
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-[20px] p-8 xl:p-10 relative" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)' }}>
            {/* Top Right Admin Access / Back Link */}
            <div className="absolute top-6 right-6">
              {!isAdminMode ? (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/5 dark:bg-[#14B8A6]/10 hover:bg-[#0F766E]/10 dark:hover:bg-[#14B8A6]/20 transition-all shadow-xs border border-[#0F766E]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Access
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-[11px] font-bold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
                >
                  Back to User Login
                </Link>
              )}
            </div>

            <div className="mb-8 pr-16">
              <h1 className="text-[28px] font-extrabold tracking-tight flex items-center gap-3" style={{ color: '#0F172A' }}>
                {isAdminMode && <Shield className="w-7 h-7 text-[#0F766E] dark:text-[#14B8A6]" />}
                <span className="dark:text-zinc-50">{isAdminMode ? 'Administrator Portal' : 'Welcome back'}</span>
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed" style={{ color: '#64748B' }}>
                <span className="dark:text-zinc-450">{isAdminMode ? 'Restricted access for authorized TransitOps administrators.' : 'Sign in to your TransitOps workspace.'}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>
                  <span className="dark:text-zinc-450">Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium border transition-all duration-200 outline-hidden bg-[#F8FAFC] dark:bg-zinc-950 text-[#0F172A] dark:text-zinc-100 placeholder-[#94A3B8] dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] ${
                      errors.email ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-[#E2E8F0] dark:border-zinc-800'
                    }`}
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                </div>
                {errors.email && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>
                  <span className="dark:text-zinc-450">Password</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium border transition-all duration-200 outline-hidden bg-[#F8FAFC] dark:bg-zinc-950 text-[#0F172A] dark:text-zinc-100 placeholder-[#94A3B8] dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] ${
                      errors.password ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-[#E2E8F0] dark:border-zinc-800'
                    }`}
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                </div>
                {errors.password && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.password}</p>}
              </div>

              {/* Submit / Demo Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/15 hover:shadow-xl hover:shadow-teal-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
                  style={{ backgroundColor: '#0F766E' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#115E59')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isAdminMode && (
                  <button
                    type="button"
                    onClick={() => executeLogin('admin@transitops.com', 'Admin@123')}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl font-bold text-sm text-[#0F172A] dark:text-white bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 hover:bg-[#F8FAFC] dark:hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4 text-[#0F766E]" /> Explore Live Demo
                  </button>
                )}
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t flex justify-between items-center" style={{ borderColor: '#F1F5F9' }}>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold hover:underline transition-colors"
                style={{ color: '#0F766E' }}
              >
                Forgot Password?
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold hover:underline transition-colors"
                style={{ color: '#0F766E' }}
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#0F766E' }} />
              <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#0F766E' }} />
              <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
