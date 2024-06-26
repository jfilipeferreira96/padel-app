const chalk = require("chalk");

class Logger {
  static dateFormat;

  static getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  static logWithTime(level, message1, message2) {
    const currentTime = this.getCurrentTime();
    const levelFormat = {
      INFO: chalk.bold.yellow("[INFO]"),
      ERROR: chalk.bold.red("[ERROR]"),
      REQUEST: chalk.bold.blue("[REQUEST]"),
      RESPONSE: chalk.bold.blueBright("[RESPONSE]"),
    }[level];

    let logMessage = `${levelFormat} ${chalk.bold(`${currentTime}:`)} ${message1}`;

    if (message2) {
      logMessage += ` ${message2}`;
    }

    console.log(logMessage);
  }

  static info(message1, message2) {
    this.logWithTime("INFO", message1, message2);
  }

  static error(message1, message2) {
    this.logWithTime("ERROR", message1, message2);
  }

  static request(message1, message2) {
    this.logWithTime("REQUEST", message1, message2);
  }

  static response(message1, message2) {
    this.logWithTime("RESPONSE", message1, message2);
  }
}

module.exports = Logger;
