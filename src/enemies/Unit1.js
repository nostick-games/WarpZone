/**
 * Classe représentant l'ennemi Unit1 - vaisseau qui descend tout droit
 */
class Unit1 {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Créer le sprite de l'ennemi
        this.sprite = scene.physics.add.sprite(x, y, 'unit1').setScale(2);
        
        // Propriétés de l'ennemi
        this.health = 20; // Nécessite un projectilePower d'au moins 10 pour être détruit
        this.speed = 100; // Vitesse de déplacement
        this.active = true; // Indique si l'ennemi est actif
        
        // Configuration de l'animation
        if (!scene.anims.exists('unit1_fly')) {
            scene.anims.create({
                key: 'unit1_fly',
                frames: scene.anims.generateFrameNumbers('unit1', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Jouer l'animation seulement si elle existe
        try {
            if (scene.anims.exists('unit1_fly') && this.sprite.texture.frameTotal > 1) {
                this.sprite.play('unit1_fly');
            }
        } catch (error) {
            console.warn("Impossible de jouer l'animation unit1_fly:", error);
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
        
        // Mouvement vertical vers le bas
        this.sprite.y += this.speed * (1/60); // Approximation du delta time
        
        // Vérifier si l'ennemi est sorti de l'écran
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
            this.destroy();
            return true; // Indique que l'ennemi a été détruit
        }
        
        return false; // Indique que l'ennemi est encore en vie
    }
    
    /**
     * Détruit l'ennemi et crée un effet d'explosion
     */
    destroy() {
        // Marquer comme inactif
        this.active = false;
        
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
export default Unit1;