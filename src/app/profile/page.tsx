"use client";

import { useAppStore } from "@/store/app-store";

export default function ProfilePage() {
  const { state, loading, updateProfile } = useAppStore();

  if (loading || !state) return <div>Chargement…</div>;

  const profile = state.profile;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Profil</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nom complet</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={profile.fullName}
          onChange={(e) =>
            updateProfile({ fullName: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Headline</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={profile.headline}
          onChange={(e) =>
            updateProfile({ headline: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={profile.email ?? ""}
          onChange={(e) =>
            updateProfile({ email: e.target.value })
          }
        />
      </div>
    </div>
  );
}
