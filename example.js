const SDK       = require('./nimsoft.js');
const config    = require('./configuration.json');
const async     = require('async');
const fs        = require('fs');

const logger = new SDK.Logger({
    file: 'nodepu.log'
});
const nimSDK = new SDK.Nimsoft(config);
const errorHandler = function(Err) {
    logger.log("ERROR: "+Err);
}
nimSDK.on('log', msg => logger.log(msg) );

const RobotsList = [];
var i = 0;

logger.log(console.time('write_name'));
logger.log('Get robots!');
logger.log('---------------------------------');
nimSDK.request({ callback: 'gethubs' })
.then( HubMap => {
    return new Promise( (resolve,reject) => {

        const Hubs = HubMap.get('hublist');
        async.each(Hubs,(hub,donehub) => {
            if(hub.domain !== 'NMS-PROD') {
                donehub();
                return;
            }
            logger.log(`hubName : ${hub.name}`);
            logger.log('---------------------------------');
            
            nimSDK.request({ path: hub.addr, callback: 'getrobots', args: [SDK.Nimsoft.NoARG,SDK.Nimsoft.NoARG]})
            .then( RobotMap => {

                const Robots = RobotMap.get('robotlist');
                async.each(Robots,(robot,donerobot) => {
                    i++;
                    RobotsList.push(robot.name);
                    donerobot();
                } , err => {
                    if(err) console.log(err);
                    logger.log(`${hub.addr} OK !!`);
                    donehub();
                });

            }).catch( errorHandler ); 

        }, err => {
            if(err) logger.log(`critical: ${err}`);
            resolve(true);
        });

    } );
})
.then( _ => {
    logger.log(`Processing done ! Robots size => ${RobotsList.length} and i size => ${i}`);
    fs.writeFile('robotslist.txt',RobotsList.join("\r\n"),function(err) {
        if(err) {
            throw new Error(err);
        }
        logger.log(console.timeEnd('write_name'));
        logger.close();
        process.exit(0);
    });
})
.catch( errorHandler );
