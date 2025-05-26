import gameManager from '../Game.js';

class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
        this.leaderboardData = [];
    }

    init(data) {
        // Récupérer les données passées depuis d'autres scènes
        this.fromScene = data.fromScene || 'ShipSelectionScene';
        this.lastSelectedShipKey = data.lastSelectedShipKey || 'spaceship1';
    }

    preload() {
        // Chargement de l'image de fond
        this.load.image('splashscreen', 'assets/items/splashscreen.png');
        
        // Chargement des images des pilotes
        this.load.image('spaceship1_pilot', 'assets/spaceship/spaceship1_pilot.png');
        this.load.image('spaceship2_pilot', 'assets/spaceship/spaceship2_pilot.png');
        this.load.image('spaceship3_pilot', 'assets/spaceship/spaceship3_pilot.png');
    }

    create() {
        // Fond d'écran - splashscreen
        this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'splashscreen').setOrigin(0.5);
        
        // Récupérer les données du leaderboard
        this.leaderboardData = gameManager.getLeaderboard();
        
        // Titre "Leaderboard" avec le même style que "WarpZone"
        const titleText = this.add.text(
            this.game.config.width / 2, 
            60, 
            'Leaderboard', 
            this.getGameFontStyle(42, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Appliquer un effet de dégradé intérieur jaune-rouge au texte
        titleText.setTint(0xffff00, 0xffff00, 0xff0000, 0xff0000);
        
        // Ajouter un effet de scintillement au titre
        this.createTitleScintillation(titleText);
        
        // Afficher les scores
        this.displayLeaderboard();
        
        // Instructions en bas
        const instructionText = this.add.text(
            this.game.config.width / 2, 
            this.game.config.height - 40, 
            'Press SPACE to return', 
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
        
        // Activer l'entrée pour la barre d'espace
        this.input.keyboard.on('keydown-SPACE', this.returnToMenu, this);
    }
    
    /**
     * Affiche la liste des scores
     */
    displayLeaderboard() {
        const startY = 140;
        const lineHeight = 45;
        
        // Si aucun score enregistré
        if (this.leaderboardData.length === 0) {
            const noScoreText = this.add.text(
                this.game.config.width / 2,
                this.game.config.height / 2,
                'No scores yet!\nPlay to set a record!',
                this.getGameFontStyle(24, '#AAAAAA')
            ).setOrigin(0.5);
            return;
        }
        
        // Afficher chaque score
        for (let i = 0; i < Math.min(10, this.leaderboardData.length); i++) {
            const scoreData = this.leaderboardData[i];
            const y = startY + (i * lineHeight);
            
            // Position du joueur (01, 02, etc.)
            const position = (i + 1).toString().padStart(2, '0');
            const positionText = this.add.text(
                30, 
                y, 
                position, 
                this.getGameFontStyle(20, '#FFFFFF')
            ).setOrigin(0, 0.5);
            
            // Image du pilote
            const pilotImageKey = gameManager.getPilotImageKey(scoreData.ship);
            const pilotImage = this.add.image(80, y, pilotImageKey)
                .setOrigin(0.5, 0.5)
                .setScale(32/128); // Mise à l'échelle pour 32x32
            
            // Nom du joueur (3 lettres)
            const nameText = this.add.text(
                120, 
                y, 
                scoreData.name, 
                this.getGameFontStyle(20, '#FFFFFF')
            ).setOrigin(0, 0.5);
            
            // Score
            const scoreText = this.add.text(
                this.game.config.width - 30, 
                y, 
                scoreData.score.toLocaleString(), 
                this.getGameFontStyle(20, '#FFFFFF')
            ).setOrigin(1, 0.5);
            
            // Effet de couleur spécial pour les 3 premiers (tous en jaune)
            if (i <= 2) {
                // 1ère, 2ème et 3ème place - Jaune
                positionText.setTint(0xFFD700);
                nameText.setTint(0xFFD700);
                scoreText.setTint(0xFFD700);
            }
            // Les positions 4-10 restent en blanc (couleur par défaut)
        }
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
     * Retourne au menu principal
     */
    returnToMenu() {
        // Transition avec fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Retourner à la scène de sélection des vaisseaux
            this.scene.start('ShipSelectionScene', { 
                lastSelectedShipKey: this.lastSelectedShipKey 
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
}

export default LeaderboardScene; 