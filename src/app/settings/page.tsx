"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserSettings {
  displayName: string | null;
  bio: string | null;
  friendListPublic: boolean;
  timelineVisibility: string;
  dmFromFriendsOnly: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings>({
    displayName: "",
    bio: "",
    friendListPublic: false,
    timelineVisibility: "FRIENDS_ONLY",
    dmFromFriendsOnly: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setSettings({
            displayName: d.user.displayName ?? "",
            bio: d.user.bio ?? "",
            friendListPublic: d.user.friendListPublic ?? false,
            timelineVisibility: d.user.timelineVisibility ?? "FRIENDS_ONLY",
            dmFromFriendsOnly: d.user.dmFromFriendsOnly ?? true,
          });
        }
      });
  }, [session]);

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const d = await res.json();
      setError(d.error ?? "保存失敗");
    }
    setSaving(false);
  };

  if (!session) return <div className="max-w-xl mx-auto px-4 py-8"><p>ログインが必要です。</p></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">設定</h1>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">表示名</label>
          <input
            value={settings.displayName ?? ""}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
            className="w-full border border-black px-2 py-1 text-sm"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">自己紹介</label>
          <textarea
            value={settings.bio ?? ""}
            onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
            className="w-full border border-black px-2 py-1 text-sm"
            rows={4}
            maxLength={1000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">タイムライン可視性</label>
          <select
            value={settings.timelineVisibility}
            onChange={(e) => setSettings({ ...settings, timelineVisibility: e.target.value })}
            className="w-full border border-black px-2 py-1 text-sm"
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="NETWORK_ONLY">NETWORK_ONLY</option>
            <option value="FRIENDS_ONLY">FRIENDS_ONLY</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="friendListPublic"
            checked={settings.friendListPublic}
            onChange={(e) => setSettings({ ...settings, friendListPublic: e.target.checked })}
          />
          <label htmlFor="friendListPublic" className="text-sm">友達一覧を公開する</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dmFriendsOnly"
            checked={settings.dmFromFriendsOnly}
            onChange={(e) => setSettings({ ...settings, dmFromFriendsOnly: e.target.checked })}
          />
          <label htmlFor="dmFriendsOnly" className="text-sm">DM は友達のみ受信する（推奨）</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">保存しました。</p>}
        <button onClick={save} disabled={saving} className="bg-black text-white px-4 py-2 text-sm disabled:opacity-50">
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
