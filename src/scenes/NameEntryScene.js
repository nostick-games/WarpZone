import gameManager from '../Game.js';

class NameEntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NameEntryScene' });
        this.playerName = ['A', 'A', 'A'];
        this.currentLetterIndex = 0;
        this.score = 0;
        this.shipKey = 'spaceship1';
        this.fromVictory = false;
        this.nameTexts = [];
        this.blinkTimers = [];
    }

    init(data) {
        // Récupérer les données passées
        this.score = data.score || 0;
        this.shipKey = data.shipKey || 'spaceship1';
        this.fromVictory = data.fromVictory || false;
    }

    preload() {
        // Pas besoin de charger d'assets supplémentaires
    }

    create() {
        // Réinitialiser la sélection sur la première lettre à chaque fois
        this.currentLetterIndex = 0;
        
        // Fond noir
        this.add.rectangle(this.game.config.width / 2, this.game.config.height / 2, 
                          this.game.config.width, this.game.config.height, 0x000000);
        
        // Titre "CONGRATS!"
        const congratsText = this.add.text(
            this.game.config.width / 2, 
            this.game.config.height / 2 - 100, 
            'CONGRATS!', 
            this.getGameFontStyle(48, '#FFD700')
        ).setOrigin(0.5);
        
        // Texte "Enter your name :"
        const enterNameText = this.add.text(
            this.game.config.width / 2, 
            this.game.config.height / 2 - 40, 
            'Enter your name :', 
            this.getGameFontStyle(24, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Créer l'affichage du nom avec les 3 lettres
        this.createNameDisplay();
        
        // Instructions
        const instructionText = this.add.text(
            this.game.config.width / 2, 
            this.game.config.height / 2 + 80, 
            'Use A-Z keys to change letters\nPress ENTER to confirm', 
            this.getGameFontStyle(16, '#AAAAAA')
        ).setOrigin(0.5);
        
        // Configurer les contrôles
        this.setupControls();
        
        // Démarrer le clignotement de la première lettre
        this.startBlinking(0);
    }
    
    /**
     * Crée l'affichage du nom avec les 3 lettres
     */
    createNameDisplay() {
        const startX = this.game.config.width / 2 - 60; // Centrer les 3 lettres
        const y = this.game.config.height / 2 + 20;
        const letterSpacing = 60;
        
        // Nettoyer les anciens textes s'ils existent
        this.nameTexts.forEach(text => text.destroy());
        this.nameTexts = [];
        
        // Créer les 3 lettres
        for (let i = 0; i < 3; i++) {
            const letterText = this.add.text(
                startX + (i * letterSpacing), 
                y, 
                this.playerName[i], 
                this.getGameFontStyle(36, '#FFFFFF')
            ).setOrigin(0.5);
            
            this.nameTexts.push(letterText);
        }
    }
    
    /**
     * Configure les contrôles clavier
     */
    setupControls() {
        // Écouter toutes les touches A-Z
        for (let i = 65; i <= 90; i++) { // Codes ASCII de A à Z
            const key = this.input.keyboard.addKey(i);
            key.on('down', () => {
                const letter = String.fromCharCode(i);
                this.setCurrentLetter(letter);
            });
        }
        
        // Touches fléchées pour naviguer
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cursors.left.on('down', () => this.moveCursor(-1));
        this.cursors.right.on('down', () => this.moveCursor(1));
        
        // Touche Entrée pour confirmer
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => this.confirmName());
    }
    
    /**
     * Définit la lettre courante
     * @param {string} letter - La lettre à définir
     */
    setCurrentLetter(letter) {
        this.playerName[this.currentLetterIndex] = letter;
        this.nameTexts[this.currentLetterIndex].setText(letter);
        
        // Passer à la lettre suivante automatiquement
        if (this.currentLetterIndex < 2) {
            this.moveCursor(1);
        }
    }
    
    /**
     * Déplace le curseur
     * @param {number} direction - Direction du mouvement (-1 ou 1)
     */
    moveCursor(direction) {
        // Arrêter le clignotement de la lettre actuelle
        this.stopBlinking(this.currentLetterIndex);
        
        // Changer l'index
        this.currentLetterIndex += direction;
        
        // Limiter l'index entre 0 et 2
        if (this.currentLetterIndex < 0) {
            this.currentLetterIndex = 0;
        } else if (this.currentLetterIndex > 2) {
            this.currentLetterIndex = 2;
        }
        
        // Démarrer le clignotement de la nouvelle lettre
        this.startBlinking(this.currentLetterIndex);
    }
    
    /**
     * Démarre le clignotement d'une lettre
     * @param {number} index - Index de la lettre
     */
    startBlinking(index) {
        if (this.blinkTimers[index]) {
            this.tweens.remove(this.blinkTimers[index]);
        }
        
        const letterText = this.nameTexts[index];
        
        this.blinkTimers[index] = this.tweens.add({
            targets: letterText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Arrête le clignotement d'une lettre
     * @param {number} index - Index de la lettre
     */
    stopBlinking(index) {
        if (this.blinkTimers[index]) {
            this.tweens.remove(this.blinkTimers[index]);
            this.blinkTimers[index] = null;
        }
        
        // Remettre l'alpha à 1
        if (this.nameTexts[index]) {
            this.nameTexts[index].setAlpha(1);
        }
    }
    
    /**
     * Confirme le nom et enregistre le score
     */
    confirmName() {
        // Arrêter tous les clignotements
        for (let i = 0; i < 3; i++) {
            this.stopBlinking(i);
        }
        
        // Construire le nom final
        const finalName = this.playerName.join('');
        
        // Enregistrer le score
        gameManager.addScore(finalName, this.score, this.shipKey);
        
        // Transition vers le leaderboard
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('LeaderboardScene', { 
                lastSelectedShipKey: this.shipKey,
                fromScene: this.fromVictory ? 'victory' : 'death'
            });
        });
    }
    
    /**
     * Nettoie la scène
     */
    destroy() {
        // Arrêter tous les timers de clignotement
        this.blinkTimers.forEach(timer => {
            if (timer) {
                this.tweens.remove(timer);
            }
        });
        this.blinkTimers = [];
        
        super.destroy();
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

export default NameEntryScene; 