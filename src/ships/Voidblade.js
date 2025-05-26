import Ship from './Ship.js';

/**
 * Classe spécifique pour le vaisseau Voidblade
 */
class Voidblade extends Ship {
    /**
     * Constructeur du vaisseau Voidblade
     * @param {Phaser.Scene} scene - La scène du jeu
     * @param {number} x - Position horizontale initiale
     * @param {number} y - Position verticale initiale
     */
    constructor(scene, x, y) {
        // Propriétés spécifiques au Voidblade
        const props = {
            moveSpeed: 3,           // Vitesse moyenne
            projectilePower: 10,     // Projectiles très puissants
            projectileSpeed: 300,    // Vitesse moyenne des projectiles
            cooldown: 400           // Cadence de tir plus lente (équilibrage)
        };
        
        // Appeler le constructeur de la classe parent avec la texture spécifique
        super(scene, x, y, 'spaceship2', props);
    }
    
    /**
     * Surcharge de la méthode shoot pour implémenter le comportement spécifique de Voidblade
     * @param {Function} addProjectileCallback - Callback pour ajouter le projectile à un tableau extérieur
     * @returns {Array} - Un tableau contenant les projectiles créés ou un tableau vide
     */
    shoot(addProjectileCallback) {
        let projectiles = [];
        
        // Vérifier si le temps de rechargement est écoulé
        const time = this.scene.time.now;
        if (time > this.lastFired + this.cooldown) {
            // Comportement selon le niveau de tir
            switch (this.shootLevel) {
                case 1:
                    // Niveau 1: un seul projectile droit (comportement par défaut)
                    const mainProjectile = this.scene.add.sprite(
                        this.shipGroup.x,
                        this.shipGroup.y - 20,
                        this.projectileType
                    );
                    mainProjectile.power = this.projectilePower;
                    mainProjectile.speed = this.projectileSpeed;
                    
                    // Effet de zoom sur le projectile
                    this.scene.tweens.add({
                        targets: mainProjectile,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 50,
                        yoyo: true
                    });
                    
                    projectiles.push(mainProjectile);
                    break;
                    
                case 2:
                    // Niveau 2: deux projectiles à -15 et +15 degrés
                    // Projectile à -15 degrés
                    const leftProjectile = this.createAngleProjectile(-15);
                    projectiles.push(leftProjectile);
                    
                    // Projectile à +15 degrés
                    const rightProjectile = this.createAngleProjectile(15);
                    projectiles.push(rightProjectile);
                    break;
                    
                case 3:
                    // Niveau 3: trois projectiles à -20, 0 et +20 degrés
                    // Projectile à -20 degrés
                    const leftProjectile3 = this.createAngleProjectile(-20);
                    projectiles.push(leftProjectile3);
                    
                    // Projectile central (0 degrés)
                    const centerProjectile = this.createAngleProjectile(0);
                    projectiles.push(centerProjectile);
                    
                    // Projectile à +20 degrés
                    const rightProjectile3 = this.createAngleProjectile(20);
                    projectiles.push(rightProjectile3);
                    break;
            }
            
            // Mettre à jour le temps du dernier tir
            this.lastFired = time;
            
            // Ajouter les projectiles via le callback
            if (addProjectileCallback) {
                projectiles.forEach(projectile => {
                    addProjectileCallback(projectile);
                });
            }
        }
        
        return projectiles;
    }
    
    /**
     * Crée un projectile avec un angle spécifique
     * @param {number} angle - Angle en degrés (0 = vers le haut)
     * @returns {Phaser.GameObjects.Sprite} - Le projectile créé
     */
    createAngleProjectile(angle) {
        // Convertir l'angle en radians
        const radians = Phaser.Math.DegToRad(angle);
        
        // Créer le projectile à la position du vaisseau
        const projectile = this.scene.add.sprite(
            this.shipGroup.x,
            this.shipGroup.y - 20,
            this.projectileType
        );
        
        // Paramètres de base
        projectile.power = this.projectilePower;
        
        // Calculer les composantes de vitesse pour l'angle donné
        projectile.speedX = Math.sin(radians) * this.projectileSpeed;
        projectile.speedY = -Math.cos(radians) * this.projectileSpeed; // Négatif car l'axe Y est inversé
        
        // Rotation visuelle du projectile pour qu'il pointe dans la bonne direction
        projectile.rotation = radians;
        
        // Définir une propriété pour indiquer que ce projectile a une trajectoire angulaire
        projectile.isAngledProjectile = true;
        
        return projectile;
    }
}

export default Voidblade; 