import { useListJobs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Scissors, MapPin, Clock, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  open: "text-primary bg-primary/10 border-primary/30",
  in_progress: "text-secondary bg-secondary/10 border-secondary/30",
  completed: "text-green-400 bg-green-400/10 border-green-400/30",
  cancelled: "text-muted-foreground bg-muted/10 border-muted/30",
};

export default function ClientJobs() {
  const { data: jobs, isLoading } = useListJobs();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">All your grooming requests</p>
        </div>
        <Link href="/client/post-job">
          <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,193,255,0.3)]">
            <Plus size={16} className="mr-1" /> New Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/client/jobs/${job.id}/bids`}>
              <Card className="bg-card border-card-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-black transition-colors">
                      <Scissors size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold capitalize text-white">{job.service?.replace("_", " ")}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusColors[job.status] || statusColors.open}`}>
                          {job.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                        {job.scheduledTime && (
                          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(job.scheduledTime).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-white">{job.budget} MAD</p>
                      <p className="text-xs text-primary font-medium">{job.bidsCount || 0} bids</p>
                    </div>
                    <ChevronRight className="text-muted-foreground" size={20} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-card-border rounded-3xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Scissors className="text-muted-foreground" size={28} />
          </div>
          <p className="text-lg font-bold text-white mb-1">No jobs yet</p>
          <p className="text-muted-foreground text-sm mb-6">Post your first request and get bids instantly</p>
          <Link href="/client/post-job">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,193,255,0.3)]">
              <Plus size={16} className="mr-2" /> Post a Job
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
