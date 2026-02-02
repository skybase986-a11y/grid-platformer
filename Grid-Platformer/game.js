let player;
let cursors;
let spaceKey;
let enterKey;
let wasPointerDown = false;
let boostFlashFrames = 0;
const BOOST_FLASH_DURATION = 6;
let gameMode = null; // 'editor', 'custom', or null

this.currentMusic = null;
let gameStarted = false;

let UI_WIDTH;
let GAME_WIDTH;
let width;
let height;
let blockColorsButton
// --- CAMERA ---
let baseCamZoom = 0.5;
let speedZoomOut = 0.15;
let camZoomLerp = 0.08;
let blockColorsOverlay;
let blockColorsText;
let blockColorButtons = [];


let levelOptionButtons

// --- INSTRUCTIONS ---
let firstTimeInstructionsShown = false;
let firstTimeEditorInstructionsShown = false;
let instructionText;
let firstPlay = true;
let escKey;
let selectBlockColorButton; // ADD THIS NEAR THE TOP WITH OTHER BUTTONS
// Add these 2 lines after escKey, enterKey setup:
let saveKey;
let loadKey;




// --- TIMING / BOOST STATE ---
let frameCounter = 0;
let lastTouchingDown = false;
let lastTouchingUp = false;
let lastLandingFrame = -9999;
let lastCeilingFrame = -9999;
let canBoost = false;
let currentBackground; // global for this scene
let blockColorHex = 0xffffff; // default white


// --- EDITOR STATE ---
let isEditorMode = false;
let blocksGroup;
let finishLine;
let spawnPoint;
let editorButtons = [];
let currentTool = 'block';
let gridSize = 64;
let gridGraphics;
let spikesGroup;
let windowsGroup;
let isWindowOpen = false;
let windowPromptText;
let noBoostBlocksGroup;
let pauseButton;
let pauseOverlay;
let resumeButton;
let isPaused = false;
let menuBg;
let returnToMenuButton;
let selectBackgroundOverlay;
let backgroundTitleText;
let backgroundBackButton;
let backgroundButtons = {};
let selectedBackgroundKey = 'A'; // default
let backgroundTextButtons = {};  // Remove this - not needed anymore

let canEditLevelSettings = true;


let editorZoomSpeed = 0.0015; // how fast the editor zoom reacts to mouse wheel
let editorTargetZoom = 0.25;  // starting zoom for editor
let editorMinZoom = 0.15;
let editorMaxZoom = 0.6;
let levelOptionsOverlay;
let levelOptionsText;
let backFromLevelOptionsButton;
let selectMusicOverlay;
let selectMusicBackButton;
let selectMusicButton; // Button inside Level Options to open this
let helpButton;

let selectBackgroundButton;

// --- TITLE SCREEN STATE ---
let gameState = 'title';
let titleText;
let hasWon = false;
let winText;
let restartButton;
let helpOverlay;
let helpImage;
let helpBackButton;
let currentPauseMenu = null; // 'main', 'levelOptions', 'selectMusic', 'help', or null
let selectedMusicKey = 'X'; // default selection

let musicTitleText;
let musicButtons = {};

const MUSIC_MAP = {
    X: 'Adventure',
    Y: 'Scary',
    Z: 'Happy'
};

const BACKGROUND_MAP = {
    A: 'Dark',
    B: 'Forest',
    C: 'Red'
};


let currentMusic = null;


// --- WORLD ---
const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 4000;

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#1d1d1d",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 500 }, debug: true }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,  // <-- make it resize automatically
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let myGameScene;

game.events.on('ready', () => {
    myGameScene = game.scene.keys.default;
});

function createLevelEditor(scene) {
    // initialize groups
    scene.blocksGroup = scene.physics.add.group();
    scene.spikesGroup = scene.physics.add.group();
    scene.windowsGroup = scene.physics.add.group();
    scene.noBoostBlocksGroup = scene.physics.add.group();

    // spawn point & finish line placeholders
    scene.spawnPoint = null;
    scene.finishLine = null;

    // menu background (if you use it)
    scene.menuBg = scene.add.image(0, 0, 'Dark').setOrigin(0, 0);

    console.log("Editor/game objects initialized.");
}

function startEditorMode(scene) {
    window.myGameScene = scene;  // assign the current scene globally

    // initialize your editor/game objects
    createLevelEditor(scene); // <-- your existing setup code for blocks, spikes, etc.

    // if a pending JSON level exists, load it automatically
    if (window.pendingLevelData) {
        scene.loadLevel(window.pendingLevelData);
        window.pendingLevelData = null;
    }
}


function preload() {
  this.load.audio('death1', 'assets/death1.mp3');
  this.load.image('spike', 'assets/images/spike.png');
  this.load.image('finish', 'assets/images/FinishLine.png');
  this.load.image('start', 'assets/images/StartPoint.png');
  this.load.image('window', 'assets/images/window.png');
  this.load.image('pause', 'assets/images/Pause.png');
  this.load.image('welcome1', 'assets/images/welcome1.png');
  this.load.image('welcome2', 'assets/images/welcome2.png');
  this.load.image('Help', 'assets/images/Help.png'); // make sure the path matches your file
  this.load.audio('Adventure', 'assets/Adventure.WAV');
this.load.audio('Scary', 'assets/Scary.m4A');
this.load.audio('Happy', 'assets/Happy.mp3');
this.load.image('Dark', 'assets/Dark.png');
this.load.image('Forest', 'assets/Forest.png');
this.load.image('Red', 'assets/red.png');



// Replace current pixel generation with proper 1x1 texture
if (!this.textures.exists('pixel')) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1); // white
    graphics.fillRect(0, 0, 1, 1);
    graphics.generateTexture('pixel', 1, 1);
    graphics.destroy();
}



  // Only generate pixel texture if it doesnâ€™t exist
  if (!this.textures.exists('pixel')) {
    this.textures.generate('pixel', { data: ['.'], pixelWidth: 1 });
  }
}


function showInstruction(scene, message, duration = 3000) {
  if (instructionText) instructionText.destroy(); // remove old

  instructionText = scene.add.text(
    config.width / 2,
    config.height / 2 - 200,
    message,
    {
      fontSize: "128px",
      fill: "#ffffff",
      align: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: { x: 20, y: 10 },
    }
  )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setAlpha(1);

  scene.tweens.add({
    targets: instructionText,
    alpha: 0,
    duration: 1000,
    delay: duration,
    onComplete: () => instructionText.destroy()
  });
}


const MENU_BUTTON_STYLE = {
  fontSize: '64px',          // same size as PAUSED text
  fontFamily: 'Arial',
  fill: '#4aa3ff',           // blue by default
  backgroundColor: '#000000',
  padding: { x: 40, y: 20 }
};








// Add this inside your scene (outside create/update)
loadLeve = function(levelData) {
    // --- CLEAR EXISTING LEVEL ELEMENTS ---
    blocksGroup.clear(true, true);
    spikesGroup.clear(true, true);
    windowsGroup.clear(true, true);
    noBoostBlocksGroup.clear(true, true);

    if (spawnPoint) spawnPoint.destroy();
    if (finishLine) finishLine.destroy();

    // --- SET BACKGROUND ---
    if (levelData.background) {
        this.cameras.main.setBackgroundColor(levelData.background);
    }

    // --- SET MUSIC ---
    if (levelData.music) {
        if (this.currentMusic) this.currentMusic.stop();
        this.currentMusic = this.sound.add(levelData.music);
        this.currentMusic.play({ loop: true });
    }

    // --- SPAWN BLOCKS ---
    if (levelData.blocks) {
        levelData.blocks.forEach(block => {
            blocksGroup.create(block.x, block.y, block.color)
                .setOrigin(0, 0)
                .setDisplaySize(gridSize, gridSize)
                .refreshBody();
        });
    }

    // --- SPAWN SPIKES ---
    if (levelData.spikes) {
        levelData.spikes.forEach(spike => {
            spikesGroup.create(spike.x, spike.y)
                .setOrigin(0, 0)
                .setDisplaySize(gridSize, gridSize)
                .refreshBody();
        });
    }

    // --- SPAWN START AND FINISH ---
    if (levelData.start) {
        spawnPoint = this.add.sprite(levelData.start.x, levelData.start.y, 'start')
            .setOrigin(0, 0)
            .setDisplaySize(gridSize, gridSize);
    }

    if (levelData.finish) {
        finishLine = this.add.sprite(levelData.finish.x, levelData.finish.y, 'finish')
            .setOrigin(0, 0)
            .setDisplaySize(gridSize, gridSize);
    }

    // --- SPAWN WINDOWS ---
    if (levelData.windows) {
        levelData.windows.forEach(w => {
            windowsGroup.create(w.x, w.y, 'window')
                .setOrigin(0, 0)
                .setDisplaySize(gridSize, gridSize)
                .refreshBody();
        });
    }

    // --- SPAWN COLONS OR SPECIAL ITEMS ---
    if (levelData.colon) {
        levelData.colon.forEach(c => {
            this.add.sprite(c.x, c.y, 'colon')
                .setOrigin(0, 0)
                .setDisplaySize(gridSize, gridSize);
        });
    }
}



