import { AudioManager } from '../audio/index.js';

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.audioManager = null;
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

    preload() {
        // Chargement de l'image de fond
        this.load.image('splashscreen', 'assets/items/splashscreen.png');
        
        // Initialiser le gestionnaire audio
        this.audioManager = new AudioManager(this);
        
        // Précharger les ressources audio
        this.audioManager.preloadAudio(this);
    }

    create() {
        // Fond d'écran - splashscreen
        this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'splashscreen').setOrigin(0.5);
        
        // Jouer la musique de fond
        this.audioManager.playMusic('background', {
            volume: 0.7,
            loop: true,
            fadeIn: true
        });
        
        // Transition automatique après un court délai
        this.time.delayedCall(1000, () => {
            this.startGame();
        });
    }
    
    startGame() {
        // Transition vers la scène de sélection de vaisseau
        // L'AudioManager est automatiquement passé aux scènes suivantes
        // car les musiques sont gérées globalement via le système sonore de Phaser
        this.scene.start('ShipSelectionScene');
    }
}

export default TitleScene;