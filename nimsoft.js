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
            if(this.args[i] == void 0) {
                this.args[i] = Nimsoft.NOARG;
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

function _assignInterface(target,interface) {
    if(target == void 0) {
        target = {};
    }
    const tInterface        = Object.assign({},interface);
    Object.assign(tInterface,target);
    return tInterface;
}


const IRequest = {
    path: 'hub',
    callback: '_status',
    timeout: 5000,
    debug: false,
    maxBuffer: 1024 * 3000,
    encoding: 'utf8'
}

function Request(cfg,options) {
    options = _assignInterface(options,IRequest);

    return function(suppOpts) {
        const tOption = Object.assign({},options,suppOpts);
        return new Promise( (resolve,reject) => {
            let cmd = `${cfg.path} -u ${cfg.login} -p ${cfg.password} ${tOption.path} ${tOption.callback}`;
            if(tOption.args !== undefined) {
                if(tOption.args instanceof Array) {
                    cmd = `${cmd} ${tOption.args.join(" ")}`;
                }
                else if(tOption.args instanceof PDS) {
                    cmd = tOption.args.toString();
                }
            }

            let errorMsg;
            let resMap;
            const cp = exec(cmd, {timeout: tOption.timeout, maxBuffer: tOption.maxBuffer, encoding: tOption.encoding}, (error, stdout, stderr) => {
                if(error) {
                    errorMsg = error;
                }
                const FailArray = Nimsoft.failed.exec(stdout);
                if(FailArray) {
                    errorMsg = FailArray[0];
                }
                else {
                    resMap = PDS.parse(stdout);
                }
            });

            cp.on('close', (rc,signal) => {
                if(rc !== Nimsoft.NIMOK) {
                    reject({
                        rc,
                        signal,
                        message: errorMsg
                    });
                }
                else {
                    resolve(resMap);
                }
            });
        });
    }
}

/*
    Main Nimsoft Class 
*/
const Nimsoft = {
    NOARG: '""',
    NIMOK: 0,
    failed: /(failed:)\s+(.*)/
};

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

    critical(msg) {
        this.log(0,msg);
    }

    error(msg) {
        this.log(1,msg);
    }

    warning(msg) {
        this.log(2,msg);
    }

    info(msg) {
        this.log(3,msg);
    }

    debug(msg) {
        this.log(4,msg);
    }

    nohead(msg) {
        this.log(5,msg);
    }

    dump(_o) {
        this.nohead(JSON.stringify(_o));
    }

    log(level,msg) {
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
    Request,
    Logger
}
