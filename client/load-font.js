//const FontFaceObserver = require('fontfaceobserver');
const conf = require('./conf.json');

module.exports = () => {
    let promises = [];
    for (let font of conf.fonts) {
        promises.push(new FontFaceObserver(font).load());
    }
    return Promise.all(promises);
}
