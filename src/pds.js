// PDS Contants
const PDSTypeDefault = new Set([
    "PDS_F",
    "PDS_PCH",
    "PDS_I"
]);
const PDSTypeArray = new Set([
    "PDS_PPDS",
    "PDS_PPCH",
    "PDS_PPI",
    "PDS_PPF"
]);
const PDSRegex = /([a-zA-Z0-9_-]+)\s+(PDS_PCH|PDS_I|PDS_PDS|PDS_PPDS)\s+[0-9]+\s?(.*)/gm;

/**
 * @function parsePDSStdout
 * @desc Parse PDS String (stdout by pu executable).
 * @param {!String} str str
 * @returns {Object}
 * 
 * @throws {TypeError}
 */
function parsePDSStdout(str) {
    if (typeof str !== "string") {
        throw new TypeError("str argument should be typeof string");
    }
    let results, PPDSName, CurrentPDS;
    const ret = {};

    while ((results = PDSRegex.exec(str)) !== null) {
        const [, varName, varType, varValue] = results;

        if (PDSTypeDefault.has(varType)) {
            const convertedValue = varType === "PDS_I" || varType === "PDS_F" ? 
                parseInt(varValue) : varValue;
            if (typeof CurrentPDS !== "undefined") {
                if (typeof PPDSName !== "undefined") {
                    Reflect.set(ret[PPDSName][CurrentPDS], varName, convertedValue);
                }
                else {
                    Reflect.set(ret[CurrentPDS], varName, convertedValue);
                }
            }
            else {
                Reflect.set(ret, varName, convertedValue);
            }
        }
        else if (PDSTypeArray.has(varType)) {
            PPDSName = varName;
            Reflect.set(ret, varName, []);
        }
        else if (varType === "PDS_PDS") {
            CurrentPDS = varName;
            if (typeof PPDSName === "undefined") {
                Reflect.set(ret, varName, {});
            }
            else if (/^\d+$/.test(CurrentPDS)) {
                Reflect.set(ret[PPDSName], varName, {});
            }
            else {
                PPDSName = null;
                Reflect.set(ret, varName, {});
            }
        }
    }

    return ret;
}

module.exports = parsePDSStdout;