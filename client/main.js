'use strict';

const conf = require('./conf.json');
const NetworkManager = require('./network-manager.js');
const SFXManager = require('./sfx-manager.js');
const SoundtrackManager = require('./soundtrack-manager.js');

const PlayState = require('./play/play-state.js');
const menu = require('./menu');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.AUTO, '');

game.global = {
    network: new NetworkManager(game),
    soundtrack: new SoundtrackManager(game),
    sfx: new SFXManager(game)
};

for (let menuKey in menu) {
    game.state.add(menuKey, menu[menuKey]);
}
game.state.add('play', new PlayState());

game.state.start('mainMenu');
