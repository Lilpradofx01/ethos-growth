import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { useApp } from "@/context/app-context";
import { Moon, Sun } from "lucide-react";

export function SiteHeader() {
  const { user, theme, toggleTheme } = useApp();
  return (
    <header className="sticky top-0 z-30 glass border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2"><Logo /></Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/features" className="hover:text-primary">Features</Link>
          <Link to="/investments" className="hover:text-primary">Invest</Link>
          <Link to="/cards" className="hover:text-primary">Cards</Link>
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/contact" className="hover:text-primary">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-muted">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <Link to="/dashboard" className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">Dashboard</Link>
          ) : (
            <>
              <Link to="/auth" className="rounded-lg px-3 py-2 text-sm">Sign in</Link>
              <Link to="/auth" className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}