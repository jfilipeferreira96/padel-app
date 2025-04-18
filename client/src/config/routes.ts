
const host = process.env.NEXT_PUBLIC_API; 

export const endpoints = {
  host: host,
  /*################## Auth #############################*/
  loginRoute: `/api/auth/login`,
  registerRoute: `/api/auth/register`,
  resetPassword: `/api/auth/reset-password`,
  forgotPassword: `/api/auth/forgotpassword`,
  checkToken: `/api/auth/checktoken`,
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
  ofertasRoute: `/api/dashboard/ofertas`,
  userOfertasRoute: `/api/dashboard/user-ofertas`,
  /*################## ACESSOS #############################*/
  acessosEntryRoute: `/api/acessos/entry`,
  acessosValidateRoute: `/api/acessos/validate`,
  updateEntryCountRoute: `/api/acessos/update-entry-count`,
  /*################## OFFpeaks #############################*/
  getOffpeakCard: "/api/offpeak/offpeak-card",
  getAllOffpeakCards: "/api/offpeak/offpeak-cards",
  addOffpeakCard: "/api/offpeak/offpeak-card",
  updateOffpeakCard: "/api/offpeak/offpeak-card",
  deleteOffpeakCard: "/api/offpeak/offpeak-card",
  assignOffpeakCard: "/api/offpeak/offpeak-card/assign",
  /*################## VOUCHERS #############################*/
  getVoucher: "/api/voucher/voucher",
  getAllVouchers: "/api/voucher/vouchers",
  addVoucher: "/api/voucher/voucher",
  updateVoucher: "/api/voucher/voucher",
  deleteVoucher: "/api/voucher/voucher",
  assignVoucher: "/api/voucher/voucher/assign",
  ativarVoucher: "/api/voucher/activate",
  updateCreditBalance: "/api/voucher/voucher-credit-update",
  getVoucherTransactions: "/api/voucher/transactions",
  userVoucher: "/api/voucher/user",
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
  /*################## Videos #############################*/
  getCreditsHistory: `/api/videos/credits-history`,
  getVideosProcessed: `/api/videos/processed`,
  getVideosWaiting: `/api/videos/waiting`,
  updateUserCredits: `/api/videos/credits`,
  addVideoProcessed: `/api/videos/processed/add`,
  processVideo: `/api/videos/processed/edit`,
  getSingleVideoProcessed: `/api/videos/processed`,
  getCreditsVideoPage: `/api/videos/page-params`,
  completeVideo: `/api/videos/stream`,
  cutVideo: `/api/videos/processed/cut`,
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
  vouchers: {
    url: "/vouchers",
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
  forgotpassword: {
    url: "/forgot-password",
  },
  register: {
    url: "/register",
  },
  videos: {
    url: "/videos",
  },
  stream: {
    url: "/videos/stream",
  },
  dashboard: {
    url: "/dashboard",
    entries: "/dashboard/entries",
    articles: "/dashboard/articles",
    offpeak: "/dashboard/offpeak",
    vouchers: "/dashboard/vouchers",
    videoCredits: "/dashboard/video-credits",
    orders: "/dashboard/orders",
    users: "/dashboard/users",
    validations: "/dashboard/validations",
    configurations: "/dashboard/configurations",
    ofertas: "/dashboard/verificar-ofertas",
  },
};