var config = require('../config/config');

var Beam = require('beam-client-node');
var Tetris = require('@mcph/tetris-reference');

var rp = require('request-promise');

var path = "http://localhost:1337/api/v1";

var user, channel;

var ee = module.exports = new require('events').EventEmitter();

rp({
    url: path + '/users/login',
    method: 'POST',
    form: {
        username: config.beam.username,
        password: config.beam.password
    },
    jar: true,
    json: true
}).then(function (data) {
    channel = data.channel;
    user = data;
    return rp({
        url: path + '/tetris/' + channel.id + '/robot',
        jar: true,
        json: true
    });
}).then(function (data) {
    data.remote = data.address;
    data.key = data.authkey;
    data.channel = channel.id;
    data.reportInterval = 20;

    var robot = new Tetris.Robot(data);
    robot.handshake(function (asdf) {
        console.log(asdf)
    });

    robot.on('report', function (report) {
        report.tactile.forEach(function (tac) {
            switch (tac.code) {
                case 87: // FWD
                    ee.emit('control', 'fwd', tac.down.mean > 0);
                break;
                case 83: // BWD
                    ee.emit('control', 'back', tac.down.mean > 0);
                break;
                case 65: // Left

                break;
                case 68: // Right

                break;

            }
            console.log(tac)
        })
    });

    console.log(data)
}).catch(function  (err) {
    console.error(err.message);
});

// var beam = new Beam();
// beam.use('password', {
//     username: config.beam.username,
//     password: config.beam.password
// }).attempt().then(function () {

//     return beam.client.request('get', '/tetris/' + config.beam.channel + '/robot');
// }).then(function (details) {


// });
