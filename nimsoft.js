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
    PU Class
*/
class ProbeUtility extends eventEmitter {

    constructor(opts) {
        super();
        Object.assign(this,opts);
    }

    call() {
        return new Promise( (resolve,reject) => {
            let cmd = `${this.nimPath} -u ${this.login} -p ${this.password} ${this.path} ${this.callback}`;
            if(this.args !== undefined && this.args instanceof Array) {
                cmd = `${cmd} ${this.args.join(" ")}`;
            }

            this.cp = exec(cmd, {timeout: this.timeout, maxBuffer: this.maxBuffer, encoding: this.encoding}, (error, stdout, stderr) => {
                if(error) {
                    this.error = error;
                }
                const FailArray = Nimsoft.failed.exec(stdout);
                if(FailArray) {
                    this.error = FailArray[0];
                }
                else {
                    this.Map = new PDS(stdout).toMap();
                }
            });

            this.cp.on('close', (rc,signal) => {
                this.rc = rc;
                this.signal = signal;
                if(this.rc !== Nimsoft.nimOk) {
                    reject(this);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
}

/*
    Main Nimsoft Class 
*/
class Nimsoft extends eventEmitter {

    constructor(opts) {
        super();
        this.login      = opts.login;
        this.password   = opts.password;
        if(path.isAbsolute(opts.path) === false) {
            throw new Error("Please provide an absolute path");
        }
        this.nimPath = path.basename(opts.path) === 'pu.exe' ? opts.path : path.join( opts.path , 'pu.exe' );
    }

    pu(opts) {
        const Options   = Object.assign(this,Nimsoft.INimRequest,opts);
        const PU        = new ProbeUtility(Options);
        return new Promise( (resolve,reject) => {
            PU.call().then( _ => resolve(PU) ).catch( err => reject(err) );
        });
    }
}
// Static variables
Nimsoft.encoding = 'utf8';
Nimsoft.timeOut = 5000;
Nimsoft.maxBuffer = 1024 * 3000;
Nimsoft.failed = /(failed:)\s+(.*)/;
Nimsoft.noArg = '""';
Nimsoft.nimOk = 0;
Nimsoft.INimRequest = {
    path: 'hub',
    callback: '_status',
    timeout: Nimsoft.timeOut,
    debug: false,
    maxBuffer: Nimsoft.maxBuffer,
    encoding: Nimsoft.encoding
}

/*
    NimAlarm 
*/
const INimAlarmConstructor = {

}

class NimAlarm extends eventEmitter {

    constructor(opts) {
        super();
    }

}

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
            if(level <= this.level) {
                const message = `${Date.now()} - ${Logger.CriticityTable[level]} ${msg} \r\n`;
                this.stream.write(message);
                console.log(message);
            }
        }
    }

    close() {
        if(this.streamOpen === false) return;
        this.stream.end();
        this.streamOpen = false;
    }

}
Logger.CriticityTable = ['[Critical]','[Error]','[Warning]','[Info]','[Debug]',''];
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
    Logger,
    NimAlarm
}
