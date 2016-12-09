'use strict';
const JoinRoom = require('./join-room.js');
const LevelEnd = require('./level-end.js');
const LevelSelect = require('./level-select.js');
const Lobby = require('./lobby.js');
const MainMenu = require('./main-menu.js');
const Username = require('./username.js');

module.exports = {
    joinRoom: new JoinRoom(),
    levelEnd: new LevelEnd(),
    levelSelect: new LevelSelect(),
    lobby: new Lobby(),
    mainMenu: new MainMenu(),
    username: new Username()
}
