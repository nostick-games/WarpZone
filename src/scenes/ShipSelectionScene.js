class ShipSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipSelectionScene' });
        this.selectedShipIndex = 1; // Par défaut Stardasher (index 1)
        this.inactivityTimer = null; // Timer pour l'inactivité
        this.ships = [
            { 
                key: 'spaceship2', 
                name: 'VOIDBLADE', 
                description: 'Diagonal shots',
                pilotName: 'Kael Orin',
                pilotImage: 'spaceship2_pilot',
                stats: {
                    speed: 2,
                    power: 2,
                    fireRate: 2
                }
            },
            { 
                key: 'spaceship1', 
                name: 'STARDASHER', 
                description: 'Triple shot forward',
                pilotName: 'Kaara Veyl',
                pilotImage: 'spaceship1_pilot',
                stats: {
                    speed: 3,
                    power: 1,
                    fireRate: 3
                }
            },
            { 
                key: 'spaceship3', 
                name: 'PLASMAGHOST', 
                description: 'Backward shots',
                pilotName: 'Gor\'Nath',
                pilotImage: 'spaceship3_pilot',
                stats: {
                    speed: 1,
                    power: 3,
                    fireRate: 1
                }
            }
        ];
        this.shipsReady = false;
        this.shipInfoTexts = [];
    }

    // Ajouter la méthode init pour récupérer le vaisseau précédemment sélectionné
    init(data) {
        // Si nous avons une information sur le dernier vaisseau sélectionné
        if (data && data.lastSelectedShipKey) {
            // Trouver l'index correspondant à la clé du vaisseau
            for (let i = 0; i < this.ships.length; i++) {
                if (this.ships[i].key === data.lastSelectedShipKey) {
                    this.selectedShipIndex = i;
                    break;
                }
            }
        }
    }

    preload() {
        // Chargement de l'image de fond
        this.load.image('splashscreen', 'assets/items/splashscreen.png');
        
        // Chargement des spritesheets des vaisseaux (uniquement idle)
        this.load.spritesheet('spaceship1_idle', 'assets/spaceship/spaceship1_idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship2_idle', 'assets/spaceship/spaceship2_idle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spaceship3_idle', 'assets/spaceship/spaceship3_idle.png', { frameWidth: 32, frameHeight: 32 });
        
        // Chargement du spritesheet des flammes
        this.load.spritesheet('flamme_spaceship', 'assets/spaceship/flamme_spaceship.png', { frameWidth: 16, frameHeight: 16 });
        
        // Chargement des images des pilotes
        this.load.image('spaceship1_pilot', 'assets/spaceship/spaceship1_pilot.png');
        this.load.image('spaceship2_pilot', 'assets/spaceship/spaceship2_pilot.png');
        this.load.image('spaceship3_pilot', 'assets/spaceship/spaceship3_pilot.png');
    }

    create() {
        // Fond d'écran - splashscreen
        this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'splashscreen').setOrigin(0.5);
        
        // Initialiser le tableau des fiches d'informations des vaisseaux
        this.shipInfoTexts = [];
        
        // Créer animation pour les flammes
        this.anims.create({
            key: 'flamme_anim',
            frames: this.anims.generateFrameNumbers('flamme_spaceship', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Créer les animations idle pour chaque vaisseau
        for (let i = 0; i < this.ships.length; i++) {
            const ship = this.ships[i];
            
            // Animation idle pour le sprite (seulement 1 frame pour idle)
            this.anims.create({
                key: ship.key + '_idle_anim',
                frames: this.anims.generateFrameNumbers(ship.key + '_idle', { start: 0, end: 0 }),
                frameRate: 5,
                repeat: 0
            });
        }
        
        // Démarrer la séquence d'animations d'entrée des vaisseaux
        this.startShipsEntryAnimation();
        
        // Input - désactivé jusqu'à ce que les animations soient terminées
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Ajouter une touche pour activer le mode test du boss (touche T)
        this.testBossKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    }
    
    startShipsEntryAnimation() {
        // Positions finales des vaisseaux
        const topY = 150;
        const centerX = this.game.config.width / 2;
        const spacing = 100;
        
        // Créer et animer le premier vaisseau (depuis le bas) - Stardasher (milieu)
        const ship1 = this.add.sprite(centerX, this.game.config.height + 50, 'spaceship1_idle').setScale(5);
        ship1.play('spaceship1_idle_anim');
        
        // Flamme pour le premier vaisseau - positionnée 41 pixels plus bas (26+15)
        const flame1 = this.add.sprite(centerX, this.game.config.height + 50 + 41, 'flamme_spaceship').setScale(5);
        flame1.setOrigin(0.5, 0);
        flame1.play('flamme_anim');
        
        // Animer le premier vaisseau vers le haut
        this.tweens.add({
            targets: [ship1, flame1],
            y: function (target) {
                // Si c'est la flamme, positionner 41 pixels plus bas que le vaisseau
                return target === flame1 ? topY + 41 : topY;
            },
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Zoom à la fin du mouvement
                this.tweens.add({
                    targets: [ship1, flame1],
                    scale: 2,
                    duration: 300,
                    ease: 'Quad.easeOut'
                });
            }
        });
        
        // Créer et animer le deuxième vaisseau (depuis la droite) - Voidblade (gauche)
        const ship2 = this.add.sprite(this.game.config.width + 50, topY, 'spaceship2_idle').setScale(5);
        ship2.play('spaceship2_idle_anim');
        
        // Flamme pour le deuxième vaisseau - positionnée 41 pixels plus bas
        const flame2 = this.add.sprite(this.game.config.width + 50, topY + 41, 'flamme_spaceship').setScale(5);
        flame2.setOrigin(0.5, 0);
        flame2.play('flamme_anim');
        
        // Animer le deuxième vaisseau de droite à gauche
        this.tweens.add({
            targets: [ship2, flame2],
            x: centerX - spacing,
            duration: 800,
            delay: 300, // Décalage pour entrée séquentielle
            ease: 'Back.easeOut',
            onComplete: () => {
                // Zoom à la fin du mouvement
                this.tweens.add({
                    targets: [ship2, flame2],
                    scale: 2,
                    duration: 300,
                    ease: 'Quad.easeOut'
                });
            }
        });
        
        // Créer et animer le troisième vaisseau (depuis la gauche) - PlasmaGhost (droite)
        const ship3 = this.add.sprite(-50, topY, 'spaceship3_idle').setScale(5);
        ship3.play('spaceship3_idle_anim');
        
        // Flamme pour le troisième vaisseau - positionnée 41 pixels plus bas
        const flame3 = this.add.sprite(-50, topY + 41, 'flamme_spaceship').setScale(5);
        flame3.setOrigin(0.5, 0);
        flame3.play('flamme_anim');
        
        // Animer le troisième vaisseau de gauche à droite
        this.tweens.add({
            targets: [ship3, flame3],
            x: centerX + spacing,
            duration: 800,
            delay: 600, // Décalage supplémentaire
            ease: 'Back.easeOut',
            onComplete: () => {
                // Zoom à la fin du mouvement
                this.tweens.add({
                    targets: [ship3, flame3],
                    scale: 2,
                    duration: 300,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Une fois les animations terminées, afficher l'interface de sélection
                        this.showSelectionInterface(ship1, ship2, ship3, flame1, flame2, flame3);
                    }
                });
            }
        });
    }
    
    showSelectionInterface(ship1, ship2, ship3, flame1, flame2, flame3) {
        // Stocker les références des vaisseaux dans l'ordre visuel : Voidblade, Stardasher, PlasmaGhost
        this.shipSprites = [ship2, ship1, ship3]; // ship2 = Voidblade, ship1 = Stardasher, ship3 = PlasmaGhost
        this.flameSprites = [flame2, flame1, flame3];
        
        // Titre WarpZone avec dégradé intérieur du jaune vers le rouge
        // Utiliser une taille de police plus grande sans scale
        const titleText = this.add.text(
            this.game.config.width / 2, 
            60, 
            'WarpZone', 
            this.getGameFontStyle(72, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Appliquer un effet de dégradé intérieur jaune-rouge au texte
        titleText.setTint(0xffff00, 0xffff00, 0xff0000, 0xff0000);
        
        // Ajouter un effet de scintillement au titre
        this.createTitleScintillation(titleText);
        
        // Créer les informations pour chaque vaisseau
        this.createShipInfoDisplays();
        
        // Instructions - position plus basse et taille de police plus grande
        const instructionText = this.add.text(
            this.game.config.width / 2, 
            this.game.config.height - 40, // Descendu de 20 pixels supplémentaires
            'Select your ship\nPress SPACE to start', 
            this.getGameFontStyle(24, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Effet de clignotement pour les instructions
        this.tweens.add({
            targets: instructionText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Activer les inputs
        this.input.keyboard.on('keydown-LEFT', this.selectPreviousShip, this);
        this.input.keyboard.on('keydown-RIGHT', this.selectNextShip, this);
        this.input.keyboard.on('keydown-SPACE', this.startGame, this);
        
        // Marquer que les vaisseaux sont prêts pour la sélection
        this.shipsReady = true;
        
        // Appliquer l'effet de sélection sur le vaisseau du milieu (Stardasher)
        this.updateShipSelection();
        
        // Démarrer le timer de 4 secondes pour aller au leaderboard
        this.startInactivityTimer();
    }
    
    /**
     * Crée un effet de scintillement pour le titre
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
                textObject.setTint(originalTint1, originalTint1, originalTint2, originalTint2);
                
                // Planifier le prochain scintillement à intervalle aléatoire
                this.time.delayedCall(Phaser.Math.Between(200, 800), scintillateText);
            });
        };
        
        // Démarrer l'effet de scintillement
        scintillateText();
    }
    
    /**
     * Crée l'affichage des informations pour chaque vaisseau
     */
    createShipInfoDisplays() {
        // Nettoyer les anciennes fiches d'informations si elles existent
        if (this.shipInfoTexts && this.shipInfoTexts.length > 0) {
            this.shipInfoTexts.forEach(shipInfo => {
                if (shipInfo) {
                    shipInfo.destroy();
                }
            });
            this.shipInfoTexts = [];
        }
        
        // Position de base pour les informations
        const baseY = 250;
        const centerX = this.game.config.width / 2;
        
        // Pour chaque vaisseau, créer l'affichage des informations
        for (let i = 0; i < this.ships.length; i++) {
            const ship = this.ships[i];
            
            // Créer un conteneur pour tous les éléments de ce vaisseau
            // Toutes les fiches sont créées au centre de l'écran
            const shipInfo = this.add.container(centerX, baseY);
            
            // Nom du vaisseau
            const nameText = this.add.text(0, 0, ship.name, this.getGameFontStyle(24, '#FFFFFF'))
                .setOrigin(0.5, 0);
            shipInfo.add(nameText);
            
            // Jauges de capacités
            const statsY = 40;
            const statLabels = ['Speed', 'Power', 'Fire Rate'];
            const statKeys = ['speed', 'power', 'fireRate'];
            
            for (let j = 0; j < statLabels.length; j++) {
                // Label de la stat - augmenter l'espace entre le texte et la barre
                const label = this.add.text(-130, statsY + j * 20, statLabels[j], this.getGameFontStyle(14, '#AAAAAA', 'left'))
                    .setOrigin(0, 0.5);
                shipInfo.add(label);
                
                // Arrière-plan de la jauge (gris)
                const barBg = this.add.rectangle(0, statsY + j * 20, 100, 12, 0x444444)
                    .setOrigin(0.5, 0.5);
                shipInfo.add(barBg);
                
                // Valeur de la stat (jaune-orange)
                const statValue = ship.stats[statKeys[j]];
                const barFill = this.add.rectangle(-50 + (statValue * 33)/2, statsY + j * 20, statValue * 33, 12, 0xFFA500)
                    .setOrigin(0.5, 0.5);
                shipInfo.add(barFill);
                
                // Suppression de l'indicateur textuel de la valeur (ex: 2/3)
            }
            
            // Image du pilote
            const pilotY = statsY + 3 * 20 + 20;
            const pilotImage = this.add.image(-32, pilotY + 32, ship.pilotImage)
                .setOrigin(0.5, 0.5)
                .setScale(64/128); // Mise à l'échelle pour 64x64
            shipInfo.add(pilotImage);
            
            // Nom du pilote
            const pilotText = this.add.text(0, pilotY + 32, `Pilot: ${ship.pilotName}`, this.getGameFontStyle(16, '#FFFFFF', 'left'))
                .setOrigin(0, 0.5);
            shipInfo.add(pilotText);
            
            // Ajouter le conteneur à la liste pour pouvoir le manipuler plus tard
            this.shipInfoTexts.push(shipInfo);
            
            // Cacher toutes les infos sauf celle du vaisseau sélectionné initialement
            if (i !== this.selectedShipIndex) {
                shipInfo.setAlpha(0);
            }
        }
    }
    
    updateShipSelection() {
        // Mettre à jour l'apparence de tous les vaisseaux
        for (let i = 0; i < this.shipSprites.length; i++) {
            const isSelected = i === this.selectedShipIndex;
            const shipSprite = this.shipSprites[i];
            const flameSprite = this.flameSprites[i];
            
            // Annuler toutes les animations en cours
            this.tweens.killTweensOf(shipSprite);
            this.tweens.killTweensOf(flameSprite);
            
            if (isSelected) {
                // Vaisseau sélectionné: couleur normale et zoom x1.3
                shipSprite.clearTint();
                flameSprite.clearTint();
                
                // Animation de zoom pour le vaisseau sélectionné
                this.tweens.add({
                    targets: [shipSprite, flameSprite],
                    scale: 2.6, // 2 * 1.3 = 2.6
                    duration: 300,
                    ease: 'Bounce.Out'
                });
                
                // Afficher les informations du vaisseau sélectionné
                if (this.shipInfoTexts[i]) {
                    this.tweens.add({
                        targets: this.shipInfoTexts[i],
                        alpha: 1,
                        duration: 300
                    });
                }
            } else {
                // Vaisseaux non sélectionnés: teinte grise (monochrome)
                shipSprite.setTint(0x888888);
                flameSprite.setTint(0x888888);
                
                // Remettre à l'échelle normale
                this.tweens.add({
                    targets: [shipSprite, flameSprite],
                    scale: 2,
                    duration: 300,
                    ease: 'Quad.easeOut'
                });
                
                // Cacher les informations des vaisseaux non sélectionnés
                if (this.shipInfoTexts[i]) {
                    this.tweens.add({
                        targets: this.shipInfoTexts[i],
                        alpha: 0,
                        duration: 300
                    });
                }
            }
        }
    }
    
    update() {
        // Vérifier si la touche de test du boss a été pressée
        if (Phaser.Input.Keyboard.JustDown(this.testBossKey)) {
            // Afficher un message indiquant que le mode test est activé
            this.showTestBossMessage();
        }
    }
    
    selectPreviousShip() {
        if (!this.shipsReady) return;
        
        this.selectedShipIndex--;
        if (this.selectedShipIndex < 0) {
            this.selectedShipIndex = this.ships.length - 1;
        }
        
        // Mettre à jour l'affichage des vaisseaux
        this.updateShipSelection();
        
        // Redémarrer le timer d'inactivité
        this.resetInactivityTimer();
    }
    
    selectNextShip() {
        if (!this.shipsReady) return;
        
        this.selectedShipIndex++;
        if (this.selectedShipIndex >= this.ships.length) {
            this.selectedShipIndex = 0;
        }
        
        // Mettre à jour l'affichage des vaisseaux
        this.updateShipSelection();
        
        // Redémarrer le timer d'inactivité
        this.resetInactivityTimer();
    }
    
    startGame() {
        if (!this.shipsReady) return;
        
        // Arrêter le timer d'inactivité
        this.stopInactivityTimer();
        
        // Stocker le vaisseau sélectionné dans le registre de données global
        this.registry.set('selectedShip', this.ships[this.selectedShipIndex].key);
        
        // Le mode test est déjà défini dans le registre si activé
        
        // Transition avec fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Aller à la scène du jeu
            this.scene.start('GameScene');
        });
    }

    /**
     * Démarre le timer d'inactivité de 4 secondes
     */
    startInactivityTimer() {
        this.inactivityTimer = this.time.delayedCall(4000, () => {
            // Aller au leaderboard après 4 secondes d'inactivité
            this.goToLeaderboard();
        });
    }
    
    /**
     * Redémarre le timer d'inactivité
     */
    resetInactivityTimer() {
        this.stopInactivityTimer();
        this.startInactivityTimer();
    }
    
    /**
     * Arrête le timer d'inactivité
     */
    stopInactivityTimer() {
        if (this.inactivityTimer) {
            this.inactivityTimer.destroy();
            this.inactivityTimer = null;
        }
    }
    
    /**
     * Va au leaderboard
     */
    goToLeaderboard() {
        // Transition avec fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Aller au leaderboard
            this.scene.start('LeaderboardScene', { 
                lastSelectedShipKey: this.ships[this.selectedShipIndex].key,
                fromScene: 'ShipSelectionScene'
            });
        });
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

    // Méthode pour afficher un message temporaire indiquant que le mode test est activé
    showTestBossMessage() {
        // Supprimer le message existant s'il y en a un
        if (this.testBossMessage) {
            this.testBossMessage.destroy();
        }
        
        // Créer un nouveau message
        this.testBossMessage = this.add.text(
            this.game.config.width / 2,
            this.game.config.height - 40,
            'MODE TEST BOSS ACTIVÉ',
            {
                fontFamily: 'Electrolize',
                fontSize: '18px',
                color: '#FF0000',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        // Activer le mode test dans le registre
        this.registry.set('testBossMode', true);
        
        // Faire clignoter le message
        this.tweens.add({
            targets: this.testBossMessage,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                if (this.testBossMessage) {
                    this.testBossMessage.destroy();
                    this.testBossMessage = null;
                }
            }
        });
    }
}

export default ShipSelectionScene;