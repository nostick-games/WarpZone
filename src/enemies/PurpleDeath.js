/**
 * Classe pour l'ennemi PurpleDeath qui traverse l'écran en diagonal
 * Apparaît à partir du niveau de difficulté 3
 */
class PurpleDeath {
    constructor(scene, x, y, direction = 'left') {
        
        this.scene = scene;
        this.active = true;
        this.direction = direction; // 'left' ou 'right'
        
        // Créer le sprite principal avec le spritesheet
        try {
            this.sprite = scene.add.sprite(x, y, 'purpledeath');
            this.sprite.setScale(1.0);
            
            // Jouer l'animation
            if (scene.anims.exists('purpledeath_fly')) {
                this.sprite.play('purpledeath_fly');
            }
            
        } catch (error) {
            // Erreur silencieuse
        }
        
        // Propriétés
        this.health = 40;
        this.baseSpeed = 2.5;
        this.scoreValue = 400; // Vaut beaucoup de points car difficile à toucher
        
        // Calculer la vitesse et la rotation selon la direction
        this.calculateMovement();
    }
    
    calculateMovement() {
        if (this.direction === 'left') {
            // Mouvement de gauche vers droite en descendant à +30 degrés
            const angle = 30 * Math.PI / 180; // +30° pour descendre vers la droite
            this.speedX = Math.cos(angle) * this.baseSpeed;
            this.speedY = Math.sin(angle) * this.baseSpeed;
            

            
            // Rotation du sprite : le sprite par défaut pointe vers le bas (90°)
            // Pour qu'il pointe vers 30°, on applique : 30° - 90° = -60°
            const spriteRotation = angle - Math.PI/2; // 30° - 90° = -60°
            this.sprite.setRotation(spriteRotation);
        } else {
            // Mouvement de droite vers gauche en descendant à +150 degrés
            const angle = 150 * Math.PI / 180; // 150° pour descendre vers la gauche
            this.speedX = Math.cos(angle) * this.baseSpeed;
            this.speedY = Math.sin(angle) * this.baseSpeed;
            

            
            // Rotation du sprite : le sprite par défaut pointe vers le bas (90°)
            // Pour qu'il pointe vers 150°, on applique : 150° - 90° = 60°
            const spriteRotation = angle - Math.PI/2; // 150° - 90° = 60°
            this.sprite.setRotation(spriteRotation);
        }
    }
    
    update(time) {
        if (!this.active) {
            return;
        }
        
        // Mouvement diagonal
        this.sprite.x += this.speedX;
        this.sprite.y += this.speedY;
        
        // Vérifier si l'ennemi est sorti de l'écran (avec une marge)
        const margin = 100;
        if (this.sprite.x < -margin || 
            this.sprite.x > this.scene.game.config.width + margin ||
            this.sprite.y > this.scene.game.config.height + margin) {
            this.destroy();
        }
    }
    
    /**
     * Applique des dégâts à l'ennemi
     * @param {number} damage - Quantité de dégâts à infliger
     * @returns {boolean} - Vrai si l'ennemi est détruit
     */
    hit(damage) {
        this.health -= damage;
        
        // Effet visuel quand l'ennemi est touché
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });
        
        // Si l'ennemi n'a plus de points de vie
        if (this.health <= 0 && this.active) {
            // Créer une explosion à la position du sprite
            const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'explosion');
            explosion.setScale(1.5); // Plus grosse explosion
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Désactiver et détruire
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    /**
     * Méthode pour obtenir les bounds du sprite pour les collisions
     * @returns {Phaser.Geom.Rectangle} - Rectangle de collision
     */
    getBounds() {
        if (this.sprite) {
            return this.sprite.getBounds();
        }
        return null;
    }
    
    destroy() {
        this.active = false;
        
        // Détruire le sprite
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}

// Export pour les modules ES
export default PurpleDeath;

// Compatibilité avec le chargement global
if (typeof window !== 'undefined') {
    window.PurpleDeath = PurpleDeath;
} 