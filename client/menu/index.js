'use strict';
const JoinRoom = require('./join-room.js');
const LevelEnd = require('./level-end.js');
const Lobby = require('./lobby.js');
const MainMenu = require('./main-menu.js');
const Username = require('./username.js');

module.exports = {
    joinRoom: new JoinRoom(),
    levelEnd: new LevelEnd(),
    lobby: new Lobby(),
    mainMenu: new MainMenu(),
    username: new Username()
}
