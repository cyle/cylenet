// load the wins module
const wins = require('./module.js');

// use it to fetch a record
wins.getRecord('cyle.lol', function(record) {
    // spit out the record info
    console.log(record);
});
