import { Link, useLocation } from "wouter";
import { Scissors, User as UserIcon, LayoutDashboard, Briefcase, FileText, CheckCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const PeacockMascot = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="peacock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C1FF" />
        <stop offset="100%" stopColor="#FF00FF" />
      </linearGradient>
    </defs>
    <path d="M50 20 C60 10, 80 15, 85 30 C90 45, 75 60, 60 70 C70 85, 55 95, 50 90 C45 95, 30 85, 40 70 C25 60, 10 45, 15 30 C20 15, 40 10, 50 20 Z" fill="url(#peacock-gradient)" opacity="0.8" />
    <path d="M50 35 L45 50 L55 50 Z" fill="#0A0A0A" />
    <circle cx="43" cy="30" r="3" fill="#0A0A0A" />
    <circle cx="57" cy="30" r="3" fill="#0A0A0A" />
    <path d="M30 65 L45 90 L50 85 L35 60 Z" fill="#00C1FF" />
    <path d="M70 65 L55 90 L50 85 L65 60 Z" fill="#FF00FF" />
    <circle cx="40" cy="85" r="8" stroke="#00C1FF" strokeWidth="3" fill="none" />
    <circle cx="60" cy="85" r="8" stroke="#FF00FF" strokeWidth="3" fill="none" />
  </svg>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <div className="min-h-[100dvh] bg-background text-foreground pb-20 md:pb-0">{children}</div>;

  const isClient = user.role === "client";

  const clientNav = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/post-job", label: "Post Job", icon: Scissors },
    { href: "/client/jobs", label: "My Jobs", icon: FileText },
  ];

  const profNav = [
    { href: "/professional/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/professional/jobs", label: "Job Board", icon: Briefcase },
    { href: "/professional/profile", label: "Profile", icon: UserIcon },
  ];

  const navItems = isClient ? clientNav : profNav;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-card-border p-4 h-[100dvh] sticky top-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <PeacockMascot />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            WASSEM
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-white border border-primary/30"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-primary" : ""} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-card-border">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/30">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                {user.isVerified && <CheckCircle size={12} className="text-primary" />}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card/80 backdrop-blur-md border-b border-card-border sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8"><PeacockMascot /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              WASSEM
            </h1>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive">
            <LogOut size={20} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-card-border pb-safe z-50">
        <div className="flex justify-around p-2">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1 p-2 w-16 cursor-pointer">
                  <div
                    className={`p-2 rounded-full transition-colors ${
                      isActive ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
