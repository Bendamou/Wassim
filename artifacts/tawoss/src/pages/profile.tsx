import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, MapPin, LogOut, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    if (confirm(t.signOutMsg)) {
      logout();
      queryClient.clear();
      setLocation("/");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-8 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(155,48,255,0.4)] text-accent">{t.tabProfile}</h2>
      </div>

      <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20" />
        
        <Avatar className="h-28 w-28 border-4 border-background relative z-10 shadow-2xl">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-muted text-4xl font-black">
            {user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="mt-4 text-center z-10">
          <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
            {user.name}
            {user.isVerified && <CheckCircle2 className="h-5 w-5 text-primary" />}
          </h3>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold mt-1">
            {user.role === "client" ? t.roleClientLabel : 
             user.role === "professional" ? t.roleProLabel : 
             t.roleSalonLabel}
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0 divide-y divide-border">
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.phone}</div>
              <div className="font-medium">{user.phone || t.notSet}</div>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.email}</div>
              <div className="font-medium">{user.email || t.notSet}</div>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.location}</div>
              <div className="font-medium">{user.location || t.notSet}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="destructive" 
        className="w-full h-14 text-lg font-bold gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5" /> {t.signOut}
      </Button>
    </div>
  );
}
