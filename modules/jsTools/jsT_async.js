/** A promise based implementation of setTimeout()
 * @param {number} ms wait time in milliseconds  */
async function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { wait };
