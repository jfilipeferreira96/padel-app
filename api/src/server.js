const app = require("./app");
const Logger = require("./utils/logger");
const port = process.env.PORT || 5005;
const host = process.env.APP_HOST || "127.0.0.1";

app.listen(port, () => Logger.info(`REST server running at http://${host}:${port}`));
