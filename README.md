# NodeUIM

CA UIM NodeJS interface to work with pu.exe in a full async way.

> **Warning :** This module spawn new node processes, so it will break if you try to parralelize to much things!

```js
const nodeuim = require('nodeuim');
const request = nodeuim.Request({
    path: "E:/Nimsoft/bin/pu.exe",
    login: "administrator",
    password: "NimSoft!01"
});

async function main() {
    const PDS = await request({
        callback: 'getrobots',
        timeout: 1500,
        args: new nodeuim.PDS(void 0, void 0)
    });

    for(const robot of PDS.get('robotlist')) {
        console.log(`robotName => ${robot.name}`);
    }
}
main().catch(console.error);
```

## Requirement 

- NodeJS 7.7.0 or higher

## Installation 

```
npm install nodeuim [--save]
```

## Documentation 

Find API & Documentations on the wiki page - [Here](https://github.com/fraxken/NodeUIM/wiki)

# Roadmap 2.0

- implement nimAlarm
- implement argMap class
- add PDS_VOID type to stdout parsing 
- add non-regex elements key(s)/value(s) from stdout parsing.
- add "toObject" method and rename PDS.parse to "toMap"
