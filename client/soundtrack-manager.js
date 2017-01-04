'use strict'
const conf = require('./conf.json');

class SoundtrackManager {
    constructor(game) {
        this.game = game;
        this.currentTrack = null;

        this.created = false;
        this.loaded = false;
    }

    create() {
        if (this.created) {
            return;
        }
        this.created = true;

        if (!this.tracks) {
            this.tracks = {};
        }
        for (let track of conf.Soundtrack.tracks) {
            if (!this.tracks[track]) {
                this.tracks[track] = this.game.sound.add(track,
                        conf.Soundtrack.volume, true);

                this.tracks[track].onDecoded.addOnce(() => {
                    if (this.currentTrack.key === track) {
                        this.currentTrack.play();
                        this.currentTrack.fadeTo(conf.Soundtrack.fade,
                                conf.Soundtrack.volume);
                    }
                });
            }
        }
    }

    play(key) {
        this.create();
        if ((!this.currentTrack) || (this.currentTrack.key !== key)) {
            if (this.currentTrack) {
                this.currentTrack.fadeOut(conf.Soundtrack.fade);
            }
            this.currentTrack = this.tracks[key];

            this.currentTrack.play();
            this.currentTrack.fadeTo(conf.Soundtrack.fade,
                    conf.Soundtrack.volume);
        }
    }
};

module.exports = SoundtrackManager;
