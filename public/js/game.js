const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  // map made with Tiled in JSON format
  this.load.tilemapTiledJSON("map", "assets/assets/map.json");
  // tiles in spritesheet
  this.load.spritesheet("tiles", "assets/assets/tiles.png", {
    frameWidth: 70,
    frameHeight: 70,
  });
  // simple coin image
  this.load.image("coin", "assets/assets/coinGold.png");
  // player animations
  this.load.atlas(
    "player",
    "assets/assets/player.png",
    "assets/assets/player.json"
  );
}

function create() {
  const self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  this.map = this.make.tilemap({ key: "map" });
  this.groundTiles = this.map.addTilesetImage("tiles");
  this.groundLayer = this.map.createDynamicLayer(
    "World",
    this.groundTiles,
    0,
    0
  );
  this.groundLayer.setCollisionByExclusion(-1, true);
  this.physics.add.collider(this.groundLayer, this.player);

  // When a player joins they are sent a list of players including themselves
  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  // When a new player connects, they are added as an other player
  this.socket.on("newPlayer", function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  // When a player disconnects, they are removed from the game
  this.socket.on("playerDisconnect", function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on("playerMoved", function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        otherPlayer.setFlipX(playerInfo.flipX);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (this.player) {
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-200);
      this.player.anims.play("walk", true);
      this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(200);
      this.player.anims.play("walk", true);
      this.player.flipX = false;
    } else {
      this.player.body.setVelocityX(0);
      this.player.anims.play("idle", true);
    }

    if (this.cursors.up.isDown && this.player.body.onFloor()) {
      this.player.body.setVelocityY(-500);
    }

    // emit player movement
    const x = this.player.x;
    const y = this.player.y;
    if (
      this.player.oldPosition &&
      (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)
    ) {
      this.socket.emit("playerMovement", {
        x: this.player.x,
        y: this.player.y,
        flipX: this.player.flipX,
      });
    }
    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
    };
  }
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, "player");
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  player.setSize(player.width, player.height - 8);

  self.player = player;

  // player walk animation
  self.anims.create({
    key: "walk",
    frames: self.anims.generateFrameNames("player", {
      prefix: "p1_walk",
      start: 1,
      end: 11,
      zeroPad: 2,
    }),
    frameRate: 10,
    repeat: -1,
  });
  // idle with only one frame, so repeat is not neaded
  self.anims.create({
    key: "idle",
    frames: [{ key: "player", frame: "p1_stand" }],
    frameRate: 10,
  });
  if (playerInfo.team === "blue") {
    self.player.setTint(0x0000ff);
  } else {
    self.player.setTint(0xff0000);
  }
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.sprite(
    playerInfo.x,
    playerInfo.y,
    "player"
  );
  otherPlayer.setBounce(0.2);
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.setSize(otherPlayer.width, otherPlayer.height - 8);
  otherPlayer.playerId = playerInfo.playerId;
  if (playerInfo.team === "blue") {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  self.otherPlayers.add(otherPlayer);
}
