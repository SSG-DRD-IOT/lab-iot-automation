// var http = require('http-request');

// var temperature = 40;

// http.post('192.168.1.118:3000/lcd/text?lcdtext=Hello', function (err, res) {
//     if (err) {
//         console.log("Unable to Post temperature to LCD");
//         console.log(err);
//     } else {
//         console.log(res);
//     }
// });

var rp = require('request-promise');

var temperature = 40;

var options = {
    method: 'POST',
    uri: 'http://192.168.1.118:3000/lcd/text?lcdtext=' + temperature + " Celsius"};

rp(options)
    .then(function (body) {
        console.log("Post Success");
    })
    .catch(function (err) {
        console.log(err);
    });
