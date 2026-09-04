'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    const fn = mode === 'signin' ? 'signInWithPassword' : 'signUp';
    const { error } = await supabase.auth[fn]({ email, password });

    if (error) {
      setStatus({ type: 'error', message: translate(error.message) });
      setPending(false);
      return;
    }

    if (mode === 'signup') {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus({
          type: 'ok',
          message: 'Te mandamos un mail para confirmar la cuenta. Confirmala y volvé a entrar.',
        });
        setPending(false);
        return;
      }
    }

    // Convierte invitaciones pendientes de este email en membresías.
    await supabase.rpc('claim_invites');
    router.replace('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl leading-none text-ink">
          {mode === 'signin' ? 'Entrar al panel' : 'Crear cuenta'}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          {mode === 'signin'
            ? 'Administrá el catálogo, los precios y las etiquetas de tu vivero.'
            : 'Creá tu usuario. Si te invitaron a un vivero, se vincula solo al entrar.'}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-ink-soft">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>

          <label className="block">
            <span className="text-sm text-ink-soft">Contraseña</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-line bg-card px-3 py-2.5 text-ink"
            />
          </label>

          {status && (
            <p
              className={`text-sm ${status.type === 'error' ? 'text-accent' : 'text-primary'}`}
              role="status"
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary px-5 py-3 text-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setStatus(null);
          }}
          className="mt-6 text-sm text-ink-soft underline underline-offset-4 hover:text-primary"
        >
          {mode === 'signin' ? 'No tengo cuenta todavía' : 'Ya tengo cuenta'}
        </button>
      </div>
    </div>
  );
}

function translate(message) {
  const map = {
    'Invalid login credentials': 'Email o contraseña incorrectos.',
    'Email not confirmed': 'Todavía no confirmaste el email.',
    'User already registered': 'Ese email ya tiene cuenta. Entrá con tu contraseña.',
  };
  return map[message] || message;
}
