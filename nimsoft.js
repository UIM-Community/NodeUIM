const exec          = require('child_process').exec;
const eventEmitter  = require('events'); 
const fs            = require('fs');
const path          = require('path');
const http          = require('http');

/*
    PDS Wrapper 
*/
class PDS {

    constructor(...args) {
        this.args = args;
        for(let i = 0,length = this.args.length;i < length;i++) {
            if(this.args[i] === null) {
                this.args[i] = Nimsoft.noArg;
            }
        }
    }

    toString() {
        return this.args.join(" ");
    }

    static parse(str) {
        let results;
        let PPDS_Name;
        let CurrentPDS;
        let parseMap = new Map();

        while( ( results = PDS.regex.exec(str) ) !== null) {
            let varName     = results[1];
            let varType     = results[2];
            let varValue    = results[3];

            if(varType === 'PDS_PCH' || varType === 'PDS_I') {
                const convertedValue = (varType === 'PDS_I') ? parseInt(varValue) : varValue;
                if(CurrentPDS !== undefined) {
                    if(PPDS_Name !== undefined) {
                        parseMap.get(PPDS_Name)[CurrentPDS][varName] = convertedValue;
                    }
                    else {
                        parseMap.get(CurrentPDS).set(varName,convertedValue);
                    }
                }
                else {
                    parseMap.set(varName,convertedValue);
                }
            }
            else if(varType === 'PDS_PPDS') {
                PPDS_Name = varName;
                parseMap.set(varName,[]);
            }
            else if(varType === 'PDS_PDS') {
                CurrentPDS = varName;
                if(PPDS_Name === undefined) {
                    parseMap.set(varName,new Map());
                }
                else {
                    if(/^\d+$/.test(CurrentPDS)) {
                        parseMap.get(PPDS_Name)[varName] = {};
                    }
                    else {
                        PPDS_Name = null;
                        parseMap.set(varName,new Map());
                    }
                }
            }
        }

        return parseMap;
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
            let cmd = `${this.puPath} -u ${this.login} -p ${this.password} ${this.path} ${this.callback}`;
            if(this.args !== undefined) {
                if(this.args instanceof Array) {
                    cmd = `${cmd} ${this.args.join(" ")}`;
                }
                else if(this.args instanceof PDS) {
                    cmd = this.args.toString();
                }
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
                    this.Map = PDS.parse(stdout);
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
        this.puPath = path.basename(opts.path) === 'pu.exe' ? opts.path : path.join( opts.path , 'pu.exe' );
        this.naPath = path.basename(opts.path) === 'nimAlarm.exe' ? opts.path : path.join( opts.path , 'nimAlarm.exe' );
    }

    pu(opts) {
        const PU = new ProbeUtility(Object.assign(this,Nimsoft.INimRequest,opts));
        return new Promise( (resolve,reject) => {
            PU.call().then( _ => resolve(PU) ).catch( err => reject(err) );
        });
    }

    alarm(opts) {
        const alarm = new NimAlarm(Object.assign(this,opts));
        return new Promise( (resolve,reject) => {
            alarm.call().then( _ => resolve(alarm) ).catch( err => reject(err) );
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
    ArgMapper
*/
class ArgMapper {

    constructor(aMap) {
        this._inner = "";
        this.argMap = aMap;
    }

    try(arg,value) {
        if(this.argMap.has(arg)) {
            this._inner+=`${this.argMap.get(arg)} ${value} `;
        }
    }

    toString() {
        return this._inner;
    }

}

/*
    NimAlarm 
*/
const INimAlarmConstructor = {
    severity: 0,
    subsystem: 1.1
}

class NimAlarm extends eventEmitter {

    constructor(opts) {
        super();
        const argMap = new Map(); 
        argMap.set('severity','-l');
        argMap.set('subsystem','-s');
        argMap.set('source','-S');
        argMap.set('token','-a');
        argMap.set('checkpoint','-c');
        argMap.set('custom1','-1');
        argMap.set('custom2','-2');
        argMap.set('custom3','-3');
        argMap.set('custom4','-4');
        argMap.set('custom5','-5');
        const strConstructor = new ArgMapper(argMap);
        Object.assign(this,INimAlarmConstructor,opts);
        for(let k in this) {
            strConstructor.try(k,this[k]);
        }
        this.strArgs = strConstructor.toString();
    }

    call() {
        return new Promise( (resolve,reject) => {
            let cmd = `${this.naPath} ${this.strArgs}${this.message}`;
            console.log(cmd);
            /*this.cp = exec(cmd, {timeout: Nimsoft.encoding, maxBuffer: Nimsoft.maxBuffer, encoding: Nimsoft.encoding}, (error, stdout, stderr) => {
                if(error) {
                    this.error = error;
                }
                const FailArray = Nimsoft.failed.exec(stdout);
                if(FailArray) {
                    this.error = FailArray[0];
                }
                else {
                    this.Map = PDS.parse(stdout);
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
            });*/
            resolve('ok');
        });
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
