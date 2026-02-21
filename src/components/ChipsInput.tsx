"use client";

import { useState } from "react";

export default function ChipsInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addOne(raw: string) {
    const v = raw.trim();
    if (!v) return;

    const exists = values.some((x) => x.toLowerCase() === v.toLowerCase());
    if (exists) return;

    onChange([...values, v]);
  }

  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  function submitDraft() {
    const v = draft.trim();
    if (!v) return;
    addOne(v);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>

      <div className="flex flex-wrap gap-2">
        {values.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            onClick={() => removeAt(i)}
            className="border rounded-full px-3 py-1 text-sm bg-white hover:bg-gray-50"
            title="Cliquer pour supprimer"
          >
            {t} <span className="opacity-60">×</span>
          </button>
        ))}
      </div>

      <input
        className="border rounded px-3 py-2 w-full"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submitDraft();
          }
        }}
        onBlur={submitDraft}
      />
    </div>
  );
}