import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Scissors, MapPin, Clock, ChevronRight, Zap, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const serviceLabels: Record<string, string> = {
  haircut: "Haircut",
  beard: "Beard Trim",
  nails: "Nails",
  full_grooming: "Full Grooming",
};

export default function JobBoard() {
  const { data: jobs, isLoading } = useListJobs({
    query: { queryKey: getListJobsQueryKey(), refetchInterval: 10000 },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Job Board</h1>
          <div className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
            <Zap size={10} /> Live
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Open grooming requests near you — bid to win</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/professional/bid/${job.id}`}>
              <Card className="bg-card border-card-border rounded-2xl hover:border-secondary/50 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-secondary group-hover:text-black transition-colors">
                        <Scissors size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white capitalize">{serviceLabels[job.service] || job.service}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                          {job.scheduledTime && (
                            <span className="flex items-center gap-1"><Clock size={11} /> {new Date(job.scheduledTime).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {(job.bidsCount || 0) === 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20 font-medium">Be the first to bid</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-medium">{job.bidsCount} competing bids</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-white">{job.budget}</p>
                        <p className="text-xs text-muted-foreground">MAD</p>
                      </div>
                      <ChevronRight className="text-muted-foreground" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-card-border rounded-3xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-secondary" size={28} />
          </div>
          <p className="text-lg font-bold text-white mb-1">No open jobs right now</p>
          <p className="text-muted-foreground text-sm">Check back soon — clients post jobs regularly</p>
        </div>
      )}
    </div>
  );
}
