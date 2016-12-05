'use strict';
const conf = require('../conf.json');
const FontFaceObserver = require('fontfaceobserver');

module.exports = {
    hPx: part => {
        return part * conf.GAME_W;
    },
    vPx: part => {
        return part * conf.GAME_H;
    },
    hPart: px => {
        return px / conf.GAME_W;
    },
    vPart: px => {
        return px / conf.GAME_H;
    },
    loadFont: () => {
        let promises = [];
        for (let font of conf.fonts) {
            promises.push(new FontFaceObserver(font).load());
        }
        return Promise.all(promises);
    }
};
