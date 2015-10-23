var config = require('../config/config');

var Beam = require('beam-client-node');
var Tetris = require('@mcph/tetris-reference');

var rp = require('request-promise');

var path = "http://localhost:1337/api/v1";

var events = require('events');

var user, channel;

var ee = new events.EventEmitter();

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
    robot.handshake(function () {
        console.log("Handshaken");
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
                case 84: // takeoff
                    ee.emit('control', 'takeoff', true);

                break;
                case 76: // land
                    ee.emit('control', 'land', true);

                break;

            }
            // console.log(tac)
        });
    });

}).catch(function  (err) {
    console.error(err.message);
});

module.exports = ee;
