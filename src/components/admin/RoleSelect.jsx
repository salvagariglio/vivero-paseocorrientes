'use client';

export default function RoleSelect({ defaultValue }) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      aria-label="Rol"
      className="rounded-card border border-line bg-card px-2 py-1 text-xs text-ink"
    >
      <option value="editor">Editor</option>
      <option value="admin">Administrador</option>
    </select>
  );
}
