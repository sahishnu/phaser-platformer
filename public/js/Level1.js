import Map from "./Map.js";
import Player from "./Player.js";

export default class Level_1 extends Phaser.Scene {
  playBtn;
  player;
  cursors;
  isGameStarted = false;
  scoreText;
  score = 0;
  lifes = [];
  dieText;
  map;
  pickUpTiles;
  jumpAudio;
  pickUpAudio;
  levelCompleteAudio;
  deathAudio;

  constructor() {
    super("level_1"); // scene key, every scene should have a unique key
  }
  //
  init() {
    this.isGameStarted = false;
    this.cursors = this.input.keyboard.createCursorKeys(); // enable keyboard player movement
  }

  preload() {
    this.isGameStarted = false;
    // load image
    this.load.image("play-btn", "assets/play.png");
    this.load.image("character-1", "assets/character_1.png");
    this.load.image("character-2", "assets/character_2.png");
    this.load.image("coin", "assets/coin.png");
    this.load.image("life", "assets/life.png");
    this.load.image("spike", "assets/spike.png");
    this.load.image("green-tile", "assets/Tiles/green-tile.png");
    this.load.image("white-tile", "assets/Tiles/white-tile.png");

    //load audio
    this.load.audio("click", ["audio/click.wav"]);
    this.load.audio("coin-pickup", ["audio/coin-pickup.wav"]);
    this.load.audio("jump", ["audio/Jump.wav"]);
    this.load.audio("level-complete", ["audio/level-complete.wav"]);
    this.load.audio("death", ["audio/death.wav"]);

    //load map
    this.load.tilemapTiledJSON("map1", "assets/Tilemap/map1.json");
    this.load.tilemapTiledJSON("map2", "assets/Tilemap/map2.json");
    this.load.tilemapTiledJSON("map3", "assets/Tilemap/map3.json");
    this.load.tilemapTiledJSON("map4", "assets/Tilemap/map4.json");
    this.load.tilemapTiledJSON("map5", "assets/Tilemap/map5.json");
    this.load.image("map-tiles", "assets/Tilemap/tiles_packed.png");
  }

  create() {
    //create map
    this.map = new Map(this, "map1"); // map1 create
    // create play button
    this.playBtn = this.add
      .image(this.cameras.main.centerX, this.cameras.main.centerY, "play-btn") // add button image
      .setInteractive() // enable it for input
      .setOrigin(0.5); // fix the button position
    this.playBtn.setDepth(5); //set button visible in scene
    this.playBtn.setScale(2.5); // fix button size
    this.playBtn.on("pointerdown", this.startGame, this); //set button click game start

    // create animations
    this.anims.create({
      key: "run",
      frames: [{ key: "character-1" }, { key: "character-2" }],
      frameRate: 8,
      repeat: -1,
    });
  } // end

  // start game
  startGame() {
    this.sound.add("click").play(); // add the sound
    this.playBtn.setVisible(false); // set the inVisibility Button

    //add audio
    this.jumpAudio = this.sound.add("jump");
    this.pickUpAudio = this.sound.add("coin-pickup");
    this.levelCompleteAudio = this.sound.add("level-complete");
    this.deathAudio = this.sound.add("death");
    //set game score text
    this.scoreText = this.add.text(950, 20, "score: 0", {
      fontFamily: "monogram",
      fontSize: "38px",
      fill: "#000",
    });
    // set level number in screen
    this.add
      .text(this.cameras.main.centerX, 50, "Level 1 - Goal : 100 Points", {
        fontFamily: "monogram",
        fontSize: "38px",
        fill: "#000",
      })
      .setDepth(20)
      .setOrigin(0.5);

    //?player and game logic here
    this.player = new Player(this, 80, 300, "character-2"); //add player in game world

    //enable collision
    this.handleCollision();

    // life...........
    this.createLifes();

    // set the game start true
    this.isGameStarted = true;
  }
  // create life....
  createLifes() {
    let life = this.physics.add
      .sprite(40, 30, "life")
      .setScale(1.5)
      .setDepth(10); // add the life image set the position and visible in scene
    this.lifes.push(life); // push the image in lifes array
    life = this.physics.add.sprite(70, 30, "life").setScale(1.5).setDepth(10); // add the life image set the position and visible in scene
    this.lifes.push(life); // push the image in lifes array
    life = this.physics.add.sprite(100, 30, "life").setScale(1.5).setDepth(10); // add the life image set the position and visible in scene
    this.lifes.push(life); // push the image in lifes array
  }

  // check the collision between player and game world map
  handleCollision() {
    this.physics.add.collider(this.player, this.map.getGroundLayer());
    this.physics.add.collider(this.player, this.map.getDieLayer(), () => {
      //  the player collition die layer(spark,or many) passed this gameover function
      this.gameOver();
    });

    let pickUpLayer = this.map.getPickupLayer();
    // pick the tileindex of coin and call it hitcoin function..
    pickUpLayer.setTileIndexCallback(152, this.hitCoins, this);
    this.physics.add.overlap(this.player, pickUpLayer); // coin collect player

    //handle level complete
    let propsLayer = this.map.getPropsLayer();
    propsLayer.setTileIndexCallback(132, this.levelComplete, this); // pick the tileindex of flag, player touch the flag levelcompelete
    this.physics.add.overlap(this.player, propsLayer); // check player overlap the flag
  }

  gameOver() {
    // gameover here
    if (this.lifes.length > 0) {
      let life = this.lifes.pop(); // remove the life image
      life.destroy(); // destroy player life
      this.deathAudio.play(); // add player death audio
      this.player.reset(); // set player initial position
    }

    if (this.lifes.length == 0) {
      localStorage.setItem("Score", this.score); //  set save the score localstorage
      this.deathAudio.play();
      this.player.reset();
      this.isGameStarted = !this.isGameStarted;
      this.scene.start("gameover");
    }
  }

  // set levelcomplete
  levelComplete() {
    // update score....

    if (this.score >= 100) {
      localStorage.setItem("Score", this.score); //  set save the score localstorage
      this.levelCompleteAudio.play();
      this.scene.start("level_2");
    }
  }
  // set player hit the coin and remove coin
  hitCoins(player, coin) {
    this.pickUpAudio.play();
    this.map.getPickupLayer().removeTileAt(coin.x, coin.y);
    this.updateScore(10); //update game score
  }

  //time and deltaTime
  update(t, dt) {
    //  player movement
    if (this.isGameStarted) {
      if (this.cursors.left.isDown) {
        // press keboard left arrow button player move left
        this.player.flipX = false;
        this.player.setVelocityX(-160);
        this.player.anims.play("run", true);
      } else if (this.cursors.right.isDown) {
        // press keboard right arrow button player move right
        this.player.flipX = true;
        this.player.setVelocityX(160);
        this.player.anims.play("run", true);
      } else {
        // no press any button player con't move
        this.player.setVelocityX(0); // set player velocity 0 ,player can't move
        this.player.anims.stop(); // stop the animations
      }
      // set player jump
      if (this.cursors.up.isDown && this.player.body.blocked.down) {
        this.jumpAudio.play();
        this.player.setVelocityY(-250); // set player jump
      }
    }
  } //end update
  // game score...
  updateScore(_value) {
    this.score += _value; // increase game score set value _value =10
    this.scoreText.setText("Score: " + this.score); // set the text for score show
  }
} //end class
