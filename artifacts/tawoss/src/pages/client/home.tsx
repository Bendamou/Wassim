import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useGetClientDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Clock, FileText, Star, ArrowRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientHome() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: dashboard, isLoading } = useGetClientDashboard({
    query: {
      retry: false,
    }
  });

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight drop-shadow-[0_0_8px_rgba(0,180,255,0.4)]">
            {t.goodMorning}, {user?.name.split(" ")[0]}
          </h2>
          <p className="text-muted-foreground mt-1">{t.appTagline}</p>
        </div>
        <Avatar className="h-12 w-12 border-2 border-primary">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold">
            {user?.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-[0_4px_20px_-5px_rgba(0,180,255,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.activeJobs}</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{dashboard?.activeJobs || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-secondary/20 shadow-[0_4px_20px_-5px_rgba(255,31,142,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.pendingBids}</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{dashboard?.pendingBids || 0}</div>}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-accent/20 shadow-[0_4px_20px_-5px_rgba(155,48,255,0.15)] col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalJobs}</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{dashboard?.totalJobs || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{t.topProfessionals}</h3>
          <Link href="/explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t.explore} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-32 shrink-0 rounded-xl" />)}
          </div>
        ) : dashboard?.topProfessionals?.length ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {dashboard.topProfessionals.map(pro => (
              <div key={pro.id} className="snap-start shrink-0 w-32 bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center">
                <Avatar className="h-14 w-14 mb-2">
                  <AvatarImage src={pro.avatar} />
                  <AvatarFallback className="bg-accent/20 text-accent font-bold">
                    {pro.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-semibold text-sm line-clamp-1 w-full">{pro.name}</div>
                <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{pro.rating?.toFixed(1) || "5.0"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-xl border-border">
            <p className="text-muted-foreground">{t.noProfessionals}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{t.recentJobs}</h3>
          <Link href="/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
            {t.myJobs} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : dashboard?.recentJobs?.length ? (
          <div className="space-y-3">
            {dashboard.recentJobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}/bids`}>
                <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div>
                    <div className="font-bold capitalize">{job.service.replace("_", " ")}</div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="text-primary font-medium">{job.budget} {t.mad}</span>
                      <span>•</span>
                      <span>{t.bidsCount(job.bidsCount || 0)}</span>
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-xl border-border bg-card/20">
            <p className="text-muted-foreground mb-4">{t.noJobsYet}</p>
            <Link href="/post-job">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" /> {t.postFirstJob}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
