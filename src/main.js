'use strict';
let conf = require('./conf.json');
let PlayState = require('./play-state.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.AUTO, '');

game.state.add('play', new PlayState());
game.state.start('play');
