# NodeUIM

CA UIM NodeJS interface to work with pu.exe in a full async way.

```js
const nodeuim = require('nodeuim');

const config = {
	path: "E:/Nimsoft/bin/pu.exe",
    login: "administrator",
    password: "NimSoft!01"
}
const uimRequest = nodeuim.Request(config);

setImmediate( async function() {
	
	try {
		const PDS = await uimRequest({
			callback: 'getrobots',
			timeout: 1500, 
			args: new nodeuim.PDS(void 0,void 0)
		});
		
		PDS.get('robotlist').forEach( ({name: robotName}) => {
			console.log(`robotName => ${robotName}`);
		}); 
	}
	catch(Err) {
		console.log(Err);
	}

});
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
