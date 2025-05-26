/**
 * Classe représentant un projectile ennemi lâché par un Saucer détruit
 */
class EnemyBullet {
    constructor(scene, x, y, velocityX, velocityY) {
        this.scene = scene;
        this.active = true;
        
        // Créer le sprite du projectile
        this.sprite = scene.add.sprite(x, y, 'bullet').setScale(2);
        
        // Propriétés de mouvement héritées du Saucer
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        
        // Propriétés du projectile
        this.damage = 1; // Dégâts infligés au joueur
        this.lifetime = 8000; // Durée de vie en millisecondes (8 secondes)
        this.creationTime = scene.time.now;
        
        // Démarrer l'animation si elle existe
        if (scene.anims.exists('bullet_anim')) {
            this.sprite.play('bullet_anim');
        }
        
        // Ajouter une référence à cet objet dans le sprite
        this.sprite.parentBullet = this;
    }
    
    /**
     * Met à jour le projectile (position, durée de vie)
     * @param {number} time - Temps actuel du jeu en millisecondes
     */
    update(time) {
        if (!this.active) return;
        
        // Calculer le delta depuis la dernière frame (approximation)
        const deltaSeconds = 1/60; // Approximation à 60 FPS
        
        // Mettre à jour la position en fonction de la vélocité
        this.sprite.x += this.velocityX * deltaSeconds;
        this.sprite.y += this.velocityY * deltaSeconds;
        
        // Vérifier si le projectile est sorti de l'écran
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        if (this.sprite.x < -20 || this.sprite.x > gameWidth + 20 || 
            this.sprite.y < -20 || this.sprite.y > gameHeight + 20) {
            this.destroy();
            return;
        }
        
        // Vérifier la durée de vie
        if (time - this.creationTime > this.lifetime) {
            this.destroy();
        }
    }
    
    /**
     * Détruit le projectile
     */
    destroy() {
        this.active = false;
        
        if (this.sprite && this.sprite.scene) {
            this.sprite.destroy();
        }
    }
    
    /**
     * Retourne les limites du projectile pour la détection de collision
     */
    getBounds() {
        if (!this.sprite || !this.active) return null;
        return this.sprite.getBounds();
    }
}

export default EnemyBullet; 