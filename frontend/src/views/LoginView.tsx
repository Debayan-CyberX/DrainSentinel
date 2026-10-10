import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { NavigationPage } from '../types';

interface LoginViewProps {
  onNavigate: (page: NavigationPage) => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authSuccess, setAuthSuccess] = useState(false);

  // Email format validation regex
  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Work email address is required.';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid municipal email address (e.g., officer@mcgm.gov.in).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate realistic asynchronous network authentication delay
    await new Promise((resolve) => setTimeout(resolve, 850));

    // Valid test profile for the development preview environment
    const DEMO_EMAIL = 'officer@mcgm.gov.in';
    const DEMO_PWD = 'Sentinel2026!';

    // Strict credential verification: Never allow arbitrary credentials to gain access
    if (email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PWD) {
      setIsLoading(false);
      setAuthSuccess(true);
      // Brief pause to allow the officer to see verified status
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          onNavigate('overview');
        }
      }, 900);
    } else {
      setIsLoading(false);
      setErrorMessage(
        'Authentication failed: Invalid credentials or unprovisioned municipal account. Please verify your municipal email and password.'
      );
    }
  };

  const fillDemoCredentials = () => {
    setEmail('officer@mcgm.gov.in');
    setPassword('Sentinel2026!');
    setFieldErrors({});
    setErrorMessage(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Navigation Breadcrumb / Return to Console */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="inline-flex items-center gap-2 text-xs text-[#a4aca0] hover:text-[#eef3e7] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Catchment Console</span>
          </button>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#86efac]/80 bg-[#383b34]/80 px-2 py-0.5 rounded-full border border-white/5">
            MCGM &bull; SWD Portal
          </span>
        </div>

        {/* Development Preview Architecture Banner */}
        <div className="bg-[#2d3029]/90 border border-[#86efac]/20 rounded-xl p-3.5 text-xs shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#86efac] flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[#d5dbc9]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#eef3e7]">Development Preview</span>
                <span className="text-[10px] font-mono text-[#86efac] bg-[#383b34] px-1.5 py-0.2 rounded">
                  Mock Auth Mode
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#a4aca0]">
                Backend OAuth2/JWT endpoints (<code className="text-[#86efac]">/api/v1/auth/token</code>) are pending server deployment. For testing form validation and credential states:
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono bg-[#23261f]/60 px-2.5 py-1.5 rounded border border-white/5">
                <span className="text-[#eef3e7]">officer@mcgm.gov.in</span>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-[#86efac] hover:underline cursor-pointer text-[10px] font-sans font-medium"
                >
                  Insert Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="nature-card rounded-2xl p-7 sm:p-8 border border-white/10 shadow-[0_24px_60px_rgba(16,22,17,0.7)]">
          {/* Card Header & Brand Seal */}
          <div className="text-center space-y-3 mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ade80]/20 via-[#86efac]/10 to-[#383b34] border border-[#86efac]/30 shadow-[0_0_24px_rgba(74,222,128,0.2)]">
              <svg className="w-6 h-6 text-[#86efac]" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 7.5 5 12 5 15.5a7 7 0 0 0 14 0c0-3.5-3-8-7-13.5z"
                  fill="url(#sylva-grad-login)"
                />
                <path
                  d="M12 7c-2 3-3.5 5.5-3.5 8a3.5 3.5 0 0 0 7 0c0-2.5-1.5-5-3.5-8z"
                  fill="#eef3e7"
                  opacity="0.65"
                />
                <defs>
                  <linearGradient id="sylva-grad-login" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#86efac" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-medium text-[#eef3e7] tracking-tight">
                DrainSentinel
              </h1>
              <p className="text-xs text-[#a4aca0] font-light mt-1">
                Municipal Waterway Monitoring &amp; Risk Management
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {authSuccess && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-medium">Credentials verified successfully.</p>
                <p className="text-[11px] text-emerald-300/80">
                  Redirecting to Catchment Dispatch Console...
                </p>
              </div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Work Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="work-email"
                className="block text-xs font-medium text-[#d5dbc9]"
              >
                Municipal Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a4aca0]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="work-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isLoading || authSuccess}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="officer@mcgm.gov.in"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#23261f]/80 text-xs text-[#eef3e7] placeholder-[#7c8177] border transition-colors focus:outline-none ${
                    fieldErrors.email
                      ? 'border-red-400/80 focus:border-red-400'
                      : 'border-white/10 focus:border-[#86efac]/60 focus:bg-[#23261f]'
                  } disabled:opacity-50`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="officer-password"
                  className="block text-xs font-medium text-[#d5dbc9]"
                >
                  Password
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage(
                      'Password resets must be coordinated through MCGM Stormwater IT Dispatch (ext. 2240).'
                    );
                  }}
                  className="text-[11px] text-[#86efac] hover:underline font-light"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a4aca0]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="officer-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  disabled={isLoading || authSuccess}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#23261f]/80 text-xs text-[#eef3e7] placeholder-[#7c8177] border transition-colors focus:outline-none ${
                    fieldErrors.password
                      ? 'border-red-400/80 focus:border-red-400'
                      : 'border-white/10 focus:border-[#86efac]/60 focus:bg-[#23261f]'
                  } disabled:opacity-50`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={isLoading || authSuccess}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a4aca0] hover:text-[#eef3e7] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Workstation Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                disabled={isLoading || authSuccess}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#23261f] border-white/20 text-[#22c55e] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-xs text-[#a4aca0] cursor-pointer select-none font-light"
              >
                Remember this workstation for 24 hours
              </label>
            </div>

            {/* Sign in Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || authSuccess}
                className="w-full py-2.5 px-4 rounded-xl pill-button text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(134,239,172,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#23261f]" />
                    <span>Authenticating...</span>
                  </>
                ) : authSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#23261f]" />
                    <span>Signed In</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>

          {/* Security Policy Notice */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#a4aca0] font-light">
              <ShieldCheck className="w-3.5 h-3.5 text-[#86efac]" />
              <span>Municipal SWD TLS Encrypted Session</span>
            </div>
            <p className="text-[10px] text-[#7c8177] mt-1.5 leading-normal">
              Authorized municipal stormwater personnel only. Unauthorized access attempts are monitored and recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
