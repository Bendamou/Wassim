import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { 
  Home, 
  Search, 
  Briefcase, 
  PlusCircle, 
  User, 
  Activity, 
  BarChart, 
  Users 
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const getLinks = () => {
    switch (user.role) {
      case "client":
        return [
          { href: "/home", label: t.tabHome, icon: Home },
          { href: "/explore", label: t.tabExplore, icon: Search },
          { href: "/jobs", label: t.tabMyJobs, icon: Briefcase },
          { href: "/post-job", label: t.tabPostJob, icon: PlusCircle },
          { href: "/profile", label: t.tabProfile, icon: User },
        ];
      case "professional":
        return [
          { href: "/pro/home", label: t.tabHome, icon: Home },
          { href: "/pro/jobs", label: t.tabMyJobs, icon: Briefcase },
          { href: "/pro/profile", label: t.tabProfile, icon: User },
        ];
      case "salon_owner":
        return [
          { href: "/salon/dashboard", label: t.tabDashboard, icon: Activity },
          { href: "/salon/analytics", label: t.analytics, icon: BarChart },
          { href: "/salon/profile", label: t.tabProfile, icon: User },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <h1 className="text-2xl font-bold text-primary tracking-widest uppercase">
            {t.appName}
          </h1>
          <button 
            onClick={toggleLang}
            className="text-xs font-bold px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-[72px] md:pb-0 overflow-y-auto">
        {/* Mobile Header (optional) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-xl font-bold text-primary tracking-widest uppercase">
            {t.appName}
          </h1>
          <button 
            onClick={toggleLang}
            className="text-xs font-bold px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </header>
        
        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} className={isActive ? "animate-pulse" : ""} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
