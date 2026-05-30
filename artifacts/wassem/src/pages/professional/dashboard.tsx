import { useGetProfessionalDashboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Briefcase, CheckCircle, Clock, Scissors, ChevronRight, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { VerifiedBadge } from "@/components/verified-badge";

export default function ProfessionalDashboard() {
  const { data: dashboard, isLoading } = useGetProfessionalDashboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-secondary/20 via-card to-card border-secondary/20 rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                {user?.isVerified && (
                  <div className="flex items-center gap-1 bg-primary/20 border border-primary/30 rounded-full px-2 py-0.5">
                    <VerifiedBadge size="sm" />
                    <span className="text-xs text-primary font-bold">Verified by Tawoss</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">{user?.location || "Location not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/20 rounded-3xl shadow-[0_0_20px_rgba(0,193,255,0.05)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={18} className="text-primary" />
              <p className="text-sm text-primary font-medium">Available Jobs</p>
            </div>
            <p className="text-4xl font-extrabold text-white">{dashboard?.availableJobs ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={18} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">My Bids</p>
            </div>
            <p className="text-4xl font-extrabold text-white">{dashboard?.myBids ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-card border-secondary/20 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={18} className="text-secondary" />
              <p className="text-sm text-secondary font-medium">Accepted Bids</p>
            </div>
            <p className="text-4xl font-extrabold text-white">{dashboard?.acceptedBids ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Link href="/professional/jobs">
        <Button className="w-full rounded-full bg-gradient-to-r from-primary to-secondary text-black font-bold py-6 text-lg shadow-[0_0_30px_rgba(0,193,255,0.2)] hover:shadow-[0_0_40px_rgba(0,193,255,0.3)] transition-all">
          <Briefcase className="mr-2" size={20} /> Browse Available Jobs
        </Button>
      </Link>

      {/* Recent Available Jobs */}
      {dashboard?.recentJobs && dashboard.recentJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Nearby Requests</h2>
            <Link href="/professional/jobs">
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full hover:text-white">
                View all <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {dashboard.recentJobs.map((job) => (
              <Link key={job.id} href={`/professional/bid/${job.id}`}>
                <Card className="bg-card border-card-border rounded-2xl hover:border-secondary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-black transition-colors">
                        <Scissors size={18} />
                      </div>
                      <div>
                        <p className="font-bold capitalize text-white">{job.service?.replace("_", " ")}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} /> {job.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-white">{job.budget} MAD</p>
                        <p className="text-xs text-muted-foreground">{job.bidsCount || 0} bids</p>
                      </div>
                      <ChevronRight className="text-muted-foreground" size={18} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
