'use strict';
const conf = require('./conf.json');

class SFXManager {
    constructor(game) {
        this.game = game;

        this.loaded = false;

        this.recycleSFX = {};
        this.sounds = [];
        this.posSounds = [];

        this.listener = null;
    }

    load() {
        if (this.loaded) {
            return;
        }
        this.loaded = true;

        for (let effect of conf.SFX.effects) {
            this.game.load.audio(effect, `../assets/sfx/${effect}.wav`);
            this.recycleSFX[effect] = [];
        }
    }
    initNetwork() {
        this.game.global.network.on.SFXPlay.add(msg => {
            console.log('hi');
            this.play(msg.effect, msg.x, msg.y);
        });
    }

    getSound(effect) {
        if (this.recycleSFX[effect].length) {
            return this.recycleSFX[effect].pop();
        } else {
            let sound = this.game.sound.add(effect);
            sound.onMarkerComplete.add(() => {
                this.recycleSFX[effect].push(sound);
            });

            return this.game.sound.add(effect);
        }
    }

    calcVolume(sound) {
        if (this.listener == null) {
            return conf.SFX.volume;
        } else {
            let dist = Phaser.Math.distance(sound.x, sound.y,
                    this.listener.x, this.listener.y);
            return conf.SFX.volume / (dist * conf.SFX.distanceScale + 1);
        }
    }

    play(effect, x, y) {
        let sound = this.getSound(effect);
        if ((x !== undefined) && (y !== undefined)) {
            let posSound = {
                x: x,
                y: y,
                sound: sound
            };
            posSound.sound.volume = this.calcVolume(posSound);
            this.posSounds.push(posSound);
        } else {
            this.sounds.push(sound);
        }

        sound.play();
    }
    playBroadcast(effect, x, y) {
        this.play(effect, x, y);
        this.game.global.network.sendSFXPlay(effect, x, y);
    }

    updateListener(x, y) {
        this.listener = {x: x, y: y};
        for (let i = 0;i < this.posSounds.length;i++) {
            let posSound = this.posSounds[i];

            if (posSound.sound.isPlaying) {
                posSound.sound.volume = this.calcVolume(posSound);
            } else {
                //Remove the element from the array, faster than `splite`
                this.posSounds[i--] = this.posSounds[this.posSounds.length - 1];
                this.posSounds.pop();
            }
        }
    }
};

module.exports = SFXManager;
