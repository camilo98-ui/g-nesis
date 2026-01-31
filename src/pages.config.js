/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Budget from './pages/Budget';
import CashierProfile from './pages/CashierProfile';
import CashiersDashboard from './pages/CashiersDashboard';
import Communication from './pages/Communication';
import Dashboard from './pages/Dashboard';
import DesignSystem from './pages/DesignSystem';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ExecutiveExperience from './pages/ExecutiveExperience';
import FreezerMap from './pages/FreezerMap';
import Home from './pages/Home';
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
import WeatherSalesImpact from './pages/WeatherSalesImpact';
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
    "Home": Home,
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
    "WeatherSalesImpact": WeatherSalesImpact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};