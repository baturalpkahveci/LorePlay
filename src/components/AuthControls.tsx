import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, Eye, EyeOff, LogIn, LogOut, UserRound, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const AuthControls = () => {
  const { user, capabilities, signIn, signUp, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    const message = isSignUp
      ? await signUp(name.trim() || email.split('@')[0] || 'User', email, password)
      : await signIn(email, password);
    setSubmitting(false);
    if (message) {
      setError(message);
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!capabilities.databaseConfigured}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50"
        title={capabilities.databaseConfigured ? 'Sign in for cloud sync' : 'Configure Neon in .env to enable sign in'}
      >
        <LogIn size={17} /> <span className="hidden lg:inline">Sign in</span>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[1000] grid min-h-dvh w-screen place-items-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Account access"
          onMouseDown={() => setIsOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 shadow-2xl shadow-black/50"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-slate-950"><UserRound size={19} /></div>
                <h2 className="text-xl font-bold">{isSignUp ? 'Create account' : 'Sign in'}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Signed-in journals are stored in your Neon database.</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-white" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {isSignUp && <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" autoComplete="name" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none focus:border-[var(--color-brand)]" />}
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" autoComplete="email" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none focus:border-[var(--color-brand)]" />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={10}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password (10+ characters)"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 pr-11 outline-none focus:border-[var(--color-brand)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {isSignUp && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className={`w-full rounded-lg border bg-[var(--bg-main)] p-3 pr-11 outline-none transition ${confirmPassword && password !== confirmPassword ? 'border-[var(--color-danger-custom)]' : 'border-[var(--border-color)] focus:border-[var(--color-brand)]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-white"
                    aria-label={showConfirmPassword ? 'Hide repeated password' : 'Show repeated password'}
                    title={showConfirmPassword ? 'Hide repeated password' : 'Show repeated password'}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              )}
              {isSignUp && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-[var(--color-danger-custom)]">Passwords do not match.</p>
              )}
            </div>

            {error && <p className="mt-3 rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 p-3 text-sm text-[var(--color-danger-custom)]">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-4 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60">
              {submitting ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); setConfirmPassword(''); }} className="mt-3 w-full text-sm text-[var(--text-secondary)] hover:text-white">
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  );
};
