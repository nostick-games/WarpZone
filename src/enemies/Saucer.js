/**
 * Classe représentant l'ennemi Saucer - vaisseau avec mouvements erratiques
 */
class Saucer {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Créer le sprite de l'ennemi
        this.sprite = scene.physics.add.sprite(x, y, 'saucer').setScale(2);
        
        // Propriétés de l'ennemi
        this.health = 10; // Nécessite un projectilePower d'au moins 10 pour être détruit
        this.speed = 120; // Vitesse de déplacement de base
        this.active = true; // Indique si l'ennemi est actif
        
        // Paramètres de mouvement erratique
        this.directionChangeTime = 0;
        this.directionChangeDelay = Phaser.Math.Between(1000, 2000);
        this.horizontalDirection = Phaser.Math.Between(-1, 1);
        this.verticalSpeed = Phaser.Math.Between(50, 100);
        
        // Configuration de l'animation
        if (!scene.anims.exists('saucer_fly')) {
            scene.anims.create({
                key: 'saucer_fly',
                frames: scene.anims.generateFrameNumbers('saucer', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Jouer l'animation seulement si elle existe
        try {
            if (scene.anims.exists('saucer_fly') && this.sprite.texture.frameTotal > 1) {
                this.sprite.play('saucer_fly');
            }
        } catch (error) {
            console.warn("Impossible de jouer l'animation saucer_fly:", error);
        }
        
        // Ajouter une référence à cet objet dans le sprite pour faciliter l'accès
        this.sprite.parentEnemy = this;
    }
    
    /**
     * Précharge les assets nécessaires
     * @param {Phaser.Scene} scene - La scène dans laquelle précharger les assets
     */
    static preload(scene) {
        // Cette méthode ne fait plus rien car le chargement des assets
        // est maintenant géré dans GameScene.preload()
    }
    
    /**
     * Met à jour l'ennemi (position, comportement)
     * @param {number} time - Le temps actuel du jeu
     */
    update(time) {
        // Ne pas mettre à jour si l'ennemi n'est pas actif
        if (!this.active) return;
        
        // Vérifier s'il est temps de changer de direction
        if (time > this.directionChangeTime) {
            // Changer la direction horizontale aléatoirement
            this.horizontalDirection = Phaser.Math.FloatBetween(-1, 1);
            
            // Légère variation de la vitesse verticale
            this.verticalSpeed = Phaser.Math.Between(50, 100);
            
            // Définir le prochain changement de direction
            this.directionChangeDelay = Phaser.Math.Between(1000, 2000);
            this.directionChangeTime = time + this.directionChangeDelay;
        }
        
        // Mouvement erratique
        this.sprite.x += this.horizontalDirection * this.speed * (1/60);
        this.sprite.y += this.verticalSpeed * (1/60);
        
        // Maintenir l'ennemi dans les limites horizontales de l'écran
        const gameWidth = this.scene.game.config.width;
        if (this.sprite.x < 20) {
            this.sprite.x = 20;
            this.horizontalDirection *= -1; // Inverser la direction si on touche le bord
        } else if (this.sprite.x > gameWidth - 20) {
            this.sprite.x = gameWidth - 20;
            this.horizontalDirection *= -1; // Inverser la direction si on touche le bord
        }
        
        // Vérifier si l'ennemi est sorti de l'écran par le bas
        if (this.sprite.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
    }
    
    /**
     * Gère les dégâts infligés à l'ennemi
     * @param {number} damage - Montant des dégâts reçus
     * @returns {boolean} - True si l'ennemi est détruit, false sinon
     */
    hit(damage) {
        // Réduire la santé en fonction des dégâts reçus
        this.health -= damage;
        
        // Effet visuel quand touché
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });
        
        // Vérifier si l'ennemi est détruit
        if (this.health <= 0) {
            // Capturer la vélocité actuelle avant destruction pour le bullet
            const currentVelocityX = this.horizontalDirection * this.speed;
            const currentVelocityY = this.verticalSpeed;
            
            this.destroy(currentVelocityX, currentVelocityY);
            return true; // Indique que l'ennemi a été détruit
        }
        
        return false; // Indique que l'ennemi est encore en vie
    }
    
    /**
     * Détruit l'ennemi et crée un effet d'explosion
     * @param {number} velocityX - Vélocité horizontale au moment de la destruction (pour le bullet)
     * @param {number} velocityY - Vélocité verticale au moment de la destruction (pour le bullet)
     */
    destroy(velocityX = 0, velocityY = 0) {
        // Marquer comme inactif
        this.active = false;
        
        // Créer un bullet ennemi si l'EnemyManager le supporte
        if (this.scene.enemyManager && this.scene.enemyManager.createEnemyBullet) {
            this.scene.enemyManager.createEnemyBullet(
                this.sprite.x, 
                this.sprite.y, 
                velocityX, 
                velocityY
            );
        }
        
        // Effet d'explosion simple
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'explosion');
        if (this.scene.anims.exists('explode')) {
            explosion.play('explode');
            
            // Supprimer l'explosion une fois l'animation terminée
            explosion.on('animationcomplete', () => {
                explosion.destroy();
            });
        } else {
            // Supprimer l'explosion après un court délai si l'animation n'existe pas
            this.scene.time.delayedCall(300, () => {
                explosion.destroy();
            });
        }
        
        // Détruire le sprite
        this.sprite.destroy();
    }
}

// Exporter la classe pour l'utiliser ailleurs
export default Saucer;