import Ship from './Ship.js';

/**
 * Classe spécifique pour le vaisseau Plasma Ghost
 */
class PlasmaGhost extends Ship {
    /**
     * Constructeur du vaisseau Plasma Ghost
     * @param {Phaser.Scene} scene - La scène du jeu
     * @param {number} x - Position horizontale initiale
     * @param {number} y - Position verticale initiale
     */
    constructor(scene, x, y) {
        // Propriétés spécifiques au Plasma Ghost
        const props = {
            moveSpeed: 2.5,         // Plus lent que les autres vaisseaux
            projectilePower: 15,     // Projectiles les plus puissants
            projectileSpeed: 250,    // Projectiles plus lents
            cooldown: 500           // Cadence de tir lente (équilibrage)
        };
        
        // Appeler le constructeur de la classe parent avec la texture spécifique
        super(scene, x, y, 'spaceship3', props);
    }
    
    /**
     * Surcharge de la méthode shoot pour créer un laser bleu
     * @param {Function} addProjectileCallback - Callback pour ajouter le projectile à un tableau extérieur
     * @returns {Array} - Un tableau contenant le laser créé ou un tableau vide
     */
    shoot(addProjectileCallback) {
        let projectiles = [];
        
        // Obtenir le temps actuel
        const time = this.scene.time.now;
        
        // Vérifier si le temps de rechargement est écoulé
        if (time > this.lastFired + this.cooldown) {
            // Créer un rectangle pour le laser avant au lieu d'un sprite
            const frontLaser = this.scene.add.rectangle(
                this.shipGroup.x,
                this.shipGroup.y - 100,  // Commencer un peu au-dessus du vaisseau
                6,                     // Largeur du laser
                150,                   // Longueur du laser
                0x0D7DE4               // Couleur bleue (#0D7DE4)
            );
            
            // Ajouter des propriétés personnalisées au laser
            frontLaser.power = this.projectilePower;
            frontLaser.speed = this.projectileSpeed * 1.5; // Le laser se déplace plus vite
            frontLaser.piercing = true; // Le laser peut traverser les ennemis
            frontLaser.hitEnemies = new Set(); // Track des ennemis déjà touchés par ce laser
            
            // Ajouter un effet de lueur autour du laser
            frontLaser.setStrokeStyle(2, 0x66CCFF, 1);
            
            // Ajouter un petit effet de pulsation au laser
            this.scene.tweens.add({
                targets: frontLaser,
                alpha: 0.7,
                duration: 100,
                yoyo: true,
                repeat: 2
            });
            
            // Ajouter au tableau de projectiles
            projectiles.push(frontLaser);
            
            // Ajouter un laser arrière à partir du niveau 2
            if (this.shootLevel >= 2) {
                // Laser arrière (vers le bas)
                const backLaser = this.scene.add.rectangle(
                    this.shipGroup.x,
                    this.shipGroup.y + 100,  // Commencer un peu en-dessous du vaisseau
                    6,                      // Largeur du laser
                    150,                    // Longueur du laser
                    0x0D7DE4                // Couleur bleue (#0D7DE4)
                );
                
                // Propriétés du laser arrière
                backLaser.power = this.projectilePower;
                backLaser.speed = -this.projectileSpeed * 1.5; // Vitesse négative pour se déplacer vers le bas
                backLaser.piercing = true; // Le laser peut traverser les ennemis
                backLaser.isBackLaser = true; // Marquer comme laser arrière pour le traitement dans GameScene
                backLaser.hitEnemies = new Set(); // Track des ennemis déjà touchés par ce laser
                
                // Effet de lueur
                backLaser.setStrokeStyle(2, 0x66CCFF, 1);
                
                // Effet de pulsation
                this.scene.tweens.add({
                    targets: backLaser,
                    alpha: 0.7,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                
                projectiles.push(backLaser);
            }
            
            // Ajouter des lasers latéraux à partir du niveau 3
            if (this.shootLevel >= 3) {
                // Laser gauche (horizontal vers la gauche)
                const leftLaser = this.scene.add.rectangle(
                    this.shipGroup.x - 100,  // Commencer un peu à gauche du vaisseau
                    this.shipGroup.y,        // Même hauteur que le vaisseau
                    150,                     // Longueur du laser (horizontal)
                    6,                       // Largeur du laser
                    0x0D7DE4                 // Couleur bleue (#0D7DE4)
                );
                
                // Propriétés du laser gauche
                leftLaser.power = this.projectilePower;
                leftLaser.speedX = -this.projectileSpeed * 1.5; // Vitesse négative pour aller vers la gauche
                leftLaser.speedY = 0; // Pas de mouvement vertical
                leftLaser.piercing = true; // Le laser peut traverser les ennemis
                leftLaser.isHorizontalLaser = true; // Marquer comme laser horizontal
                leftLaser.hitEnemies = new Set(); // Track des ennemis déjà touchés par ce laser
                
                // Effet de lueur
                leftLaser.setStrokeStyle(2, 0x66CCFF, 1);
                
                // Effet de pulsation
                this.scene.tweens.add({
                    targets: leftLaser,
                    alpha: 0.7,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                
                projectiles.push(leftLaser);
                
                // Laser droit (horizontal vers la droite)
                const rightLaser = this.scene.add.rectangle(
                    this.shipGroup.x + 100,  // Commencer un peu à droite du vaisseau
                    this.shipGroup.y,        // Même hauteur que le vaisseau
                    150,                     // Longueur du laser (horizontal)
                    6,                       // Largeur du laser
                    0x0D7DE4                 // Couleur bleue (#0D7DE4)
                );
                
                // Propriétés du laser droit
                rightLaser.power = this.projectilePower;
                rightLaser.speedX = this.projectileSpeed * 1.5; // Vitesse positive pour aller vers la droite
                rightLaser.speedY = 0; // Pas de mouvement vertical
                rightLaser.piercing = true; // Le laser peut traverser les ennemis
                rightLaser.isHorizontalLaser = true; // Marquer comme laser horizontal
                rightLaser.hitEnemies = new Set(); // Track des ennemis déjà touchés par ce laser
                
                // Effet de lueur
                rightLaser.setStrokeStyle(2, 0x66CCFF, 1);
                
                // Effet de pulsation
                this.scene.tweens.add({
                    targets: rightLaser,
                    alpha: 0.7,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                
                projectiles.push(rightLaser);
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
}

export default PlasmaGhost; 