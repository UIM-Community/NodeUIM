# uimNodePu
CA UIM NodeJS interface to work with pu.exe in a full async way.

# Requirement 

- NodeJS 7.x.x or higher

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
