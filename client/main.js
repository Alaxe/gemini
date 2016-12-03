'use strict';

const conf = require('./conf.json');
const PlayState = require('./play-state.js');
const MainMenu = require('./main-menu.js');

const game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');
game.global = {};

game.state.add('play', new PlayState());
game.state.add('mainMenu', new MainMenu());
game.state.start('mainMenu');
