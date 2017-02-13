const exec = require('child_process').exec;
const eventEmitter = require('events'); 
const fs = require('fs');
const path = require('path');

/*
    PDS Wrapper 
*/
class PDS {

    constructor(str) {
        let results;
        let PPDS_Name;
        let CurrentPDS;
        this._inner = new Map();

        while( ( results = PDS.regex.exec(str) ) !== null) {
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
                    if(/^\d+$/.test(CurrentPDS)) {
                        this._inner.get(PPDS_Name)[varName] = {};
                    }
                    else {
                        PPDS_Name = null;
                        this._inner.set(varName,new Map());
                    }
                }
            }
        }

    }

    toMap() {
        return this._inner;
    }
}
PDS.regex = /([a-zA-Z0-9_-]+)\s+(PDS_PCH|PDS_I|PDS_PDS|PDS_PPDS)\s+[0-9]+\s?(.*)/gm;

/*
    Main Nimsoft Class 
*/
const INimRequest = {
    path: 'hub',
    callback: '_status',
    timeout: 10000,
    debug: false,
    maxBuffer: 1024 * 5000,
    encoding: 'utf8'
}

class Nimsoft extends eventEmitter {

    constructor(opts) {
        super();
        this.login = opts.login;
        this.password = opts.password;
        this.path = opts.path+"\\pu.exe";
    }

    request(opts) {
        let Options = {};
        Object.assign(Options,INimRequest,opts);
        return new Promise( (resolve,reject) => {
            let cmd = `${this.path} -u ${this.login} -p ${this.password} ${Options.path} ${Options.callback}`;
            if(Options.args !== undefined && Options.args instanceof Array) {
                cmd = `${cmd} ${Options.args.join(" ")}`;
            }
            exec(cmd, {timeout: Options.timeout, maxBuffer: Options.maxBuffer, encoding: Options.encoding}, (error, stdout, stderr) => {
                if(error && this.debug) {
                    reject(error);
                }
                const FailArray = Nimsoft.failed.exec(stdout);
                if(FailArray) {
                    reject(FailArray[0]);
                }
                else {
                    resolve(new PDS(stdout).toMap());
                }
            });
        });
    }
}
Nimsoft.encoding = 'utf8';
Nimsoft.timeOut = 10000;
Nimsoft.failed = /(failed:)\s+(.*)/;
Nimsoft.NoARG = '""';

/*
    LOGGER Class 
*/
const ILoggerConstructor = {
    level: 5,
    streamOpen: false
}

class Logger extends eventEmitter {

    constructor(opts) {
        super();
        Object.assign(this,ILoggerConstructor,opts);
        if(this.file === undefined) {
            throw new Error('Please provide a file for logger');
        }
        this.open();
        this.on('log',this.log);
    }

    open() {
        if(this.streamOpen === true) return;
        this.stream = fs.createWriteStream(this.file,{
            defaultEncoding: 'utf8'
        });
        this.streamOpen = true;
    }

    log(msg,level) {
        if(msg !== undefined) {
            level = level || 3; 
            const header = "";
            this.stream.write(msg+"\r\n");
        }
    }

    close() {
        if(this.streamOpen === false) return;
        this.stream.end();
        this.streamOpen = false;
    }

}
Logger.Critical = 0;
Logger.Error = 1;
Logger.Warning = 2;
Logger.Info = 3;
Logger.Debug = 4;
Logger.Empty = 5;

/*
    Exports all modules ! 
*/
module.exports = {
    Nimsoft,
    PDS,
    Logger
}
