const exec = require('child_process').exec;
const eventEmitter = require('events'); 

class PDS {

    constructor(str) {
        let results;
        let PPDS_Name;
        let CurrentPDS;
        this._inner = new Map();
        console.log('start parsing');
        console.time('parseTime');
        while(results = PDS.regex.exec(str)) {
            let varName     = results[1];
            let varType     = results[2];
            let varValue    = results[3];

            if(varType === 'PDS_PCH' || varType === 'PDS_I') {
                const convertedValue = (varType === 'PDS_I') ? parseInt(varValue) : varValue;
                if(CurrentPDS !== undefined) {
                    if(PPDS_Name !== undefined) {
                        this._inner.get(PPDS_Name)[CurrentPDS][varName] = convertedValue;
                    }
                    else {
                        this._inner.get(CurrentPDS).set(varName,convertedValue);
                    }
                }
                else {
                    this._inner.set(varName,convertedValue);
                }
            }
            else if(varType === 'PDS_PPDS') {
                PPDS_Name = varName;
                this._inner.set(varName,[]);
            }
            else if(varType === 'PDS_PDS') {
                CurrentPDS = varName;
                if(PPDS_Name === undefined) {
                    this._inner.set(varName,new Map());
                }
                else {
                    this._inner.get(PPDS_Name)[varName] = {};
                }
            }
        }
        console.timeEnd('parseTime');
    }

    toMap() {
        return this._inner;
    }
}
PDS.regex = /([a-zA-Z0-9_-]+)\s+(PDS_PCH|PDS_I|PDS_PDS|PDS_PPDS)\s+[0-9]+\s?([a-zA-Z0-9:\-\/.[,\]]+)?/g;

class Nimsoft extends eventEmitter {

    constructor(opts) {
        super();
        this.login = opts.login;
        this.password = opts.password;
        this.path = opts.path+"\\pu.exe";
    }

    request(nimPath,callbackName,args) {
        if(nimPath === undefined || callbackName === undefined) {
            console.error('Please provide good argument for Request method');
            return;
        }
        return new Promise( (resolve,reject) => {
            let cmd = `${this.path} -u ${this.login} -p ${this.password} ${nimPath} ${callbackName}`;
            if(args !== undefined && args instanceof Array) {
                cmd = `${cmd} ${args.join(" ")}`;
            }
            console.log(cmd);
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                const PDSObject = new PDS(stdout);
                this.emit('requestDone',PDSObject);
                resolve(PDSObject.toMap());
            });
        });
    }
}
Nimsoft.NoARG = '""';

module.exports = Nimsoft;
