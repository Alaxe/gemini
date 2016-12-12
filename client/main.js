'use strict';

const conf = require('./conf.json');
const NetworkManager = require('./network-manager.js');

const PlayState = require('./play/play-state.js');
const menu = require('./menu');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');

game.global = {
    network: new NetworkManager(game)
};

for (let menuKey in menu) {
    game.state.add(menuKey, menu[menuKey]);
}
game.state.add('play', new PlayState());

game.state.start('mainMenu');