function create() {

  
  window.myGameScene = this;
spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // === KEYBOARD INPUT ===
  this.input.keyboard.on('keydown-ENTER', () => {
    if (gameMode) return;
    gameMode = 'editor';
    startEditorMode(this);
  });

  this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
saveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
loadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);



  
  // === DIMENSIONS & CAMERAS (FIXED) ===
  width = this.scale.width;
  height = this.scale.height;
  UI_WIDTH = Math.floor(width * 0.1);
  GAME_WIDTH = width - UI_WIDTH;

  // UI Camera (left 10%)
  uiCamera = this.cameras.add(0, 0, UI_WIDTH, height);
  uiCamera.setScroll(0, 0);
  uiCamera.setZoom(1);

  // Main Game Camera (right 90%)
  this.cameras.main.setViewport(UI_WIDTH, 0, GAME_WIDTH, height);

  // === PHYSICS GROUPS ===
  blocksGroup = this.physics.add.staticGroup();
  spikesGroup = this.physics.add.staticGroup();
  windowsGroup = this.physics.add.staticGroup();
  noBoostBlocksGroup = this.physics.add.staticGroup();

  // === PLAYER ===
player = this.physics.add.sprite(100, 100, 'pixel')
  .setOrigin(0, 0)
  .setDisplaySize(64, 64)
  .setTint(0xffff00);

player.sfx = { death: this.sound.add('death1') };

// ✅ ADD THIS LINE - FIXES ERROR
player.boostOutline = this.add.rectangle(player.x, player.y, player.displayWidth + 8, player.displayHeight + 8)
  .setOrigin(0, 0).setStrokeStyle(3, 0xffff00).setVisible(false);
  cursors = this.input.keyboard.createCursorKeys();

  // === SPAWN POINTS ===
  spawnPoint = this.add.sprite(100, 500, 'start').setOrigin(0, 0).setDisplaySize(gridSize, gridSize);
  finishLine = this.add.sprite(1400, 500, 'finish').setOrigin(0, 0).setDisplaySize(gridSize, gridSize);

  // === UI ELEMENTS ===
  speedText = this.add.text(0, 0, "0", { fontSize: "64px", fill: "#ffffff" }).setOrigin(0.5, 1);
  windowPromptText = this.add.text(0, 0, "Press Space to interact", {
    fontSize: "32px", fill: "#ffffff", backgroundColor: "rgba(5, 7, 7, 1)", padding: { x: 10, y: 5 }
  }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

  // Pause button (UI camera only)
  pauseButton = this.add.image(40, height - 40, 'pause')
    .setOrigin(0.5).setDisplaySize(48, 48).setScrollFactor(0).setDepth(10000)
    .setInteractive({ useHandCursor: true }).setVisible(false);
  pauseButton.on('pointerup', () => togglePause.call(this));

  // === PHYSICS COLLISIONS ===
  this.physics.add.collider(player, blocksGroup);
  this.physics.add.collider(player, noBoostBlocksGroup);
  this.physics.add.overlap(player, spikesGroup, () => killPlayer(this));
  this.physics.add.overlap(player, windowsGroup, () => player.canOpenWindow = true);

  // Example window
  windowsGroup.create(600, 500, 'window').setOrigin(0, 0).setDisplaySize(gridSize, gridSize).refreshBody();

  // === EDITOR UI ===
  gridGraphics = this.add.graphics();
  gridGraphics.lineStyle(1, 0x666666, 0.5);
  drawGrid(this, gridGraphics);
  gridGraphics.setVisible(false);
  createEditorButtons(this);

  // === WORLD CAMERA ===
  const cam = this.cameras.main;
  cam.setZoom(0.5);
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  updateEditorZoomLimits(cam);

  // Title screen camera
  if (gameState === 'title') {
    cam.stopFollow();
    const zoomX = cam.width / WORLD_WIDTH;
    const zoomY = cam.height / WORLD_HEIGHT;
    cam.setZoom(Math.min(zoomX, zoomY));
    cam.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  // === BACKGROUND ===
  menuBg = this.add.image(config.width / 2, config.height / 2, 'welcome1')
    .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT).setScrollFactor(0).setDepth(-5000);

  // Background animation
  this.time.addEvent({
    delay: 250, loop: true, callback: () => {
      if (gameState !== 'title') return;
      menuBg.setTexture(menuBg.texture.key === 'welcome1' ? 'welcome2' : 'welcome1');
    }
  });

  // === MENU BUTTONS ===
  resumeButton = makeMenuButton(this, config.width / 2, config.height / 2, 'RESUME', () => togglePause.call(this));
  returnToMenuButton = makeMenuButton(this, config.width / 2, config.height / 2 + 100, 'RETURN TO MAINMENU (WILL KICK YOU OUT OF GAME)', () => window.location.reload());
  levelOptionsButton = makeMenuButton(this, config.width / 2, config.height / 2 + 200, 'LEVEL OPTIONS', () => openLevelOptions.call(this));
  helpButton = makeMenuButton(this, config.width / 2, config.height / 2 + 300, 'HELP', () => openHelpMenu.call(this));

  // Pause overlay
  pauseOverlay = this.add.rectangle(config.width / 2, config.height / 2, config.width * 2, config.height * 2, 0x000000, 0.55)
    .setScrollFactor(0).setDepth(2000).setVisible(false);
  pauseText = this.add.text(config.width / 2, config.height * 0.25, 'Press pause again to return from any menu', {
    fontSize: '128px', fill: '#ffffff', fontFamily: 'Arial'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setVisible(false);

  // Win UI
  winText = this.add.text(config.width / 2, config.height / 2 - 60, "YOU WIN!", { fontSize: "96px", fill: "#05fde9ff" })
    .setOrigin(0.5).setScrollFactor(0).setVisible(false);
  restartButton = this.add.text(config.width / 2, config.height / 2 + 40, "RESTART", { fontSize: "48px", fill: "#ffffff" })
    .setOrigin(0.5).setScrollFactor(0).setInteractive().setVisible(false).on("pointerup", () => restartLevel.call(this));

  // Music buttons (hidden initially)
  musicTitleText = this.add.text(config.width / 2, config.height * 0.25, 'SELECT MUSIC', {
    fontSize: '96px', fill: '#ffffff', fontFamily: 'Arial'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setVisible(false);

  const musicButtonY = config.height / 2;
  const spacing = 360;
  musicButtons.X = makeMenuButton(this, config.width / 2 - spacing, musicButtonY, 'Adventure', () => selectMusic.call(this, 'X'));
  musicButtons.Y = makeMenuButton(this, config.width / 2, musicButtonY, 'Scary', () => selectMusic.call(this, 'Y'));
  musicButtons.Z = makeMenuButton(this, config.width / 2 + spacing, musicButtonY, 'Happy', () => selectMusic.call(this, 'Z'));
  Object.values(musicButtons).forEach(btn => btn.setVisible(false));

  selectMusicBackButton = makeMenuButton(this, config.width / 2, config.height / 2 + 200, 'BACK', () => closeSelectMusicMenu.call(this)).setVisible(false);

  // Block color menu
  createBlockColorMenu(this);

  // === LOAD LEVEL FUNCTION ===
  this.loadLevel = function(levelData) {
    console.log("Loading level:", levelData.name || "Unnamed");
    
    // Clear everything
    blocksGroup.clear(true, true);
    spikesGroup.clear(true, true);
    windowsGroup.clear(true, true);
    noBoostBlocksGroup.clear(true, true);
    if (this.spawnPoint) this.spawnPoint.destroy();
    if (this.finishLine) this.finishLine.destroy();
    
    // Background & Music
    if (levelData.background && menuBg) menuBg.setTexture(levelData.background);
    if (levelData.music) {
      if (this.currentMusic) this.currentMusic.stop();
      this.currentMusic = this.sound.add(levelData.music);
      if (this.currentMusic) this.currentMusic.play({ loop: true });
    }
    
    // Spawn level elements
    if (levelData.blocks) levelData.blocks.forEach(block => {
      const blockSprite = blocksGroup.create(block.x, block.y, 'pixel')
        .setOrigin(0, 0).setDisplaySize(block.width || 64, block.height || 64);
      if (block.tint) blockSprite.setTint(block.tint);
      blockSprite.refreshBody();
    });
    
    if (levelData.spikes) levelData.spikes.forEach(spike => {
      spikesGroup.create(spike.x, spike.y, 'spike').setOrigin(0, 0)
        .setDisplaySize(spike.width || 64, spike.height || 64).refreshBody();
    });
    
    if (levelData.windows) levelData.windows.forEach(window => {
      windowsGroup.create(window.x, window.y, 'window').setOrigin(0, 0)
        .setDisplaySize(window.width || 64, window.height || 64).refreshBody();
    });
    
    if (levelData.noBoostBlocks) levelData.noBoostBlocks.forEach(block => {
      noBoostBlocksGroup.create(block.x, block.y, 'pixel').setOrigin(0, 0)
        .setDisplaySize(block.width || 64, block.height || 64).setTint(0x0000ff).refreshBody();
    });
    
    if (levelData.start) {
      this.spawnPoint = this.add.sprite(levelData.start.x, levelData.start.y, 'start')
        .setOrigin(0, 0).setDisplaySize(levelData.start.width || 64, levelData.start.height || 64);
    }
    if (levelData.finish) {
      this.finishLine = this.add.sprite(levelData.finish.x, levelData.finish.y, 'finish')
        .setOrigin(0, 0).setDisplaySize(levelData.finish.width || 64, levelData.finish.height || 64);
    }
    
    console.log("✅ Level loaded successfully!");
  };

  // === CAMERA IGNORE LISTS ===

// ✅ FIXED - UI camera shows buttons, main camera shows game
uiCamera.setViewport(0, 0, 150, height);  // ✅ BUTTONS VISIBLE

this.cameras.main.ignore([pauseButton]);   // Main cam ignores ONLY pause button
pauseButton.setScrollFactor(0).setDepth(10000);  // UI properties


// ✅ FIXED - MAKE UI CAMERA SHOW BUTTONS
editorButtons.forEach(btn => {
  btn.setScrollFactor(0);           // UI fixed position
  btn.setDepth(10000);              // On top
  btn.setVisible(false);            // Hidden until editor mode
  if (btn.border) {
    btn.border.setScrollFactor(0);  // Border too
    btn.border.setDepth(10000);
    btn.border.setVisible(false);
  }
});


  // === MOUSE WHEEL ZOOM ===
  this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
    if (!isEditorMode) return;
    const cam = this.cameras.main;
    const before = cam.getWorldPoint(pointer.x, pointer.y);
    const zoomFactor = 0.001;
    editorTargetZoom = Phaser.Math.Clamp(
      editorTargetZoom - editorTargetZoom * zoomFactor * deltaY, editorMinZoom, editorMaxZoom
    );
    const oldZoom = cam.zoom;
    cam.zoom = editorTargetZoom;
    cam.preRender();
    const after = cam.getWorldPoint(pointer.x, pointer.y);
    cam.zoom = oldZoom;
    cam.scrollX -= after.x - before.x;
    cam.scrollY -= after.y - before.y;
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, WORLD_WIDTH - cam.width / cam.zoom);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, WORLD_HEIGHT - cam.height / cam.zoom);
  });

  // === TITLE SCREEN SETUP ===
  player.setVisible(false);
  speedText.setVisible(false);
  pauseButton.setVisible(false);
  blocksGroup.setVisible(false);
  spikesGroup.setVisible(false);
  noBoostBlocksGroup.setVisible(false);
  windowsGroup.setVisible(false);
  finishLine.setVisible(false);
  spawnPoint.setVisible(false);
  gridGraphics.setVisible(false);

  // ESC handling
  escKey.on('down', () => {
    if (levelOptionsOverlay?.visible) closeLevelOptions.call(this);
    else if (isPaused) togglePause.call(this);
  });

  enterKey.on('down', () => {
    if (gameState === 'title') startGame.call(this);
  });

  // Export level data
  this.exportLevel = function() {
    return {
      music: selectedMusicKey || 'X',
      background: selectedBackgroundKey || 'A',
      blocks: blocksGroup.getChildren().map(b => ({ x: b.x, y: b.y, width: b.displayWidth, height: b.displayHeight, tint: b.tint })),
      spikes: spikesGroup.getChildren().map(s => ({ x: s.x, y: s.y, width: s.displayWidth, height: s.displayHeight })),
      windows: windowsGroup.getChildren().map(w => ({ x: w.x, y: w.y, width: w.displayWidth, height: w.displayHeight })),
      noBoostBlocks: noBoostBlocksGroup.getChildren().map(b => ({ x: b.x, y: b.y, width: b.displayWidth, height: b.displayHeight })),
      start: spawnPoint ? { x: spawnPoint.x, y: spawnPoint.y, width: spawnPoint.displayWidth, height: spawnPoint.displayHeight } : null,
      finish: finishLine ? { x: finishLine.x, y: finishLine.y, width: finishLine.displayWidth, height: finishLine.displayHeight } : null
    };
  };

  
}




