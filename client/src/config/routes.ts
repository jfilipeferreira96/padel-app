
const host = process.env.NEXT_PUBLIC_API; 

export const endpoints = {
  host: host,
  /*################## Auth #############################*/
  loginRoute: `/api/auth/login`,
  registerRoute: `/api/auth/register`,
  logoutRoute: `/api/auth/logout`,
  /*################## Users #############################*/
  cardsRoute: `/api/auth/users/cards/`,
  getAllUsers: `/api/auth/users`,
  getSingleUser: `/api/auth/users`,
  registerUserManually: `/api/auth/users`,
  updateUser: `/api/auth/users`,
  deleteUser: `/api/auth/users`,
  updateAccount: `/api/auth/account`,
  /*################## Dashboard #############################*/
  dashboardEntriesRoute: `/api/dashboard/entries`,
  manuallyCreateCard: `/api/dashboard/manually-card`,
  dashboardCardsRoute: `/api/dashboard/cards`,
  configRoute: `/api/dashboard/configs`,
  /*################## ACESSOS #############################*/
  acessosEntryRoute: `/api/acessos/entry`,
  acessosValidateRoute: `/api/acessos/validate`,
  updateEntryCountRoute: `/api/acessos/update-entry-count`,
  /*################## OFFpeakS #############################*/
  getOffpeakCard: "/api/offpeak/offpeak-card",
  getAllOffpeakCards: "/api/offpeak/offpeak-cards",
  addOffpeakCard: "/api/offpeak/offpeak-card",
  updateOffpeakCard: "/api/offpeak/offpeak-card",
  deleteOffpeakCard: "/api/offpeak/offpeak-card",
  assignOffpeakCard: "/api/offpeak/offpeak-card/assign",
  /*################## News #############################*/
  // Rotas para Notícias
  addNews: `/api/articles/add`,
  getAllNews: `/api/articles/all`,
  getNews: `/api/articles/article`,
  updateNews: `/api/articles/article`,
  deleteNews: `/api/articles/article`,
  // Rotas para Pedidos
  addOrder: `/api/orders/order`,
  getSingleOrder: `/api/orders/order`,
  getAllOrders: `/api/orders/orders`,
};

export const routes = {
  landingpage: {
    url: "/",
  },
  home: {
    url: "/home",
  },
  offpeaks: {
    url: "/offpeaks",
  },
  account: {
    url: "/account",
  },
  carimbos: {
    url: "/carimbos",
  },
  qrcode: {
    url: "/qrcode",
  },
  cart: {
    url: "/cart",
  },
  store: {
    url: "/store",
    product: "/store/product",
  },
  signin: {
    url: "/sign-in",
  },
  register: {
    url: "/register",
  },
  dashboard: {
    url: "/dashboard",
    entries: "/dashboard/entries",
    articles: "/dashboard/articles",
    offpeak: "/dashboard/offpeak",
    orders: "/dashboard/orders",
    users: "/dashboard/users",
    validations: "/dashboard/validations",
    configurations: "/dashboard/configurations",
  },
};