import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Home, Briefcase, User, LayoutDashboard, TrendingUp, DollarSign, Heart } from "lucide-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return <div className="min-h-[100dvh] bg-[#090013]">{children}</div>;

  const isSalonOwner = user.role === "salon_owner";
  const isClient = user.role === "client";

  const navItems = isSalonOwner
    ? [
        { href: "/",                label: "Map",     icon: Home },
        { href: "/salon/dashboard", label: "Salon",   icon: LayoutDashboard },
        { href: "/salon/analytics", label: "Revenue", icon: TrendingUp },
        { href: "/salon/finance",   label: "Finance", icon: DollarSign },
        { href: "/profile",         label: "Profile", icon: User },
      ]
    : isClient
    ? [
        { href: "/",           label: "Home",      icon: Home },
        { href: "/request",    label: "Request",   icon: Briefcase },
        { href: "/favorites",  label: "Favorites", icon: Heart },
        { href: "/profile",    label: "Profile",   icon: User },
      ]
    : [
        { href: "/pro/requests", label: "Jobs",     icon: Briefcase },
        { href: "/profile",      label: "Profile",  icon: User },
      ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  // Color per role
  const accentColor = isSalonOwner ? "#9B30FF" : isClient ? "#00B4FF" : "#FF1F8E";

  return (
    <div className="min-h-[100dvh] bg-[#090013] relative">
      <div className="pb-20">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#090013]/95 backdrop-blur-xl border-t border-white/5 pb-safe-bottom">
        <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
          {navItems.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1 px-2 cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                    style={active ? {
                      background: `${accentColor}18`,
                      boxShadow: `0 0 12px ${accentColor}30`,
                    } : {}}
                  >
                    <Icon size={22} style={{ color: active ? accentColor : "#4b5563" }} />
                  </div>
                  <span
                    className="text-[10px] font-bold transition-colors"
                    style={{ color: active ? accentColor : "#4b5563" }}
                  >
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
