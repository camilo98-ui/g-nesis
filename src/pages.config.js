import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Rankings from './pages/Rankings';
import SearchCashier from './pages/SearchCashier';
import Budget from './pages/Budget';
import Team from './pages/Team';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "Sales": Sales,
    "Rankings": Rankings,
    "SearchCashier": SearchCashier,
    "Budget": Budget,
    "Team": Team,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};