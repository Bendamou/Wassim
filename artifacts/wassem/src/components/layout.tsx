import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Home, Briefcase, User } from "lucide-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <div className="min-h-[100dvh] bg-[#0A0A0A]">{children}</div>;
  }

  const isClient = user.role === "client";

  const navItems = isClient
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/request", label: "Request", icon: Briefcase },
        { href: "/profile", label: "Profile", icon: User },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/pro/requests", label: "Requests", icon: Briefcase },
        { href: "/profile", label: "Profile", icon: User },
      ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] relative">
      {/* Main content */}
      <div className="pb-20">{children}</div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 pb-safe-bottom">
        <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1 w-16 cursor-pointer">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    active
                      ? "bg-gradient-to-br from-[#00C1FF]/20 to-[#FF00FF]/20 shadow-[0_0_15px_rgba(0,193,255,0.2)]"
                      : ""
                  }`}>
                    <Icon
                      size={22}
                      className={active ? "text-[#00C1FF]" : "text-gray-600"}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${active ? "text-[#00C1FF]" : "text-gray-600"}`}>
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
