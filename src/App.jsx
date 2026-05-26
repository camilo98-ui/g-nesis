import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import GenesisCommandCenter from './pages/GenesisCommandCenter';
import SalesReportView from './pages/SalesReportView';
import PYGDashboard from './pages/PYGDashboard';
import HourlyTransactions from './pages/HourlyTransactions';
import BudgetNew from './pages/BudgetNew';
import PowerBIReport from './pages/PowerBIReport';
import ProductTicketAnalysisPage from './pages/ProductTicketAnalysisPage';
import RadarCompetitivo from './pages/RadarCompetitivo';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NovaProvider } from '@/components/NovaContext';
import { PYGDashboardProvider } from '@/components/PYGDashboardContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {MainPage && <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/GenesisCommandCenter" element={<LayoutWrapper currentPageName="GenesisCommandCenter"><GenesisCommandCenter /></LayoutWrapper>} />
      <Route path="/SalesReportView" element={<LayoutWrapper currentPageName="SalesReportView"><SalesReportView /></LayoutWrapper>} />
      <Route path="/PYGDashboard" element={<LayoutWrapper currentPageName="PYGDashboard"><PYGDashboard /></LayoutWrapper>} />
      <Route path="/HourlyTransactions" element={<HourlyTransactions />} />
      <Route path="/Budget" element={<LayoutWrapper currentPageName="Budget"><BudgetNew /></LayoutWrapper>} />
      <Route path="/PowerBIReport" element={<LayoutWrapper currentPageName="PowerBIReport"><PowerBIReport /></LayoutWrapper>} />
      <Route path="/ProductTicketAnalysis" element={<LayoutWrapper currentPageName="ProductTicketAnalysis"><ProductTicketAnalysisPage /></LayoutWrapper>} />
      <Route path="/RadarCompetitivo" element={<RadarCompetitivo />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <NovaProvider>
      <PYGDashboardProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
      </PYGDashboardProvider>
      </NovaProvider>
    </AuthProvider>
  )
}

export default App