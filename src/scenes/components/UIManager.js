/**
 * Gestionnaire d'Interface Utilisateur pour GameScene
 * Gère l'affichage et la mise à jour des éléments UI (score, vies, bombes, étoiles)
 */
class UIManager {
    constructor(scene) {
        this.scene = scene;
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

    /**
     * Met à jour le score avec les effets visuels appropriés
     * @param {number} points - Points à ajouter au score
     */
    updateScore(points) {
        // Appliquer le multiplicateur si le bonus x2 est actif
        const finalPoints = points * this.scene.scoreMultiplier;
        
        // Mettre à jour le score
        this.scene.score += finalPoints;
        
        // Mettre à jour le texte du score (seulement le chiffre)
        this.scene.scoreText.setText(`${this.scene.score}`);
        
        // Maintenir la couleur jaune si le bonus x2 est actif
        this.updateScoreColor();
        
        // Effet de flash sur le texte du score (plus intense si bonus x2)
        this.scene.tweens.add({
            targets: this.scene.scoreText,
            scale: this.scene.scoreMultiplier > 1 ? 1.4 : 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // Remettre la couleur appropriée après l'animation
                this.updateScoreColor();
            }
        });
        
        // Si bonus x2 actif, effet de couleur dorée temporaire en plus
        if (this.scene.scoreMultiplier > 1) {
            this.scene.tweens.add({
                targets: this.scene.scoreText,
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
        if (this.scene.bonusX2Active || this.scene.scoreMultiplier > 1) {
            // Couleur jaune pendant le bonus x2
            this.scene.scoreText.setTint(0xFFD700);
        } else {
            // Couleur blanche normale
            this.scene.scoreText.clearTint();
        }
    }
    
    /**
     * Met à jour le compteur d'étoiles
     */
    updateStarCount() {
        this.scene.starText.setText(`x${this.scene.stars}`);
        
        // Effet de flash sur le texte des étoiles
        this.scene.tweens.add({
            targets: this.scene.starText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    /**
     * Crée l'affichage des vies avec les icônes de pilotes appropriées
     */
    createLifeDisplay() {
        // Nettoyer les icônes précédentes si elles existent
        this.scene.lifeIcons.forEach(icon => icon.destroy());
        this.scene.lifeIcons = [];
        
        // Déterminer l'asset du pilote selon le vaisseau sélectionné
        let pilotTextureKey;
        switch (this.scene.selectedShip) {
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
        const endX = this.scene.game.config.width - 30; // Position de la dernière vie
        const spacing = 37; // Espacement entre les vies (32px + 5px)
        const startX = endX - (this.scene.maxLives - 1) * spacing; // Position de la première vie
        const startY = this.scene.game.config.height - 30; // Même hauteur que les bombes
        
        // Afficher d'abord les vies disponibles (pilotes) de gauche à droite
        let iconIndex = 0;
        
        // D'abord afficher les vies disponibles (pilotes) de gauche à droite
        for (let i = 0; i < this.scene.lives; i++) {
            const lifeIcon = this.scene.add.image(startX + iconIndex * spacing, startY, pilotTextureKey);
            lifeIcon.setScale(0.25); // Réduire de 128x128 à 32x32
            lifeIcon.setOrigin(0.5);
            this.scene.lifeIcons.push(lifeIcon);
            iconIndex++;
        }
        
        // Ensuite afficher les vies vides
        for (let i = this.scene.lives; i < this.scene.maxLives; i++) {
            const lifeIcon = this.scene.add.image(startX + iconIndex * spacing, startY, 'pilot_life_empty');
            lifeIcon.setScale(0.25); // Réduire de 128x128 à 32x32
            lifeIcon.setOrigin(0.5);
            this.scene.lifeIcons.push(lifeIcon);
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
     * Crée l'affichage des bombes disponibles
     */
    createBombDisplay() {
        // Nettoyer les icônes précédentes si elles existent
        this.scene.bombIcons.forEach(icon => icon.destroy());
        this.scene.bombIcons = [];
        
        // Position de départ pour la première bombe (en bas à gauche)
        const startX = 30;
        const startY = this.scene.game.config.height - 30;
        const spacing = 24; // Espacement entre les bombes
        
        // Créer les icônes pour chaque emplacement de bombe
        for (let i = 0; i < this.scene.maxBombs; i++) {
            // Choisir l'image selon si la bombe est disponible ou non
            const textureKey = i < this.scene.bombCount ? 'bomb' : 'bomb_empty';
            
            // Créer le sprite
            const bombIcon = this.scene.add.image(startX + i * spacing, startY, textureKey);
            bombIcon.setScale(2); // Scale x2
            bombIcon.setOrigin(0.5);
            
            // Ajouter au tableau pour pouvoir les mettre à jour plus tard
            this.scene.bombIcons.push(bombIcon);
        }
    }
    
    /**
     * Met à jour l'affichage du compteur de bombes
     */
    updateBombDisplay() {
        for (let i = 0; i < this.scene.maxBombs; i++) {
            // Mettre à jour la texture selon l'état actuel
            const textureKey = i < this.scene.bombCount ? 'bomb' : 'bomb_empty';
            this.scene.bombIcons[i].setTexture(textureKey);
        }
    }
}

export default UIManager; 