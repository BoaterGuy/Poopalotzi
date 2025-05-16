import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Router, Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";

// Public Pages
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Member Pages
import MemberDashboard from "@/pages/member/Dashboard";
import MemberProfile from "@/pages/member/Profile";
import MemberBoatManagement from "@/pages/member/BoatManagement";
import MemberRequestService from "@/pages/member/RequestService";
import MemberServiceHistory from "@/pages/member/ServiceHistory";
import MemberServiceSubscription from "@/pages/member/ServiceSubscription";

// Employee Pages
import EmployeeSchedule from "@/pages/employee/Schedule";
import EmployeeManualEntry from "@/pages/employee/ManualEntry";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCustomerManagement from "@/pages/admin/CustomerManagement";
import AdminMarinaManagement from "@/pages/admin/MarinaManagement";
import AdminRequestManagement from "@/pages/admin/RequestManagement";
import AdminCalendar from "@/pages/admin/Calendar";
import AdminServiceLevelManagement from "@/pages/admin/ServiceLevelManagement";
import AdminManualServiceEntry from "@/pages/admin/AdminManualServiceEntry";

import PageLayout from "./components/layout/PageLayout";
import { useAuth } from "./hooks/use-auth";
import { Redirect } from "wouter";

// Role-based route guards
const MemberRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

const EmployeeRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

const AdminRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PageLayout>
              <Switch>
                {/* Public Routes */}
                <Route path="/" component={Home} />
                <Route path="/services" component={Services} />
                <Route path="/about" component={About} />
                <Route path="/contact" component={Contact} />
                <Route path="/auth" component={AuthPage} />
                
                {/* Member Routes */}
                <Route path="/member/dashboard">
                  <MemberRoute component={MemberDashboard} path="/member/dashboard" />
                </Route>
                <Route path="/member/profile">
                  <MemberRoute component={MemberProfile} path="/member/profile" />
                </Route>
                <Route path="/member/boats">
                  <MemberRoute component={MemberBoatManagement} path="/member/boats" />
                </Route>
                <Route path="/member/request-service">
                  <MemberRoute component={MemberRequestService} path="/member/request-service" />
                </Route>
                {/* Add support for /member/request as an alternative URL */}
                <Route path="/member/request">
                  <MemberRoute component={MemberRequestService} path="/member/request" />
                </Route>
                <Route path="/member/service-history">
                  <MemberRoute component={MemberServiceHistory} path="/member/service-history" />
                </Route>
                <Route path="/member/subscription">
                  <MemberRoute component={MemberServiceSubscription} path="/member/subscription" />
                </Route>
                
                {/* Employee Routes */}
                <Route path="/employee/schedule">
                  <EmployeeRoute component={EmployeeSchedule} path="/employee/schedule" />
                </Route>
                <Route path="/employee/manual-entry">
                  <EmployeeRoute component={EmployeeManualEntry} path="/employee/manual-entry" />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard">
                  <AdminRoute component={AdminDashboard} path="/admin/dashboard" />
                </Route>
                <Route path="/admin/customers">
                  <AdminRoute component={AdminCustomerManagement} path="/admin/customers" />
                </Route>
                <Route path="/admin/marinas">
                  <AdminRoute component={AdminMarinaManagement} path="/admin/marinas" />
                </Route>
                <Route path="/admin/requests">
                  <AdminRoute component={AdminRequestManagement} path="/admin/requests" />
                </Route>
                <Route path="/admin/calendar">
                  <AdminRoute component={AdminCalendar} path="/admin/calendar" />
                </Route>
                <Route path="/admin/service-levels">
                  <AdminRoute component={AdminServiceLevelManagement} path="/admin/service-levels" />
                </Route>
                <Route path="/admin/manual-service-form">
                  <AdminRoute component={AdminManualServiceEntry} path="/admin/manual-service-form" />
                </Route>
                
                {/* 404 Route */}
                <Route component={NotFound} />
              </Switch>
            </PageLayout>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
