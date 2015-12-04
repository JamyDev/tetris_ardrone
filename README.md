# tetris_ardrone
Tetris flies the Beam AR Drone.

## Usage

- Set username and password in `config/config.js`
- Link the module using `npm link`
- Install [ARDrone WebFlight](https://github.com/eschnou/ardrone-webflight)
- Go to where you cloned WebFlight
- Run `npm link tetris_ardrone`
- Copy the `webflight/tetris` folder to the `plugins` folder of your WebFlight install
- Make sure to enable the `tetris` module in your WebFlight config
- Run WebFlight!
