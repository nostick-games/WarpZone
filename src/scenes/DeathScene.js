import gameManager from '../Game.js';

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
        this.selectedShipKey = '';
        this.baseScore = 0;
        this.starsEarned = 0;
        this.finalScore = 0;
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
        // Récupérer les données depuis GameScene
        this.selectedShipKey = data.selectedShipKey || 'spaceship1';
        this.baseScore = data.baseScore || 0;
        this.starsEarned = data.starsEarned || 0;
        
        // Calculer le score final avec le multiplicateur d'étoiles
        this.calculateFinalScore();
    }

    preload() {
        // Charger les assets spécifiques à la scène de mort
        this.load.image('death_spaceship1', 'assets/spaceship/death_spaceship1.png');
        this.load.image('death_spaceship2', 'assets/spaceship/death_spaceship2.png');
        this.load.image('death_spaceship3', 'assets/spaceship/death_spaceship3.png');
        
        // Charger le spritesheet des étoiles
        this.load.spritesheet('star', 'assets/items/star.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        // Nettoyer immédiatement les effets CSS du bonus x2 qui pourraient persister
        this.clearBonusX2CSSEffects();
        
        // Obtenir les dimensions du jeu
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;

        // Fondu depuis le noir
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Afficher le vaisseau détruit au centre avec une animation
        this.showDestroyedShip(gameWidth, gameHeight);

        // Attendre plus longtemps pour laisser le temps de voir l'animation du vaisseau détruit
        this.time.delayedCall(4000, () => {
            this.showGameOverUI(gameWidth, gameHeight);
        });
    }

    showDestroyedShip(gameWidth, gameHeight) {
        // Déterminer l'asset du vaisseau en fonction de selectedShipKey
        let deathShipTextureKey;
        if (this.selectedShipKey === 'spaceship1') {
            deathShipTextureKey = 'death_spaceship1';
        } else if (this.selectedShipKey === 'spaceship2') {
            deathShipTextureKey = 'death_spaceship2';
        } else if (this.selectedShipKey === 'spaceship3') {
            deathShipTextureKey = 'death_spaceship3';
        } else {
            deathShipTextureKey = 'death_spaceship1';
        }

        // Afficher le vaisseau détruit au centre avec une animation
        this.deathShipImage = this.add.image(gameWidth / 2, gameHeight / 2, deathShipTextureKey);
        this.deathShipImage.setScale(2);
        this.deathShipImage.setAlpha(1); // Commencer visible
        
        // Animation de clignotement dramatique
        this.tweens.add({
            targets: this.deathShipImage,
            alpha: { from: 1, to: 0.3 },
            duration: 400,
            yoyo: true,
            repeat: 3, // Clignote 4 fois au total
            ease: 'Power2',
            onComplete: () => {
                // Après le clignotement, faire disparaître progressivement
                this.tweens.add({
                    targets: this.deathShipImage,
                    alpha: 0.1, // Devient très transparent pour servir d'arrière-plan
                    duration: 1000,
                    ease: 'Power2'
                });
            }
        });
    }

    showGameOverUI(gameWidth, gameHeight) {
        let currentY = 80;

        // 1. Titre "GAME OVER" avec dégradé rouge vers bordeaux
        const gameOverText = this.add.text(
            gameWidth / 2,
            currentY,
            'GAME OVER',
            this.getGameFontStyle(42, '#FFFFFF')
        ).setOrigin(0.5);
        
        // Appliquer un dégradé rouge vers bordeaux
        gameOverText.setTint(0xFF0000, 0xFF0000, 0x800000, 0x800000);
        
        currentY += 80;

        // 2. Score de base
        const scoreText = this.add.text(
            gameWidth / 2,
            currentY,
            `Score : ${this.baseScore.toLocaleString()}`,
            this.getGameFontStyle(24, '#FFFFFF')
        ).setOrigin(0.5);
        
        currentY += 50;

        // 3. Affichage des étoiles ou "Zero star"
        if (this.starsEarned === 0) {
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
                `Total score : ${this.finalScore.toLocaleString()}`,
                this.getGameFontStyle(24, '#FFD700')
            ).setOrigin(0.5);
            
            currentY += 60;
            this.handleHighScoreCheck(gameWidth, currentY);
        } else {
            // Afficher les étoiles une par une avec effet de zoom
            this.displayStarsAnimated(currentY, gameWidth, (newY) => {
                currentY = newY;
                
                // Animer le score final avec un compteur qui défile
                this.animateScoreCounter(this.baseScore, this.finalScore, gameWidth, currentY, (finalY) => {
                    this.handleHighScoreCheck(gameWidth, finalY + 60);
                });
            });
        }
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
        const totalRows = Math.ceil(this.starsEarned / starsPerRow);
        
        let starsDisplayed = 0;
        
        // Fonction pour afficher une étoile
        const displayNextStar = () => {
            if (starsDisplayed >= this.starsEarned) {
                // Toutes les étoiles sont affichées
                // Ajuster currentY en fonction du nombre de lignes
                currentY += (totalRows - 1) * rowSpacing + 60;
                onComplete(currentY);
                return;
            }
            
            // Calculer la position de cette étoile
            const currentRow = Math.floor(starsDisplayed / starsPerRow);
            const positionInRow = starsDisplayed % starsPerRow;
            const starsInThisRow = Math.min(starsPerRow, this.starsEarned - (currentRow * starsPerRow));
            
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
    handleHighScoreCheck(gameWidth, currentY) {
        // Vérifier si c'est un high score
        if (gameManager.isTopScore(this.finalScore)) {
            // Nouveau high score
            const highScoreText = this.add.text(
                gameWidth / 2,
                currentY,
                'High-score !',
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
            
            // Instructions pour saisir le nom
            const instructionText = this.add.text(
                gameWidth / 2,
                currentY,
                'Press SPACE to enter your name',
                this.getGameFontStyle(16, '#FFFFFF')
            ).setOrigin(0.5);
            
            // Effet de clignotement pour les instructions
            this.tweens.add({
                targets: instructionText,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            
            // Activer l'entrée pour aller à la saisie du nom
            this.input.keyboard.on('keydown-SPACE', () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('NameEntryScene', { 
                        score: this.finalScore,
                        shipKey: this.selectedShipKey,
                        fromVictory: false
                    });
                });
            });
        } else {
            // Pas de high score - retour à l'écran titre
            const instructionText = this.add.text(
                gameWidth / 2,
                currentY,
                'Press SPACE to return to title',
                this.getGameFontStyle(16, '#FFFFFF')
            ).setOrigin(0.5);
            
            // Effet de clignotement pour les instructions
            this.tweens.add({
                targets: instructionText,
                alpha: 0.3,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            
            // Timer automatique de 4 secondes
            this.time.delayedCall(4000, () => {
                this.returnToTitle();
            });
            
            // Ou appui sur SPACE
            this.input.keyboard.on('keydown-SPACE', () => {
                this.returnToTitle();
            });
        }
    }

    calculateFinalScore() {
        if (this.starsEarned === 0) {
            this.finalScore = this.baseScore;
        } else {
            // Multiplicateur : 1 étoile = x1.1, 2 étoiles = x1.2, etc.
            const multiplier = 1 + (this.starsEarned * 0.1);
            this.finalScore = Math.round(this.baseScore * multiplier);
        }
    }

    returnToTitle() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }

    /**
     * Nettoie les effets CSS du bonus x2 qui pourraient persister
     */
    clearBonusX2CSSEffects() {
        try {
            const gameCanvas = this.sys.game.canvas;
            if (gameCanvas) {
                gameCanvas.style.boxShadow = 'none';
                gameCanvas.style.transition = '';
            }
        } catch (error) {
            // Erreur silencieuse
        }
    }
}

export default DeathScene; 