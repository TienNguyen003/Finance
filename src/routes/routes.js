import config from '~/config';
import HomePage from '~/components/Home';
import StrategicFinance from '~/components/StrategicFinance';
import FinanceManager from '~/components/FinanceManager';
import DebtManagement from '~/components/DebtManagement';
import VisualReport from '~/components/VisualReport';
import FundAllocation from '~/components/FundAllocation';

// Public routes
const publicRoutes = [
    {
        path: config.routes.home,
        component: HomePage,
    },
    {
        path: config.routes.strategic,
        component: StrategicFinance,
    },
    {
        path: config.routes.finance,
        component: FinanceManager,
    },
    {
        path: config.routes.debt,
        component: DebtManagement,
    },
    {
        path: config.routes.report,
        component: VisualReport,
    },
    {
        path: config.routes.fund,
        component: FundAllocation,
    },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
