import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-md mx-4 border rounded-xl p-8"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <div className="flex mb-4 gap-3 items-center">
          <AlertCircle className="h-8 w-8" style={{ color: 'var(--loss)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            404 — Page Not Found
          </h1>
        </div>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          Did you forget to add the page to the router?
        </p>
      </div>
    </div>
  );
}
