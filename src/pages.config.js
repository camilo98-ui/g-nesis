import Budget from './pages/Budget';
import CashierProfile from './pages/CashierProfile';
import CashiersDashboard from './pages/CashiersDashboard';
import Communication from './pages/Communication';
import Dashboard from './pages/Dashboard';
import DesignSystem from './pages/DesignSystem';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ExecutiveExperience from './pages/ExecutiveExperience';
import FreezerMap from './pages/FreezerMap';
import Management from './pages/Management';
import PopsyPlanner from './pages/PopsyPlanner';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Quality from './pages/Quality';
import Rankings from './pages/Rankings';
import Reports from './pages/Reports';
import RoulettePopsy from './pages/RoulettePopsy';
import Sales from './pages/Sales';
import SearchCashier from './pages/SearchCashier';
import Settings from './pages/Settings';
import TWAGuide from './pages/TWAGuide';
import Team from './pages/Team';
import Training from './pages/Training';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Budget": Budget,
    "CashierProfile": CashierProfile,
    "CashiersDashboard": CashiersDashboard,
    "Communication": Communication,
    "Dashboard": Dashboard,
    "DesignSystem": DesignSystem,
    "ExecutiveDashboard": ExecutiveDashboard,
    "ExecutiveExperience": ExecutiveExperience,
    "FreezerMap": FreezerMap,
    "Management": Management,
    "PopsyPlanner": PopsyPlanner,
    "PredictiveAnalytics": PredictiveAnalytics,
    "PrivacyPolicy": PrivacyPolicy,
    "Quality": Quality,
    "Rankings": Rankings,
    "Reports": Reports,
    "RoulettePopsy": RoulettePopsy,
    "Sales": Sales,
    "SearchCashier": SearchCashier,
    "Settings": Settings,
    "TWAGuide": TWAGuide,
    "Team": Team,
    "Training": Training,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};