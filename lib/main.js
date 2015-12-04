var config = require('../config/config');

var Beam = require('beam-client-node');
var Tetris = require('beam-interactive-node');

var Packets = require('beam-interactive-node/dist/robot/proto/packets');

var rp = require('request-promise');

var path = "https://lab.beam.pro/api/v1";

var events = require('events');

var user, channel;

var ee = new events.EventEmitter();
// HTTP Auth needed for Beam Lab
// var httpAuth = {
//     user: 'SomeHTTPUser',
//     pass: 'SomeHTTPPass',
//     sendImmediately: true
// };

rp({
    url: path + '/users/login',
    method: 'POST',
    auth: httpAuth,
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
        auth: httpAuth,
        jar: true,
        json: true
    });
}).then(function (data) {
    data.remote = data.address;
    data.channel = channel.id;
    data.reportInterval = 20;

    console.log(data)

    // console.log(data = { remote: "192.168.0.138:3442", channel: 3, key: "joob75iy80w92pac", reportInterval: 20})

    var robot = new Tetris.Robot(data);
    robot.handshake(function (err) {
        console.log("Handshaken", err);
    });

    var cache = {};
    var connected = 0;
    var reset = false;
    cache[87] = 0;
    cache[83] = 0;
    cache[84] = 0;
    cache[65] = 0;
    cache[68] = 0;
    cache[76] = 0;

    setInterval(function () {
        var data = Object.keys(cache).map(function (key) {
            var doo = avg(cache[key], connected);
            return {
                target: 0,
                code: parseInt(key, 10),
                progress: doo != 1 ? doo : 0.99,
                fired: doo >= 0.5
            }
        })
        robot.send(new Packets.ProgressUpdate({
            progress: data
        }));
    }, 300)

    robot.on('report', function (report) {
        report.tactile.forEach(function (tac) {
            connected = report.connected;
            console.log("Before", cache[tac.code], "connected", report.connected)
            cache[tac.code] -= tac.up ? tac.up.mean : 0;
            cache[tac.code] += tac.down.mean;
            console.log("After", cache[tac.code])

            switch (tac.code) {
                case 84: // takeoff
                    ee.emit('control', 'takeoff', avg(cache[84], report.connected) > 0.5);
                break;
                case 76: // land
                    ee.emit('control', 'land', avg(cache[76], report.connected) > 0.5);
                break;
                default:
                    reset = false;
                break;
            }
            // console.log(tac)
        });
        if (reset) {
            return;
        }
        reset = true;
        // FWD && BACK
        var stop = false;
        if (cache[87] > cache[83]) {
            ee.emit('control', 'fwd', avg(cache[87], report.connected));
        } else if (cache[83] > cache[87]) {
            ee.emit('control', 'back', avg(cache[83], report.connected));
        } else {
            ee.emit('control', 'fwd', 0);
            ee.emit('control', 'back', 0);

            stop = true;
        }
        // LEFT && RIGHT
        if (cache[65] > cache[68]) {
            ee.emit('control', 'left', avg(cache[65], report.connected));
            stop &= false;
        } else if (cache[68] > cache[65]) {
            ee.emit('control', 'right', avg(cache[68], report.connected));
            stop &= false;
        } else {
            ee.emit('control', 'left', 0);
            ee.emit('control', 'right', 0);

            stop &= true;
        }

        if (stop) {
            ee.emit('control', 'stop', true);
        }
    });

    robot.on('error', function (err) {
        console.log("ROBOT err", err)
    })

}).catch(function  (err) {
    console.error(err);
});

function avg (n, connected) {
    return n > 0 ? n / connected : 0
}

module.exports = ee;
