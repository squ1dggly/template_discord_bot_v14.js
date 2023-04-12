// Reusable functions for printing out console.log() in 4k ultra HD full color.

const chalk = require('chalk');

module.exports = {
    success: (msg) => console.log(chalk.green(msg)),
    error: (header, msg, err) => console.error(chalk.black.bgRed(header) + " " + chalk.magenta(msg), err),

    log: (msg) => console.log(chalk.gray(msg)),
    debug: (msg) => console.log(chalk.magenta(msg))
};