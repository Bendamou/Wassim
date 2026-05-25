import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import RequestService from "@/pages/request";
import RequestMulti from "@/pages/request-multi";
import MatchScreen from "@/pages/match";
import TrackingPage from "@/pages/tracking";
import ProRequests from "@/pages/pro/requests";
import ProBid from "@/pages/pro/bid";
import Profile from "@/pages/profile";
import SalonProfile from "@/pages/salon/profile";
import SalonDashboard from "@/pages/salon/dashboard";
import SalonAnalytics from "@/pages/salon/analytics";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"><Guard><Home /></Guard></Route>
        <Route path="/request"><Guard><RequestService /></Guard></Route>
        <Route path="/request-multi"><Guard><RequestMulti /></Guard></Route>
        <Route path="/match/:id"><Guard><MatchScreen /></Guard></Route>
        <Route path="/tracking/:jobId"><Guard><TrackingPage /></Guard></Route>
        <Route path="/pro/requests"><Guard><ProRequests /></Guard></Route>
        <Route path="/pro/bid/:jobId"><Guard><ProBid /></Guard></Route>
        <Route path="/salon/dashboard"><Guard><SalonDashboard /></Guard></Route>
        <Route path="/salon/analytics"><Guard><SalonAnalytics /></Guard></Route>
        <Route path="/salon/:id"><Guard><SalonProfile /></Guard></Route>
        <Route path="/profile"><Guard><Profile /></Guard></Route>
        <Route><Guard><Home /></Guard></Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
