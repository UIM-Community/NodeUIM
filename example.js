const SDK       = require('./nimsoft.js');
const Nimsoft   = SDK.Nimsoft;
const Logger    = SDK.Logger;
const config    = require('./configuration.json');
const async     = require('async');
const fs        = require('fs');

const logger = new Logger({
    file: 'nodepu.log'
});
const nimSDK = new Nimsoft(config);
nimSDK.on('log', msg => logger.log(msg) );

function closeHandler() {
    logger.log(console.timeEnd('write_name'));
    logger.close();
    process.exit(0);
}

const RobotsList = [];

logger.log(console.time('write_name'));
logger.log('Get robots!');
logger.log('---------------------------------');
nimSDK.pu({ callback: 'gethubs' }).then( Response => {
    return new Promise( (resolve, reject) => {
        logger.log('Return code => '+Response.rc);
        async.each(Response.Map.get('hublist'),(hub, donehub) => {
            if(hub.domain !== 'NMS-PROD') {
                donehub();
                return;
            }
            logger.log(`hubName : ${hub.name}`);
            logger.log('---------------------------------');
            
            nimSDK.pu({ path: hub.addr, callback: 'getrobots', args: [Nimsoft.noArg,Nimsoft.noArg]}).then( ResponseSub => {
                logger.log('Return code => '+ResponseSub.rc);
                async.each(ResponseSub.Map.get('robotlist'),(robot, donerobot) => {
                    RobotsList.push(robot.name);
                    donerobot();
                } , err => {
                    err && logger.log(err);
                    logger.log(`${hub.addr} OK !!`);
                    donehub();
                });
            }).catch( ProbeUtility => {
                logger.log(ProbeUtility.error+` for ${hub.name}`,Logger.Error);
                donehub();
            }); 

        }, err => {
            err && logger.log(err,Logger.Error);
            resolve(true);
        });

    } );
})
.then( _ => {
    logger.log(`Processing done ! Robots size => ${RobotsList.length}`);
    fs.writeFile('robotslist.txt',RobotsList.join("\r\n"), err => {
        if(err) {
            throw new Error(err);
        }
        closeHandler();
    });
})
.catch( ProbeUtility => {
    logger.log(ProbeUtility.error,Logger.Error);
    closeHandler();
});
