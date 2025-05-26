class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
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
    }

    create() {
        // Fond d'écran - splashscreen
        this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'splashscreen').setOrigin(0.5);
        
        // Transition automatique après un court délai
        this.time.delayedCall(1000, () => {
            this.startGame();
        });
    }
    
    startGame() {
        // Transition vers la scène de sélection de vaisseau
        this.scene.start('ShipSelectionScene');
    }
}

export default TitleScene;