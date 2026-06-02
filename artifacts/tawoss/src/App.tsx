import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { queryClient } from "@/lib/query-client";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Shared
import Profile from "@/pages/profile";

// Client
import ClientHome from "@/pages/client/home";
import Explore from "@/pages/client/explore";
import ClientJobs from "@/pages/client/jobs";
import JobBids from "@/pages/client/bids";
import PostJob from "@/pages/client/post-job";
import Favorites from "@/pages/client/favorites";

// Professional
import ProHome from "@/pages/pro/home";
import ProJobs from "@/pages/pro/jobs";

// Salon
import SalonDashboard from "@/pages/salon/dashboard";
import SalonAnalytics from "@/pages/salon/analytics";
import SalonDetail from "@/pages/salon/salon-detail";

// Protect routes component
const ProtectedRoute = ({ component: Component, role, ...rest }: any) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Redirect to="/" />;
  if (role && user?.role !== role) {
    if (user?.role === "client") return <Redirect to="/home" />;
    if (user?.role === "professional") return <Redirect to="/pro/home" />;
    if (user?.role === "salon_owner") return <Redirect to="/salon/dashboard" />;
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

function Router() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to={user?.role === "client" ? "/home" : user?.role === "professional" ? "/pro/home" : "/salon/dashboard"} />
        ) : (
          <Welcome />
        )}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Client Routes */}
      <Route path="/home"><ProtectedRoute component={ClientHome} role="client" /></Route>
      <Route path="/explore"><ProtectedRoute component={Explore} role="client" /></Route>
      <Route path="/jobs"><ProtectedRoute component={ClientJobs} role="client" /></Route>
      <Route path="/jobs/:id/bids"><ProtectedRoute component={JobBids} role="client" /></Route>
      <Route path="/post-job"><ProtectedRoute component={PostJob} role="client" /></Route>
      <Route path="/favorites"><ProtectedRoute component={Favorites} role="client" /></Route>
      <Route path="/salon/:id"><ProtectedRoute component={SalonDetail} /></Route>

      {/* Professional Routes */}
      <Route path="/pro/home"><ProtectedRoute component={ProHome} role="professional" /></Route>
      <Route path="/pro/jobs"><ProtectedRoute component={ProJobs} role="professional" /></Route>

      {/* Salon Routes */}
      <Route path="/salon/dashboard"><ProtectedRoute component={SalonDashboard} role="salon_owner" /></Route>
      <Route path="/salon/analytics"><ProtectedRoute component={SalonAnalytics} role="salon_owner" /></Route>

      {/* Shared Routes */}
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/pro/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/salon/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Fallback for unhandled routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Layout>
                <Router />
              </Layout>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
