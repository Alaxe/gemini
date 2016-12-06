'use strict';
const conf = require('../conf.json');
const ui = require('../ui');

class Lobby {
    init(roomData) {
        this.roomData = null;
        if (roomData) {
            this.roomData = roomData;
        }
    }
    create(){
        console.log(this.roomData);
    };
    onDataUpdate(roomData) {
    }
}

module.exports = Lobby;