function drawGrid(scene, graphics) {
  for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
    graphics.lineBetween(x, 0, x, WORLD_HEIGHT);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
    graphics.lineBetween(0, y, WORLD_WIDTH, y);
  }
}

function createEditorButtons(scene) {

  const padding = 20;
  const size = 64;
  const spacing = 16;

  // 🔥 FIX: Position for UI CAMERA (left side)
  const startX = 20;  // ← UI CAMERA X
  const startY = 100; // ← START HIGH UP

  editorButtons = [];

  // Helper to create Image buttons with a border
  function makeButton(y, textureKey, toolName) {
    // border rectangle
    const border = scene.add.rectangle(
      startX + size / 2,
      y + size / 2,
      size + 6,
      size + 6
    )
      .setStrokeStyle(3, 0x000000)
      .setScrollFactor(0);

    // button image
    const btn = scene.add.image(startX, y, textureKey)
      .setOrigin(0, 0)
      .setDisplaySize(size, size)
      .setInteractive()
      .setScrollFactor(0);

    // attach border to button
    btn.border = border;

    btn.on('pointerdown', () => {
      currentTool = toolName;
      highlightButton(btn);
    });

    editorButtons.push(btn);
  }

  // Block button (colored rectangle)
  const blockBorder = scene.add.rectangle(
    startX + size / 2,
    startY + size / 2,
    size + 6,
    size + 6
  )
    .setStrokeStyle(3, 0x000000)
    .setScrollFactor(0);

  const blockBtn = scene.add.rectangle(
    startX,
    startY,
    size,
    size,
    0x888888
  )
    .setOrigin(0, 0)
    .setInteractive()
    .setScrollFactor(0);

  blockBtn.border = blockBorder;
  blockBtn.on('pointerdown', () => {
    currentTool = 'block';
    highlightButton(blockBtn);
  });

  editorButtons.push(blockBtn);

  // Other buttons
  makeButton(startY + (size + spacing), 'spike', 'spike');
  makeButton(startY + 2 * (size + spacing), 'finish', 'finish');
  makeButton(startY + 3 * (size + spacing), 'start', 'spawn');
  makeButton(startY + 4 * (size + spacing), 'window', 'window');
  makeButton(startY + 5 * (size + spacing), 'pixel', 'noboost');

  const noboostBtn = editorButtons[editorButtons.length - 1];
  noboostBtn.setTint(0x0000ff);

  // Hide everything initially
// 🔥 MAKE EDITOR BUTTONS VISIBLE ON UI CAMERA
editorButtons.forEach(btn => {
  uiCamera.ignore(false);  // SHOW on UI cam
  btn.setPosition(btn.x, btn.y);  // Force position
  btn.setVisible(true);     // FORCE VISIBLE

});

  // Highlight first button
  highlightButton(editorButtons[0]);

  // Ensure editor buttons render ONLY on UI camera
  editorButtons.forEach(btn => {
    scene.cameras.main.ignore(btn);
    if (btn.border) scene.cameras.main.ignore(btn.border);
  });
}

function highlightButton(selected) {
  editorButtons.forEach(btn => {
    if (btn.border) {
      btn.border.setStrokeStyle(3, 0x000000); // reset borders
    }
  });

  if (selected.border) {
    selected.border.setStrokeStyle(4, 0xffff00); // highlight selected button
  }
}

