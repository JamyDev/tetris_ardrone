var tetris_ardrone = require('../../../tetris_ardrone');

var mul = 0.5;

module.exports = function (name, deps) {
    tetris_ardrone.on('control', function (type, state) {
        console.log(type, state, state * mul)
        if (type === 'fwd') {
            deps.client.front(state * mul);
        } else if (type === 'back') {
            deps.client.back(state * mul);
        } else if (type === 'left') {
            deps.client.left(state * mul);
        } else if (type === 'right') {
            deps.client.right(state * mul);
        } else if (type === 'takeoff' && state) {
            deps.client.takeoff();
        } else if (type === 'land' && state) {
            deps.client.land();
        } else if (type === 'stop') {
            deps.client.stop();
        }
    });
};

