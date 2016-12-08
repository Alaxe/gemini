'use strict';

const conf = require('./conf.json');
const NetworkManager = require('./network-manager.js');

const PlayState = require('./play/play-state.js');
const Username = require('./menus/username.js');
const MainMenu = require('./menus/main-menu.js');
const Lobby = require('./menus/lobby.js');
const JoinRoom = require('./menus/join-room.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');

game.global = {
    network: new NetworkManager(game)
};

game.state.add('play', new PlayState());
game.state.add('mainMenu', new MainMenu());
game.state.add('username', new Username());
game.state.add('lobby', new Lobby());
game.state.add('joinRoom', new JoinRoom());

game.state.start('username');