function toggleEditorMode() {
  isEditorMode = !isEditorMode;

  editorButtons.forEach(btn => {
    const show = isEditorMode;
    btn.setVisible(show);
    btn.setInteractive(show);
    if (btn.border) btn.border.setVisible(show);
  });

  player.setVisible(!isEditorMode);
  speedText.setVisible(!isEditorMode);
  gridGraphics.setVisible(isEditorMode);
  pauseButton.setVisible(true);

  const cam = this.cameras.main;
  if (isEditorMode) {
    cam.stopFollow();
    cam.centerOn(1000, 300);
    editorTargetZoom = 0.2;
    player.body.setVelocity(0, 0);
    player.body.enable = false;
    this.physics.world.debugGraphic.visible = false;
  } else {
    player.body.enable = true;
    player.setPosition(spawnPoint.x, spawnPoint.y);
    player.body.setVelocity(0, 0);
    cam.startFollow(player, true, 0.08, 0.08);
    this.physics.world.debugGraphic.visible = true;
  }

  if (isEditorMode && !firstTimeEditorInstructionsShown) {
    showInstruction(this, "Press ENTER to playtest, and PAUSE for level settings", 4000);
    firstTimeEditorInstructionsShown = true;
  }
}




function placeObject(x, y) {
  // Clamp x/y to world
  x = Phaser.Math.Clamp(x, 0, WORLD_WIDTH - gridSize);
  y = Phaser.Math.Clamp(y, 0, WORLD_HEIGHT - gridSize);

  if (currentTool === 'block') {
    const existing = blocksGroup.getChildren().find(b => b.x === x && b.y === y);
    if (!existing) {
      blocksGroup.create(x, y, 'pixel')
    .setOrigin(0, 0)
    .setDisplaySize(gridSize, gridSize)
    .setTint(blockColorHex) // âœ… use selected color
    .refreshBody();

    }
  } else if (currentTool === 'finish') {
    finishLine.setPosition(x, y);
  } else if (currentTool === 'spawn') {
    spawnPoint.setPosition(x, y);
  } else if (currentTool === 'spike') {
    const existing = spikesGroup.getChildren().find(s => s.x === x && s.y === y);
    if (!existing) {
      const spike = spikesGroup.create(x, y, 'spike')
        .setOrigin(0, 0)
        .setDisplaySize(gridSize, gridSize);

      spike.refreshBody();

      const hitboxWidth = gridSize * 0.2;
      const hitboxHeight = gridSize * 0.55;

      const offsetX = (gridSize - hitboxWidth) / 2;
      const offsetY = gridSize - hitboxHeight;

      spike.body.setSize(hitboxWidth, hitboxHeight);
      spike.body.setOffset(offsetX, offsetY);
    }
  } else if (currentTool === 'window') {
    const existing = windowsGroup.getChildren().find(w => w.x === x && w.y === y);
    if (!existing) {
      const win = windowsGroup.create(x, y, 'window')
        .setOrigin(0, 0)
        .setDisplaySize(gridSize, gridSize)
        .refreshBody();
    }
  } else if (currentTool === 'noboost') {
    const existing = noBoostBlocksGroup.getChildren().find(b => b.x === x && b.y === y);
    if (!existing) {
      const block = noBoostBlocksGroup.create(x, y, 'pixel')
        .setOrigin(0, 0)
        .setDisplaySize(gridSize, gridSize)
        .setTint(0x0000ff) // blue
        .refreshBody();
    }
  }
}

function update() {
  // UI positioning FIRST (always runs)\
  if (!pauseOverlay || !resumeButton || !pauseButton) return;
  

if (gameStarted) {
  if (Phaser.Input.Keyboard.JustDown(saveKey)) {
    saveLevelToClipboard(this);
  }
  if (Phaser.Input.Keyboard.JustDown(loadKey)) {
    loadLevelFromClipboard(this);
  }
}

  forceBackButtonsHidden();

  if (pauseButton?.visible) {}
  if (pauseOverlay?.visible) {
    pauseOverlay.setPosition(config.width / 2, config.height / 2);
  }
  if (resumeButton?.visible) {
    resumeButton.setPosition(config.width / 2, config.height / 2 + 100);
  }

  if (isPaused) return;

  pauseOverlay.setVisible(false);

  frameCounter++;

  if (boostFlashFrames > 0) {
    this.cameras.main.flash(50, 50, 50, 0);
    boostFlashFrames--;
  }

if (currentBackground && player) {
  if (currentBackground && player) {
    const bgWidth = currentBackground.displayWidth;
    const bgHeight = currentBackground.displayHeight;

    // Calculate desired BG center based on player
    let bgX = player.x;
    let bgY = player.y;

    // Move at half the player's position
    bgX = WORLD_WIDTH / 2 + (player.x - WORLD_WIDTH / 2) * 0.5;
    bgY = WORLD_HEIGHT / 2 + (player.y - WORLD_HEIGHT / 2) * 0.5;

    // Clamp so edges donâ€™t leave world bounds
    const halfW = bgWidth / 2;
    const halfH = bgHeight / 2;

    bgX = Phaser.Math.Clamp(bgX, halfW, WORLD_WIDTH - halfW);
    bgY = Phaser.Math.Clamp(bgY, halfH, WORLD_HEIGHT - halfH);

    currentBackground.setPosition(bgX, bgY);
}

}



  // *** FIXED ENTER KEY - EDITOR TOGGLE ***
  if (gameState !== 'title' && Phaser.Input.Keyboard.JustDown(enterKey)) {
    toggleEditorMode.call(this);
    return;
  }
  // *** EDITOR TOGGLE END ***

  // Reset interaction each frame
  if (player && !isEditorMode) player.canOpenWindow = false;

  // Window proximity check (only in game mode)
  let nearestWindow = null;
  let minDist = 100;

  windowsGroup.getChildren().forEach(win => {
    const dx = player.x + player.displayWidth / 2 - (win.x + gridSize / 2);
    const dy = player.y + player.displayHeight / 2 - (win.y + gridSize / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      nearestWindow = win;
      minDist = dist;
    }
  });

  if (nearestWindow && !isEditorMode && player) {
    player.canOpenWindow = true;
    windowPromptText.setVisible(true);
    const cam = this.cameras.main;
    const screenX = (nearestWindow.x + gridSize / 2 - cam.scrollX) * cam.zoom;
    const screenY = (nearestWindow.y - 40 - cam.scrollY) * cam.zoom;
    windowPromptText.setPosition(screenX, screenY);
  } else {
    windowPromptText.setVisible(false);
  }

  if (player && player.canOpenWindow && Phaser.Input.Keyboard.JustDown(spaceKey)) {
    toggleWindow.call(this);
  }

  if (gameState === 'title') return;

  // Editor or gameplay logic
  if (isEditorMode) {
    handleEditorInput.call(this);
    updateEditorCamera(this);
  } else {
    handleMovementAndBoost.call(this);
    updateSpeedCamera(this);

    const speedDisplay = Math.round(Math.abs(player.body.velocity.x));
    speedText.setText(speedDisplay.toString());
    speedText.setPosition(
      player.x + player.displayWidth / 2,
      player.y - 20
    );
  }

  // Bounds check (gameplay only)
  if (!isEditorMode && player) {
    const bounds = this.physics.world.bounds;
    const px = player.x;
    const py = player.y;
    const w = player.displayWidth;
    const h = player.displayHeight;
    const outOfBounds = px < bounds.x || py < bounds.y || px + w > bounds.right || py + h > bounds.bottom;
    if (outOfBounds) {
      killPlayer(this);
      return;
    }
  }

  // Win check (gameplay only)
  if (!isEditorMode && !hasWon && player && finishLine) {
    if (Phaser.Geom.Intersects.RectangleToRectangle(
      player.getBounds(),
      finishLine.getBounds()
    )) {
      triggerWin.call(this);
      return;
    }
  }

  if (player) {
    player.boostOutline.setPosition(player.x - 4, player.y - 4);
  }
  if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
    openUploadedLevelsTab(this);
}

}


