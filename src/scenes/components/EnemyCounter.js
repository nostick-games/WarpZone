/**
 * Gestionnaire du compteur d'ennemis et de la jauge arc-en-ciel
 * Gère l'octroi de vies supplémentaires et le bonus de score x3
 */
class EnemyCounter {
    constructor(scene) {
        this.scene = scene;
        
        // Compteur d'ennemis détruits
        this.enemiesKilled = 0;
        this.enemiesNeededForLife = 50;
        
        // Dimensions de la jauge
        this.gaugeWidth = 360; // Largeur de la fenêtre de jeu
        this.gaugeHeight = 3;
        this.gaugeY = scene.game.config.height - 5; // En bas de l'écran
        
        // Jauge visuelle
        this.gaugeGraphics = null;
        
        // Bonus x3 (quand on a déjà 5 vies)
        this.bonusX3Active = false;
        this.bonusX3EndTime = 0;
        this.bonusX3Duration = 10000; // 10 secondes
        this.bonusX3Text = null;
        this.bonusX3Glow = null;
        
        this.createGauge();
        

    }
    

    
    /**
     * Crée la jauge arc-en-ciel en bas de l'écran
     */
    createGauge() {
        // Créer un objet graphique pour la jauge
        this.gaugeGraphics = this.scene.add.graphics();
        this.updateGaugeDisplay();
    }
    
    /**
     * Met à jour l'affichage de la jauge arc-en-ciel
     */
    updateGaugeDisplay() {
        if (!this.gaugeGraphics) return;
        
        // Effacer le graphique précédent
        this.gaugeGraphics.clear();
        
        // Calculer la progression (0 à 1)
        const progress = this.enemiesKilled / this.enemiesNeededForLife;
        const filledWidth = Math.min(progress * this.gaugeWidth, this.gaugeWidth);
        
        // Dessiner la partie remplie avec des couleurs arc-en-ciel
        for (let x = 0; x < filledWidth; x++) {
            // Calculer la couleur HSL pour l'arc-en-ciel
            const hue = (x / this.gaugeWidth) * 360; // De 0 à 360 degrés
            const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
            const hexColor = Phaser.Display.Color.GetColor32(color.r, color.g, color.b, 255);
            
            // Dessiner une ligne verticale de 1 pixel de large
            this.gaugeGraphics.fillStyle(hexColor);
            this.gaugeGraphics.fillRect(x, this.gaugeY, 1, this.gaugeHeight);
        }
        
        // Dessiner la partie vide en gris foncé
        if (filledWidth < this.gaugeWidth) {
            this.gaugeGraphics.fillStyle(0x333333);
            this.gaugeGraphics.fillRect(filledWidth, this.gaugeY, this.gaugeWidth - filledWidth, this.gaugeHeight);
        }
    }
    
    /**
     * Incrémente le compteur d'ennemis détruits
     */
    addEnemyKill() {
        this.enemiesKilled++;
        
        // Mettre à jour la jauge
        this.updateGaugeDisplay();
        
        // Vérifier si on doit donner une récompense
        if (this.enemiesKilled >= this.enemiesNeededForLife) {
            this.checkReward();
        }
    }
    
    /**
     * Vérifie et applique la récompense (vie ou bonus x3)
     */
    checkReward() {
        // Remettre le compteur à zéro
        this.enemiesKilled = 0;
        
        // Vérifier si le joueur a déjà 5 vies
        if (this.scene.lives >= this.scene.maxLives) {
            // Donner le bonus x3 au score
            this.activateBonusX3();
        } else {
            // Donner une vie supplémentaire
            this.giveExtraLife();
        }
        
        // Mettre à jour la jauge (maintenant vide)
        this.updateGaugeDisplay();
    }
    
    /**
     * Donne une vie supplémentaire au joueur
     */
    giveExtraLife() {
        this.scene.lives++;
        this.scene.uiManager.updateLifeDisplay();
        
        // Créer le texte "1-UP!" avec le même style que les bonus
        const oneUpText = this.scene.add.text(
            this.scene.game.config.width / 2,
            this.scene.game.config.height - 50,
            '1-UP!',
            this.scene.uiManager.getGameFontStyle(20, '#00FF00') // Vert pour la vie supplémentaire
        ).setOrigin(0.5);
        
        // Animation pulsante du texte (même que les bonus)
        this.scene.tweens.add({
            targets: oneUpText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 3, // Pulse 4 fois au total (3 répétitions + 1 initial)
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Faire disparaître le texte après l'animation
                oneUpText.destroy();
            }
        });
    }
    
    /**
     * Active le bonus x3 au score pendant 10 secondes
     */
    activateBonusX3() {
        this.bonusX3Active = true;
        this.bonusX3EndTime = this.scene.time.now + this.bonusX3Duration;
        
        // Mettre à jour le multiplicateur de score (remplace temporairement le x2)
        const previousMultiplier = this.scene.scoreMultiplier;
        this.scene.scoreMultiplier = 3;
        
        // Appliquer immédiatement la couleur jaune au score
        this.scene.uiManager.updateScoreColor();
        
        // Flash jaune pour le bonus x3 (comme le bonus x2)
        this.scene.createPowerupFlashEffect('yellow');
        
        // Créer le texte du bonus
        this.bonusX3Text = this.scene.add.text(
            this.scene.game.config.width / 2,
            this.scene.game.config.height - 50,
            'SCORE x3!',
            this.scene.uiManager.getGameFontStyle(20, '#FFD700')
        ).setOrigin(0.5);
        
        // Animation pulsante du texte
        this.scene.tweens.add({
            targets: this.bonusX3Text,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Programmer la fin du bonus
        this.scene.time.delayedCall(this.bonusX3Duration, () => {
            this.deactivateBonusX3(previousMultiplier);
        });
    }
    
    /**
     * Désactive le bonus x3
     */
    deactivateBonusX3(previousMultiplier = 1) {
        this.bonusX3Active = false;
        
        // Restaurer le multiplicateur précédent
        this.scene.scoreMultiplier = previousMultiplier;
        
        // Mettre à jour la couleur du score
        this.scene.uiManager.updateScoreColor();
        
        // Utiliser le système de nettoyage du bonus x2 pour les effets visuels
        this.scene.clearBonusX2Effects();
        
        // Supprimer le texte spécifique au bonus x3
        if (this.bonusX3Text) {
            this.bonusX3Text.destroy();
            this.bonusX3Text = null;
        }
    }
    

    
    /**
     * Met à jour le système de bonus x3 (à appeler dans update)
     */
    update(time) {
        // Vérifier si le bonus x3 doit se terminer
        if (this.bonusX3Active && time >= this.bonusX3EndTime) {
            this.deactivateBonusX3();
        }
    }
    
    /**
     * Remet à zéro le compteur (pour un nouveau jeu)
     */
    reset() {
        this.enemiesKilled = 0;
        this.updateGaugeDisplay();
        
        // Désactiver le bonus x3 s'il est actif
        if (this.bonusX3Active) {
            this.deactivateBonusX3();
        }
        

    }
    
    /**
     * Détruit le composant
     */
    destroy() {
        if (this.gaugeGraphics) {
            this.gaugeGraphics.destroy();
        }
        
        // Désactiver le bonus x3 s'il est actif
        if (this.bonusX3Active) {
            this.deactivateBonusX3();
        }
    }
}

export default EnemyCounter; 