'use strict';

const conf = require('./conf.json');

const PlayState = require('./play-state.js');

const PickUsername = require('./pick-username.js');
const MainMenu = require('./main-menu.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');
game.global = {};

game.state.add('play', new PlayState());
game.state.add('mainMenu', new MainMenu());
game.state.add('pickUsername', new PickUsername());

game.state.start('pickUsername');