function handleMovementAndBoost() {
  const touchingDown = player.body.touching.down;
  const touchingUp = player.body.touching.up;

  const MAX_NORMAL_GROUND_SPEED = 360;
  const GROUND_ACCEL = 999;
  const AIR_ACCEL = 0;
  const BOOST_MULTIPLIER = 1.6;
  const JUMP_VELOCITY_Y = -300;
  const BOOST_WINDOW_FRAMES = 10;

  // --- FLOOR BOOST LOGIC ---
  const justLanded = touchingDown && !lastTouchingDown;

  let standingOnNoBoost = false;
  noBoostBlocksGroup.getChildren().forEach(block => {
    if (player.body.bottom === block.body.top &&
      player.body.x + player.body.width > block.body.x &&
      player.body.x < block.body.right) {
      standingOnNoBoost = true;
    }
  });

  if (justLanded) {
    lastLandingFrame = frameCounter;
    canBoost = !standingOnNoBoost; // disable boost if standing on no-boost block
  }

  const framesSinceLanding = frameCounter - lastLandingFrame;
  const floorInBoostWindow = framesSinceLanding <= BOOST_WINDOW_FRAMES;

  // --- CEILING BOOST LOGIC ---
  const justHitCeiling = touchingUp && !lastTouchingUp;
  if (justHitCeiling) {
    lastCeilingFrame = frameCounter;
    canBoost = true;
  }
  const framesSinceCeiling = frameCounter - lastCeilingFrame;
  const ceilingInBoostWindow = framesSinceCeiling <= BOOST_WINDOW_FRAMES;

  player.boostOutline.setVisible(
    (touchingDown && floorInBoostWindow) || (touchingUp && ceilingInBoostWindow)
  );

  // --- HORIZONTAL MOVEMENT ---
  let moveInput = 0;
  if (cursors.left.isDown) moveInput = -1;
  else if (cursors.right.isDown) moveInput = 1;

  if (touchingDown) {
    player.setAccelerationX(moveInput * GROUND_ACCEL);
    if (!justLanded && !floorInBoostWindow) {
      player.body.velocity.x = Phaser.Math.Clamp(
        player.body.velocity.x,
        -MAX_NORMAL_GROUND_SPEED,
        MAX_NORMAL_GROUND_SPEED
      );
    }
  } else {
    player.setAccelerationX(moveInput * AIR_ACCEL);
  }

  // --- JUMP / BOOST ---
  if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
    // --- FLOOR JUMP / BOOST ---
    if (touchingDown || floorInBoostWindow) {
      player.setVelocityY(JUMP_VELOCITY_Y);

      if (canBoost && floorInBoostWindow) {
        player.body.velocity.x *= BOOST_MULTIPLIER;
        canBoost = false;
        boostFlashFrames = BOOST_FLASH_DURATION;
      }
    }

    // --- CEILING JUMP / BOOST ---
    if (touchingUp || ceilingInBoostWindow) {
      // Optional: small downward push
      player.setVelocityY(-JUMP_VELOCITY_Y);

      if (canBoost && ceilingInBoostWindow) {
        player.body.velocity.x *= BOOST_MULTIPLIER;
        canBoost = false;
        boostFlashFrames = BOOST_FLASH_DURATION;
      }
    }
  }

  // --- UPDATE FLAGS ---
  lastTouchingDown = touchingDown;
  lastTouchingUp = touchingUp;

  // --- EDITOR MOUSE INPUT (optional) ---
  if (isEditorMode) {
    const pointer = this.input.activePointer;
    if (pointer.isDown && !wasPointerDown) {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridPos = getGridPosition(worldPoint.x, worldPoint.y);
      if (pointer.leftButtonDown()) placeObject(gridPos.x, gridPos.y);
      else if (pointer.rightButtonDown()) deleteObject(gridPos.x, gridPos.y);
    }
  }

  wasPointerDown = this.input.activePointer.isDown;
}


function createGameplayBackground(scene) {
    currentBackground = scene.add.image(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        BACKGROUND_MAP[selectedBackgroundKey]
    )
    .setOrigin(0.5)
.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)

    .setDepth(-4000);
}


function startGame() {
  gameState = 'playing';
  gameStarted = true;
  playSelectedMusic(this);

  // ✅ SINGLE BACKGROUND - destroy menuBg, create gameplay bg
  if (menuBg) menuBg.destroy();
  createGameplayBackground(this); // creates currentBackground

  const cam = this.cameras.main;
  cam.setZoom(baseCamZoom);
  cam.startFollow(player, true, 0.08, 0.08);

  // Show game objects
  player.setVisible(true);
  pauseButton.setVisible(true);
  speedText.setVisible(true);
  blocksGroup.setVisible(true);
  spikesGroup.setVisible(true);
  noBoostBlocksGroup.setVisible(true);
  windowsGroup.setVisible(true);
  finishLine.setVisible(true);
  spawnPoint.setVisible(true);
  titleText?.setVisible(false);

  player.setPosition(spawnPoint.x, spawnPoint.y);
}



function updateSpeedCamera(scene) {
  const cam = scene.cameras.main;

  // SPEED-BASED ZOOM ONLY (camera position handled by follow)
  const speed = Math.abs(player.body.velocity.x);
  const speedFactor = Phaser.Math.Clamp(speed / 1500, 0, 1);
  const targetZoom = baseCamZoom - speedFactor * speedZoomOut;

  cam.setZoom(
    Phaser.Math.Linear(cam.zoom, targetZoom, camZoomLerp)
  );
}

function updateEditorCamera(scene) {
  const cam = scene.cameras.main;

  cam.zoom = Phaser.Math.Linear(
    cam.zoom,
    editorTargetZoom,
    0.12
  );
}

function killPlayer(scene) {
  player.sfx.death.play();

  // Reset velocity
  player.body.setVelocity(0, 0);

  // Reset position to spawn
  player.setPosition(spawnPoint.x, spawnPoint.y);

  // Reset boost state
  canBoost = false;
  lastTouchingDown = false;
  lastLandingFrame = -9999;

  // Small camera snap to avoid weird offsets
  scene.cameras.main.flash(120, 255, 0, 0);
}

function triggerWin() {
  hasWon = true;

  // Freeze player
  player.body.setVelocity(0, 0);
  player.body.enable = false;

  // Stop camera follow
  this.cameras.main.stopFollow();

  // Show UI
  winText.setVisible(true);
  restartButton.setVisible(true);

  // Optional: small flash
  this.cameras.main.flash(200, 0, 255, 0);
}

function restartLevel() {
  hasWon = false;

  // Hide UI
  winText.setVisible(false);
  restartButton.setVisible(false);

  // Reset player
  player.body.enable = true;
  player.setPosition(spawnPoint.x, spawnPoint.y);
  player.body.setVelocity(0, 0);

  // Reset boost state
  canBoost = false;
  lastTouchingDown = false;
  lastLandingFrame = -9999;

  // Resume camera follow
  this.cameras.main.startFollow(player, true, 0.08, 0.08);

  // Optional: reset finish line position if needed
  // createFinishLine(this);
}

function updateEditorZoomLimits(cam) {
  // World dimensions
  const worldWidth = WORLD_WIDTH;
  const worldHeight = WORLD_HEIGHT;

  // Screen dimensions
  const screenWidth = config.width;
  const screenHeight = config.height;

  // Minimum zoom so camera never sees outside world
  editorMinZoom = Math.min(
    screenWidth / worldWidth,
    screenHeight / worldHeight
  );

  // Optional maximum zoom
  editorMaxZoom = 0.6;

  // Clamp target zoom
  editorTargetZoom = Phaser.Math.Clamp(editorTargetZoom, editorMinZoom, editorMaxZoom);
}

// --- Additional utility functions ---
function drawGrid(scene, graphics) {
  for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
    graphics.lineBetween(x, 0, x, WORLD_HEIGHT);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
    graphics.lineBetween(0, y, WORLD_WIDTH, y);
  }
}

function handleEditorInput() {
  if (!isEditorMode) return;

  const pointer = this.input.activePointer;
  if (!pointer.isDown) return;

  function getGridPosition(worldX, worldY) {
  return {
    x: Math.floor(worldX / gridSize) * gridSize,
    y: Math.floor(worldY / gridSize) * gridSize
  };
}


  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const gridPos = getGridPosition(worldPoint.x, worldPoint.y);

  if (pointer.leftButtonDown()) {
    placeObject.call(this, gridPos.x, gridPos.y);
  } else if (pointer.rightButtonDown()) {
    deleteObject.call(this, gridPos.x, gridPos.y);
  }
}

function deleteObject(x, y) {
  blocksGroup.getChildren().forEach(block => {
    if (block.x === x && block.y === y) block.destroy();
  });

  spikesGroup.getChildren().forEach(spike => {
    if (spike.x === x && spike.y === y) spike.destroy();
  });

  windowsGroup.getChildren().forEach(win => {
    if (win.x === x && win.y === y) win.destroy();
  });

  noBoostBlocksGroup.getChildren().forEach(block => {
    if (block.x === x && block.y === y) block.destroy();
  });
}

function toggleWindow() {
  const cam = this.cameras.main;

  if (!isWindowOpen) {
    // Open the window: zoom out to see entire level
    cam.stopFollow();
    cam.setZoom(Math.min(
      config.width / WORLD_WIDTH,
      config.height / WORLD_HEIGHT
    ));
    cam.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // Lock player movement
    player.body.moves = false;

    isWindowOpen = true;
  } else {
    // Close the window: zoom back and follow player
    cam.startFollow(player, true, 0.08, 0.08);
    cam.setZoom(baseCamZoom);

    // Unlock movement
    player.body.moves = true;

    isWindowOpen = false;
  }
}


