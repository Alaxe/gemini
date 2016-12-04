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

},{"./conf.json":2,"./text.js":14}],2:[function(require,module,exports){
module.exports={
    "GAME_W": 800,
    "GAME_H": 500,
    "GRAVITY": 0,
    "CAMERA_INTERPOLATION": 0.1,
    "Player": {
        "GRAVITY": 1600,
        "MAX_VELOCITY": {
            "x": 1000,
            "y": 1000
        },
        "WALK_VELOCITY": 600,
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
        "font": "25px Roboto",
        "fill": "#222",
        "wordWrap": true,
        "wordWrapWidth": 1000000,
        "padding": 10,
        "boundsAlignH": "center"
    },
    "Button": {
        "Text": {
            "boundsAlignH": "center",
            "boundsAlignV": "middle",
            "fill": "#FFFFFF"
        },
        "rectRadius": 10,
        "padding": 10,
        "fill": 0x1C67FF,
        "hover": 0x0C5CFC,
        "width": 200,
        "height": 50
    },
    "InputField": {
        "fill": "#222",
        "padding": 5,
        "borderColor": "#1C67FF",
        "borderRadius": 10,
        "backgroundColor": "#eeeeee",
        "cursorColor": "#222222",
        "font": "20px Roboto",
        "height": 25,
        "width": 200

    },
    "Background": {
        "menu": "#eee",
        "play": "#435668"
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
const FontFaceObserver = require('fontfaceobserver');
const conf = require('./conf.json');

module.exports = () => {
    let promises = [];
    for (let font of conf.fonts) {
        promises.push(new FontFaceObserver(font).load());
    }
    return Promise.all(promises);
}

},{"./conf.json":2,"fontfaceobserver":16}],5:[function(require,module,exports){
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
            console.log('hi');
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

},{"./conf.json":2,"./player.js":13}],6:[function(require,module,exports){
const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');
const Text = require('./text.js');

class MainMenu {
    constructor() {}

    init() {}
    preload() {
        loadFont();
        this.add.plugin(Fabrique.Plugins.InputField);
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;

        this.title = new Text(this.game, 250, 190, 'Start a game', 
        {
            width:300, 
            height: 50,
        });

        this.createRoom = new Button(this.game, 250, 240, 'Create a room', 
                300, 40);
        this.joinRoom = new Button(this.game, 250, 300, 'Join a room', 300, 40);

        this.createRoom.onClick.add(() => {
            this.game.state.start('play');
        });
        this.joinRoom.onClick.add(() => {
        });

    }
};

module.exports = MainMenu;

},{"./button.js":1,"./conf.json":2,"./load-font.js":4,"./text.js":14}],7:[function(require,module,exports){
'use strict';

const conf = require('./conf.json');

const PlayState = require('./play-state.js');

const PickUsername = require('./pick-username.js');
const MainMenu = require('./main-menu.js');

let game = new Phaser.Game(conf.GAME_W, conf.GAME_H, Phaser.WEBGL, '');
game.global = {};

game.state.add('play', new PlayState());
game.state.add('mainMenu', new MainMenu());
game.state.add('pickUsername', new PickUsername());

game.state.start('pickUsername');

},{"./conf.json":2,"./main-menu.js":6,"./pick-username.js":11,"./play-state.js":12}],8:[function(require,module,exports){
class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = new WebSocket(`ws://${document.location.hostname}:7001`);

        //this.onlinePlayers = {};
        this.onKeyframeUpdate = new Phaser.Signal();
        this.onTileUpdate = new Phaser.Signal();
        this.onRoomUpdate = new Phaser.Signal();
        this.onJoinError = new Phaser.Signal();

        this.onGameStart = new Phaser.Signal();

        this.ws.onmessage = msgStr => {
            let msg = JSON.parse(msgStr.data);

            if (msg.type == 'keyframeUpdate') {
                this.onKeyframeUpdate.dispatch(msg);
            } else if (msg.type == 'tileUpdate') {
                this.onTileUpdate.dispatch(msg);
            } else {
                console.log('Received unknown message', msg);
            }
        }
    }

    joinRoom(roomId) {
        this.sendOnOpen({
            type: 'join',
            roomId: roomId,
            username: this.game.global.username
        });
    }

    createRoom() {
        this.sendOnOpen({
            type: 'create',
            username: this.game.global.username
        });
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

    sendOnOpen(json) {
        if (this.ws.readyState === WebSocket.OPeN) {
                this.send(json);
        } else {
            this.ws.onopen = () => {
                this.send(json);
            }
        }
    }

    send(json) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            return false;
        } else {
            this.ws.send(JSON.stringify(json));
            return true;
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

},{"./conf.json":2,"./player.js":13}],11:[function(require,module,exports){
'use strict';
const conf = require('./conf.json');

const loadFont = require('./load-font.js');
const Button = require('./button.js');
const Text = require('./text.js');

class PickUsername {
    constructor() {}

    preload() {
        loadFont();
        this.add.plugin(Fabrique.Plugins.InputField);
    }
    create() {
        this.stage.backgroundColor = conf.Background.menu;
        
        this.label = new Text(this.game, 250, 200, 'Pick a username', {
            width: 300,
            height: 50
        });

        let inputStyle = Object.assign({}, conf.InputField, {
            width: 290,
            placeHolder: "Username"
        });
        this.input = this.add.inputField(250, 250, inputStyle);
        this.button = new Button(this.game, 250, 300, 'Start', 300, 40);

        this.button.onClick.add(() => {
            this.game.global.username = this.input.value;
            this.game.state.start('mainMenu');
        });
    }
};

module.exports = PickUsername;

},{"./button.js":1,"./conf.json":2,"./load-font.js":4,"./text.js":14}],12:[function(require,module,exports){
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

        this.stage.backgroundColor = conf.Background.play;
    }

    update() { 
        this.physics.arcade.collide(this.player, this.level.platformLayer);
        this.network.sendKeyframe(this.player);
    }
};

module.exports = PlayState;

},{"./conf.json":2,"./level.js":3,"./load-font.js":4,"./local-player.js":5,"./network-manager.js":8,"./online-player-manager.js":9,"./player.js":13,"./use-highlight.js":15}],13:[function(require,module,exports){
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

},{"./conf.json":2}],14:[function(require,module,exports){
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

},{"./conf.json":2,"./load-font.js":4}],15:[function(require,module,exports){
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

},{"./conf.json":2}],16:[function(require,module,exports){
(function(){function m(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function n(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function l(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",l),a()})};function t(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function x(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;left:-999px;white-space:nowrap;font:"+b+";"}function y(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function z(a,b){function c(){var a=l;y(a)&&a.a.parentNode&&b(a.g)}var l=a;m(a.b,c);m(a.c,c);y(a)};function A(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var B=null,C=null,E=null,F=null;function I(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function J(a,b){return[a.style,a.weight,I()?a.stretch:"","100px",b].join(" ")}
A.prototype.load=function(a,b){var c=this,l=a||"BESbswy",r=0,D=b||3E3,G=(new Date).getTime();return new Promise(function(a,b){var e;null===F&&(F=!!document.fonts);if(e=F)null===C&&(C=/OS X.*Version\/10\..*Safari/.test(navigator.userAgent)&&/Apple/.test(navigator.vendor)),e=!C;if(e){e=new Promise(function(a,b){function f(){(new Date).getTime()-G>=D?b():document.fonts.load(J(c,'"'+c.family+'"'),l).then(function(c){1<=c.length?a():setTimeout(f,25)},function(){b()})}f()});var K=new Promise(function(a,
c){r=setTimeout(c,D)});Promise.race([K,e]).then(function(){clearTimeout(r);a(c)},function(){b(c)})}else n(function(){function e(){var b;if(b=-1!=g&&-1!=h||-1!=g&&-1!=k||-1!=h&&-1!=k)(b=g!=h&&g!=k&&h!=k)||(null===B&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),B=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=B&&(g==u&&h==u&&k==u||g==v&&h==v&&k==v||g==w&&h==w&&k==w)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(r),a(c))}
function H(){if((new Date).getTime()-G>=D)d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)g=f.a.offsetWidth,h=p.a.offsetWidth,k=q.a.offsetWidth,e();r=setTimeout(H,50)}}var f=new t(l),p=new t(l),q=new t(l),g=-1,h=-1,k=-1,u=-1,v=-1,w=-1,d=document.createElement("div");d.dir="ltr";x(f,J(c,"sans-serif"));x(p,J(c,"serif"));x(q,J(c,"monospace"));d.appendChild(f.a);d.appendChild(p.a);d.appendChild(q.a);document.body.appendChild(d);u=f.a.offsetWidth;v=p.a.offsetWidth;
w=q.a.offsetWidth;H();z(f,function(a){g=a;e()});x(f,J(c,'"'+c.family+'",sans-serif'));z(p,function(a){h=a;e()});x(p,J(c,'"'+c.family+'",serif'));z(q,function(a){k=a;e()});x(q,J(c,'"'+c.family+'",monospace'))})})};"undefined"!==typeof module?module.exports=A:(window.FontFaceObserver=A,window.FontFaceObserver.prototype.load=A.prototype.load);}());

},{}]},{},[7]);
