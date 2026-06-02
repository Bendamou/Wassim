import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Star, Wallet } from "lucide-react";

export default function SalonAnalytics() {
  const { t } = useI18n();

  // Mock data for analytics
  const mockData = {
    revenue: 4250,
    chairsBusy: 85, // percentage
    avgRating: 4.8,
    totalClients: 124,
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(155,48,255,0.4)] text-accent">
            {t.analytics}
          </h2>
          <p className="text-muted-foreground mt-1">Performance overview for your salon</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.thisWeek}</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{mockData.revenue} {t.mad}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.chairsBusy}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mockData.chairsBusy}%</div>
            <p className="text-xs text-muted-foreground mt-1">Utilization rate</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.avgRating}</CardTitle>
            <Star className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{mockData.avgRating}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on 48 reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Walk-ins</CardTitle>
            <BarChart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{mockData.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="h-64 bg-card border border-border rounded-xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="text-center relative z-10 p-6">
          <BarChart className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Detailed charts coming soon</h3>
          <p className="text-muted-foreground text-sm max-w-sm">We are building powerful visualizations for your revenue, busiest hours, and staff performance.</p>
        </div>
      </div>
    </div>
  );
}
