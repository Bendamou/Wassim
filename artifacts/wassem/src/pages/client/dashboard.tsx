import { useLocation } from "wouter";
import { Link } from "wouter";
import { useGetClientDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, MapPin, ChevronRight, Star, FileText } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading } = useGetClientDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Manage your grooming requests</p>
        </div>
        <Link href="/client/post-job" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,193,255,0.3)]">
            <Scissors className="mr-2 h-4 w-4" /> Post a Job
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Scissors size={64} />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-2">Active Jobs</p>
            <div className="text-4xl font-extrabold text-white">{dashboard.activeJobs}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/20 rounded-3xl overflow-hidden relative shadow-[0_0_30px_rgba(0,193,255,0.05)]">
          <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-primary mb-2">Pending Bids</p>
            <div className="text-4xl font-extrabold text-white">{dashboard.pendingBids}</div>
            {dashboard.pendingBids > 0 && (
              <Button onClick={() => setLocation('/client/jobs')} size="sm" className="mt-4 rounded-full bg-primary/20 text-primary hover:bg-primary/30 w-fit">
                View Bids
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-card-border rounded-3xl overflow-hidden hidden md:block">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Jobs Completed</p>
            <div className="text-4xl font-extrabold text-white">{dashboard.totalJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Barbers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Top Local Professionals</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full hover:text-white">View all <ChevronRight size={16} /></Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {dashboard.topProfessionals.map((prof) => (
            <Card key={prof.id} className="bg-card border-card-border rounded-2xl hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {prof.avatar ? (
                    <img src={prof.avatar} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {prof.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold truncate text-white">{prof.name}</p>
                    {prof.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {prof.rating?.toFixed(1) || "New"}</span>
                    <span>{prof.acceptedBids} completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {dashboard.topProfessionals.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-card-border rounded-2xl">
              No professionals found in your area yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
        <div className="space-y-3">
          {dashboard.recentJobs.map((job) => (
            <Link key={job.id} href={`/client/jobs/${job.id}/bids`}>
              <Card className="bg-card border-card-border rounded-2xl hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                      <Scissors size={20} />
                    </div>
                    <div>
                      <p className="font-bold capitalize text-white">{job.service.replace('_', ' ')}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {job.scheduledTime ? new Date(job.scheduledTime).toLocaleString() : 'ASAP'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <p className="font-bold text-white">{job.budget} MAD</p>
                      <p className="text-xs text-primary">{job.bidsCount || 0} Bids</p>
                    </div>
                    <ChevronRight className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {dashboard.recentJobs.length === 0 && (
            <div className="py-12 text-center border border-dashed border-card-border rounded-3xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="text-muted-foreground" size={24} />
              </div>
              <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
              <Link href="/client/post-job" className="mt-4 text-primary hover:underline text-sm font-medium">Post your first job</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
