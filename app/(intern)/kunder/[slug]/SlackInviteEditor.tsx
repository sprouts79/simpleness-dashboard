"use client";

import { useState, useTransition } from "react";
import { saveSlackInviteAction } from "./actions";

export default function SlackInviteEditor({
  slug,
  initialUrl,
}: {
  slug: string;
  initialUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialUrl ?? "");
  const [savedUrl, setSavedUrl] = useState<string | null>(initialUrl);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    const trimmed = value.trim();
    startTransition(async () => {
      const res = await saveSlackInviteAction(slug, trimmed || null);
      if (res.ok) {
        setSavedUrl(trimmed || null);
        setEditing(false);
      } else {
        setError(res.error ?? "Kunne ikke lagre");
      }
    });
  }

  function cancel() {
    setValue(savedUrl ?? "");
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-neutral-200 first:border-t-0 text-sm">
        <span className="text-neutral-500">Invite-lenke</span>
        <div className="flex items-center gap-3 min-w-0">
          {savedUrl ? (
            <a
              href={savedUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[13px] text-[#515b12] hover:underline truncate max-w-[280px]"
            >
              {savedUrl}
            </a>
          ) : (
            <span className="text-neutral-400 text-[13px]">Mangler</span>
          )}
          <button onClick={() => setEditing(true)} className="text-xs text-[#515b12] hover:underline">
            {savedUrl ? "Endre" : "Legg til"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-t border-neutral-200 first:border-t-0">
      <label className="block text-xs text-neutral-500 mb-1.5">Invite-lenke</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://join.slack.com/share/..."
        autoFocus
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:border-neutral-400"
      />
      {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={save}
          disabled={pending}
          className="px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-black disabled:opacity-40"
        >
          {pending ? "Lagrer …" : "Lagre"}
        </button>
        <button
          onClick={cancel}
          disabled={pending}
          className="px-3 py-1.5 rounded-md border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-100"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
