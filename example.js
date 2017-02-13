const Nimsoft = require('./nimsoft.js');
const config = require('./configuration.json');

const nimSDK = new Nimsoft(config);
nimSDK.request('hub','getrobots',[Nimsoft.NoARG,Nimsoft.NoARG])
.then( Map => {
    console.log(Map.get('origin'));
})
.catch( err => {
    throw new Error(err);
});
