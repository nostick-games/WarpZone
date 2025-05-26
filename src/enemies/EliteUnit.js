/**
 * Classe pour un ennemi d'élite qui n'apparaît qu'à partir du niveau 3
 */
class EliteUnit {
    constructor(scene, x, y) {
        this.scene = scene;
        this.active = true;
        
        // Créer le sprite
        this.sprite = scene.add.sprite(x, y, 'eliteunit');
        this.sprite.setScale(1.2); // Légèrement plus grand que les autres
        
        // Jouer l'animation de vol
        this.sprite.play('eliteunit_fly');
        
        // Propriétés
        this.speed = 1.5; // Plus rapide que les ennemis normaux
        this.health = 20; // Plus résistant
        this.shotChance = 0.015; // Chance de tirer à chaque frame
        this.lastShot = 0;
        this.shotDelay = 1500; // Délai entre chaque tir
        
        // Pour le score
        this.scoreValue = 300; // Vaut plus de points
    }
    
    update(time) {
        if (!this.active) return;
        
        // Mouvement
        this.sprite.y += this.speed;
        
        // Si l'ennemi sort de l'écran, le désactiver
        if (this.sprite.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
        
        // Tirer aléatoirement avec un délai minimum
        if (time > this.lastShot + this.shotDelay && Math.random() < this.shotChance) {
            this.shoot();
            this.lastShot = time;
        }
    }
    
    shoot() {
        // Créer un projectile ennemi
        const projectile = this.scene.add.sprite(this.sprite.x, this.sprite.y + 20, 'enemy_projectile');
        projectile.setScale(1.2);
        projectile.setTint(0xFF0000);
        
        // Propriétés du projectile
        projectile.speed = 3;
        projectile.damage = 1;
        
        // Ajouter à une liste de projectiles ennemis si nécessaire
        if (this.scene.enemyProjectiles) {
            this.scene.enemyProjectiles.push(projectile);
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
            // Créer une explosion
            const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'explosion');
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // 50% de chance de laisser tomber un power-up
            if (Math.random() < 0.5 && this.scene.powerupManager) {
                // Sélectionner aléatoirement le type (bombe, arme, étoile)
                const powerupTypes = ['weapon', 'bomb', 'star', 'bonusx2'];
                const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                
                this.scene.powerupManager.createPowerup(this.sprite.x, this.sprite.y, randomType);
            }
            
            // Désactiver et détruire
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    destroy() {
        this.active = false;
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// Si on utilise des modules ES
export default EliteUnit;

// Pour la compatibilité avec le chargement global
if (typeof window !== 'undefined') {
    window.EliteUnit = EliteUnit;
} 