function makeMenuButton(scene, x, y, label, onClick) {
  const btn = scene.add.text(
    x,
    y,
    label,
    MENU_BUTTON_STYLE
  )
  .setOrigin(0.5)
  .setScrollFactor(0)
  .setDepth(2001)
  .setInteractive({ useHandCursor: true });

  // hover effects
  btn.on('pointerover', () => {
    btn.setStyle({ fill: '#ffffff' }); // white on hover
  });

  btn.on('pointerout', () => {
    btn.setStyle({ fill: '#4aa3ff' }); // blue default
  });

  btn.on('pointerup', onClick);

  btn.setVisible(false);
  return btn;
}


function createBlockColorMenu(scene) {
    if (blockColorButtons.length > 0) return;

    const colors = [
        { name: 'WHITE', hex: 0xffffff },
        { name: 'RED',   hex: 0xff5555 },
        { name: 'GREEN', hex: 0x55ff55 },
        { name: 'BLUE',  hex: 0x5555ff }
    ];

    const startY = config.height / 2 - 150;

    colors.forEach((c, i) => {
        const btn = makeMenuButton(
            scene,
            config.width / 2,
            startY + i * 120,
            c.name,
            () => {
                blockColorHex = c.hex;
                closeBlockColorsMenu.call(scene);
            }
        );
        btn.setVisible(false);
        blockColorButtons.push(btn);
    });

    backFromBlockColorsButton = makeMenuButton(
        scene,
        config.width / 2,
        startY + colors.length * 120 + 100,
        'BACK',
        () => closeBlockColorsMenu.call(scene)
    );
    backFromBlockColorsButton.setVisible(false);
}


function togglePause() {
    isPaused = !isPaused;


    setVisibleObjects([
    selectBackgroundOverlay,
    backgroundTitleText,
    backgroundBackButton,
    backgroundButtons.A,
    backgroundButtons.B,
    backgroundButtons.C
], false);


    if (isPaused) {
        this.physics.world.pause();

        if (!currentPauseMenu) {
            // Show main pause menu
            currentPauseMenu = 'main';

            pauseOverlay.setVisible(true);
            pauseText.setVisible(true);
         const pauseButtons = [resumeButton, returnToMenuButton, helpButton];
if (isEditorMode) pauseButtons.push(levelOptionsButton);

setVisibleObjects(pauseButtons, true);


            // Hide all submenus
            setVisibleObjects([levelOptionsOverlay, levelOptionsText, backFromLevelOptionsButton, selectMusicButton, 
                selectMusicOverlay, selectMusicBackButton,
                helpOverlay, helpImage, helpBackButton], false);
        }

        // Stop following player while paused
        this.cameras.main.stopFollow();

    } else {
        // Unpause
        this.physics.world.resume();

        // Hide everything
        pauseOverlay.setVisible(false);
        pauseText.setVisible(false);

      setVisibleObjects([
    resumeButton, returnToMenuButton, levelOptionsButton, helpButton,
    levelOptionsOverlay, levelOptionsText, backFromLevelOptionsButton, selectMusicButton,
    selectMusicOverlay, selectMusicBackButton,
    helpOverlay, helpImage, helpBackButton
], false);

setVisibleObjects([
    selectBackgroundOverlay,
    backgroundTitleText,
    backgroundBackButton,
    backgroundButtons.A,
    backgroundButtons.B,
    backgroundButtons.C
], false);


Object.values(musicButtons).forEach(btn => btn.setVisible(false));
musicTitleText.setVisible(false);


        currentPauseMenu = null;

        // Resume following player if in gameplay
        if (!isEditorMode && !hasWon) {
            this.cameras.main.startFollow(player, true, 0.08, 0.08);
        }
    }
}









function openSelectMusicMenu() {
    // Hide Level Options buttons

    setVisibleObjects([helpButton], false);


    setVisibleObjects([levelOptionsOverlay, levelOptionsText, backFromLevelOptionsButton, selectMusicButton], false);

    selectMusicBackButton.setVisible(true);

    // Dark green overlay & title
    if (!selectMusicOverlay) {
        selectMusicOverlay = this.add.rectangle(
            config.width / 2,
            config.height / 2,
            config.width * 2,
            config.height * 2,
            0x006400, // dark green
            0.7
        ).setScrollFactor(0).setDepth(2000);
    }



    isPaused = true;

  setVisibleObjects([
    levelOptionsOverlay,
    levelOptionsText,
    backFromLevelOptionsButton,
    selectMusicButton,
    selectBackgroundButton   // ðŸ‘ˆ THIS
], false);


    // Show music menu
    setVisibleObjects([
        selectMusicOverlay,
        musicTitleText,
        selectMusicBackButton
    ], true);

    Object.values(musicButtons).forEach(btn => btn.setVisible(true));

    // Ensure correct highlight
    selectMusic(selectedMusicKey);
}





function closeSelectMusicMenu() {
    // Hide music menu
setVisibleObjects([
    selectMusicOverlay,
    musicTitleText,
    selectMusicBackButton
], false);

Object.values(musicButtons).forEach(btn => btn.setVisible(false));

selectMusicBackButton.setVisible(false);

  setVisibleObjects([
    levelOptionsOverlay,
    levelOptionsText,
    backFromLevelOptionsButton,
    selectMusicButton,
    selectBackgroundButton
], true);

}





function setVisibleObjects(objects, visible) {
    objects.forEach(obj => {
        if (obj) obj.setVisible(visible);
    });
}



function openHelpMenu() {
    // Hide main pause menu buttons

    Object.values(musicButtons).forEach(btn => btn.setVisible(false));
musicTitleText.setVisible(false);
selectMusicOverlay?.setVisible(false);
selectMusicBackButton?.setVisible(false);

    setVisibleObjects([pauseOverlay, pauseText, resumeButton, returnToMenuButton, levelOptionsButton, helpButton], false);

    // Create overlay if it doesn't exist
    if (!helpOverlay) {
        helpOverlay = this.add.rectangle(
            config.width / 2,
            config.height / 2,
            config.width * 2,
            config.height * 2,
            0x000000, // black background behind image
            0.7
        ).setScrollFactor(0).setDepth(2000);
    }

    // Create image if it doesn't exist
    if (!helpImage) {
        helpImage = this.add.image(
            config.width / 2,
            config.height / 2,
            'Help'
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2001);

        // Optional: scale it to fit screen
        const scaleX = config.width * 4 / helpImage.width;
        const scaleY = config.height * 4 / helpImage.height;
        helpImage.setScale(Math.min(scaleX, scaleY));
    }

    // Back button
    if (!helpBackButton) {
        helpBackButton = makeMenuButton(
            this,
            config.width / 2,
            config.height / 2 + config.height * 0.4, // bottom of screen
            'BACK',
            () => closeHelpMenu.call(this)
        );
    }

    // Show everything
    setVisibleObjects([helpOverlay, helpImage, helpBackButton], true);
}

function closeHelpMenu() {
    // Hide help menu elements
    setVisibleObjects([helpOverlay, helpImage, helpBackButton], false);

    // Show main pause menu buttons again
    setVisibleObjects([pauseOverlay, pauseText, resumeButton, returnToMenuButton, levelOptionsButton, helpButton], true);
}
function selectMusic(key) {
    selectedMusicKey = key;

    Object.entries(musicButtons).forEach(([k, btn]) => {
        btn.setTint(0xffff00);

    });

    // Only switch music if actively playing
    if (!isEditorMode && !isPaused) {
        playSelectedMusic(this);
    }
}


function safeSetVisible(obj, visible) {
    if (obj) obj.setVisible(visible);
}




function playSelectedMusic(scene) {
    const musicKey = MUSIC_MAP[selectedMusicKey];
    if (!musicKey) return;

    // Stop previous music
    if (currentMusic) {
        currentMusic.stop();
        currentMusic.destroy();
        currentMusic = null;
    }

    currentMusic = scene.sound.add(musicKey, {
        loop: true,
        volume: 0.6
    });

    currentMusic.play();
}

function stopMusic() {
    if (currentMusic) {
        currentMusic.stop();
        currentMusic.destroy();
        currentMusic = null;
    }
}

