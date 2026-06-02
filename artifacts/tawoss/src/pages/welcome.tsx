import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Link, useLocation } from "wouter";

export default function Welcome() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const handleRoleSelect = (role: string) => {
    localStorage.setItem("tawoss_signup_role", role);
    setLocation("/register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-6xl font-black text-primary tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,180,255,0.5)]">
          {t.appName}
        </h1>
        <p className="text-xl text-muted-foreground mt-2 font-medium tracking-wide">
          {t.appTagline}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-center text-xl font-semibold mb-6">{t.chooseRole}</h2>
        
        <button 
          onClick={() => handleRoleSelect("client")}
          className="w-full bg-card hover:bg-muted border border-border p-4 rounded-xl flex flex-col items-center transition-all hover-elevate-2 shadow-lg"
          data-testid="role-client-btn"
        >
          <span className="text-lg font-bold text-foreground">{t.roleClient}</span>
          <span className="text-sm text-muted-foreground mt-1">{t.roleClientSub}</span>
        </button>

        <button 
          onClick={() => handleRoleSelect("professional")}
          className="w-full bg-card hover:bg-muted border border-border p-4 rounded-xl flex flex-col items-center transition-all hover-elevate-2 shadow-lg"
          data-testid="role-pro-btn"
        >
          <span className="text-lg font-bold text-foreground">{t.rolePro}</span>
          <span className="text-sm text-muted-foreground mt-1">{t.roleProSub}</span>
        </button>

        <button 
          onClick={() => handleRoleSelect("salon_owner")}
          className="w-full bg-card hover:bg-muted border border-border p-4 rounded-xl flex flex-col items-center transition-all hover-elevate-2 shadow-lg"
          data-testid="role-salon-btn"
        >
          <span className="text-lg font-bold text-foreground">{t.roleSalon}</span>
          <span className="text-sm text-muted-foreground mt-1">{t.roleSalonSub}</span>
        </button>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            {t.alreadyHaveAccount}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
