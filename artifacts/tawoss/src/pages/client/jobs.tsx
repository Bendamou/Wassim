import { useListJobs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MapPin, Clock, ArrowRight, Briefcase } from "lucide-react";

export default function ClientJobs() {
  const { t, lang } = useI18n();
  const { data: jobs, isLoading } = useListJobs();

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(0,180,255,0.4)]">{t.myJobs}</h2>
        <Link href="/post-job">
          <Button size="sm" className="gap-2 shadow-[0_0_15px_rgba(0,180,255,0.3)]">
            <PlusCircle className="h-4 w-4" /> {t.postNewJob}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : jobs?.length ? (
        <div className="space-y-4">
          {jobs.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}/bids`}>
              <Card className="bg-card/80 backdrop-blur hover:bg-muted/50 transition-colors cursor-pointer border-border hover:border-primary/50 group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          job.status === "open" ? "bg-primary/20 text-primary border border-primary/30" :
                          job.status === "in_progress" ? "bg-secondary/20 text-secondary border border-secondary/30" :
                          job.status === "completed" ? "bg-green-500/20 text-green-500 border border-green-500/30" :
                          "bg-muted text-muted-foreground border border-border"
                        }`}>
                          {job.status === "open" ? t.statusOpen : job.status === "in_progress" ? t.statusInProgress : job.status === "completed" ? t.statusCompleted : t.statusCancelled}
                        </div>
                        {job.status === "open" && job.bidsCount ? (
                          <span className="text-xs font-bold text-secondary animate-pulse">
                            {job.bidsCount} new bids!
                          </span>
                        ) : null}
                      </div>
                      
                      <h3 className="text-xl font-bold capitalize">{job.service.replace("_", " ")}</h3>
                      
                      <div className="space-y-1 mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </div>
                        {job.scheduledTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" /> {new Date(job.scheduledTime).toLocaleString(lang)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between h-full">
                      <div className="text-xl font-black text-primary drop-shadow-[0_0_5px_rgba(0,180,255,0.3)]">
                        {job.budget} {t.mad}
                      </div>
                      
                      <div className="mt-8 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 border border-dashed rounded-xl border-border bg-card/20 flex flex-col items-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">{t.noJobsYet}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">{t.clientsPosting}</p>
          <Link href="/post-job">
            <Button className="shadow-[0_0_15px_rgba(0,180,255,0.3)]">{t.postFirstJob}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
