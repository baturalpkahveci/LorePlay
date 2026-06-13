import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Cloud, Eye, EyeOff, KeyRound, LockKeyhole, LogIn, LogOut, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type AuthMode = 'signIn' | 'signUp' | 'forgot';

export const AuthControls = () => {
  const { user, capabilities, signIn, signUp, signOut, requestPasswordReset } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = mode === 'forgot'
      ? await requestPasswordReset(email)
      : mode === 'signUp'
        ? await signUp(name.trim() || email.split('@')[0] || 'User', email, password)
        : await signIn(email, password);
    setSubmitting(false);

    if (result) {
      setError(result);
      return;
    }

    if (mode === 'forgot') {
      setMessage('If an account exists for this email, a reset link has been sent.');
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setIsOpen(false);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 md:block">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-success-custom)]"><Cloud size={13} /> Signed in</div>
          <div className="mt-0.5 max-w-36 truncate text-xs text-[var(--text-secondary)]">{user.email}</div>
        </div>
        <button onClick={() => void signOut()} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--color-danger-custom)] hover:text-[var(--color-danger-custom)]" title="Sign out" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  const isSignUp = mode === 'signUp';
  const isForgot = mode === 'forgot';

  return (
    <>
      <button
        onClick={() => { changeMode('signIn'); setIsOpen(true); }}
        disabled={!capabilities.authConfigured}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50"
        title={capabilities.authConfigured ? 'Sign in for cloud sync' : 'Add VITE_NEON_AUTH_URL to .env to enable sign in'}
      >
        <LogIn size={17} /> <span className="hidden lg:inline">Sign in</span>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[1000] grid min-h-dvh w-screen place-items-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Account access"
          onMouseDown={() => setIsOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-md overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl shadow-black/60"
          >
            <div className="relative border-b border-[var(--border-color)] bg-[linear-gradient(135deg,_rgba(56,189,248,0.14),_rgba(52,211,153,0.05),_rgba(24,28,35,0.96))] p-5 sm:p-6">
              <button type="button" onClick={() => setIsOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-black/20 hover:text-white" aria-label="Close"><X size={18} /></button>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-brand)] text-slate-950 shadow-lg shadow-sky-500/20">
                {isForgot ? <KeyRound size={22} /> : <UserRound size={22} />}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">LorePlay Account</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{isForgot ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                {isForgot ? 'Enter your account email and we will send a secure reset link.' : 'Sync your journal securely across devices with your Neon-backed account.'}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {!isForgot && (
                <div className="mb-5 grid grid-cols-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-1">
                  <button type="button" onClick={() => changeMode('signIn')} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'signIn' ? 'bg-[var(--bg-surface-hover)] text-white shadow' : 'text-[var(--text-secondary)] hover:text-white'}`}>Sign in</button>
                  <button type="button" onClick={() => changeMode('signUp')} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'signUp' ? 'bg-[var(--bg-surface-hover)] text-white shadow' : 'text-[var(--text-secondary)] hover:text-white'}`}>Create account</button>
                </div>
              )}

              <div className="space-y-3">
                {isSignUp && (
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" autoComplete="name" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-3 outline-none transition focus:border-[var(--color-brand)]" />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-3 outline-none transition focus:border-[var(--color-brand)]" />
                </div>

                {!isForgot && (
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                    <input type={showPassword ? 'text' : 'password'} required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (10+ characters)" autoComplete={isSignUp ? 'new-password' : 'current-password'} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-11 outline-none transition focus:border-[var(--color-brand)]" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                )}

                {isSignUp && (
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                    <input type={showConfirmPassword ? 'text' : 'password'} required minLength={10} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" autoComplete="new-password" className={`w-full rounded-lg border bg-[var(--bg-main)] py-3 pl-10 pr-11 outline-none transition ${confirmPassword && password !== confirmPassword ? 'border-[var(--color-danger-custom)]' : 'border-[var(--border-color)] focus:border-[var(--color-brand)]'}`} />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-white" aria-label={showConfirmPassword ? 'Hide repeated password' : 'Show repeated password'}>
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                )}
              </div>

              {isSignUp && confirmPassword && password !== confirmPassword && <p className="mt-2 text-xs text-[var(--color-danger-custom)]">Passwords do not match.</p>}
              {isForgot && <p className="mt-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm leading-5 text-[var(--text-secondary)]">The reset email is sent by Neon Auth. Email delivery and sender settings are managed from Neon Console.</p>}
              {error && <p className="mt-3 rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 p-3 text-sm text-[var(--color-danger-custom)]">{error}</p>}
              {message && <p className="mt-3 rounded-lg border border-[var(--color-success-custom)]/30 bg-[var(--color-success-custom)]/10 p-3 text-sm text-[var(--color-success-custom)]">{message}</p>}

              <button type="submit" disabled={submitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-3 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                {isForgot ? <Mail size={17} /> : <ShieldCheck size={17} />}
                {submitting ? 'Please wait...' : isForgot ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in securely'}
              </button>

              {mode === 'signIn' && (
                <button type="button" onClick={() => changeMode('forgot')} className="mt-3 w-full text-sm font-medium text-[var(--color-brand)] hover:underline">Forgot password?</button>
              )}
              {isForgot && (
                <button type="button" onClick={() => changeMode('signIn')} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white"><ArrowLeft size={15} /> Back to sign in</button>
              )}
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
};
