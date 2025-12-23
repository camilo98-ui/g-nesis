import Budget from './pages/Budget';
import CashierProfile from './pages/CashierProfile';
import CashiersDashboard from './pages/CashiersDashboard';
import Dashboard from './pages/Dashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import FreezerMap from './pages/FreezerMap';
import Home from './pages/Home';
import Management from './pages/Management';
import PopsyPlanner from './pages/PopsyPlanner';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Quality from './pages/Quality';
import Rankings from './pages/Rankings';
import Reports from './pages/Reports';
import RoulettePopsy from './pages/RoulettePopsy';
import Sales from './pages/Sales';
import SearchCashier from './pages/SearchCashier';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Training from './pages/Training';
import DesignSystem from './pages/DesignSystem';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Budget": Budget,
    "CashierProfile": CashierProfile,
    "CashiersDashboard": CashiersDashboard,
    "Dashboard": Dashboard,
    "ExecutiveDashboard": ExecutiveDashboard,
    "FreezerMap": FreezerMap,
    "Home": Home,
    "Management": Management,
    "PopsyPlanner": PopsyPlanner,
    "PredictiveAnalytics": PredictiveAnalytics,
    "Quality": Quality,
    "Rankings": Rankings,
    "Reports": Reports,
    "RoulettePopsy": RoulettePopsy,
    "Sales": Sales,
    "SearchCashier": SearchCashier,
    "Settings": Settings,
    "Team": Team,
    "Training": Training,
    "DesignSystem": DesignSystem,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};