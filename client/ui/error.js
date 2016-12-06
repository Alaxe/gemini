const conf = require('../conf.json');
const Text  = require('./text.js');

class Error extends Text {
    constructor(game, x, y, options) {
        let style = Object.assign({}, conf.Error.Text, options);
        super(game, x, y, '', style);

        this.textClearTimer = null;
    }

    setText(text, timeout = conf.Error.timeout) {
        if (this.textClearTimer) {
            window.clearTimeout(this.textClearTimer);
        }
        super.setText(text);
        this.textClearTimer = window.setTimeout(() => {
            this.setText('');
            this.textClearTimer = null;
        }, timeout);
    }
};

module.exports = Error;
