// Use core dependencie(s)
const { exec } = require("child_process");

// Use internal dependencie(s)
const { parsePDSStdout } = require("./src/pds");

/**
 * @function executeCP
 * @param {!String} cmd string command
 * @returns {Promise<Object>}
 */
function executeCP(cmd) {
    const options = {
        timeout: 3000,
        maxBuffer: 1024 * 3000,
        encoding: "utf8"
    };

    return new Promise((resolve, reject) => {
        let err, ret;
        const cp = exec(cmd, options, (error, stdout) => {
            if (error) {
                err = error;
            }
            ret = parsePDSStdout(stdout);
        });

        cp.on("close", (rc) => {
            if (rc !== 0) {
                return reject(err);
            }

            return resolve(ret);
        });
    });
}

/**
 * @function callbackDescriptor
 * @param {!String} path path (or probe name)
 * @param {!String} name callback name
 * @param {Object} options callback options
 * @returns {Function}
 */
function callbackDescriptor(path, name, options = {}) {
    return function cb(args = {}) {
        const ret = [];
        for (const [argName, argType] of Object.entries(options)) {
            if (Reflect.has(args, argName)) {
                const arg = Reflect.get(args, argName);
                if (typeof arg === argType) {
                    ret.push(arg);
                    continue;
                }
            }
            ret.push("\"\"");
        }

        return [path, name, ret];
    };
}

// Export functions
module.exports = {
    executeCP,
    callbackDescriptor
};
