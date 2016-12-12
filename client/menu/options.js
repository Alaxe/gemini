const ui = require('../ui');
const levelData = require('../level-data.json');

class Options {
    init() {}
    create() {
        this.heading = new ui.Text(this.game, 0.3, 0.3, 'Options', 0.4, 0.1);
        this.changeUsername = new ui.Button(this.game, 0.3, 0.4, 'Change username');
        this.resetProgress = new ui.Button(this.game, 0.3, 0.5, 'Reset progress');
        this.back = new ui.Button(this.game, 0.3, 0.6, 'Back');

        this.changeUsername.onClick.add(() => {
            localStorage.removeItem('username');
            this.state.start('username');
        });
        this.resetProgress.onClick.add(() => {
            for (let i = 0;i < levelData.length;i++) {
                localStorage.removeItem('levelData-' + i);
            }
            this.state.start('mainMenu');
        });
        this.back.onClick.add(() => {
            this.state.start('mainMenu');
        });
    }
};
module.exports = Options;
