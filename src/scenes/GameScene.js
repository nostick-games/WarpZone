/**
 * Classe de la scène principale du jeu
 */
import { Stardasher, Voidblade, PlasmaGhost } from '../ships/index.js';
import Asteroid from '../items/Asteroid.js';
import { PowerupManager, AsteroidManager, CollisionManager, EnemyCounter } from './components/index.js';
import EnemyBullet from '../enemies/EnemyBullet.js';
import gameManager from '../Game.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Propriétés du jeu
        this.score = 0;
        this.stars = 0; // Compteur d'étoiles collectées
        this.gameOver = false;
        this.projectiles = [];
        
        // Pour les astéroïdes et powerups
        this.asteroids = [];
        this.powerups = [];
        this.nextAsteroidTime = 0;
        this.asteroidSpawnInterval = 5000; // 5 secondes entre chaque astéroïde
        
        // Système de vies
        this.lives = 3; // Le joueur commence avec 3 vies
        this.maxLives = 5; // Maximum 5 vies
        this.lifeIcons = []; // Tableau pour stocker les sprites des vies
        
        // Pour les bombes
        this.bombCount = 2; // Le joueur commence avec 2 bombes
        this.maxBombs = 5; // Maximum de 5 bombes
        this.bombIcons = []; // Tableau pour stocker les sprites des bombes
        
        // Pour le lancement de bombe
        this.isChargingBomb = false;
        this.bombChargeTime = 0;
        this.bombChargeDuration = 2000; // 2 secondes
        this.bombChargeCircle = null;
        this.bombAnimationInProgress = false;
        this.collisionsDisabled = false; // Variable pour désactiver les collisions
        this.playerInvincible = false; // État d'invincibilité du joueur
        this.invincibilityTimer = null; // Timer pour l'invincibilité
        
        // Pour différencier le tir normal et le chargement de bombe
        this.spaceKeyDownTime = 0; // Moment où la barre d'espace a été enfoncée
        this.minBombChargeDelay = 300; // Délai minimal (en ms) avant de considérer que c'est un chargement de bombe
        this.spaceKeyWasDown = false; // Pour détecter quand la barre d'espace vient d'être enfoncée
        this.canShoot = true; // Pour éviter les tirs multiples avec un seul appui
        
        // Pour le bonus x2
        this.scoreMultiplier = 1; // Multiplicateur de score (1 = normal, 2 = bonus x2)
        this.bonusX2Active = false; // État du bonus x2
        this.bonusX2EndTime = 0; // Temps de fin du bonus x2
        this.bonusX2Text = null; // Texte du bonus x2
    }

    /**
     * Retourne un style de texte standardisé avec la police "Electrolize"
     * @param {number} fontSize - Taille de la police (par défaut: 16)
     * @param {string} color - Couleur du texte (par défaut: blanc)
     * @param {string} align - Alignement du texte (par défaut: center)
     * @returns {object} - Style de texte pour Phaser
     */
    getGameFontStyle(fontSize = 16, color = '#FFFFFF', align = 'center') {
        return {
            fontFamily: 'Electrolize',
            fontSize: `${fontSize}px`,
            color: color,
            align: align
        };
    }

    init(data) {
        // Récupérer le vaisseau sélectionné du registre
        this.selectedShip = this.registry.get('selectedShip');
        
        // Initialiser le temps du dernier tir
        this.lastFired = 0;
        
        // Réinitialiser le score et les étoiles
        this.score = 0;
        this.stars = 0; // Commencer avec 0 étoile
        this.gameOver = false;
        
        // Réinitialiser le système de vies
        this.lives = 3;
        this.lifeIcons = [];
        
        // Réinitialiser le nombre de bombes
        this.bombCount = 2;
        this.bombIcons = [];
        
        // Réinitialiser les variables de lancement de bombe
        this.isChargingBomb = false;
        this.bombChargeTime = 0;
        this.bombChargeCircle = null;
        this.bombAnimationInProgress = false;
        
        // Réinitialiser le bonus x2
        this.scoreMultiplier = 1;
        this.bonusX2Active = false;
        this.bonusX2EndTime = 0;
        this.bonusX2Text = null;
        
        // Réinitialiser le compteur d'ennemis s'il existe
        if (this.enemyCounter) {
            this.enemyCounter.reset();
        }
    }

    preload() {
        // Importer les classes des ennemis
        this.Unit1 = window.Unit1;
        this.Saucer = window.Saucer;
        this.EliteUnit = window.EliteUnit; // Ajouter l'ennemi d'élite
        this.PurpleDeath = window.PurpleDeath; // Ajouter PurpleDeath
        this.Tourelle = window.Tourelle; // Ajouter la Tourelle
        this.TourelleLeft = window.TourelleLeft; // Ajouter la TourelleLeft
        this.BlueBeetle = window.BlueBeetle; // Ajouter le boss BlueBeetle
        this.EnemyManager = window.EnemyManager;
        this.EnemyBullet = window.EnemyBullet; // Ajouter EnemyBullet
        

        
        // Charger les spritesheets des vaisseaux
        // Spaceship 1
        this.load.spritesheet('spaceship1_idle', 'assets/spaceship/spaceship1_idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship1_left', 'assets/spaceship/spaceship1_left.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship1_right', 'assets/spaceship/spaceship1_right.png', { frameWidth: 32, frameHeight: 32 });
        
        // Spaceship 2
        this.load.spritesheet('spaceship2_idle', 'assets/spaceship/spaceship2_idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship2_left', 'assets/spaceship/spaceship2_left.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship2_right', 'assets/spaceship/spaceship2_right.png', { frameWidth: 32, frameHeight: 32 });
        
        // Spaceship 3
        this.load.spritesheet('spaceship3_idle', 'assets/spaceship/spaceship3_idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship3_left', 'assets/spaceship/spaceship3_left.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship3_right', 'assets/spaceship/spaceship3_right.png', { frameWidth: 32, frameHeight: 32 });
        
        // Charger le spritesheet des flammes
        this.load.spritesheet('flamme_spaceship', 'assets/spaceship/flamme_spaceship.png', { frameWidth: 16, frameHeight: 16 });
        
        // Charger les projectiles
        this.load.image('projectile1', 'assets/spaceship/spaceship1_shoot.png');
        this.load.image('projectile2', 'assets/spaceship/spaceship2_shoot.png');
        this.load.image('projectile3', 'assets/spaceship/spaceship3_projectile3.png');
        
        // Précharger les assets des ennemis
        this.load.spritesheet('unit1', 'assets/enemies/unit1.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('saucer', 'assets/enemies/saucer.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('eliteunit', 'assets/enemies/eliteunit.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('purpledeath', 'assets/enemies/PurpleDeath.png', { frameWidth: 64, frameHeight: 88 });
        this.load.spritesheet('tourelle', 'assets/enemies/tourelle.png', { frameWidth: 66, frameHeight: 66 });
        this.load.spritesheet('tourelle_left', 'assets/enemies/tourelle_left.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('bluebeetle', 'assets/enemies/boss/BlueBeetle.png', { frameWidth: 169, frameHeight: 178 });
        
        // Nouveaux assets pour la tourelle redessinée
        this.load.image('astroport', 'assets/enemies/astroport.png');
        this.load.spritesheet('tourelle_new', 'assets/enemies/tourelle_new.png', { frameWidth: 32, frameHeight: 32 });
        
        // Charger le spritesheet des projectiles ennemis (bullets)
        this.load.spritesheet('bullet', 'assets/enemies/bullet.png', { frameWidth: 8, frameHeight: 8 });
        
        // Log de chargement des assets PurpleDeath
        this.load.spritesheet('explosion', 'assets/enemies/explosion.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('enemy_projectile', 'assets/enemies/enemy_projectile.png');
        
        // Charger les assets des astéroïdes et powerups
        this.load.image('asteroid1', 'assets/items/asteroid1.png');
        this.load.image('asteroid2', 'assets/items/asteroid2.png');
        this.load.spritesheet('powerup', 'assets/items/powerup.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('powerup_bomb', 'assets/items/powerup_bomb.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('star', 'assets/items/star.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bonusx2', 'assets/items/bonusx2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('1-up', 'assets/items/1-up.png');
        
        // Charger les assets des bombes
        this.load.image('bomb', 'assets/items/bomb.png');
        this.load.image('bomb_empty', 'assets/items/bomb_empty.png');
        this.load.spritesheet('bomb_explosion', 'assets/items/bomb_explosion.png', { frameWidth: 64, frameHeight: 64 });
        
        // Charger les assets du laser du boss BlueBeetle
        this.load.spritesheet('charge_effect', 'assets/enemies/boss/1_charge_effect.png', { frameWidth: 96, frameHeight: 72 });
        this.load.spritesheet('charge_build', 'assets/enemies/boss/2_charge_build.png', { frameWidth: 40, frameHeight: 40 });
        this.load.spritesheet('ignition_burst', 'assets/enemies/boss/3_ignition_burst.png', { frameWidth: 104, frameHeight: 104 });
        this.load.spritesheet('beam_origin', 'assets/enemies/boss/4_beam_origin.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('beam_frames', 'assets/enemies/boss/5_beam_frames.png', { frameWidth: 32, frameHeight: 128 });
        
        // Charger les assets des pilotes pour les vies
        this.load.image('pilot1_life', 'assets/spaceship/pilot1_life.png');
        this.load.image('pilot2_life', 'assets/spaceship/pilot2_life.png');
        this.load.image('pilot3_life', 'assets/spaceship/pilot3_life.png');
        this.load.image('pilot_life_empty', 'assets/spaceship/pilot_life_empty.png');
        
        // Diagnostique : afficher les dimensions réelles du fichier tourelle_left
        this.load.on('filecomplete-spritesheet-tourelle_left', () => {
            const texture = this.textures.get('tourelle_left');
            if (texture && texture.source[0]) {
                // Diagnostic silencieux
            }
        });
    }

    create() {
        // Créer le fond étoilé
        this.createStarfield();
        
        // Créer l'animation des flammes (pour éviter qu'elle n'apparaisse au centre)
        if (!this.anims.exists('flamme_anim')) {
            this.anims.create({
                key: 'flamme_anim',
                frames: this.anims.generateFrameNumbers('flamme_spaceship', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Créer l'animation de l'étoile
        if (!this.anims.exists('star_anim')) {
            this.anims.create({
                key: 'star_anim',
                frames: this.anims.generateFrameNumbers('star', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Préparer les textures pour la détection pixel-perfect
        this.prepareTexturesForPixelDetection();
        
        // Initialiser les gestionnaires
        this.collisionManager = new CollisionManager(this);
        this.powerupManager = new PowerupManager(this);
        this.asteroidManager = new AsteroidManager(this);
        
        // Position initiale et finale du vaisseau
        const startY = this.game.config.height / 2;
        const endY = this.game.config.height - 100;
        
        // Créer le vaisseau approprié en fonction de la sélection
        this.createPlayerShip(this.game.config.width / 2, startY);
        
        // Initialiser les tableaux
        this.projectiles = [];
        this.asteroids = [];
        this.powerups = [];
        
        // Rechercher et supprimer tout sprite de flamme orphelin
        let flameCount = 0;
        this.children.each(child => {
            // Si c'est un sprite de flamme
            if (child.texture && child.texture.key === 'flamme_spaceship') {
                flameCount++;
                
                // Ne garder que la flamme associée au vaisseau du joueur
                if (this.player && this.player.flameSprite !== child) {
                    child.destroy();
                }
            }
        });
        

        
        // Effet de zoom et mouvement vers le bas
        // On utilise une animation différente pour être sûr que le scale fonctionne correctement
        this.time.delayedCall(100, () => {
            this.tweens.add({
                targets: this.player.shipGroup,
                scale: { from: 15, to: 2 },
                y: endY,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    // Activer les contrôles après l'animation
                    this.playerReady = true;
                    
                    // Afficher la flamme
                    this.player.flameSprite.setVisible(true);
                    
                    // Afficher les textes après l'animation
                    this.showGameText();
                    
                    // Initialiser le gestionnaire d'ennemis après l'animation
                    this.initEnemyManager();
                    
                    // S'assurer que EnemyManager a aussi une référence au collisionManager si besoin
                    if (this.enemyManager && this.collisionManager) {
                        // Normalement, EnemyManager utilisera this.scene.collisionManager directement
                        // donc pas besoin d'assignation explicite ici sauf cas particulier.
                    }
                }
            });
        });
        
        // Ajouter des contrôles pour le joueur
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Touche de tir (barre d'espace)
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Touche pour activer/désactiver le débogage (D)
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        
        // Touche pour utiliser une bombe (B)
        this.bombKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        
        // Désactiver les contrôles pendant l'animation
        this.playerReady = false;
        
        // Créer un texte pour le score (centré en haut)
        this.scoreText = this.add.text(this.game.config.width / 2, 30, '0', 
            this.getGameFontStyle(24, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Initialiser la couleur du score
        this.updateScoreColor();
        
        // Créer le compteur d'étoiles (à droite de l'écran)
        this.starIcon = this.add.sprite(this.game.config.width - 65, 30, 'star');
        this.starIcon.setScale(1);
        this.starIcon.play({ key: 'star_anim', repeat: -1 });
        
        this.starText = this.add.text(this.game.config.width - 50, 30, `x${this.stars}`, 
            this.getGameFontStyle(24, '#F9DE4F')
        ).setOrigin(0, 0.5);
        
        // Créer l'affichage des bombes
        this.createBombDisplay();
        
        // Créer l'affichage des vies
        this.createLifeDisplay();
        
        // Initialiser le compteur d'ennemis
        this.enemyCounter = new EnemyCounter(this);
    }
    
    /**
     * Crée le vaisseau du joueur selon le type sélectionné
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     */
    createPlayerShip(x, y) {
        switch (this.selectedShip) {
            case 'spaceship1':
                this.player = new Stardasher(this, x, y);
                break;
            case 'spaceship2':
                this.player = new Voidblade(this, x, y);
                break;
            case 'spaceship3':
                this.player = new PlasmaGhost(this, x, y);
                break;
            default:
                this.player = new Stardasher(this, x, y);
                break;
        }
        
        // Définir une profondeur élevée pour que le vaisseau soit toujours au premier plan
        this.player.shipGroup.setDepth(1000);
        
        // Initialiser le scale pour l'animation d'entrée
        // Le scale est maintenant défini sur le groupe, pas sur les sprites individuels
        this.player.shipGroup.setScale(15);
        
        // Assurons-nous que le scale des sprites à l'intérieur du groupe reste à 2
        this.player.sprite.setScale(0.8);
        this.player.flameSprite.setScale(0.8);
    }
    
    initEnemyManager() {
        // Vérifier si nous sommes en mode test du boss
        const testBossMode = this.registry.get('testBossMode') || false;
        this.isTestingBoss = testBossMode;
        
        // Créer le gestionnaire d'ennemis avec le niveau de difficulté approprié
        if (testBossMode) {
            // Créer avec niveau de difficulté 6 pour tester le boss
            this.enemyManager = new this.EnemyManager(this, this.time.now, 6);
            console.log("Mode test du boss activé! Niveau de difficulté forcé à 6.");
        } else {
            // Création normale
            this.enemyManager = new this.EnemyManager(this, this.time.now);
        }
        
        // Créer les animations des ennemis
        if (!this.anims.exists('unit1_fly')) {
            this.anims.create({
                key: 'unit1_fly',
                frames: this.anims.generateFrameNumbers('unit1', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('saucer_fly')) {
            this.anims.create({
                key: 'saucer_fly',
                frames: this.anims.generateFrameNumbers('saucer', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('explode')) {
            this.anims.create({
                key: 'explode',
                frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 6 }),
                frameRate: 20,
                repeat: 0
            });
        }
        
        // Animation pour l'ennemi d'élite
        if (!this.anims.exists('eliteunit_fly')) {
            this.anims.create({
                key: 'eliteunit_fly',
                frames: this.anims.generateFrameNumbers('eliteunit', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animation pour PurpleDeath
        if (!this.anims.exists('purpledeath_fly')) {
            this.anims.create({
                key: 'purpledeath_fly',
                frames: this.anims.generateFrameNumbers('purpledeath', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        // Animation pour la Tourelle
        if (!this.anims.exists('tourelle_fire')) {
            this.anims.create({
                key: 'tourelle_fire',
                frames: this.anims.generateFrameNumbers('tourelle', { start: 0, end: 10 }), // 11 frames (0 à 10)
                frameRate: 8,
                repeat: 0 // Ne joue qu'une seule fois
            });
        }
        
        // Animation inverse pour la Tourelle (deuxième tir)
        if (!this.anims.exists('tourelle_fire_reverse')) {
            this.anims.create({
                key: 'tourelle_fire_reverse',
                frames: this.anims.generateFrameNumbers('tourelle', { start: 10, end: 5 }), // De frame 10 à 5 (sens inverse)
                frameRate: 8,
                repeat: 0 // Ne joue qu'une seule fois
            });
        }
        
        // Animations pour la nouvelle tourelle (tourelle_new)
        if (!this.anims.exists('tourelle_new_fire1')) {
            this.anims.create({
                key: 'tourelle_new_fire1',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 1, end: 11 }),
                frameRate: 8,
                repeat: 0
            });
        }
        
        if (!this.anims.exists('tourelle_new_fire2')) {
            this.anims.create({
                key: 'tourelle_new_fire2',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 11, end: 5 }),
                frameRate: 8,
                repeat: 0
            });
        }
        
        if (!this.anims.exists('tourelle_new_fire3')) {
            this.anims.create({
                key: 'tourelle_new_fire3',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 5, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Animations pour la nouvelle TourelleLeft (même spritesheet mais noms différents)
        // Animation pour la nouvelle TourelleLeft - Phase 1 (frame 1 à 11)
        if (!this.anims.exists('tourelle_left_new_fire1')) {
            this.anims.create({
                key: 'tourelle_left_new_fire1',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 1, end: 11 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Animation pour la nouvelle TourelleLeft - Phase 2 (frame 11 à 5)
        if (!this.anims.exists('tourelle_left_new_fire2')) {
            this.anims.create({
                key: 'tourelle_left_new_fire2',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 11, end: 5 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Animation pour la nouvelle TourelleLeft - Phase 3 (frame 5 à 2)
        if (!this.anims.exists('tourelle_left_new_fire3')) {
            this.anims.create({
                key: 'tourelle_left_new_fire3',
                frames: this.anims.generateFrameNumbers('tourelle_new', { start: 5, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }
        
        // Animation pour la Tourelle de gauche
        if (!this.anims.exists('tourelle_left_fire')) {
            this.anims.create({
                key: 'tourelle_left_fire',
                frames: this.anims.generateFrameNumbers('tourelle_left', { start: 0, end: 10 }), // 11 frames (0 à 10)
                frameRate: 8,
                repeat: 0 // Ne joue qu'une seule fois
            });
        }
        
        // Animation inverse pour la Tourelle de gauche (deuxième tir)
        if (!this.anims.exists('tourelle_left_fire_reverse')) {
            this.anims.create({
                key: 'tourelle_left_fire_reverse',
                frames: this.anims.generateFrameNumbers('tourelle_left', { start: 10, end: 5 }), // De frame 10 à 5 (sens inverse)
                frameRate: 8,
                repeat: 0 // Ne joue qu'une seule fois
            });
        }
        
        // Animation pour les projectiles ennemis (bullets)
        if (!this.anims.exists('bullet_anim')) {
            this.anims.create({
                key: 'bullet_anim',
                frames: this.anims.generateFrameNumbers('bullet', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animation pour le boss BlueBeetle
        if (!this.anims.exists('bluebeetle_fly')) {
            this.anims.create({
                key: 'bluebeetle_fly',
                frames: this.anims.generateFrameNumbers('bluebeetle', { start: 0, end: 1 }),
                frameRate: 5,
                repeat: -1
            });
        }
        
        // Animations pour le laser du boss BlueBeetle
        if (!this.anims.exists('charge_effect_anim')) {
            this.anims.create({
                key: 'charge_effect_anim',
                frames: this.anims.generateFrameNumbers('charge_effect', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: 0
            });
        }
        
        if (!this.anims.exists('charge_build_anim')) {
            this.anims.create({
                key: 'charge_build_anim',
                frames: this.anims.generateFrameNumbers('charge_build', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('ignition_burst_anim')) {
            this.anims.create({
                key: 'ignition_burst_anim',
                frames: this.anims.generateFrameNumbers('ignition_burst', { start: 0, end: 4 }),
                frameRate: 15,
                repeat: 0
            });
        }
        
        if (!this.anims.exists('beam_origin_anim')) {
            this.anims.create({
                key: 'beam_origin_anim',
                frames: this.anims.generateFrameNumbers('beam_origin', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('beam_frames_anim')) {
            this.anims.create({
                key: 'beam_frames_anim',
                frames: this.anims.generateFrameNumbers('beam_frames', { start: 0, end: 13 }),
                frameRate: 20,
                repeat: -1
            });
        }
        
        // Création de l'animation d'explosion de bombe
        if (!this.anims.exists('bomb_explode')) {
            this.anims.create({
                key: 'bomb_explode',
                frames: this.anims.generateFrameNumbers('bomb_explosion', { start: 0, end: 14 }),
                frameRate: 20,
                repeat: 0
            });
        }
    }
    
    createStarfield() {
        // Créer le fond noir
        this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000022).setOrigin(0);
        
        // Créer les conteneurs pour les étoiles
        this.nearStars = this.add.container(0, 0);
        this.farStars = this.add.container(0, 0);
        
        // Générer des étoiles lointaines (petites et lentes)
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.game.config.width);
            const y = Phaser.Math.Between(0, this.game.config.height);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.6);
            
            const star = this.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.farStars.add(star);
        }
        
        // Générer des étoiles proches (plus grandes et rapides)
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, this.game.config.width);
            const y = Phaser.Math.Between(0, this.game.config.height);
            const size = Phaser.Math.Between(2, 3);
            const alpha = Phaser.Math.FloatBetween(0.7, 1);
            
            const star = this.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.nearStars.add(star);
        }
        
        // Vitesses de scrolling
        this.farStarsSpeed = 0.5;
        this.nearStarsSpeed = 2;
    }
    
    updateStarfield() {
        // Mettre à jour les étoiles lointaines
        this.farStars.each(star => {
            star.y += this.farStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.game.config.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.game.config.width);
            }
        });
        
        // Mettre à jour les étoiles proches
        this.nearStars.each(star => {
            star.y += this.nearStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.game.config.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.game.config.width);
            }
        });
    }
    
    showGameText() {
        // Cette méthode doit rester vide pour que this.scoreText (créé dans create() et centré)
        // ne soit pas écrasé par un nouveau texte en haut à gauche.
        // Le score et les étoiles sont déjà correctement initialisés dans create().
    }
    
    handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;


        // Nettoyer les effets du bonus X2 immédiatement
        this.clearBonusX2Effects();

        // Arrêter la musique de fond si elle joue
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }

        // Effet de secousse de la caméra
        this.cameras.main.shake(500, 0.02); // Secouer pendant 500ms avec une intensité de 0.02

        // Créer une explosion sur le joueur
        if (this.player && this.player.ship && this.player.ship.active) {
            const explosion = this.add.sprite(this.player.ship.x, this.player.ship.y, 'explosion');
            explosion.setScale(this.player.ship.scale * 1.5); // Explosion un peu plus grosse que le vaisseau
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            // Cache le joueur immédiatement
            this.player.ship.setVisible(false);
            if (this.player.flameSprite) {
                this.player.flameSprite.setVisible(false);
            }
        }

        // Arrêter tous les timers et les mouvements
        if (this.enemyManager) {
            this.enemyManager.reset(); // Pour arrêter les spawns et vider les ennemis existants
            // On pourrait aussi vouloir arrêter les tweens/timers spécifiques aux ennemis ici
        }
        if (this.asteroidManager) {
            this.asteroidManager.reset();
        }
        if (this.powerupManager) {
            this.powerupManager.reset();
        }
        
        // Arrêter les mises à jour des projectiles
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];

        // Nettoyer les effets bonus X2
        this.clearBonusX2Effects();

        // Délai avant de passer à l'écran de Game Over
        this.time.delayedCall(2000, () => {
            // Passer à la scène de Game Over en passant le score de base et les étoiles séparément
            this.scene.start('DeathScene', { 
                selectedShipKey: this.selectedShip,
                baseScore: this.score,
                starsEarned: this.stars
            });
        });
    }
    
    updateScore(points) {
        // Appliquer le multiplicateur si le bonus x2 est actif
        const finalPoints = points * this.scoreMultiplier;
        
        // Mettre à jour le score
        this.score += finalPoints;
        
        // Mettre à jour le texte du score (seulement le chiffre)
        this.scoreText.setText(`${this.score}`);
        
        // Maintenir la couleur jaune si le bonus x2 est actif
        this.updateScoreColor();
        
        // Effet de flash sur le texte du score (plus intense si bonus x2)
        this.tweens.add({
            targets: this.scoreText,
            scale: this.scoreMultiplier > 1 ? 1.4 : 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // Remettre la couleur appropriée après l'animation
                this.updateScoreColor();
            }
        });
        
        // Si bonus x2 actif, effet de couleur dorée temporaire en plus
        if (this.scoreMultiplier > 1) {
            this.tweens.add({
                targets: this.scoreText,
                tint: 0xFFFF00, // Couleur jaune plus vive pendant le flash
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    // Remettre la couleur jaune normale après le flash
                    this.updateScoreColor();
                }
            });
        }
    }
    
    /**
     * Met à jour la couleur du score en fonction de l'état du bonus x2
     */
    updateScoreColor() {
        if (this.bonusX2Active || this.scoreMultiplier > 1) {
            // Couleur jaune pendant le bonus x2
            this.scoreText.setTint(0xFFD700);
        } else {
            // Couleur blanche normale
            this.scoreText.clearTint();
        }
    }
    
    /**
     * Met à jour le compteur d'étoiles
     */
    updateStarCount() {
        this.starText.setText(`x${this.stars}`);
        
        // Effet de flash sur le texte des étoiles
        this.tweens.add({
            targets: this.starText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }
    
    /**
     * Gère l'apparition d'un astéroïde à un intervalle aléatoire
     * @param {number} time - Temps actuel
     */
    spawnAsteroid(time) {
        // Déléguer la création d'astéroïdes au gestionnaire
        this.asteroidManager.spawnAsteroid(time);
    }

    update(time, delta) {
        // Ne pas mettre à jour si game over
        if (this.gameOver) {
            return;
        }
        
        // Mettre à jour le fond étoilé
        this.updateStarfield();
        
        // Faire apparaître des astéroïdes à intervalle régulier
        this.spawnAsteroid(time);
        
        // Ne pas mettre à jour les contrôles si le joueur n'est pas prêt
        if (!this.playerReady) return;
        
        // Activer/désactiver le mode débogage des collisions
        if (Phaser.Input.Keyboard.JustDown(this.debugKey) && this.enemyManager) {
            this.enemyManager.debugCollision = !this.enemyManager.debugCollision;

        }
        
        // Gestion améliorée de la barre d'espace pour distinguer tir et chargement de bombe
        if (this.spaceKey.isDown && !this.bombAnimationInProgress) {
            // Si la barre d'espace vient d'être enfoncée
            if (!this.spaceKeyWasDown) {
                this.spaceKeyWasDown = true;
                this.spaceKeyDownTime = time;
                this.canShoot = true;
            }
            
            // Calcul du temps pendant lequel la barre d'espace a été maintenue
            const spaceKeyHoldDuration = time - this.spaceKeyDownTime;
            
            // Si la barre est maintenue assez longtemps, commencer à charger la bombe
            if (spaceKeyHoldDuration >= this.minBombChargeDelay && !this.isChargingBomb) {
                this.isChargingBomb = true;
                this.bombChargeTime = 0;
                this.createBombChargeCircle();
                this.canShoot = false; // Empêcher le tir une fois le chargement commencé
            }
            
            // Si on est en train de charger une bombe
            if (this.isChargingBomb) {
                // Mettre à jour le temps de chargement
                this.bombChargeTime += delta;
                
                // Mettre à jour la jauge circulaire
                this.updateBombChargeCircle(this.bombChargeTime / this.bombChargeDuration);
                
                // Si le chargement est complet, lancer la bombe
                if (this.bombChargeTime >= this.bombChargeDuration) {
                    this.isChargingBomb = false;
                    this.removeBombChargeCircle();
                    this.launchBomb();
                }
            }
            // Si appui court et possibilité de tirer
            else if (spaceKeyHoldDuration < this.minBombChargeDelay && this.canShoot) {
                // Tirer un projectile
                const newProjectiles = this.player.shoot((projectile) => {
                    this.projectiles.push(projectile);
                });
                // La gestion des projectiles est maintenant faite dans le callback
                this.canShoot = false; // Empêcher de tirer à nouveau avant de relâcher la touche
            }
        } 
        // Quand la barre d'espace est relâchée
        else if (!this.spaceKey.isDown) {
            // Réinitialiser l'état de la barre d'espace
            this.spaceKeyWasDown = false;
            
            // Si on était en train de charger une bombe, annuler le chargement
            if (this.isChargingBomb) {
                this.isChargingBomb = false;
                this.bombChargeTime = 0;
                this.removeBombChargeCircle();
            }
            
            // Réactiver la possibilité de tirer
            this.canShoot = true;
        }
        
        // Vérifier si le joueur utilise une bombe avec la touche B (méthode alternative)
        if (Phaser.Input.Keyboard.JustDown(this.bombKey) && !this.bombAnimationInProgress) {
            if (this.bombCount > 0) {
                this.launchBomb();
            } else {
                this.shakePlayer();
            }
        }
        
        // Mettre à jour la position du joueur
        this.player.update(this.cursors);
        
        // Mettre à jour les astéroïdes
        this.asteroidManager.update(delta);
        
        // Vérifier les collisions avec le joueur seulement si les collisions sont activées et le joueur n'est pas invincible
        if (!this.collisionsDisabled && !this.playerInvincible && this.asteroidManager.checkPlayerCollision(this.player)) {
            this.handlePlayerHit();
            return;
        }
        
        // Mettre à jour le gestionnaire d'ennemis s'il existe
        if (this.enemyManager) {
            this.enemyManager.update(time);
            
            // Vérifier les collisions avec les projectiles seulement si les collisions sont activées
            if (!this.collisionsDisabled && this.enemyManager) { // Vérification supplémentaire
                const scoreFromHits = this.enemyManager.checkProjectileCollisions(this.projectiles);
                
                // Mettre à jour le score si nécessaire
                if (scoreFromHits > 0) {
                    this.updateScore(scoreFromHits);
                }
                
                // Vérifier les collisions entre le joueur et les ennemis si le joueur n'est pas invincible
                if (!this.playerInvincible && this.enemyManager && this.enemyManager.checkPlayerCollisions(this.player)) {
                    this.handlePlayerHit();
                    return;
                }
            }
        }
        
        // Mettre à jour manuellement la position des projectiles et nettoyer ceux qui sont hors écran
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Déplacer le projectile selon sa trajectoire
            if (projectile.isAngledProjectile) {
                // Pour les projectiles avec trajectoire angulaire (Voidblade)
                projectile.x += projectile.speedX * (1/60);
                projectile.y += projectile.speedY * (1/60);
            } else if (projectile.isBackLaser) {
                // Pour les lasers arrière (Plasma Ghost niveau 2+)
                projectile.y -= projectile.speed * (1/60); // La vitesse est déjà négative
            } else if (projectile.isHorizontalLaser) {
                // Pour les lasers horizontaux (Plasma Ghost niveau 3)
                projectile.x += projectile.speedX * (1/60);
                projectile.y += projectile.speedY * (1/60); // speedY est 0 pour les lasers horizontaux
            } else {
                // Pour les projectiles standard (mouvement vertical)
                projectile.y -= projectile.speed * (1/60); // Approximation du delta time
            }
            
            // Vérifier les collisions avec les astéroïdes seulement si les collisions sont activées
            if (!this.collisionsDisabled) {
                this.checkAsteroidCollisions(projectile);
            }
            
            // Vérifier si le projectile est sorti de l'écran
            if (projectile.y < -20 || projectile.y > this.game.config.height + 20 || projectile.x < -20 || projectile.x > this.game.config.width + 20) {
                // Supprimer les particules associées si elles existent
                if (projectile.particles) {
                    projectile.particles.destroy();
                }
                
                // Détruire le sprite
                projectile.destroy();
                
                // Retirer du tableau
                this.projectiles.splice(i, 1);
            }
        }
        
        // Mettre à jour les powerups et vérifier les collisions
        this.updatePowerups(delta);
        
        // Gérer l'expiration du bonus x2
        this.updateBonusX2(time);
        
        // Mettre à jour le compteur d'ennemis (pour le bonus x3)
        if (this.enemyCounter) {
            this.enemyCounter.update(time);
        }
    }
    
    /**
     * Vérifie les collisions entre un projectile et les astéroïdes
     * @param {Phaser.GameObjects.Sprite} projectile - Le projectile à vérifier
     * @returns {boolean} - Vrai si une collision a eu lieu
     */
    checkAsteroidCollisions(projectile) {
        // Déléguer la vérification des collisions au gestionnaire d'astéroïdes
        return this.asteroidManager.checkProjectileCollisions(projectile);
    }
    
    /**
     * Met à jour les powerups et gère les collisions avec le joueur
     * @param {number} delta - Temps écoulé depuis la dernière mise à jour
     */
    updatePowerups(delta) {
        // Déléguer la mise à jour et la gestion des collisions au PowerupManager
        this.powerupManager.update(delta, this.player, (powerup) => {
            // Callback pour gérer les effets des powerups collectés

            
            if (powerup.type === 'weapon') {
                // Si niveau de tir max atteint, bonus de score
                if (this.player.shootLevel >= 3) {
                    this.updateScore(500);
                    // Flash jaune car niveau max déjà atteint
                    this.createWeaponPowerupEffect(true);
                } else {
                    this.player.upgradeShoot();
                    // Flash vert car amélioration effective
                    this.createWeaponPowerupEffect(false);
                }
            } else if (powerup.type === 'bomb') {
                // Si nombre max de bombes atteint, bonus de score
                if (this.bombCount >= this.maxBombs) {
                    this.updateScore(500);
                    // Flash rouge car niveau max déjà atteint
                    this.createPowerupFlashEffect('red');
                } else {
                    this.bombCount++;
                    this.updateBombDisplay();
                    // Flash rouge car amélioration effective
                    this.createPowerupFlashEffect('red');
                }
            } else if (powerup.type === 'star') {
                // Bonus de score pour les étoiles
                this.updateScore(100);
                
                // Augmenter le compteur d'étoiles
                this.stars++;
                this.updateStarCount();
                
                // Flash violet pour les étoiles
                this.createPowerupFlashEffect('purple');
            } else if (powerup.type === 'bonusx2') {
                // Activer le bonus x2 pendant 10 secondes
                this.activateBonusX2(10000); // 10 secondes en millisecondes
                
                // Flash jaune pour le bonus x2
                this.createPowerupFlashEffect('yellow');
            }
        });
    }

    /**
     * Prépare les textures pour la détection de collision par pixels
     */
    prepareTexturesForPixelDetection() {

        
        // Liste des textures à préparer - Utiliser uniquement les textures nouvellement chargées
        const textureKeys = [
            'spaceship1_idle', 'spaceship2_idle', 'spaceship3_idle',
            'projectile1', 'projectile2', 'projectile3',
            'unit1', 'saucer',
            'asteroid1', 'asteroid2', 'powerup'
        ];
        
        // Forcer le chargement complet des textures
        textureKeys.forEach(key => {
            if (this.textures.exists(key)) {
                // Marquer la texture comme utilisée pour la détection pixel-perfect
                const texture = this.textures.get(key);
                texture.pixelPerfectDetection = true;
            }
        });
    }

    /**
     * Vérifie s'il y a une collision entre le joueur et un astéroïde
     * @param {Ship} player - Le vaisseau du joueur
     * @param {Asteroid} asteroid - L'astéroïde à vérifier
     * @returns {boolean} - Vrai s'il y a collision
     */
    checkPlayerAsteroidCollision(player, asteroid) {
        // Vérifier la collision rectangle à rectangle
        if (Phaser.Geom.Rectangle.Overlaps(
            player.getBounds(),
            asteroid.sprite.getBounds()
        )) {

            return true;
        }
        return false;
    }

    /**
     * Crée l'affichage graphique du compteur de bombes
     */
    createBombDisplay() {
        // Nettoyer les icônes précédentes si elles existent
        this.bombIcons.forEach(icon => icon.destroy());
        this.bombIcons = [];
        
        // Position de départ pour la première bombe (en bas à gauche)
        const startX = 30;
        const startY = this.game.config.height - 30;
        const spacing = 24; // Espacement entre les bombes
        
        // Créer les icônes pour chaque emplacement de bombe
        for (let i = 0; i < this.maxBombs; i++) {
            // Choisir l'image selon si la bombe est disponible ou non
            const textureKey = i < this.bombCount ? 'bomb' : 'bomb_empty';
            
            // Créer le sprite
            const bombIcon = this.add.image(startX + i * spacing, startY, textureKey);
            bombIcon.setScale(2); // Scale x2
            bombIcon.setOrigin(0.5);
            
            // Ajouter au tableau pour pouvoir les mettre à jour plus tard
            this.bombIcons.push(bombIcon);
        }
    }
    
    /**
     * Met à jour l'affichage du compteur de bombes
     */
    updateBombDisplay() {
        for (let i = 0; i < this.maxBombs; i++) {
            // Mettre à jour la texture selon l'état actuel
            const textureKey = i < this.bombCount ? 'bomb' : 'bomb_empty';
            this.bombIcons[i].setTexture(textureKey);
        }
    }
    
    /**
     * Utilise une bombe si disponible
     * @returns {boolean} - Vrai si une bombe a été utilisée
     */
    useBomb() {
        if (this.bombCount > 0) {
            this.bombCount--;
            this.updateBombDisplay();
            return true;
        }
        return false;
    }

    /**
     * Crée la jauge circulaire de chargement de la bombe
     */
    createBombChargeCircle() {
        // Supprimer l'ancienne jauge si elle existe
        this.removeBombChargeCircle();
        
        // Créer un graphique pour la jauge
        this.bombChargeCircle = this.add.graphics();
        
        // Définir la position et le rayon
        this.bombChargeCircleRadius = 40; // Rayon de la jauge
    }
    
    /**
     * Met à jour la jauge circulaire en fonction de la progression
     * @param {number} progress - Progression du chargement (0 à 1)
     */
    updateBombChargeCircle(progress) {
        if (!this.bombChargeCircle) return;
        
        // Nettoyer le graphique
        this.bombChargeCircle.clear();
        
        // Position du cercle (autour du vaisseau du joueur)
        const x = this.player.shipGroup.x;
        const y = this.player.shipGroup.y;
        
        // Dessiner le cercle de fond (gris transparent)
        this.bombChargeCircle.fillStyle(0xAAAAAA, 0.3);
        this.bombChargeCircle.fillCircle(x, y, this.bombChargeCircleRadius);
        
        // Dessiner le cercle de progression (bleu)
        if (progress > 0) {
            // Calculer l'angle (en radians) pour l'arc de progression
            const startAngle = -Math.PI / 2; // Commencer en haut
            const endAngle = startAngle + (Math.PI * 2 * progress);
            
            // Dessiner l'arc de progression
            this.bombChargeCircle.fillStyle(0x0D7DE4, 0.6);
            this.bombChargeCircle.beginPath();
            this.bombChargeCircle.arc(x, y, this.bombChargeCircleRadius, startAngle, endAngle, false);
            this.bombChargeCircle.lineTo(x, y);
            this.bombChargeCircle.closePath();
            this.bombChargeCircle.fillPath();
            
            // Ajouter un contour au cercle
            this.bombChargeCircle.lineStyle(2, 0x0D7DE4, 1);
            this.bombChargeCircle.strokeCircle(x, y, this.bombChargeCircleRadius);
        }
    }
    
    /**
     * Supprime la jauge circulaire
     */
    removeBombChargeCircle() {
        if (this.bombChargeCircle) {
            this.bombChargeCircle.destroy();
            this.bombChargeCircle = null;
        }
    }
    
    /**
     * Fait vibrer le vaisseau du joueur (effet visuel quand pas de bombe disponible)
     */
    shakePlayer() {
        if (this.player && this.player.shipGroup) {
            // Sauvegarder la position originale
            const originalX = this.player.shipGroup.x;
            
            // Créer une séquence de vibration
            this.tweens.timeline({
                targets: this.player.shipGroup,
                tweens: [
                    { x: originalX - 10, duration: 50 },
                    { x: originalX + 10, duration: 50 },
                    { x: originalX - 8, duration: 50 },
                    { x: originalX + 8, duration: 50 },
                    { x: originalX - 5, duration: 50 },
                    { x: originalX + 5, duration: 50 },
                    { x: originalX, duration: 50 }
                ]
            });
        }
    }

    /**
     * Lance une bombe avec l'animation complète
     */
    launchBomb() {
        // Vérifier si on a des bombes disponibles
        if (this.bombCount <= 0) {
            this.shakePlayer();
            return;
        }
        
        // Marquer l'animation comme en cours pour bloquer d'autres actions
        this.bombAnimationInProgress = true;
        
        // Désactiver les collisions pendant toute l'animation
        this.collisionsDisabled = true;
        
        // Sauvegarder la position actuelle du vaisseau
        const originalX = this.player.shipGroup.x;
        const originalY = this.player.shipGroup.y;
        const originalScale = this.player.shipGroup.scale;
        
        // Position en bas et au centre de l'écran pour l'animation
        const centerX = this.game.config.width / 2;
        const bottomY = this.game.config.height - 60;
        
        // Définir une valeur de depth élevée pour le vaisseau pour qu'il soit au-dessus des autres éléments
        this.player.shipGroup.setDepth(1000);
        
        // Étape 1: Zoom progressif et déplacement vers le bas et au centre
        this.tweens.add({
            targets: this.player.shipGroup,
            scale: 15,
            y: bottomY,
            x: centerX,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // Étape 2: Afficher la bombe devant le vaisseau
                const bombSprite = this.add.image(
                    centerX,  // Position X au centre
                    bottomY - 100, // Juste au-dessus du vaisseau
                    'bomb'
                );
                bombSprite.setScale(10);
                bombSprite.setDepth(5); // Valeur de depth inférieure au vaisseau
                
                // Étape 3: Déplacer la bombe vers le centre de l'écran avec dézoom
                this.tweens.add({
                    targets: bombSprite,
                    scale: 2,
                    y: this.game.config.height / 2,
                    duration: 1200,
                    ease: 'Power1',
                    onComplete: () => {
                        // Supprimer le sprite de la bombe
                        bombSprite.destroy();
                        
                        // Étape 4: Créer les explosions aléatoires
                        this.createRandomExplosions(() => {
                            // Étape 5: Retour du vaisseau à sa position normale
                            this.tweens.add({
                                targets: this.player.shipGroup,
                                scale: originalScale,
                                y: originalY,
                                x: originalX,
                                duration: 1000,
                                ease: 'Power2',
                                onComplete: () => {
                                    // Animation terminée et réactiver les collisions
                                    this.bombAnimationInProgress = false;
                                    this.collisionsDisabled = false;
                                    
                                    // Maintenir la depth élevée du vaisseau pour qu'il reste au premier plan
                                    this.player.shipGroup.setDepth(1000);
                                    
                                    // Activer l'invincibilité pendant 1 seconde
                                    this.setPlayerInvincible(1000);
                                }
                            });
                        });
                        
                        // Appliquer des dégâts aux ennemis
                        if (this.enemyManager) {
                            const score = this.enemyManager.damageAllEnemies(50);
                            if (score > 0) {
                                this.updateScore(score);
                            }
                        }
                        
                        // Décrémenter le compteur de bombes
                        this.bombCount--;
                        this.updateBombDisplay();
                    }
                });
            }
        });
    }
    
    /**
     * Crée des explosions aléatoires sur l'écran
     * @param {Function} onComplete - Fonction à appeler une fois toutes les explosions terminées
     */
    createRandomExplosions(onComplete) {
        // Nombre d'explosions à créer
        const explosionCount = 12;
        let completedExplosions = 0;
        
        // Zone d'exclusion autour du vaisseau
        const safeZoneY = this.game.config.height - 120;
        
        // Fonction pour créer une explosion à une position aléatoire
        const createExplosion = (index) => {
            // Position aléatoire (éviter le bas de l'écran où se trouve le joueur)
            let x = Phaser.Math.Between(50, this.game.config.width - 50);
            let y = Phaser.Math.Between(50, safeZoneY);
            
            // Délai basé sur l'index
            const delay = index * 100;
            
            // Créer l'explosion après le délai
            this.time.delayedCall(delay, () => {
                const explosion = this.add.sprite(x, y, 'bomb_explosion');
                explosion.setScale(Phaser.Math.FloatBetween(1.0, 2.0));
                explosion.setDepth(6); // Depth plus élevée que la bombe mais inférieure au vaisseau
                
                // Jouer l'animation
                explosion.play('bomb_explode');
                
                // Une fois l'animation terminée
                explosion.on('animationcomplete', () => {
                    // Supprimer le sprite
                    explosion.destroy();
                    
                    // Incrémenter le compteur
                    completedExplosions++;
                    
                    // Si toutes les explosions sont terminées, appeler la fonction de rappel
                    if (completedExplosions >= explosionCount && onComplete) {
                        onComplete();
                    }
                });
            });
        };
        
        // Créer toutes les explosions
        for (let i = 0; i < explosionCount; i++) {
            createExplosion(i);
        }
    }

    /**
     * Rend le joueur invincible pendant la durée spécifiée avec effet visuel de clignotement
     * @param {number} duration - Durée de l'invincibilité en millisecondes
     */
    setPlayerInvincible(duration) {
        if (this.player && this.player.shipGroup) {
            // Activer l'état d'invincibilité
            this.playerInvincible = true;
            
            // Créer l'effet de clignotement
            const blinkTween = this.tweens.add({
                targets: this.player.shipGroup,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: Math.floor(duration / 200), // Répéter pour la durée complète
                ease: 'Linear'
            });
            
            // Créer le timer pour désactiver l'invincibilité
            this.invincibilityTimer = this.time.delayedCall(duration, () => {
                // Désactiver l'invincibilité
                this.playerInvincible = false;
                
                // S'assurer que l'alpha est revenu à 1
                this.player.shipGroup.alpha = 1;
                
                // Arrêter le clignotement si encore actif
                if (blinkTween && blinkTween.isPlaying()) {
                    blinkTween.stop();
                    this.player.shipGroup.alpha = 1;
                }
                
                this.invincibilityTimer = null;
            }, null, this);
        }
    }

    /**
     * Active le bonus x2 pour une durée donnée
     * @param {number} duration - Durée en millisecondes
     */
    activateBonusX2(duration) {
        // Activer le multiplicateur
        this.scoreMultiplier = 2;
        this.bonusX2Active = true;
        this.bonusX2EndTime = this.time.now + duration;
        
        // Appliquer immédiatement la couleur jaune au score
        this.updateScoreColor();
        
        // Créer le texte du bonus x2
        this.bonusX2Text = this.add.text(
            this.game.config.width / 2,
            this.game.config.height - 50,
            'SCORE x2!',
            this.getGameFontStyle(20, '#FFD700')
        ).setOrigin(0.5);
        
        // Animation pulsante du texte
        this.tweens.add({
            targets: this.bonusX2Text,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * Met à jour le status du bonus x2
     * @param {number} time - Temps actuel
     */
    updateBonusX2(time) {
        if (this.bonusX2Active && time >= this.bonusX2EndTime) {
            this.clearBonusX2Effects();
        }
    }
    


    clearBonusX2Effects() {
        // S'assurer que le multiplicateur de score est réinitialisé si ce n'est pas déjà fait
        this.scoreMultiplier = 1;
        this.bonusX2Active = false;
        
        // Supprimer le texte du bonus x2
        if (this.bonusX2Text) {
            this.bonusX2Text.destroy();
            this.bonusX2Text = null;
        }
        
        // Remettre la couleur normale du score
        this.updateScoreColor();
    }

    /**
     * Crée un flash de toute la fenêtre lors d'un powerup d'arme
     * @param {boolean} isMaxLevel - Si true, flash jaune (niveau max atteint), sinon flash vert
     */
    createWeaponPowerupEffect(isMaxLevel = false) {
        // Choisir la couleur selon le niveau
        const flashColor = isMaxLevel ? 0xFFD700 : 0x00FF00; // Jaune ou vert
        this.createPowerupFlash(flashColor);
    }

    /**
     * Crée un flash de couleur spécifique pour les powerups
     * @param {string} colorName - Nom de la couleur ('red', 'yellow', 'purple', etc.)
     */
    createPowerupFlashEffect(colorName) {
        let flashColor;
        
        switch (colorName) {
            case 'red':
                flashColor = 0xFF0000;
                break;
            case 'yellow':
                flashColor = 0xFFD700;
                break;
            case 'purple':
                flashColor = 0x8A2BE2;
                break;
            case 'green':
                flashColor = 0x00FF00;
                break;
            default:
                flashColor = 0xFFFFFF; // Blanc par défaut
                break;
        }
        
        this.createPowerupFlash(flashColor);
    }

    /**
     * Crée un flash de toute la fenêtre avec la couleur spécifiée
     * @param {number} flashColor - Couleur hexadécimale du flash
     */
    createPowerupFlash(flashColor) {
        // Créer un rectangle qui couvre toute la fenêtre
        const flashOverlay = this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            flashColor,
            0.5
        );
        
        // Mettre au premier plan
        flashOverlay.setDepth(2000);
        
        // Animation de flash : apparition rapide puis disparition plus lente
        this.tweens.add({
            targets: flashOverlay,
            alpha: { from: 0.5, to: 0 },
            duration: 1000, // 1 seconde
            ease: 'Power2',
            onComplete: () => {
                flashOverlay.destroy();
            }
        });
        
        // Effet de pulsation supplémentaire pour plus d'impact
        this.tweens.add({
            targets: flashOverlay,
            scale: { from: 1, to: 1.08 },
            duration: 500,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    destroy() {
        // Nettoyer l'effet de glow
        this.clearBonusX2Effects();
        
        // Appeler la méthode destroy de CollisionManager pour nettoyer les ressources
        if (this.collisionManager) {
            this.collisionManager.destroy();
            this.collisionManager = null;
        }
        
        // Détruire le compteur d'ennemis
        if (this.enemyCounter) {
            this.enemyCounter.destroy();
            this.enemyCounter = null;
        }
        
        // Autres nettoyages potentiels de la scène...
    }

    /**
     * Gère les collisions avec le joueur (perte d'une vie)
     */
    handlePlayerHit() {
        if (this.gameOver || this.playerInvincible) return;
        

        
        // Perdre une vie
        this.lives--;
        this.updateLifeDisplay();
        
        // Réinitialiser les powerups d'armes du joueur
        this.resetPlayerWeapons();
        
        // Effet de secousse de la caméra pendant 1 seconde
        this.cameras.main.shake(1000, 0.015);
        
        // Créer une petite explosion sur le joueur
        if (this.player && this.player.shipGroup) {
            const explosion = this.add.sprite(this.player.shipGroup.x, this.player.shipGroup.y, 'explosion');
            explosion.setScale(1.5);
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
        }
        
        // Vérifier si c'est game over
        if (this.lives <= 0) {
            this.handleGameOver();
        } else {
            // Activer l'invincibilité temporaire avec clignotement (2 secondes)
            this.setPlayerInvincible(2000);
        }
    }
    
    /**
     * Réinitialise les powerups d'armes du joueur
     */
    resetPlayerWeapons() {
        if (this.player) {
            this.player.shootLevel = 1; // Remettre au niveau de base
        }
    }
    
    /**
     * Crée l'affichage graphique du compteur de vies
     */
    createLifeDisplay() {
        // Nettoyer les icônes précédentes si elles existent
        this.lifeIcons.forEach(icon => icon.destroy());
        this.lifeIcons = [];
        
        // Déterminer l'asset du pilote selon le vaisseau sélectionné
        let pilotTextureKey;
        switch (this.selectedShip) {
            case 'spaceship1':
                pilotTextureKey = 'pilot1_life';
                break;
            case 'spaceship2':
                pilotTextureKey = 'pilot2_life';
                break;
            case 'spaceship3':
                pilotTextureKey = 'pilot3_life';
                break;
            default:
                pilotTextureKey = 'pilot1_life';
                break;
        }
        
        // Position de départ pour la première vie (en bas à droite, même ligne que les bombes)
        // Calculer la position de départ pour avoir les vies alignées à droite
        const endX = this.game.config.width - 30; // Position de la dernière vie
        const spacing = 37; // Espacement entre les vies (32px + 5px)
        const startX = endX - (this.maxLives - 1) * spacing; // Position de la première vie
        const startY = this.game.config.height - 30; // Même hauteur que les bombes
        
        // Afficher d'abord les vies disponibles (pilotes) de gauche à droite
        let iconIndex = 0;
        
        // D'abord afficher les vies disponibles (pilotes) de gauche à droite
        for (let i = 0; i < this.lives; i++) {
            const lifeIcon = this.add.image(startX + iconIndex * spacing, startY, pilotTextureKey);
            lifeIcon.setScale(0.25); // Réduire de 128x128 à 32x32
            lifeIcon.setOrigin(0.5);
            this.lifeIcons.push(lifeIcon);
            iconIndex++;
        }
        
        // Ensuite afficher les vies vides
        for (let i = this.lives; i < this.maxLives; i++) {
            const lifeIcon = this.add.image(startX + iconIndex * spacing, startY, 'pilot_life_empty');
            lifeIcon.setScale(0.25); // Réduire de 128x128 à 32x32
            lifeIcon.setOrigin(0.5);
            this.lifeIcons.push(lifeIcon);
            iconIndex++;
        }
    }
    
    /**
     * Met à jour l'affichage du compteur de vies
     */
    updateLifeDisplay() {
        // Simplement recréer l'affichage pour maintenir l'ordre correct
        this.createLifeDisplay();
    }

    /**
     * Gère la victoire contre le boss final
     */
    handleBossVictory() {
        if (this.gameOver) return;
        
        // Marquer la partie comme terminée
        this.gameOver = true;
        
        // Arrêter les mises à jour et nettoyer
        if (this.enemyManager) {
            this.enemyManager.reset();
            this.enemyManager = null; // Mettre à null pour éviter les erreurs
        }
        if (this.asteroidManager) {
            this.asteroidManager.reset();
        }
        if (this.powerupManager) {
            this.powerupManager.reset();
        }
        
        // Nettoyer les effets bonus X2
        this.clearBonusX2Effects();
        
        // Utiliser le score réellement affiché à l'écran (this.score contient le score correct)
        const currentScore = this.score;
        
        // Calculer le score final avec le multiplicateur d'étoiles
        const starMultiplier = 1 + (this.stars * 0.1); // 1 étoile = x1.1, 2 étoiles = x1.2, etc.
        const finalScore = Math.floor(currentScore * starMultiplier);
        
        // Obtenir les dimensions du jeu
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // Position Y de départ pour l'affichage
        let currentY = 120;
        
        // Afficher le message de victoire avec les mêmes effets que "Leaderboard"
        const victoryText = this.add.text(
            gameWidth / 2,
            currentY,
            'YOU WIN!',
            this.getGameFontStyle(48, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Appliquer un effet de dégradé intérieur jaune-rouge au texte
        victoryText.setTint(0xffff00, 0xffff00, 0xff0000, 0xff0000);
        
        // Ajouter un effet de scintillement au titre
        this.createTitleScintillation(victoryText);
        
        currentY += 80;
        
        // Affichage des étoiles ou "Zero star"
        if (this.stars === 0) {
            const zeroStarText = this.add.text(
                gameWidth / 2,
                currentY,
                'Zero star',
                this.getGameFontStyle(20, '#FFFFFF')
            ).setOrigin(0.5);
            currentY += 40;
            
            // Pas d'animation de score si aucune étoile
            const totalScoreText = this.add.text(
                gameWidth / 2,
                currentY,
                `Total score : ${finalScore.toLocaleString()}`,
                this.getGameFontStyle(24, '#FFD700')
            ).setOrigin(0.5);
            
            currentY += 60;
            this.handleHighScoreCheck(finalScore, gameWidth, currentY);
        } else {
            // Afficher les étoiles une par une avec effet de zoom
            this.displayStarsAnimated(currentY, gameWidth, (newY) => {
                currentY = newY;
                
                // Animer le score final avec un compteur qui défile
                this.animateScoreCounter(currentScore, finalScore, gameWidth, currentY, (finalY) => {
                    this.handleHighScoreCheck(finalScore, gameWidth, finalY + 60);
                });
            });
        }
    }
    
    /**
     * Crée un effet de scintillement pour le titre (copié de LeaderboardScene)
     * @param {Phaser.GameObjects.Text} textObject - L'objet texte à faire scintiller
     */
    createTitleScintillation(textObject) {
        // Sauvegarder les teintes originales pour pouvoir y revenir
        const originalTint1 = 0xffff00; // Jaune
        const originalTint2 = 0xff0000; // Rouge
        
        // Créer un effet de pulsation subtile
        this.tweens.add({
            targets: textObject,
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Créer un effet de scintillement aléatoire
        const scintillateText = () => {
            // Générer un point de scintillement aléatoire (une lettre aléatoire)
            const letterIndex = Phaser.Math.Between(0, textObject.text.length - 1);
            
            // Créer un effet de flash blanc pour une lettre spécifique
            textObject.setTint(
                letterIndex === 0 ? 0xffffff : originalTint1,
                letterIndex === 1 ? 0xffffff : originalTint1,
                letterIndex === 2 ? 0xffffff : originalTint2, 
                letterIndex === 3 ? 0xffffff : originalTint2
            );
            
            // Retour aux couleurs d'origine après un court délai
            this.time.delayedCall(100, () => {
                if (textObject && textObject.scene) {
                    textObject.setTint(originalTint1, originalTint1, originalTint2, originalTint2);
                    
                    // Planifier le prochain scintillement à intervalle aléatoire
                    this.time.delayedCall(Phaser.Math.Between(200, 800), scintillateText);
                }
            });
        };
        
        // Démarrer l'effet de scintillement
        scintillateText();
    }
    
    /**
     * Affiche les étoiles une par une avec effet de zoom
     */
    displayStarsAnimated(startY, gameWidth, onComplete) {
        let currentY = startY;
        
        // Créer le conteneur pour les étoiles
        const starsContainer = this.add.container(gameWidth / 2, currentY);
        
        // Configuration pour l'affichage multi-lignes
        const starsPerRow = 5;
        const starSpacing = 60;
        const rowSpacing = 70; // Espacement vertical entre les lignes
        
        // Calculer le nombre de lignes nécessaires
        const totalRows = Math.ceil(this.stars / starsPerRow);
        
        let starsDisplayed = 0;
        
        // Fonction pour afficher une étoile
        const displayNextStar = () => {
            if (starsDisplayed >= this.stars) {
                // Toutes les étoiles sont affichées
                // Ajuster currentY en fonction du nombre de lignes
                currentY += (totalRows - 1) * rowSpacing + 60;
                onComplete(currentY);
                return;
            }
            
            // Calculer la position de cette étoile
            const currentRow = Math.floor(starsDisplayed / starsPerRow);
            const positionInRow = starsDisplayed % starsPerRow;
            const starsInThisRow = Math.min(starsPerRow, this.stars - (currentRow * starsPerRow));
            
            // Calculer la position X pour centrer les étoiles de cette ligne
            const rowWidth = (starsInThisRow - 1) * starSpacing;
            const startXForRow = -rowWidth / 2;
            const starX = startXForRow + (positionInRow * starSpacing);
            
            // Calculer la position Y
            const starY = currentRow * rowSpacing;
            
            // Créer l'étoile (invisible au début)
            const star = this.add.image(starX, starY, 'star').setScale(0).setAlpha(0);
            starsContainer.add(star);
            
            // Animation de zoom et apparition
            this.tweens.add({
                targets: star,
                scale: { from: 0, to: 2 },
                alpha: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Passer à l'étoile suivante après un court délai
                    starsDisplayed++;
                    this.time.delayedCall(300, displayNextStar);
                }
            });
        };
        
        // Commencer l'affichage des étoiles
        displayNextStar();
    }
    
    /**
     * Anime le score final avec un compteur qui défile
     */
    animateScoreCounter(startScore, endScore, gameWidth, currentY, onComplete) {
        // Créer le texte du score total
        const totalScoreText = this.add.text(
            gameWidth / 2,
            currentY,
            `Total score : ${startScore.toLocaleString()}`,
            this.getGameFontStyle(24, '#FFD700')
        ).setOrigin(0.5);
        
        // Animer le compteur de score
        let currentDisplayScore = startScore;
        const scoreDifference = endScore - startScore;
        const animationDuration = 2000; // 2 secondes
        const steps = 60; // 60 étapes pour une animation fluide
        const scoreIncrement = scoreDifference / steps;
        const stepDuration = animationDuration / steps;
        
        let step = 0;
        
        const updateScore = () => {
            step++;
            currentDisplayScore = Math.floor(startScore + (scoreIncrement * step));
            
            // S'assurer qu'on ne dépasse pas le score final
            if (currentDisplayScore >= endScore) {
                currentDisplayScore = endScore;
            }
            
            // Mettre à jour le texte
            totalScoreText.setText(`Total score : ${currentDisplayScore.toLocaleString()}`);
            
            // Continuer l'animation ou terminer
            if (step < steps && currentDisplayScore < endScore) {
                this.time.delayedCall(stepDuration, updateScore);
            } else {
                // Animation terminée
                onComplete(currentY);
            }
        };
        
        // Démarrer l'animation après un court délai
        this.time.delayedCall(500, updateScore);
    }
    
    /**
     * Gère la vérification du high score et l'affichage des instructions
     */
    handleHighScoreCheck(finalScore, gameWidth, currentY) {
        // Vérifier si c'est un high score
        if (gameManager.isTopScore(finalScore)) {
            // Nouveau high score
            const highScoreText = this.add.text(
                gameWidth / 2,
                currentY,
                'NEW HIGH SCORE!',
                this.getGameFontStyle(28, '#FFD700')
            ).setOrigin(0.5);
            
            // Effet de clignotement
            this.tweens.add({
                targets: highScoreText,
                alpha: 0.3,
                duration: 600,
                yoyo: true,
                repeat: -1
            });
            
            currentY += 50;
            
            // Instructions pour saisir le nom (initialement grisées)
            const instructionText = this.add.text(
                gameWidth / 2,
                currentY,
                'Press SPACE to enter your name',
                this.getGameFontStyle(16, '#777777') // Texte grisé initialement
            ).setOrigin(0.5);
            
            // Désactiver la touche Espace pendant 2 secondes
            this.spaceKeyEnabled = false;
            
            // Activer la touche après 2 secondes
            this.time.delayedCall(2000, () => {
                // Changer la couleur du texte pour indiquer que la touche est active
                instructionText.setStyle(this.getGameFontStyle(16, '#FFFFFF'));
                
                // Effet de clignotement pour les instructions
                this.tweens.add({
                    targets: instructionText,
                    alpha: 0.3,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
                
                // Activer la touche Espace
                this.spaceKeyEnabled = true;
            });
            
            // Configurer la touche Espace
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.input.keyboard.on('keydown-SPACE', () => {
                // Vérifier si la touche est activée
                if (this.spaceKeyEnabled) {
                    this.cameras.main.fadeOut(500, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('NameEntryScene', { 
                            score: finalScore,
                            shipKey: this.selectedShip,
                            fromVictory: true
                        });
                    });
                }
            });
        } else {
            // Pas de high score - retour à l'écran titre
            const instructionText = this.add.text(
                gameWidth / 2,
                currentY,
                'Press SPACE to return to title',
                this.getGameFontStyle(16, '#777777') // Texte grisé initialement
            ).setOrigin(0.5);
            
            // Désactiver la touche Espace pendant 2 secondes
            this.spaceKeyEnabled = false;
            
            // Activer la touche après 2 secondes
            this.time.delayedCall(2000, () => {
                // Changer la couleur du texte pour indiquer que la touche est active
                instructionText.setStyle(this.getGameFontStyle(16, '#FFFFFF'));
                
                // Effet de clignotement pour les instructions
                this.tweens.add({
                    targets: instructionText,
                    alpha: 0.3,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
                
                // Activer la touche Espace
                this.spaceKeyEnabled = true;
            });
            
            // Timer automatique de 6 secondes (4 secondes après l'activation de la touche)
            this.time.delayedCall(6000, () => {
                this.returnToTitle();
            });
            
            // Configurer la touche Espace
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.input.keyboard.on('keydown-SPACE', () => {
                // Vérifier si la touche est activée
                if (this.spaceKeyEnabled) {
                    this.returnToTitle();
                }
            });
        }
    }
    
    /**
     * Affiche les étoiles collectées
     * @param {number} startY - Position Y de départ
     * @param {number} gameWidth - Largeur du jeu
     * @returns {number} - Nouvelle position Y après affichage
     */
    displayStars(startY, gameWidth) {
        const starSize = 32;
        const starSpacing = 4;
        const maxStarsPerRow = Math.floor((gameWidth - 40) / (starSize + starSpacing));
        
        let currentY = startY;
        let starsPlaced = 0;
        
        while (starsPlaced < this.stars) {
            const starsInThisRow = Math.min(maxStarsPerRow, this.stars - starsPlaced);
            const rowWidth = starsInThisRow * starSize + (starsInThisRow - 1) * starSpacing;
            const startX = (gameWidth - rowWidth) / 2;
            
            for (let i = 0; i < starsInThisRow; i++) {
                const starX = startX + i * (starSize + starSpacing) + starSize / 2;
                const star = this.add.image(starX, currentY + starSize / 2, 'star', 0);
                star.setScale(1); // Taille normale 32x32
                
                // Petit effet de scintillement aléatoire
                this.time.delayedCall(Phaser.Math.Between(0, 2000), () => {
                    this.tweens.add({
                        targets: star,
                        alpha: 0.5,
                        duration: 200,
                        yoyo: true,
                        repeat: 1
                    });
                });
                
                starsPlaced++;
            }
            
            currentY += starSize + 10; // Espacement entre les lignes
        }
        
        return currentY + 20; // Retourner la position Y pour le prochain élément
    }
    
    /**
     * Retourne à l'écran titre
     */
    returnToTitle() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ShipSelectionScene', { 
                lastSelectedShipKey: this.selectedShip 
            });
        });
    }
}

// Exporter la classe pour l'utiliser ailleurs
export default GameScene;