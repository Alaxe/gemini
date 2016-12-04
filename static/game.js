(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const conf = require('./conf.json');
const Text = require('./text.js');

class Button extends Phaser.Group {
    constructor(game, x, y, label, width, height) {
        super(game);

        this.x = x;
        this.y = y;
        this.onClick = new Phaser.Signal();

        width = width || conf.Button.width;
        height = height || conf.Button.height;

        this.background = game.add.graphics();

        this.background.beginFill(0xFFFFFFF);
        this.background.drawRoundedRect(0, 0, width, height,
            conf.Button.rectRadius);
        this.background.endFill();

        this.background.tint = conf.Button.fill;

        this.background.inputEnabled = true;

        this.background.events.onInputOver.add(() => {
            this.background.tint = conf.Button.hover;
        })
        this.background.events.onInputOut.add(() => {
            this.background.tint = conf.Button.fill;
        });
        this.background.events.onInputDown.add(() => {
            this.onClick.dispatch();
        });

        this.background.tint = conf.Button.fill;

        this.add(this.background);

        this.text = new Text(game, 0, 0, label, Object.assign(
            {},
            conf.Button.Text,
            {
                width: width, 
                height: height
            }
        ));
        this.add(this.text);
    }
};

module.exports = Button;

},{"./conf.json":2,"./text.js":13}],2:[function(require,module,exports){
module.exports={
    "GAME_W": 800,
    "GAME_H": 500,
    "GRAVITY": 0,
    "CAMERA_INTERPOLATION": 0.1,
    "Player": {
        "GRAVITY": 1600,
        "MAX_VELOCITY": {
            "x": 400,
            "y": 1500
        },
        "WALK_VELOCITY": 800,
        "AIR_VELOCITY": 300,
        "JUMP_VELOCITY": 800,
        "JUMP_INTERVAL_MS": 750,
        "INTERPOLATION_DELAY_MS": 200
    },
    "Highlight": {
        "Y": {
            "min": -1,
            "max": -1
        },
        "X": {
            "min": 0,
            "max": 2
        },
        "color": 0xFFFFFF
    },
    "fonts": ["Roboto"],
    "Text": {
        "font": "Roboto",
        "fontSize": 25,
        "fill": "#FFFFFF",
        "wordWrap": true,
        "wordWrapWidth": 1000000,
        "padding": 10
    },
    "Button": {
        "Text": {
            "boundsAlignH": "center",
            "boundsAlignV": "middle"
        },
        "rectRadius": 10,
        "padding": 10,
        "fill": 0x1C67FF,
        "hover": 0x0C5CFC,
        "width": 200,
        "height": 50
    },
    "TextInput": {
        "Text": {
        }
    },
    "Menu": {
        "background": "#314047"
    }
}

},{}],3:[function(require,module,exports){
'use strict';
function rotateMask(mask, rotationRad) {
    let rotCnt = Math.round(rotationRad / Math.PI * 2);
    let firstMask = mask;
    for (let i = 0;i < rotCnt;i++) {
        mask = ((mask & 7) << 1) + ((mask & 8) >> 3);
    }

    return mask;
}

class LogicBlock {
    constructor(tile) {
        this.tile = tile;
        this.inCC = null;
        this.outCC = null;

        this.hasInput = false;
        this.calcOutput();
    }

    calcOutput() {

        if ((this.hasInput) && (this.tile.index & 1)) {
            this.tile.index++;
        } else if ((!this.hasInput) && ((this.tile.index & 1) == 0)) {
            this.tile.index--;
        }

        if (this.hasInput) {

        }
        const outputIds = [9, 10, 12, 13, 18];
        this.hasOutput = outputIds.includes(this.tile.index);
    }
}

class CableComponent {
    constructor() {
        this.tiles = [];
        this.input = [];
        this.output = [];

        this.inputsLeft = 0;
        this.hasInput = false;

        //this.map = startTile.layer.map;
    }

    setPower(power) {
        //console.log(this.tiles, power);
        for (let tile of this.tiles) {
            let baseIndex = tile.index;
            if ((tile.index & 1) == 0) {
                baseIndex--;
            }

            tile.index = power
                ? baseIndex + 1
                : baseIndex;
            //tile.id++;
            //this.map.putTile(tile, tile.x, tile.y, tile.layer.name);
            //console.log(tile.layer.name);
        }
    }

    addCable(tile) {
        if (tile.properties.type !== 'cable') {
            throw new Error(tile);
        }

        this.tiles.push(tile);
        tile.properties.component = this;
    }

    addOutput(tile) {
        let block = tile.properties.block;

        this.output.push(block);
        block.inCC = this;
    }

    addInput(tile) {
        let block = tile.properties.block;

        this.input.push(block);
        block.outCC = this;
    }
}

class Level {
    constructor(game) {
        this.onTileChange = new Phaser.Signal();

        this.game = game;

        this.map = this.game.add.tilemap('map');
        this.map.addTilesetImage('platforms');
        this.map.addTilesetImage('cables');

        this.cableLayer = this.map.createLayer('cables');
        this.cableLayer.resizeWorld();

        this.platformLayer = this.map.createLayer('platforms');
        this.platformLayer.resizeWorld();

        this.map.setCollision(19, true, 'platforms');
        this.buildNetwork();

        this.simulatePower();
    }

    static useTile(tile) {
        if ((tile == null) || (!tile.properties.usable)) {
            return false;
        } else {
            let oldIndex = tile.index;
            console.log(tile);

            tile.index = tile.properties.onUseId;
            tile.properties.onUseId = oldIndex;

            console.log(tile);

            return true;
        }
    }

    onUseTile(tile) {
        console.log('using ', tile);
        if (this.constructor.useTile(tile)) {
            this.simulatePower();
            console.log(tile);
            this.onTileChange.dispatch(tile);
        }
    }

    onTileUpdate(msg) {
        let tile = this.map.getTile(msg.x, msg.y, msg.layer, true);

        tile.index = msg.index;
        tile.properties.onUseId = msg.properties.onUseId;

        this.map.putTile(tile, msg.x, msg.y, msg.layer);

        if (msg.layer == 'cables') {
            this.simulatePower();
        }
    }

    initNetwork() {
        this.cableComponents = [];
        this.logicBlocks = [];

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');

                if (tile == null) {
                    continue;
                }
                tile.properties.component = null;

                if (tile.properties.type === 'logic') {
                    tile.properties.block = new LogicBlock(tile);
                    this.logicBlocks.push(tile.properties.block);
                }
            }
        }
    }

    rotateTileEnds() {
        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');
                if (tile === null) {
                    continue;
                }

                let prop = tile.properties;
                let rotation = tile.rotation;

                if (prop.type === 'cable') {
                    prop.ends = rotateMask(prop.ends, rotation);
                } else if (prop.type === 'logic') {
                    prop.input = rotateMask(prop.input, rotation);
                    prop.output = rotateMask(prop.output, rotation);
                }
            }
        }
    }
    getLogicBlock(tile) {
        if (tile.properties.type !== 'logic') {
            throw new Error(tile);
        }
        if (!tile.block) {
            tile.block =  new LogicBlock(tile);
        }
        return tile.block;
    }

    buildComponent(startTile) {
        let cc = new CableComponent();
        cc.addCable(startTile);

        let queue = [startTile];

        const sides = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        while (queue.length > 0) {
            let curTile = queue[0];
            queue.shift();

            for (let i = 0;i < sides.length;i++) {
                let curBit = 1 << i;
                let newBit = 1 << ((i + 2) % 4);

                if (!(curTile.properties.ends & curBit)) {
                    continue;
                }

                let newX = curTile.x + sides[i].x;
                let newY = curTile.y + sides[i].y;

                let newTile = this.map.getTile(newX, newY, 'cables');
                if (newTile == null) {
                    continue;
                }

                if (newTile.properties.type === 'cable') {
                    if ((newTile.properties.ends & newBit) &&
                            (!newTile.properties.component)) {
                        cc.addCable(newTile);
                        queue.push(newTile);
                    }
                } else if (newTile.properties.type === 'logic') {
                    if (newTile.properties.input & newBit) {
                        cc.addOutput(newTile);
                    } else if (newTile.properties.output & newBit) {
                        cc.addInput(newTile);
                    }
                }
            }
        }
        return cc;
    }

    connectLogicBlocks() {
        for (let block of this.logicBlocks) {
            if (!block.outCC) {
                block.outCC = new CableComponent();
                block.outCC.addInput(block.tile);

                const sides = [
                    {x: 0, y: -1},
                    {x: 1, y: 0},
                    {x: 0, y: 1},
                    {x: -1, y: 0}
                ];
                for (let i = 0;i < sides.length;i++) {
                    if ((block.tile.properties.output & (1 << i)) == 0) {
                        continue;
                    }

                    let nX = block.tile.x + sides[i].x;
                    let nY = block.tile.y + sides[i].y;

                    let nTile = this.map.getTile(nX, nY, 'cables');

                    if ((nTile == null) || (nTile.properties.type != 'logic')) {
                        continue;
                    }

                    block.outCC.addOutput(nTile);
                }

                this.cableComponents.push(block.outCC);
            }
        }

        for (let block of this.logicBlocks) {
            if (!block.inCC) {
                block.inCC = new CableComponent();
                block.inCC.addOutput(block.tile);

                this.cableComponents.push(block.inCC);
            }
        }
    }

    buildNetwork() {
        this.rotateTileEnds();
        this.initNetwork();

        for (let x = 0;x < this.map.width;x++) {
            for (let y = 0;y < this.map.height;y++) {
                let tile = this.map.getTile(x, y, 'cables');
                if (tile === null) {
                    continue;
                }

                if ((tile.properties.type === 'cable') &&
                        (tile.properties.component == null)) {
                    this.cableComponents.push(this.buildComponent(tile));
                }
            }
        }

        this.connectLogicBlocks();
    }

    simulatePower() {
        let queue = [];
        for (let cc of this.cableComponents) {
            cc.inputsLeft = cc.input.length;
            cc.hasInput = false;

            if (cc.inputsLeft == 0) {
                queue.push(cc);
            }
            //i.setPower(Math.round(Math.random()));
        }

        while (queue.length > 0) {
            let cur = queue[0];
            queue.shift();

            //console.log(cur);

            cur.setPower(cur.hasInput);

            for (let block of cur.output) {
                block.hasInput = cur.hasInput;
                block.calcOutput();

                block.outCC.hasInput = block.outCC.hasInput || block.hasOutput;
                //console.log(block.hasOutput, block.outCC.hasInput);
                block.outCC.inputsLeft--;

                if (block.outCC.inputsLeft == 0) {
                    queue.push(block.outCC);
                }
            }
        }

        this.cableLayer.dirty = true;
    }
}
module.exports = Level;

},{}],4:[function(require,module,exports){
//const FontFaceObserver = require('fontfaceobserver');
const conf = require('./conf.json');

module.exports = () => {
    let promises = [];
    for (let font of conf.fonts) {
        promises.push(new FontFaceObserver(font).load());
    }
    return Promise.all(promises);
}

},{"./conf.json":2}],5:[function(require,module,exports){
const conf = require('./conf.json');
const Player = require('./player.js');

class LocalPlayer extends Player {
    constructor(game, x = 0, y = 0) {
        super(game, x, y);

        this.game.physics.enable(this, Phaser.Physics.ARCADE);

        this.body.collideWorldBounds = true;
        this.body.gravity.y = conf.Player.GRAVITY;

        this.body.maxVelocity.y = conf.Player.MAX_VELOCITY.y;
        this.body.maxVelocity.x = conf.Player.MAX_VELOCITY.x;

        this.nextJump = this.game.time.now;

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.jump = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    }

    update() {
        let xVelocity = this.body.onFloor()
            ? conf.Player.WALK_VELOCITY
            : conf.Player.AIR_VELOCITY;

        if (this.cursors.right.isDown) {
            this.body.velocity.x = xVelocity;
        } else if (this.cursors.left.isDown) {
            this.body.velocity.x = -xVelocity;
        } else {
            this.body.velocity.x = 0;
        }


        if ((this.body.onFloor()) && (this.jump.isDown) &&
                (this.game.time.now >= this.nextJump)) {

            this.body.velocity.y -= conf.Player.JUMP_VELOCITY;
            this.nextJump = this.game.time.now + conf.Player.JUMP_INTERVAL_MS;
        }

        if (this.body.velocity.x < 0) {
            this.scale.setTo(-1, 1);
        } else if (this.body.velocity.x > 0) {
            this.scale.setTo(1, 1);
        }
    }
}

module.exports = LocalPlayer;

},{"./conf.json":2,"./player.js":12}],6:[function(require,module,exports){
const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');

class MainMenu {
    constructor() {}

    init() {}
    preload() {
        loadFont();
    }
    create() {
        this.button = new Button(this.game, 300, 200, 'Start', 200, 100);
        this.stage.backgroundColor = conf.Menu.background;

        this.button.onClick.add(() => {
            this.game.state.start('play');
        });
    }

};

module.exports = MainMenu;

},{"./button.js":1,"./conf.json":2,"./load-font.js":4}],7:[function(require,module,exports){
'use strict';

const conf = require('./conf.json');
const PlayState = require('./play-state.js');
const MainMenu = require('./main-menu.js');

const game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');
game.global = {};

game.state.add('play', new PlayState());
game.state.add('mainMenu', new MainMenu());
game.state.start('mainMenu');

},{"./conf.json":2,"./main-menu.js":6,"./play-state.js":11}],8:[function(require,module,exports){
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        //this.onlinePlayers = {};
        this.onKeyframeUpdate = new Phaser.Signal();
        this.onTileUpdate = new Phaser.Signal();

        const self = this;

        this.ws.onopen = () => {
            let url = window.parent.location.pathname;
            console.log(url);

            let gameId = url.substr(url.lastIndexOf('/') + 1);
            self.ws.send(JSON.stringify({
                type: 'connect',
                gameId: gameId
            }));
        }

        this.ws.onmessage = msgStr => {
            let msg = JSON.parse(msgStr.data);

            if (msg.type == 'keyframeUpdate') {
                self.onKeyframeUpdate.dispatch(msg);
            } else if (msg.type == 'tileUpdate') {
                self.onTileUpdate.dispatch(msg);
            } else {
                console.log('Received unknown message', msg);
            }
        }
    }

    sendTileUpdate(tile) {
        console.log(tile, tile.id);
        this.send({
            type: 'broadcast',
            body: {
                type: 'tileUpdate',
                x: tile.x,
                y: tile.y,
                layer: tile.layer.name,
                index: tile.index,
                properties: {
                    onUseId: tile.properties.onUseId
                }
            }
        });
    }

    sendKeyframe(player) {
        this.send({
            type: 'broadcast',
            body: {
                type: 'keyframeUpdate',
                x: player.x,
                y: player.y,
                time: this.game.time.now
            }
        });
    }

    send(json) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            return false;
        } else {
            this.ws.send(JSON.stringify(json));
        }
    }
}

