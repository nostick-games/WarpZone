/**
 * Gestionnaire de Projectiles pour GameScene
 * Gère la création, mise à jour, collisions et nettoyage des projectiles du joueur
 */
class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = []; // Tableau des projectiles actifs
    }

    /**
     * Ajoute un projectile au gestionnaire
     * @param {Phaser.GameObjects.Sprite} projectile - Le projectile à ajouter
     */
    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    /**
     * Fait tirer le joueur et ajoute les projectiles créés
     * @param {Ship} player - Le vaisseau du joueur
     * @returns {Array} - Les projectiles créés
     */
    playerShoot(player) {
        const newProjectiles = player.shoot((projectile) => {
            this.addProjectile(projectile);
        });
        return newProjectiles;
    }

    /**
     * Met à jour tous les projectiles actifs
     * @param {number} delta - Temps écoulé depuis la dernière mise à jour
     */
    update(delta) {
        // Mettre à jour manuellement la position des projectiles et nettoyer ceux qui sont hors écran
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Déplacer le projectile selon sa trajectoire
            if (projectile.isAngledProjectile) {
                // Pour les projectiles avec trajectoire angulaire (Voidblade)
                projectile.x += projectile.speedX * (1/60);
                projectile.y += projectile.speedY * (1/60);
            } else if (projectile.isBackLaser) {
                // Pour les lasers arrière (Plasma Ghost niveau 2+)
                projectile.y -= projectile.speed * (1/60); // La vitesse est déjà négative
            } else if (projectile.isHorizontalLaser) {
                // Pour les lasers horizontaux (Plasma Ghost niveau 3)
                projectile.x += projectile.speedX * (1/60);
                projectile.y += projectile.speedY * (1/60); // speedY est 0 pour les lasers horizontaux
            } else {
                // Pour les projectiles standard (mouvement vertical)
                projectile.y -= projectile.speed * (1/60); // Approximation du delta time
            }
            
            // Vérifier les collisions avec les astéroïdes seulement si les collisions sont activées
            if (!this.scene.collisionsDisabled) {
                this.checkAsteroidCollisions(projectile);
            }
            
            // Vérifier si le projectile est sorti de l'écran
            if (projectile.y < -20 || projectile.y > this.scene.game.config.height + 20 || 
                projectile.x < -20 || projectile.x > this.scene.game.config.width + 20) {
                // Supprimer les particules associées si elles existent
                if (projectile.particles) {
                    projectile.particles.destroy();
                }
                
                // Détruire le sprite
                projectile.destroy();
                
                // Retirer du tableau
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Vérifie les collisions entre un projectile et les astéroïdes
     * @param {Phaser.GameObjects.Sprite} projectile - Le projectile à vérifier
     * @returns {boolean} - Vrai si une collision a eu lieu
     */
    checkAsteroidCollisions(projectile) {
        // Déléguer la vérification des collisions au gestionnaire d'astéroïdes
        return this.scene.asteroidManager.checkProjectileCollisions(projectile);
    }

    /**
     * Retourne le tableau des projectiles actifs (pour les collisions avec les ennemis)
     * @returns {Array} - Le tableau des projectiles
     */
    getProjectiles() {
        return this.projectiles;
    }

    /**
     * Supprime un projectile spécifique du gestionnaire
     * @param {Phaser.GameObjects.Sprite} projectile - Le projectile à supprimer
     */
    removeProjectile(projectile) {
        const index = this.projectiles.indexOf(projectile);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    }

    /**
     * Nettoie tous les projectiles (utilisé lors de la destruction de la scène)
     */
    destroy() {
        // Détruire tous les projectiles restants
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile && projectile.destroy) {
                projectile.destroy();
            }
        }
        
        // Vider le tableau
        this.projectiles = [];
    }
}

export default ProjectileManager; 