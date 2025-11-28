import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Rankings from './pages/Rankings';
import SearchCashier from './pages/SearchCashier';
import Budget from './pages/Budget';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CashierProfile from './pages/CashierProfile';
import CashiersDashboard from './pages/CashiersDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "Sales": Sales,
    "Rankings": Rankings,
    "SearchCashier": SearchCashier,
    "Budget": Budget,
    "Team": Team,
    "Reports": Reports,
    "Settings": Settings,
    "CashierProfile": CashierProfile,
    "CashiersDashboard": CashiersDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};