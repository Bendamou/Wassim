import { useGetProfessionalDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProHome() {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const { data: dashboard, isLoading } = useGetProfessionalDashboard({
    query: {
      retry: false,
    }
  });

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight drop-shadow-[0_0_8px_rgba(255,31,142,0.4)] text-secondary">
            {t.welcomeBack}, {user?.name.split(" ")[0]}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{t.rolePro}</p>
            {user?.isVerified && (
              <span className="flex items-center gap-1 text-xs text-primary font-bold">
                <CheckCircle2 className="h-3 w-3" /> {t.verifiedPro}
              </span>
            )}
          </div>
        </div>
        <Avatar className="h-12 w-12 border-2 border-secondary">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-secondary/20 text-secondary font-bold">
            {user?.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-[0_4px_20px_-5px_rgba(0,180,255,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.availableJobs}</CardTitle>
            <Briefcase className="h-4 w-4 text-primary animate-pulse" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{dashboard?.availableJobs || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-secondary/20 shadow-[0_4px_20px_-5px_rgba(255,31,142,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.myBids}</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{dashboard?.myBids || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-green-500/20 shadow-[0_4px_20px_-5px_rgba(34,197,94,0.15)] col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.statusAccepted}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold text-green-500">{dashboard?.acceptedBids || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{t.recentJobs}</h3>
          <Link href="/pro/jobs" className="text-sm text-secondary hover:underline flex items-center gap-1">
            {t.allRequests} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : dashboard?.recentJobs?.length ? (
          <div className="space-y-3">
            {dashboard.recentJobs.map(job => (
              <div key={job.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center hover:bg-muted/50 transition-colors group">
                <div>
                  <div className="font-bold capitalize">{job.service.replace("_", " ")}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="text-primary font-medium">{job.budget} {t.mad}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mb-1 ${
                    job.status === "open" ? "bg-primary/20 text-primary" :
                    job.status === "in_progress" ? "bg-secondary/20 text-secondary" :
                    job.status === "completed" ? "bg-green-500/20 text-green-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {job.status === "open" ? t.statusOpen : job.status === "in_progress" ? t.statusInProgress : job.status === "completed" ? t.statusCompleted : t.statusCancelled}
                  </div>
                  <div className="text-muted-foreground transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 inline" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-xl border-border bg-card/20">
            <p className="text-muted-foreground mb-4">{t.noJobsYet}</p>
            <Link href="/pro/jobs">
              <Button size="sm" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {t.browseToBid}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
