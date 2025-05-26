/**
 * Classe représentant un astéroïde qui peut donner un powerup
 */
class Asteroid {
    /**
     * Constructeur de la classe Asteroid
     * @param {Phaser.Scene} scene - La scène du jeu
     * @param {number} x - Position horizontale initiale
     * @param {number} y - Position verticale initiale
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.health = 20; // Santé initiale de l'astéroïde
        this.destroyed = false;
        
        // Créer le sprite de l'astéroïde
        this.sprite = scene.add.sprite(x, y, 'asteroid1');
        this.sprite.setScale(1.5);
        
        // Référence à l'astéroïde dans le sprite
        this.sprite.asteroid = this;
        
        // Paramètres de mouvement en zigzag
        this.speed = 0.8; // Vitesse de déplacement verticale
        this.amplitude = 100; // Amplitude du zigzag horizontal
        this.frequency = 0.001; // Fréquence du zigzag
        this.initialX = x;
        this.time = 0;
    }
    
    /**
     * Mettre à jour la position et l'état de l'astéroïde
     * @param {number} delta - Temps écoulé depuis la dernière mise à jour
     */
    update(delta) {
        if (this.destroyed) return;
        
        // Incrémenter le temps pour le mouvement
        this.time += delta;
        
        // Mouvement en zigzag
        const newX = this.initialX + Math.sin(this.time * this.frequency) * this.amplitude;
        const newY = this.sprite.y + this.speed;
        
        // Mettre à jour la position
        this.sprite.x = newX;
        this.sprite.y = newY;
        
        // Vérifier si l'astéroïde est sorti de l'écran
        if (this.sprite.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
    }
    
    /**
     * Gérer les dégâts subis par l'astéroïde
     * @param {number} damage - Quantité de dégâts
     * @returns {boolean} - Vrai si l'astéroïde est détruit
     */
    takeDamage(damage) {
        this.health -= damage;
        
        // Si l'astéroïde est à moitié détruit, changer son apparence
        if (this.health <= 10 && this.sprite.texture.key !== 'asteroid2') {
            this.sprite.setTexture('asteroid2');
        }
        
        // Si l'astéroïde est complètement détruit
        if (this.health <= 0 && !this.destroyed) {
            // this.spawnPowerUp(); // Supprimé: La logique de spawn est maintenant gérée par AsteroidManager
            this.destroyed = true;
            this.sprite.visible = false;
            return true;
        }
        
        return false;
    }
    
    /**
     * Faire apparaître un powerup à la place de l'astéroïde
     * CETTE METHODE N'EST PLUS UTILISEE DIRECTEMENT.
     * La création de power-up est gérée par AsteroidManager.
     */
    spawnPowerUp() {
        // console.log("[ASTEROID.JS] spawnPowerUp() appelée - NE DEVRAIT PLUS ARRIVER DIRECTEMENT");
        // Utiliser le PowerupManager pour créer le powerup
        if (this.scene.powerupManager) {
            // Le type sera déterminé par le PowerupManager
            // qui utilise les probabilités configurées (98% étoile, 1% bombe, 1% arme)
            this.scene.powerupManager.createPowerup(
                this.sprite.x, 
                this.sprite.y
            );
        } else {
            // Ce code de fallback ne devrait jamais être exécuté avec la nouvelle architecture
            console.log(`[ASTEROID] Erreur: PowerupManager non disponible pour créer un power-up`);
        }
    }
    
    /**
     * Détruire l'astéroïde
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        // Après la refactorisation, la liste des astéroïdes est gérée par AsteroidManager
        // Il n'y a plus besoin d'accéder à this.scene.asteroids ici
        // Le gestionnaire AsteroidManager s'occupe de supprimer l'astéroïde de sa liste
        this.destroyed = true;
    }
}

export default Asteroid; 