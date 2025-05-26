/**
 * Gestionnaire d'Effets Visuels pour GameScene
 * Gère tous les effets visuels : fond étoilé, flash, invincibilité, bonus, animations
 */
class EffectsManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Crée le fond étoilé animé
     */
    createStarfield() {
        // Créer le fond noir
        this.scene.add.rectangle(0, 0, this.scene.game.config.width, this.scene.game.config.height, 0x000022).setOrigin(0);
        
        // Créer les conteneurs pour les étoiles
        this.scene.nearStars = this.scene.add.container(0, 0);
        this.scene.farStars = this.scene.add.container(0, 0);
        
        // Générer des étoiles lointaines (petites et lentes)
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.scene.game.config.width);
            const y = Phaser.Math.Between(0, this.scene.game.config.height);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.6);
            
            const star = this.scene.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.scene.farStars.add(star);
        }
        
        // Générer des étoiles proches (plus grandes et rapides)
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, this.scene.game.config.width);
            const y = Phaser.Math.Between(0, this.scene.game.config.height);
            const size = Phaser.Math.Between(2, 3);
            const alpha = Phaser.Math.FloatBetween(0.7, 1);
            
            const star = this.scene.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.scene.nearStars.add(star);
        }
        
        // Vitesses de scrolling
        this.scene.farStarsSpeed = 0.5;
        this.scene.nearStarsSpeed = 2;
    }
    
    /**
     * Met à jour le fond étoilé animé
     */
    updateStarfield() {
        // Mettre à jour les étoiles lointaines
        this.scene.farStars.each(star => {
            star.y += this.scene.farStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.scene.game.config.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.scene.game.config.width);
            }
        });
        
        // Mettre à jour les étoiles proches
        this.scene.nearStars.each(star => {
            star.y += this.scene.nearStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.scene.game.config.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.scene.game.config.width);
            }
        });
    }

    /**
     * Rend le joueur invincible pendant la durée spécifiée avec effet visuel de clignotement
     * @param {number} duration - Durée de l'invincibilité en millisecondes
     */
    setPlayerInvincible(duration) {
        if (this.scene.player && this.scene.player.shipGroup) {
            // Activer l'état d'invincibilité
            this.scene.playerInvincible = true;
            
            // Créer l'effet de clignotement
            const blinkTween = this.scene.tweens.add({
                targets: this.scene.player.shipGroup,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: Math.floor(duration / 200), // Répéter pour la durée complète
                ease: 'Linear'
            });
            
            // Créer le timer pour désactiver l'invincibilité
            this.scene.invincibilityTimer = this.scene.time.delayedCall(duration, () => {
                // Désactiver l'invincibilité
                this.scene.playerInvincible = false;
                
                // S'assurer que l'alpha est revenu à 1
                this.scene.player.shipGroup.alpha = 1;
                
                // Arrêter le clignotement si encore actif
                if (blinkTween && blinkTween.isPlaying()) {
                    blinkTween.stop();
                    this.scene.player.shipGroup.alpha = 1;
                }
                
                this.scene.invincibilityTimer = null;
            }, null, this.scene);
        }
    }

    /**
     * Active le bonus x2 pour une durée donnée
     * @param {number} duration - Durée en millisecondes
     */
    activateBonusX2(duration) {
        // Activer le multiplicateur
        this.scene.scoreMultiplier = 2;
        this.scene.bonusX2Active = true;
        this.scene.bonusX2EndTime = this.scene.time.now + duration;
        
        // Appliquer immédiatement la couleur jaune au score
        this.scene.uiManager.updateScoreColor();
        
        // Créer le texte du bonus x2
        this.scene.bonusX2Text = this.scene.add.text(
            this.scene.game.config.width / 2,
            this.scene.game.config.height - 50,
            'SCORE x2!',
            this.scene.uiManager.getGameFontStyle(20, '#FFD700')
        ).setOrigin(0.5);
        
        // Animation pulsante du texte
        this.scene.tweens.add({
            targets: this.scene.bonusX2Text,
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
        if (this.scene.bonusX2Active && time >= this.scene.bonusX2EndTime) {
            this.clearBonusX2Effects();
        }
    }
    
    /**
     * Nettoie les effets du bonus x2
     */
    clearBonusX2Effects() {
        // S'assurer que le multiplicateur de score est réinitialisé si ce n'est pas déjà fait
        this.scene.scoreMultiplier = 1;
        this.scene.bonusX2Active = false;
        
        // Supprimer le texte du bonus x2
        if (this.scene.bonusX2Text) {
            this.scene.bonusX2Text.destroy();
            this.scene.bonusX2Text = null;
        }
        
        // Remettre la couleur normale du score
        this.scene.uiManager.updateScoreColor();
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
        const flashOverlay = this.scene.add.rectangle(
            this.scene.game.config.width / 2,
            this.scene.game.config.height / 2,
            this.scene.game.config.width,
            this.scene.game.config.height,
            flashColor,
            0.5
        );
        
        // Mettre au premier plan
        flashOverlay.setDepth(2000);
        
        // Animation de flash : apparition rapide puis disparition plus lente
        this.scene.tweens.add({
            targets: flashOverlay,
            alpha: { from: 0.5, to: 0 },
            duration: 1000, // 1 seconde
            ease: 'Power2',
            onComplete: () => {
                flashOverlay.destroy();
            }
        });
        
        // Effet de pulsation supplémentaire pour plus d'impact
        this.scene.tweens.add({
            targets: flashOverlay,
            scale: { from: 1, to: 1.08 },
            duration: 500,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Crée un effet de scintillement pour le titre (utilisé dans la victoire)
     * @param {Phaser.GameObjects.Text} textObject - L'objet texte à faire scintiller
     */
    createTitleScintillation(textObject) {
        // Sauvegarder les teintes originales pour pouvoir y revenir
        const originalTint1 = 0xffff00; // Jaune
        const originalTint2 = 0xff0000; // Rouge
        
        // Créer un effet de pulsation subtile
        this.scene.tweens.add({
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
            this.scene.time.delayedCall(100, () => {
                if (textObject && textObject.scene) {
                    textObject.setTint(originalTint1, originalTint1, originalTint2, originalTint2);
                    
                    // Planifier le prochain scintillement à intervalle aléatoire
                    this.scene.time.delayedCall(Phaser.Math.Between(200, 800), scintillateText);
                }
            });
        };
        
        // Démarrer l'effet de scintillement
        scintillateText();
    }

    /**
     * Affiche les étoiles une par une avec effet de zoom (pour la victoire)
     * @param {number} startY - Position Y de départ
     * @param {number} gameWidth - Largeur du jeu
     * @param {Function} onComplete - Callback à appeler une fois terminé
     */
    displayStarsAnimated(startY, gameWidth, onComplete) {
        let currentY = startY;
        
        // Créer le conteneur pour les étoiles
        const starsContainer = this.scene.add.container(gameWidth / 2, currentY);
        
        // Configuration pour l'affichage multi-lignes
        const starsPerRow = 5;
        const starSpacing = 60;
        const rowSpacing = 70; // Espacement vertical entre les lignes
        
        // Calculer le nombre de lignes nécessaires
        const totalRows = Math.ceil(this.scene.stars / starsPerRow);
        
        let starsDisplayed = 0;
        
        // Fonction pour afficher une étoile
        const displayNextStar = () => {
            if (starsDisplayed >= this.scene.stars) {
                // Toutes les étoiles sont affichées
                // Ajuster currentY en fonction du nombre de lignes
                currentY += (totalRows - 1) * rowSpacing + 60;
                onComplete(currentY);
                return;
            }
            
            // Calculer la position de cette étoile
            const currentRow = Math.floor(starsDisplayed / starsPerRow);
            const positionInRow = starsDisplayed % starsPerRow;
            const starsInThisRow = Math.min(starsPerRow, this.scene.stars - (currentRow * starsPerRow));
            
            // Calculer la position X pour centrer les étoiles de cette ligne
            const rowWidth = (starsInThisRow - 1) * starSpacing;
            const startXForRow = -rowWidth / 2;
            const starX = startXForRow + (positionInRow * starSpacing);
            
            // Calculer la position Y
            const starY = currentRow * rowSpacing;
            
            // Créer l'étoile (invisible au début)
            const star = this.scene.add.image(starX, starY, 'star').setScale(0).setAlpha(0);
            starsContainer.add(star);
            
            // Animation de zoom et apparition
            this.scene.tweens.add({
                targets: star,
                scale: { from: 0, to: 2 },
                alpha: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Passer à l'étoile suivante après un court délai
                    starsDisplayed++;
                    this.scene.time.delayedCall(300, displayNextStar);
                }
            });
        };
        
        // Commencer l'affichage des étoiles
        displayNextStar();
    }

    /**
     * Anime le score final avec un compteur qui défile (pour la victoire)
     * @param {number} startScore - Score de départ
     * @param {number} endScore - Score final
     * @param {number} gameWidth - Largeur du jeu
     * @param {number} currentY - Position Y actuelle
     * @param {Function} onComplete - Callback à appeler une fois terminé
     */
    animateScoreCounter(startScore, endScore, gameWidth, currentY, onComplete) {
        // Créer le texte du score total
        const totalScoreText = this.scene.add.text(
            gameWidth / 2,
            currentY,
            `Total score : ${startScore.toLocaleString()}`,
            this.scene.uiManager.getGameFontStyle(24, '#FFD700')
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
                this.scene.time.delayedCall(stepDuration, updateScore);
            } else {
                // Animation terminée
                onComplete(currentY);
            }
        };
        
        // Démarrer l'animation après un court délai
        this.scene.time.delayedCall(500, updateScore);
    }
}

export default EffectsManager; 