function openSelectBackgroundMenu() {
  setVisibleObjects([selectBackgroundOverlay, backgroundTitleText, backgroundBackButton], true);

  // Show only the background buttons
  Object.values(backgroundButtons).forEach(btn => btn.setVisible(true));

  currentPauseMenu = 'background';

  // Hide level options
  setVisibleObjects([
      levelOptionsOverlay,
      levelOptionsText,
      backFromLevelOptionsButton,
      selectMusicButton,
      selectBackgroundButton
  ], false);

  // Red overlay
  if (!selectBackgroundOverlay) {
      selectBackgroundOverlay = this.add.rectangle(
          config.width / 2,
          config.height / 2,
          config.width * 2,
          config.height * 2,
          0x8b0000, // dark red
          0.7
      ).setScrollFactor(0).setDepth(2000);
  }

  // Title
  if (!backgroundTitleText) {
      backgroundTitleText = this.add.text(
          config.width / 2,
          config.height * 0.25,
          'SELECT BACKGROUND',
          {
              fontSize: '96px',
              fill: '#ffffff',
              fontFamily: 'Arial'
          }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
  }

  // Back button
  if (!backgroundBackButton) {
      backgroundBackButton = makeMenuButton(
          this,
          config.width / 2,
          config.height / 2 + 300,
          'BACK',
          () => closeSelectBackgroundMenu.call(this)
      );
  }

  // Background text buttons WITH PROPER VARIABLES
  const spacing = 300;
  const y = config.height / 2;
  
  if (!backgroundButtons.A) {
    backgroundButtons.A = makeMenuButton(this, config.width / 2 - spacing, y, 'A', () => selectBackground('A'));
    backgroundButtons.B = makeMenuButton(this, config.width / 2, y, 'B', () => selectBackground('B'));
    backgroundButtons.C = makeMenuButton(this, config.width / 2 + spacing, y, 'C', () => selectBackground('C'));
  }
  
  setVisibleObjects([backgroundButtons.A, backgroundButtons.B, backgroundButtons.C], true);
  selectBackground(selectedBackgroundKey);
}


function closeSelectBackgroundMenu() {

     setVisibleObjects([selectBackgroundOverlay, backgroundTitleText, backgroundBackButton], false);

    // Hide background buttons
    Object.values(backgroundButtons).forEach(btn => btn.setVisible(false));

    currentPauseMenu = 'main';


    setVisibleObjects([
        selectBackgroundOverlay,
        backgroundTitleText,
        backgroundBackButton,
        backgroundButtons.A,
        backgroundButtons.B,
        backgroundButtons.C
    ], false);

    // Return to Level Options
    setVisibleObjects([
        levelOptionsOverlay,
        levelOptionsText,
        backFromLevelOptionsButton,
        selectMusicButton,
        selectBackgroundButton
    ], true);
}

function selectBackground(key) {
  if (currentPauseMenu !== 'background') return;  // Guard stray clicks
  
  selectedBackgroundKey = key;
  
  // Highlight selected button
  Object.entries(backgroundButtons).forEach(([k, btn]) => {
    btn.setTint(k === key ? 0xffff00 : 0xffffff);
  });
  
  // IMMEDIATELY APPLY BACKGROUND CHANGE
  if (currentBackground) {
    currentBackground.setTexture(BACKGROUND_MAP[key]);
    console.log('Background changed to:', BACKGROUND_MAP[key]);
  }
}


function loadCustomLevel(levelData) {
    canEditLevelSettings = false;

    selectedMusicKey = levelData.music;
    selectedBackgroundKey = levelData.background;

    playSelectedMusic(this);
    applySelectedBackground();
}


function setBackground(key) {
    if (!BACKGROUND_MAP[key]) return;

    selectedBackgroundKey = key;

    if (currentBackground) {
        currentBackground.setTexture(BACKGROUND_MAP[key]);
    }
}


function openBlockColorsMenu() {
    setVisibleObjects([
        levelOptionsOverlay,
        levelOptionsText,
        backFromLevelOptionsButton,
        selectMusicButton,
        selectBackgroundButton,
        selectBlockColorButton
    ], false);

    setVisibleObjects([
        ...blockColorButtons,
        backFromBlockColorsButton
    ], true);
}








function toggleBlockColorsMenu() {
    // If menu exists and is visible â†’ close it
    if (blockColorsOverlay?.visible) {
        closeBlockColorsMenu.call(this);
    } else {
        openBlockColorsMenu.call(this);
    }
}


function highlightBlockColorButton(selectedBtn) {
    if (!blockColorButtons.all) return;

    blockColorButtons.all.forEach(btn => {
        btn.setStrokeStyle(0); // remove highlight
    });

    selectedBtn.setStrokeStyle(4, 0xffff00); // yellow highlight
}

function openBlockColorsMenu() {
    // Hide all level option buttons
    if (levelOptionButtons) {
        levelOptionButtons.forEach(btn => btn.setVisible(false));
    }

    // Hide the "Block Colors" button itself
    if (blockColorsButton) blockColorsButton.setVisible(false);

    if (!blockColorsOverlay) {
        // Semi-transparent background
        blockColorsOverlay = this.add.rectangle(
            config.width / 2,
            config.height / 2,
            config.width * 0.6,
            config.height * 0.6,
            0x000000,
            0.8
        ).setScrollFactor(0).setDepth(3000);

        // Title
        blockColorsText = this.add.text(
            config.width / 2,
            config.height / 2 - 200,
            "Select Block Color",
            { fontSize: '64px', fill: '#ffffff', fontFamily: 'Arial' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(3001);

        // Color buttons
        const colors = [0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        const spacing = 120;
        const startX = config.width / 2 - ((colors.length - 1) * spacing) / 2;
        blockColorButtons.all = [];

        colors.forEach((color, index) => {
            const btn = this.add.rectangle(
                startX + index * spacing,
                config.height / 2,
                100, 100,
                color
            ).setOrigin(0.5)
             .setInteractive()
             .setScrollFactor(0)
             .setDepth(3001);

            btn.on('pointerup', () => {
                blockColorHex = color;
            });

            blockColorButtons.all.push(btn);
        });

        // Back button
        blockColorsBackButton = this.add.text(
            config.width / 2,
            config.height / 2 + 200,
            "Back",
            { fontSize: '48px', fill: '#ffffff', fontFamily: 'Arial', backgroundColor: '#333333' }
        ).setOrigin(0.5)
         .setInteractive()
         .setScrollFactor(0)
         .setDepth(3001);

        blockColorsBackButton.on('pointerup', () => {
            closeBlockColorsMenu.call(this);
        });
    }

    // Show everything
    blockColorsOverlay.setVisible(true);
    blockColorsText.setVisible(true);
    blockColorButtons.all.forEach(b => b.setVisible(true));
    if (blockColorsBackButton) blockColorsBackButton.setVisible(true);
}






function openBlockColorsMenu() {


    // Hide LEVEL OPTIONS buttons
    setVisibleObjects([
        selectMusicButton,
        selectBackgroundButton,
        selectBlockColorButton,
        backFromLevelOptionsButton,
        levelOptionsText
    ], false);

    // Show BLOCK COLORS menu
    blockColorButtons.forEach(btn => btn.setVisible(false));
    backFromBlockColorsButton.setVisible(false);
}

function closeBlockColorsMenu() {
    setVisibleObjects([
        ...blockColorButtons,
        backFromBlockColorsButton
    ], false);


}



function hideAllMenus() {
    setVisibleObjects([
        pauseMenuText,
        resumeButton,
        levelOptionsButton,
        quitButton,

        levelOptionsText,
        backFromLevelOptionsButton,
        selectMusicButton,
        selectBackgroundButton,
        selectBlockColorButton,

        musicMenuText,
        backgroundMenuText,

        blockColorsText,
        blockColorsBackButton,
        ...blockColorButtons
    ], false);
}






function disableAllBackButtons() {
    [
        backFromLevelOptionsButton,
        selectMusicBackButton,
        helpBackButton,
        backFromBlockColorsButton,
        backgroundBackButton
    ].forEach(btn => {
        if (btn) {
            btn.disableInteractive();
            btn.setVisible(false);
        }
    });
}




function forceBackButtonsHidden() {
    if (selectMusicBackButton) selectMusicBackButton.setVisible(false);
    if (helpBackButton) helpBackButton.setVisible(false);
    if (backFromLevelOptionsButton) backFromLevelOptionsButton.setVisible(false);
    if (backFromBlockColorsButton) backFromBlockColorsButton.setVisible(false);
}





// 🔥 SAVE LEVEL TO CLIPBOARD (S key)
function saveLevelToClipboard(scene) {
  const levelData = {
    music: selectedMusicKey || 'X',
    background: selectedBackgroundKey || 'A',
    blocks: blocksGroup.getChildren().map(b => ({
      x: b.x, y: b.y, width: b.displayWidth, height: b.displayHeight, tint: b.tint
    })),
    spikes: spikesGroup.getChildren().map(s => ({
      x: s.x, y: s.y, width: s.displayWidth, height: s.displayHeight
    })),
    windows: windowsGroup.getChildren().map(w => ({
      x: w.x, y: w.y, width: w.displayWidth, height: w.displayHeight
    })),
    noBoostBlocks: noBoostBlocksGroup.getChildren().map(b => ({
      x: b.x, y: b.y, width: b.displayWidth, height: b.displayHeight
    })),
    start: spawnPoint ? { x: spawnPoint.x, y: spawnPoint.y, width: spawnPoint.displayWidth, height: spawnPoint.displayHeight } : null,
    finish: finishLine ? { x: finishLine.x, y: finishLine.y, width: finishLine.displayWidth, height: finishLine.displayHeight } : null
  };

  const jsonString = JSON.stringify(levelData, null, 2);
  
  navigator.clipboard.writeText(jsonString).then(() => {
    showInstruction(scene, "LEVEL SAVED TO CLIPBOARD! (Press L to load)", 2000);
  });
}

// 🔥 LOAD LEVEL FROM CLIPBOARD (L key)
function loadLevelFromClipboard(scene) {
  navigator.clipboard.readText().then(text => {
    try {
      const levelData = JSON.parse(text);
      console.log("Loading JSON:", levelData);
      
      // SAFETY CHECKS
      if (!levelData.music || !levelData.background) {
        throw new Error("Missing music or background");
      }
      
      // 🔥 SAFE CLEAR (no crashes)
      if (blocksGroup) blocksGroup.clear(true, true);
      if (spikesGroup) spikesGroup.clear(true, true);
      if (windowsGroup) windowsGroup.clear(true, true);
      if (noBoostBlocksGroup) noBoostBlocksGroup.clear(true, true);
      
      if (scene.spawnPoint) scene.spawnPoint.destroy();
      if (scene.finishLine) scene.finishLine.destroy();
      
      // 🔥 SAFE TEXTURE CHANGE (NO CRASH)
      selectedMusicKey = levelData.music;
      selectedBackgroundKey = levelData.background;
      
      // ONLY change texture if menuBg exists AND texture exists
      if (menuBg && scene.textures.exists(levelData.background)) {
        menuBg.setTexture(levelData.background);
      }
      
      // BLOCKS - SAFE
      if (levelData.blocks?.length) {
        levelData.blocks.forEach(block => {
          const sprite = blocksGroup.create(block.x, block.y, 'pixel');
          sprite.setOrigin(0, 0);
          sprite.setDisplaySize(block.width || 64, block.height || 64);
          sprite.setTint(block.tint || 0xffffff);
          sprite.refreshBody();
        });
      }
      
      // SPIKES - SAFE  
      if (levelData.spikes?.length) {
        levelData.spikes.forEach(spike => {
          const sprite = spikesGroup.create(spike.x, spike.y, 'spike');
          sprite.setOrigin(0, 0);
          sprite.setDisplaySize(spike.width || 64, spike.height || 64);
          sprite.refreshBody();
        });
      }
      
      // WINDOWS - SAFE
      if (levelData.windows?.length) {
        levelData.windows.forEach(window => {
          const sprite = windowsGroup.create(window.x, window.y, 'window');
          sprite.setOrigin(0, 0);
          sprite.setDisplaySize(window.width || 64, window.height || 64);
          sprite.refreshBody();
        });
      }
      
      // NO-BOOST - SAFE
      if (levelData.noBoostBlocks?.length) {
        levelData.noBoostBlocks.forEach(block => {
          const sprite = noBoostBlocksGroup.create(block.x, block.y, 'pixel');
          sprite.setOrigin(0, 0);
          sprite.setDisplaySize(block.width || 64, block.height || 64);
          sprite.setTint(0x0000ff);
          sprite.refreshBody();
        });
      }
      
      // START/FINISH - SAFE
      if (levelData.start) {
        scene.spawnPoint = scene.add.sprite(levelData.start.x, levelData.start.y, 'start')
          .setOrigin(0, 0).setDisplaySize(levelData.start.width || 64, levelData.start.height || 64);
      }
      if (levelData.finish) {
        scene.finishLine = scene.add.sprite(levelData.finish.x, levelData.finish.y, 'finish')
          .setOrigin(0, 0).setDisplaySize(levelData.finish.width || 64, levelData.finish.height || 64);
      }
      
      showInstruction(scene, "✅ LEVEL LOADED PERFECTLY!", 2000);
      
    } catch (error) {
      console.error("LOAD ERROR:", error);
      showInstruction(scene, "❌ LOAD FAILED!", 2000);
    }
  });
}




function openLevelOptions() {  // ← NO (scene) PARAMETER
  const scene = window.myGameScene;  // ← GET SCENE FROM GLOBAL
  
  // Hide other menus
  if (pauseOverlay) pauseOverlay.setVisible(true);
  if (pauseText) pauseText.setVisible(false);
  
  // Hide main pause buttons  
  if (resumeButton) resumeButton.setVisible(false);
  if (returnToMenuButton) returnToMenuButton.setVisible(false);
  if (helpButton) helpButton.setVisible(false);
  
  // Create level options UI if missing
  if (!levelOptionsOverlay) {
    levelOptionsOverlay = scene.add.rectangle(
      config.width / 2, config.height / 2, 
      config.width * 0.8, config.height * 0.6, 
      0x333333, 0.9
    ).setScrollFactor(0).setDepth(2003);
    
    levelOptionsText = scene.add.text(
      config.width / 2, config.height / 2 - 100, 
      'LEVEL OPTIONS', 
      { fontSize: '96px', fill: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(2004);
    
    selectMusicButton = makeMenuButton(
      scene, config.width / 2, config.height / 2, 
      'MUSIC', () => openSelectMusicMenu()
    );
    
    backFromLevelOptionsButton = makeMenuButton(
      scene, config.width / 2, config.height / 2 + 120, 
      'BACK', () => closeLevelOptions()
    );
  }
  
  // Show everything
  levelOptionsOverlay.setVisible(true);
  levelOptionsText.setVisible(true);
  selectMusicButton.setVisible(true);
  backFromLevelOptionsButton.setVisible(true);
  
  currentPauseMenu = 'levelOptions';
}

function closeLevelOptions() {  // ← NO PARAMETER
  const scene = window.myGameScene;
  
  if (levelOptionsOverlay) levelOptionsOverlay.setVisible(false);
  if (levelOptionsText) levelOptionsText.setVisible(false);
  if (selectMusicButton) selectMusicButton.setVisible(false);
  if (backFromLevelOptionsButton) backFromLevelOptionsButton.setVisible(false);
  
  // Restore main menu
  if (resumeButton) resumeButton.setVisible(true);
  if (returnToMenuButton) returnToMenuButton.setVisible(true);
  if (levelOptionsButton) levelOptionsButton.setVisible(true);
  if (helpButton) helpButton.setVisible(true);
  
  currentPauseMenu = 'main';
}

function openSelectMusicMenu() {  // ← NO PARAMETER
  closeLevelOptions();
  
  if (musicTitleText) musicTitleText.setVisible(true);
  Object.values(musicButtons).forEach(btn => btn.setVisible(true));
  if (selectMusicBackButton) selectMusicBackButton.setVisible(true);
  
  currentPauseMenu = 'selectMusic';
}



function openSelectMusicMenu(scene) {
  closeLevelOptions(scene);
  
  if (musicTitleText) musicTitleText.setVisible(true);
  Object.values(musicButtons).forEach(btn => btn.setVisible(true));
  if (selectMusicBackButton) selectMusicBackButton.setVisible(true);
  
  currentPauseMenu = 'selectMusic';
}



function playSelectedMusic(scene) {
  // Stop any currently playing track
  if (currentMusic) {
    currentMusic.stop();
    currentMusic.destroy();
    currentMusic = null;
  }

  const soundKey = MUSIC_MAP[selectedMusicKey];  // e.g. 'Adventure'

  // If mapping is wrong, bail silently
  if (!soundKey) {
    console.warn('No sound mapping for selectedMusicKey:', selectedMusicKey);
    return;
  }

  // If audio wasn’t loaded or key typo, bail
  if (!scene.sound || !scene.sound.exists || !scene.sound.exists(soundKey)) {
    // In older Phaser versions, exists() may not exist – in that case just try/catch play.
    console.warn('Sound not loaded or key invalid:', soundKey);
    return;
  }

  currentMusic = scene.sound.add(soundKey, { loop: true, volume: 1 });
  currentMusic.play();
}