module.exports = NetworkManager;

},{}],9:[function(require,module,exports){
const OnlinePlayer = require('./online-player.js');

class OnlinePlayerManager {
    constructor(game, network) {
        this.game = game;
        this.playersById = {}
    }

    getPlayerById(id) {
        if (!(id in this.playersById)) {
            this.playersById[id] = new OnlinePlayer(this.game);
        }
        return this.playersById[id];
    }

    handleKeyframeUpdate(msg) {
        let player = this.getPlayerById(msg.playerId);
        player.addKeyframe(msg);
    }
}
module.exports = OnlinePlayerManager;

},{"./online-player.js":10}],10:[function(require,module,exports){
const Player = require('./player.js');
const conf = require('./conf.json');

let onlinePlayersById = {}

class OnlinePlayer extends Player {
    constructor(game) {
        super(game);
        this.keyframes = [];

        this.meanTimeDiff = 0;
        this.meanSampleCnt = 0;
    }

    static handleKeyframeUpdate(msg) {

    }

    addKeyframe(msg) {
        this.keyframes.push(msg);

        if (this.keyframes.length == 1) {
            this.x = this.keyframes[0].x;
            this.y = this.keyframes[0].y;
        }

        let timeDiff = this.game.time.now - msg.time;

        this.meanTimeDiff *= this.meanSampleCnt / (this.meanSampleCnt + 1);
        this.meanSampleCnt++;

        this.meanTimeDiff += timeDiff / this.meanSampleCnt;
    }
    update() {
        let netNow = this.game.time.now
                - conf.Player.INTERPOLATION_DELAY_MS
                - this.meanTimeDiff;

        while ((this.keyframes.length > 1) && (this.keyframes[1].time < netNow)) {
            this.keyframes.shift();
        }

        let prev = this.keyframes[0];
        if (this.keyframes.length > 1) {
            let next = this.keyframes[1];

            let traversedPart = (netNow - prev.time) / (next.time - prev.time);

            this.x = prev.x + (next.x - prev.x) * traversedPart;
            this.y = prev.y + (next.y - prev.y) * traversedPart;
        } else {
            //console.log('Not enough keyframes');
            this.x = prev.x;
            this.y = prev.y;
        }
    }
}

module.exports = OnlinePlayer;

},{"./conf.json":2,"./player.js":12}],11:[function(require,module,exports){
'use strict';

const conf = require('./conf.json');

const Player = require('./player.js');
const LocalPlayer = require('./local-player.js');
const OnlinePlayerManager = require('./online-player-manager.js');
const loadFont = require('./load-font.js');

const NetworkManager = require('./network-manager.js');
const Level = require('./level.js');
const UseManager = require('./use-highlight.js');


class PlayState {
    constructor() {}

    preload() {
        this.load.image('platforms', '../assets/platforms.png')
        this.load.image('cables', '../assets/cables.png')
        this.load.tilemap('map', '../assets/level.json', null,
            Phaser.Tilemap.TILED_JSON);

        this.load.image('player', '../assets/player.png');

        loadFont();
    }
    create() {
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = conf.GRAVITY;

        this.level = new Level(this.game);

        this.player = new LocalPlayer(this.game);
        this.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON,
            conf.CAMERA_INTERPOLATION, conf.CAMERA_INTERPOLATION);

        this.network = new NetworkManager(this.game);

        this.useManager = new UseManager(this.game, this.level,
                this.player);

        this.level.onTileChange.add(this.network.sendTileUpdate
                .bind(this.network));

        this.onlinePlayerManager = new OnlinePlayerManager(this.game);
        this.network.onKeyframeUpdate.add(this
            .onlinePlayerManager
            .handleKeyframeUpdate
            .bind(this.onlinePlayerManager));

        this.network.onTileUpdate.add(this.level.onTileUpdate.bind(this.level));
        this.network.onTileUpdate.add(console.log);
        this.restart = this.input.keyboard.addKey(Phaser.Keyboard.R);
    }

    update() {
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;

},{"./conf.json":2,"./level.js":3,"./load-font.js":4,"./local-player.js":5,"./network-manager.js":8,"./online-player-manager.js":9,"./player.js":12,"./use-highlight.js":14}],12:[function(require,module,exports){
const conf = require('./conf.json');

class Player extends Phaser.Sprite {
    constructor(game, x = 0, y = 0) {
        super(game, x, y, 'player');

        ///Should add animations

        this.anchor.setTo(0.5, 0.5);
        this.game.add.existing(this);
    }
}

module.exports = Player;

},{"./conf.json":2}],13:[function(require,module,exports){
const conf = require('./conf.json');
const loadFont = require('./load-font.js');

class Text extends Phaser.Text {
    constructor(game, x, y, text, pStyle) {
        let style = Object.assign({}, conf.Text, pStyle);
        super(game, x, y, text, style);
        
        if ((style.width) && (style.height)) {
            this.setTextBounds(
                style.padding, 
                style.padding, 
                style.width - 2 * style.padding,
                style.height - 2 * style.padding
            );
        }

        loadFont().then(() => {
            this.setText(text);
        });

        game.add.existing(this);
    }
}

module.exports = Text;

},{"./conf.json":2,"./load-font.js":4}],14:[function(require,module,exports){
'use strict';
const conf = require('./conf.json').Highlight;

class UseManager extends Phaser.Graphics {
    constructor(game, level, player) {
        console.log('bollocks');
        super(game, 0, 0);

        super.lineStyle(2, conf.color, 1);
        super.drawRect(1, 1, 30, 30);

        this.game.add.existing(this);

        this.layer = level.cableLayer;
        this.player = player;

        this.tile = null;

        this.useButton = this.game.input.keyboard.addKey(Phaser.KeyCode.E);
        this.onUse = new Phaser.Signal();

        this.onUse.add(level.onUseTile.bind(level));

        this.useButton.onDown.add(key => {
            if (this.tile) {
                this.onUse.dispatch(this.tile);
            }
        });
        this.useButton.onDown.add(console.log);

    }

    update() {
        this.tile = null;
        this.visible = false;

        if (!this.player.body.onFloor()) {
            return;
        }

        let tileW = this.layer.map.tileWidth;
        let tileH = this.layer.map.tileHeight;

        let bestDist;

        for (let dY = conf.Y.min;dY <= conf.Y.max;dY++) {
            for (let dX = conf.X.min;dX <= conf.X.max;dX++) {
                let newX = this.player.x + this.player.scale.x * dX * tileW;
                let newY = this.player.y + this.player.scale.y * dY * tileH;

                let tileX = this.layer.getTileX(newX);
                let tileY = this.layer.getTileY(newY);

                let curTile = this.layer.map.getTile(tileX, tileY, this.layer);

                if ((curTile) && (curTile.properties.usable)) {
                    let xDist = this.player.x - (tileX + 0.5) * tileW;
                    let yDist = this.player.y - (tileY + 0.6) * tileH;
                    let curDist = Math.abs(xDist) + Math.abs(yDist);

                    if ((this.tile == null) || (curDist < bestDist)) {
                        this.tile = curTile;
                        bestDist = curDist;
                    }
                }
            }
        }

        if (this.tile) {
            this.visible = true;
            this.x = this.tile.worldX;
            this.y = this.tile.worldY;
        }
    }
}

module.exports = UseManager;

},{"./conf.json":2}]},{},[7]);
