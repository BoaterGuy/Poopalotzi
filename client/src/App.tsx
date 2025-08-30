// Removed React Query to fix vendor module TypeScript errors
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
import MemberDashboardNew from "@/pages/member/DashboardNew";
import MemberProfile from "@/pages/member/Profile";
import MemberBoatManagement from "@/pages/member/BoatManagement";
import MemberRequestService from "@/pages/member/RequestServiceMinimal";
import MemberServiceHistory from "@/pages/member/ServiceHistory";
import MemberServiceSubscription from "@/pages/member/ServiceSubscription";
import MemberServicePlans from "@/pages/member/ServicePlans";
import MemberPaymentHistory from "@/pages/member/PaymentHistory";

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
import AdminUserManagement from "@/pages/admin/UserManagement";
import CloverSettingsSimple from "@/pages/admin/CloverSettingsSimple";
import CloverConnect from "@/pages/admin/CloverConnect";

import PageLayout from "./components/layout/PageLayout";
import { useAuth } from "./hooks/use-auth";
import { Redirect } from "wouter";

// Role-based route guards
const MemberRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <Component {...rest} />;
};

const EmployeeRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== 'employee' && user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

const AdminRoute = ({ component: Component, ...rest }: { component: React.FC<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
};

function App() {
  return (
    <ThemeProvider>
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
                  <MemberRoute component={MemberDashboardNew} path="/member/dashboard" />
                </Route>
                <Route path="/member/dashboard-new">
                  <MemberRoute component={MemberDashboardNew} path="/member/dashboard-new" />
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
                <Route path="/member/service-plans">
                  <MemberRoute component={MemberServicePlans} path="/member/service-plans" />
                </Route>
                <Route path="/member/payments">
                  <MemberRoute component={MemberPaymentHistory} path="/member/payments" />
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
                <Route path="/admin/customer-management">
                  <AdminRoute component={AdminCustomerManagement} path="/admin/customer-management" />
                </Route>
                <Route path="/admin/marinas">
                  <AdminRoute component={AdminMarinaManagement} path="/admin/marinas" />
                </Route>
                <Route path="/admin/marina-management">
                  <AdminRoute component={AdminMarinaManagement} path="/admin/marina-management" />
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
                <Route path="/admin/user-management">
                  <AdminRoute component={AdminUserManagement} path="/admin/user-management" />
                </Route>
                <Route path="/admin/manual-service-form">
                  <AdminRoute component={AdminManualServiceEntry} path="/admin/manual-service-form" />
                </Route>
                <Route path="/admin/clover-settings">
                  <AdminRoute component={CloverSettingsSimple} path="/admin/clover-settings" />
                </Route>
                <Route path="/admin/clover-connect">
                  <AdminRoute component={CloverConnect} path="/admin/clover-connect" />
                </Route>
                
                {/* 404 Route */}
                <Route component={NotFound} />
              </Switch>
            </PageLayout>
          </AuthProvider>
        </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
