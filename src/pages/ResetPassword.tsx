import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tokenError = searchParams.get('error');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const message = await resetPassword(token, password);
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    setComplete(true);
  };

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl shadow-black/30">
        <div className="border-b border-[var(--border-color)] bg-[linear-gradient(135deg,_rgba(56,189,248,0.14),_rgba(52,211,153,0.05),_rgba(24,28,35,0.96))] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-brand)] text-slate-950"><KeyRound size={22} /></div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">LorePlay Account</p>
          <h1 className="mt-1 text-2xl font-bold">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Use at least 10 characters. Other active sessions will be signed out after the reset.</p>
        </div>

        <div className="p-6">
          {complete ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-[var(--color-success-custom)]" size={42} />
              <h2 className="mt-4 text-xl font-bold">Password updated</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Your new password is ready. Return to LorePlay and sign in.</p>
              <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-slate-950"><ArrowLeft size={16} /> Return to LorePlay</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                  <input type={showPassword ? 'text' : 'password'} required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" autoComplete="new-password" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-11 outline-none focus:border-[var(--color-brand)]" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
                  <input type={showConfirmPassword ? 'text' : 'password'} required minLength={10} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat new password" autoComplete="new-password" className={`w-full rounded-lg border bg-[var(--bg-main)] py-3 pl-10 pr-11 outline-none ${confirmPassword && password !== confirmPassword ? 'border-[var(--color-danger-custom)]' : 'border-[var(--border-color)] focus:border-[var(--color-brand)]'}`} />
                  <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--text-secondary)] hover:text-white" aria-label={showConfirmPassword ? 'Hide repeated password' : 'Show repeated password'}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
              </div>

              {(error || tokenError) && <p className="mt-3 rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 p-3 text-sm text-[var(--color-danger-custom)]">{error || 'This reset link is invalid or has expired.'}</p>}

              <button type="submit" disabled={submitting || !token || Boolean(tokenError)} className="mt-4 w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Updating password...' : 'Update password'}
              </button>
              <Link to="/" className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white"><ArrowLeft size={15} /> Back to LorePlay</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
