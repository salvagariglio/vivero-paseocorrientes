'use client';

import { useFormStatus } from 'react-dom';

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-soft">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const base =
  'w-full rounded-sm rounded-card border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/60 focus:border-primary';

export function Input(props) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${base} ${props.className ?? ''}`} />;
}

export function Select(props) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />;
}

export function Check({ name, label, defaultChecked, hint }) {
  return (
    <label className="flex items-start gap-3 py-1.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-[var(--c-primary)]"
      />
      <span>
        <span className="text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children = 'Guardar cambios', variant = 'primary' }) {
  const { pending } = useFormStatus();
  const styles =
    variant === 'danger'
      ? 'border border-accent text-accent hover:bg-accent hover:text-on-dark'
      : 'bg-primary text-on-dark hover:opacity-90';

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-pill px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${styles}`}
    >
      {pending ? 'Guardando…' : children}
    </button>
  );
}

export function FormStatus({ state }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? 'text-primary' : 'text-accent'}`}>
      {state.message}
    </p>
  );
}

export function Fieldset({ title, description, children }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="rule font-display text-2xl leading-none text-ink">{title}</h2>
      {description && <p className="mt-2 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
