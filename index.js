// Use core dependencie(s)
const { join } = require("path");
const { readdir } = require("fs");

// Use internal dependencie(s)
const { executeCP, callbackDescriptor } = require("./src/utils");

/**
 * @const callbacks
 * @type {ProbeUtility.callbacks}
 * @desc NodeUIM callbacks!
 */
const callbacks = {
    hub: {
        getrobots: callbackDescriptor("hub", "getrobots", {
            name: "number",
            detail: "number"
        })
    },
    controller: {
        get_info: callbackDescriptor("controller", "get_info", {
            interfaces: "number",
            robot: "string"
        })
    }
};

/**
 * @class ProbeUtility
 * @classdesc Nimsoft probe utility
 * 
 * @member {String} login
 * @member {String} password
 */
class ProbeUtility {

    /**
     * @constructor
     * @param {!String} login pu Login
     * @param {!String} password pu Password
     */
    constructor(login, password) {
        this.login = login;
        this.password = password;
    }

    /**
     * @public
     * @async
     * @method exec
     * @memberof ProbeUtility#
     * @param {!String} nimPath path of the callback
     * @param {!String} callback callback name
     * @param {any} args callback arguments
     * @returns {*}
     */
    async exec(nimPath, callback, args) {
        const nimRoot = join(process.env.NIM_ROOT, "/bin/pu");
        let cmd;
        if (nimPath instanceof Array) {
            const [path, name, sArgs] = nimPath;
            cmd = `${nimRoot} -u ${this.login} -p ${this.password} ${path} ${name} `;
            cmd = cmd.concat(sArgs.join(" "));
        }
        else if (callback instanceof Array) {
            const [path, name, sArgs] = callback;
            const tNimPath = nimPath.concat(path);
            cmd = `${nimRoot} -u ${this.login} -p ${this.password} ${tNimPath} ${name} `;
            cmd = cmd.concat(sArgs.join(" "));
        }
        else {
            cmd = `${nimRoot} -u ${this.login} -p ${this.password} ${nimPath} ${callback} `;
            if (args instanceof Array) {
                cmd = cmd.concat(args.join(" "));
            }
        }

        return await executeCP(cmd);
    }

}
ProbeUtility.void = "\"\"";

// Exports all class!
module.exports = {
    ProbeUtility,
    callbacks
};
