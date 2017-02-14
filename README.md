# NodeUIM
CA UIM NodeJS interface to work with pu.exe in a full async way.

## Requirement 

- NodeJS 7.x.x or higher

> Install on the system **or take the binary version to execute without installing NodeJS on the system**. 

## Examples 

```js
const SDK       = require('./nimsoft.js');
const Nimsoft   = SDK.Nimsoft;
const Logger    = SDK.Logger;

const logger = new Logger({
    file: 'example.log',
    level: 3
});

const nimSDK = new Nimsoft(config);
nimSDK.pu({ callback: 'gethubs' }).then( Response => {
    logger.log(`Response code => ${Response.rc}`,Logger.Info);
    logger.log(JSON.Stringify(Response.Map,null,2));
})
.catch( ProbeUtility => {
    logger.log(ProbeUtility.error,Logger.Error);
    closeHandler();
});
```

## Benchmark

- request to pu.exe ( between 350 - 500 ms ) 
- Parsing time ( 10 ms for 1000 robots ).

## Roadmap Release 1

- Setup Nimsoft.noArg automatically when needed ( HARD )
- Add better event handling on probeUtility

## Roadmap Release 2 

- Continue to code a checkconfig.
- Develop nimAlarm class.
