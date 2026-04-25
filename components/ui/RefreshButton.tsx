"use client";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Sekundær oppdater-knapp — speiler adlaunch's "Sjekk Drive".
 * Hvit bg + tynn border + refresh-ikon. Spinner når loading.
 * Brukes til Hent data / Oppdater / Sjekk Drive på tvers av apper.
 */
export default function RefreshButton({
  onClick,
  loading = false,
  label,
  loadingLabel,
  disabled = false,
  title,
}: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={title}
      className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
          <span>{loadingLabel ?? label}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
