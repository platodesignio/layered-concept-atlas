"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, Menu, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface HeaderUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export function Header() {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [pathname]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  const navLinks = [
    { href: "/concepts", label: "概念一覧" },
    { href: "/analysis", label: "分析" },
    { href: "/compare", label: "比較" },
    { href: "/mapping", label: "層間写像" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <Layers className="h-5 w-5 text-violet-600" />
          <span className="hidden sm:block">Layered Concept Atlas</span>
          <span className="sm:hidden">LCA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname.startsWith(l.href)
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              {l.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              管理
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.name ?? user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>ログアウト</Button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>ログイン</Button>
              <Button size="sm" onClick={() => router.push("/register")}>登録</Button>
            </div>
          )}
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-500"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300"
            >
              {l.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300">管理</Link>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            {user ? (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { logout(); setMenuOpen(false); }}>ログアウト</Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { router.push("/login"); setMenuOpen(false); }}>ログイン</Button>
                <Button size="sm" className="flex-1" onClick={() => { router.push("/register"); setMenuOpen(false); }}>登録</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
