import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import AuthPage from "@/pages/auth";
import ClientDashboard from "@/pages/client/dashboard";
import PostJob from "@/pages/client/post-job";
import ClientJobs from "@/pages/client/jobs";
import BiddingRoom from "@/pages/client/bidding-room";
import ProfessionalDashboard from "@/pages/professional/dashboard";
import JobBoard from "@/pages/professional/job-board";
import SendBid from "@/pages/professional/send-bid";
import ProfessionalProfile from "@/pages/professional/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  allowedRole,
}: {
  component: React.ComponentType;
  allowedRole?: "client" | "professional";
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return <AuthPage />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {user ? (
            user.role === "client" ? (
              <ProtectedRoute component={ClientDashboard} allowedRole="client" />
            ) : (
              <ProtectedRoute component={ProfessionalDashboard} allowedRole="professional" />
            )
          ) : (
            <AuthPage />
          )}
        </Route>

        {/* Client Routes */}
        <Route path="/client/dashboard">
          <ProtectedRoute component={ClientDashboard} allowedRole="client" />
        </Route>
        <Route path="/client/post-job">
          <ProtectedRoute component={PostJob} allowedRole="client" />
        </Route>
        <Route path="/client/jobs">
          <ProtectedRoute component={ClientJobs} allowedRole="client" />
        </Route>
        <Route path="/client/jobs/:id/bids">
          <ProtectedRoute component={BiddingRoom} allowedRole="client" />
        </Route>

        {/* Professional Routes */}
        <Route path="/professional/dashboard">
          <ProtectedRoute component={ProfessionalDashboard} allowedRole="professional" />
        </Route>
        <Route path="/professional/jobs">
          <ProtectedRoute component={JobBoard} allowedRole="professional" />
        </Route>
        <Route path="/professional/bid/:jobId">
          <ProtectedRoute component={SendBid} allowedRole="professional" />
        </Route>
        <Route path="/professional/profile">
          <ProtectedRoute component={ProfessionalProfile} allowedRole="professional" />
        </Route>

        <Route component={NotFound} />
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
