'use strict';
const conf = require('../conf.json');
const utils = require('./util.js');

class InputField {
    constructor(game, x, y, options) {
        game.add.plugin(Fabrique.Plugins.InputField);

        let xPx = utils.hPx(x);
        let yPx = utils.vPx(y);

        let style = Object.assign({}, conf.InputField, options);
        style.width = utils.hPx(style.width) - 2 * style.padding;
        style.height = utils.vPx(style.height) - 2 * style.padding;

        this.inputField = game.add.inputField(xPx, yPx, style);
    }
    getValue() {
        return this.inputField.value;
    }
};

module.exports = InputField;
