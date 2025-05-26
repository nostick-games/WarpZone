/**
 * Classe gérant la génération et le comportement des astéroïdes
 */
import Asteroid from '../../items/Asteroid.js';

class AsteroidManager {
    /**
     * Crée le gestionnaire d'astéroïdes
     * @param {Phaser.Scene} scene - La scène Phaser à laquelle appartient ce système
     */
    constructor(scene) {
        this.scene = scene;
        
        // Propriétés des astéroïdes
        this.asteroids = [];
        this.nextAsteroidTime = 0;
        this.asteroidSpawnInterval = 5000; // 5 secondes entre chaque astéroïde
        
        // Probabilité qu'un astéroïde génère un power-up lorsqu'il est détruit
        this.powerupDropChance = 1.0; // 100% de chance
    }
    
    /**
     * Gère l'apparition d'un astéroïde à un intervalle aléatoire
     * @param {number} time - Temps actuel
     */
    spawnAsteroid(time) {
        // Ne pas faire apparaître d'astéroïdes si le bonus x2 ou x3 est actif
        if (this.scene.bonusX2Active || (this.scene.enemyCounter && this.scene.enemyCounter.bonusX3Active)) {
            return;
        }
        
        // Vérifier si c'est le moment de faire apparaître un astéroïde
        if (time < this.nextAsteroidTime) {
            return;
        }
        
        // Position X aléatoire (entre 50 et largeur - 50)
        const x = Phaser.Math.Between(50, this.scene.game.config.width - 50);
        const y = -50; // Apparaît au-dessus de l'écran
        
        // Créer un nouvel astéroïde
        const asteroid = new Asteroid(this.scene, x, y);
        this.asteroids.push(asteroid);
        
        // Définir le prochain temps d'apparition (entre 5 et 12 secondes)
        this.nextAsteroidTime = time + this.asteroidSpawnInterval + Phaser.Math.Between(0, 7000);
    }
    
    /**
     * Met à jour tous les astéroïdes
     * @param {number} delta - Temps écoulé depuis la dernière frame en ms
     */
    update(delta) {
        // Mettre à jour chaque astéroïde
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Mettre à jour la position et vérifier si l'astéroïde est toujours actif
            if (asteroid.update(delta)) {
                // Si l'astéroïde est sorti de l'écran, le supprimer du tableau
                this.asteroids.splice(i, 1);
            }
        }
    }
    
    /**
     * Vérifie les collisions entre les projectiles et les astéroïdes
     * @param {Object} projectile - Le projectile à vérifier
     * @returns {boolean} - Vrai si une collision a été détectée
     */
    checkProjectileCollisions(projectile) {
        let collisionDetected = false;
        if (!this.scene.collisionManager || !projectile || !projectile.active) {
            return false;
        }
        
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            if (!asteroid || !asteroid.sprite || asteroid.destroyed) continue;

            // Les projectiles sont petits, la détection pixel-perfect peut être moins cruciale,
            // mais on l'active pour la cohérence.
            const intersection = this.scene.collisionManager.getCollisionIntersection(projectile, asteroid.sprite, true, 2, 30);
            
            if (intersection) {
                // Gérer le débogage si EnemyManager (ou un autre manager) active le flag global
                // if (this.scene.enemyManager && this.scene.enemyManager.debugCollision) {
                //     this.scene.collisionManager.debugDrawCollision(projectile, asteroid.sprite, intersection, true);
                // }
                // Pour l'instant, on ne gère pas le debugDraw ici, car le flag est dans EnemyManager.
                // On pourrait ajouter un flag de debug à AsteroidManager ou passer celui de EnemyManager.

                // console.log(`[COLLISION] Projectile a touché un astéroïde à la position (${Math.floor(asteroid.sprite.x)}, ${Math.floor(asteroid.sprite.y)})`);
                const isDestroyed = asteroid.takeDamage(10); // Supposons 10 de dégâts par projectile
                
                if (isDestroyed) {
                    // console.log(`[DESTRUCTION] Astéroïde détruit à la position (${Math.floor(asteroid.sprite.x)}, ${Math.floor(asteroid.sprite.y)})`);
                    const rollChance = Math.random();
                    if (rollChance < this.powerupDropChance) {
                        // console.log(`[POWER-UP DIAGNOSTIC] Astéroïde détruit - Génération d'un power-up. Tirage: ${rollChance.toFixed(3)}, Seuil: ${this.powerupDropChance}`);
                        if (this.scene.powerupManager) {
                            this.scene.powerupManager.createPowerup(asteroid.sprite.x, asteroid.sprite.y);
                        }
                    } else {
                        // console.log(`[POWER-UP DIAGNOSTIC] Astéroïde détruit - Pas de power-up. Tirage: ${rollChance.toFixed(3)}, Seuil: ${this.powerupDropChance}`);
                    }
                    // L'astéroïde se détruit lui-même et sera retiré via sa propre logique ou par le manager
                    // this.asteroids.splice(i, 1); // Plus géré ici directement, destroy() s'en occupe
                }
                
                // Si le projectile n'est pas perforant, il est détruit
                if (!projectile.piercing) {
                    if (projectile.particles) {
                        projectile.particles.destroy();
                    }
                    projectile.destroy();
                    // Il faut aussi retirer le projectile de la liste gérée par GameScene
                    // Cela doit être fait par GameScene, pas ici.
                }
                collisionDetected = true;
                // Si le projectile n'est pas perforant, on arrête de vérifier pour ce projectile
                if (!projectile.piercing) {
                    break; 
                }
            }
        }
        return collisionDetected;
    }
    
    /**
     * Vérifie la collision entre le joueur et les astéroïdes
     * @param {Object} player - Le vaisseau du joueur (doit avoir une propriété .sprite)
     * @returns {boolean} - Vrai si une collision a été détectée
     */
    checkPlayerCollision(player) {
        if (!this.scene.collisionManager || !player || !player.sprite || player.isInvincible) {
            return false;
        }
        
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            if (!asteroid || !asteroid.sprite || asteroid.destroyed) continue;

            const intersection = this.scene.collisionManager.getCollisionIntersection(player.sprite, asteroid.sprite, true, 2, 30);
            
            if (intersection) {
                // Gérer le débogage comme pour les projectiles
                // if (this.scene.enemyManager && this.scene.enemyManager.debugCollision) {
                //     this.scene.collisionManager.debugDrawCollision(player.sprite, asteroid.sprite, intersection, true);
                // }

                asteroid.destroy(); // L'astéroïde se détruit
                // this.asteroids.splice(i, 1); // Géré par la logique de destruction de l'astéroïde ou du manager
                return true; // Collision détectée, le joueur est touché
            }
        }
        return false;
    }
    
    /**
     * Détruit tous les astéroïdes à l'écran
     * @returns {number} - Le nombre d'astéroïdes détruits
     */
    destroyAll() {
        const count = this.asteroids.length;
        
        // Détruire tous les astéroïdes
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            this.asteroids[i].destroy();
        }
        
        // Vider le tableau
        this.asteroids = [];
        
        return count;
    }

    reset() {
        // Détruire tous les astéroïdes actifs
        this.asteroids.forEach(asteroid => {
            if (asteroid && asteroid.sprite && asteroid.sprite.active) {
                asteroid.destroy();
            }
        });
        this.asteroids = [];
        this.nextAsteroidTime = 0;
        console.log("[AsteroidManager] Réinitialisé");
    }
}

export default AsteroidManager; 