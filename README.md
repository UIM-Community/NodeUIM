# uimNodePu
CA UIM NodeJS interface to work with pu.exe in a full async way.

## Requirement 

- NodeJS 7.x.x or higher

> Install on the system **or take the binary version to execute without installing NodeJS on the system**. 

## Examples 

```js
const nimSDK = new Nimsoft(config);
nimSDK.request('hub','getrobots',[Nimsoft.NoARG,Nimsoft.NoARG])
.then( Map => {
    console.log(Map.get('origin'));
})
.catch( err => {
    throw new Error(err);
});
```

request method return a ES6 Promise. The stdout of pu.exe is parsed into a ES6 Map by a PDS Class.

## Benchmark

- request to pu.exe ( between 350 - 500 ms ) 
