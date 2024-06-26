
const host = process.env.NEXT_PUBLIC_API_URL; 

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
  dashboardCardsRoute: `/api/dashboard/cards`,
  configRoute: `/api/dashboard/configs`,
  /*################## ACESSOS #############################*/
  acessosEntryRoute: `/api/acessos/entry`,
  acessosValidateRoute: `/api/acessos/validate`,
  /*################## OFFPICKS #############################*/
  getOffpickCard: "/api/offpick/offpick-card",
  getAllOffpickCards: "/api/offpick/offpick-cards",
  addOffpickCard: "/api/offpick/offpick-card",
  updateOffpickCard: "/api/offpick/offpick-card",
  deleteOffpickCard: "/api/offpick/offpick-card",
  assignOffpickCard: "/api/offpick/offpick-card/assign",
  /*################## Orders & Producuts #############################*/
  // Rotas para Produtos
  addProduct: `/api/orders/product`,
  getAllProducts: `/api/orders/products`,
  getProduct: `/api/orders/product`,
  updateProduct: `/api/orders/product`,
  deleteProduct: `/api/orders/product`,
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
  offpicks: {
    url: "/offpicks",
  },
  account: {
    url: "/account",
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
    products: "/dashboard/products",
    offpick: "/dashboard/offpick",
    orders: "/dashboard/orders",
    users: "/dashboard/users",
    validations: "/dashboard/validations",
    configurations: "/dashboard/configurations",
  },
};