/**
 * Classe abstraite représentant un vaisseau jouable
 */
class Ship {
    /**
     * Constructeur de la classe Ship
     * @param {Phaser.Scene} scene - La scène du jeu
     * @param {number} x - Position horizontale initiale
     * @param {number} y - Position verticale initiale
     * @param {string} textureKey - Clé de la texture du vaisseau
     * @param {Object} props - Propriétés spécifiques du vaisseau
     */
    constructor(scene, x, y, textureKey, props) {
        this.scene = scene;
        this.textureKey = textureKey;
        
        // Propriétés du vaisseau
        this.props = props || {};
        this.moveSpeed = this.props.moveSpeed || 3;
        this.speed = this.props.speed || 300; // Vitesse pour le déplacement basé sur le delta time
        this.projectilePower = this.props.projectilePower || 10;
        this.projectileSpeed = this.props.projectileSpeed || 300;
        this.cooldown = this.props.cooldown || 400;
        this.fireRate = this.props.fireRate || 400; // Délai entre deux tirs
        
        // Niveau de tir (pour les powerups)
        this.shootLevel = 1;
        
        // Définir le type de projectile en fonction du vaisseau
        if (this.textureKey === 'spaceship1') {
            this.projectileType = 'projectile1';
        } else if (this.textureKey === 'spaceship2') {
            this.projectileType = 'projectile2';
        } else if (this.textureKey === 'spaceship3') {
            this.projectileType = 'projectile3';
        } else {
            this.projectileType = 'projectile1';
        }
        
        // Temps du dernier tir
        this.lastFired = 0;
        
        // Vérifier si les textures sont chargées, sinon les charger
        this.loadTextures(scene);
        
        // Déterminer si nous sommes dans GameScene ou ShipSelectionScene
        const isGameScene = scene.key === 'GameScene';
        
        // Créer un groupe pour le vaisseau et ses éléments associés
        this.shipGroup = scene.add.container(x, y);
        
        // Créer le sprite du vaisseau avec l'animation idle
        this.sprite = scene.physics.add.sprite(0, 0, `${textureKey}_idle`).setScale(2);
        
        // Créer le sprite des flammes en dessous du vaisseau
        this.flameSprite = scene.add.sprite(0, 0, 'flamme_spaceship').setScale(2);
        
        // Positionner les flammes à Y = 0 (sous le vaisseau)
        this.flameSprite.setOrigin(0.5, -1);
        
        // Si on est dans GameScene, configurer la flamme pour l'animation d'entrée
        if (isGameScene) {
            this.flameSprite.setVisible(false); // La flamme sera visible après l'animation d'entrée
        }
        
        // Ajouter les sprites au groupe
        this.shipGroup.add([this.flameSprite, this.sprite]);
        
        // Configurer les animations
        this.createAnimations(scene);
        
        // Jouer l'animation d'idle pour le vaisseau
        this.sprite.play(`${textureKey}_idle_anim`);
        
        // Jouer l'animation des flammes
        this.flameSprite.play('flamme_anim');
        
        // Pour GameScene, nous avons besoin de body pour la physique
        if (isGameScene) {
            scene.physics.world.enable(this.shipGroup);
        }
    }
    
    /**
     * Charge les textures nécessaires si elles ne sont pas déjà chargées
     * @param {Phaser.Scene} scene - La scène du jeu
     */
    loadTextures(scene) {
        // Vérifier et charger les textures si nécessaire
        if (!scene.textures.exists(`${this.textureKey}_idle`)) {
            scene.load.spritesheet(`${this.textureKey}_idle`, `assets/spaceship/${this.textureKey}_idle.png`, { frameWidth: 32, frameHeight: 32 });
        }
        if (!scene.textures.exists(`${this.textureKey}_left`)) {
            scene.load.spritesheet(`${this.textureKey}_left`, `assets/spaceship/${this.textureKey}_left.png`, { frameWidth: 32, frameHeight: 32 });
        }
        if (!scene.textures.exists(`${this.textureKey}_right`)) {
            scene.load.spritesheet(`${this.textureKey}_right`, `assets/spaceship/${this.textureKey}_right.png`, { frameWidth: 32, frameHeight: 32 });
        }
        if (!scene.textures.exists('flamme_spaceship')) {
            scene.load.spritesheet('flamme_spaceship', 'assets/spaceship/flamme_spaceship.png', { frameWidth: 16, frameHeight: 16 });
        }
        
        // Charger immédiatement les assets si nécessaire (pour éviter le chargement asynchrone)
        if (scene.load.list.size > 0) {
            scene.load.start();
        }
    }
    
    /**
     * Crée toutes les animations nécessaires pour le vaisseau
     * @param {Phaser.Scene} scene - La scène du jeu
     */
    createAnimations(scene) {
        // Animation pour les flammes - Supprimée car déjà créée dans GameScene
        // L'animation flamme_anim est maintenant créée dans GameScene.create()
        
        // Animation idle pour le vaisseau (1 frame)
        if (!scene.anims.exists(`${this.textureKey}_idle_anim`)) {
            scene.anims.create({
                key: `${this.textureKey}_idle_anim`,
                frames: scene.anims.generateFrameNumbers(`${this.textureKey}_idle`, { start: 0, end: 0 }),
                frameRate: 5,
                repeat: 0
            });
        }
        
        // Animation pour tourner à gauche (2 frames)
        if (!scene.anims.exists(`${this.textureKey}_left_anim`)) {
            scene.anims.create({
                key: `${this.textureKey}_left_anim`,
                frames: scene.anims.generateFrameNumbers(`${this.textureKey}_left`, { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animation pour tourner à droite (2 frames)
        if (!scene.anims.exists(`${this.textureKey}_right_anim`)) {
            scene.anims.create({
                key: `${this.textureKey}_right_anim`,
                frames: scene.anims.generateFrameNumbers(`${this.textureKey}_right`, { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }
    
    /**
     * Met à jour la position du vaisseau en fonction des contrôles
     * @param {Phaser.Input.Keyboard.CursorKeys} cursors - Touches de direction
     */
    update(cursors) {
        // Position initiale
        const initialX = this.shipGroup.x;
        const initialY = this.shipGroup.y;
        
        // Mouvement horizontal
        if (cursors.left.isDown) {
            this.shipGroup.x -= this.moveSpeed;
            // Changer l'animation pour tourner à gauche
            if (this.sprite.anims.currentAnim.key !== `${this.textureKey}_left_anim`) {
                this.sprite.play(`${this.textureKey}_left_anim`);
            }
        } else if (cursors.right.isDown) {
            this.shipGroup.x += this.moveSpeed;
            // Changer l'animation pour tourner à droite
            if (this.sprite.anims.currentAnim.key !== `${this.textureKey}_right_anim`) {
                this.sprite.play(`${this.textureKey}_right_anim`);
            }
        } else {
            // Revenir à l'animation idle si aucune touche horizontale n'est enfoncée
            if (this.sprite.anims.currentAnim.key !== `${this.textureKey}_idle_anim`) {
                this.sprite.play(`${this.textureKey}_idle_anim`);
            }
        }
        
        // Mouvement vertical
        if (cursors.up.isDown) {
            this.shipGroup.y -= this.moveSpeed;
        } else if (cursors.down.isDown) {
            this.shipGroup.y += this.moveSpeed;
        }
        
        // Maintenir le vaisseau dans les limites de l'écran
        this.shipGroup.x = Phaser.Math.Clamp(
            this.shipGroup.x, 
            20, 
            this.scene.game.config.width - 20
        );
        
        this.shipGroup.y = Phaser.Math.Clamp(
            this.shipGroup.y, 
            20, 
            this.scene.game.config.height - 20
        );
    }
    
    /**
     * Tire un projectile si le délai de recharge est écoulé
     * @param {Function} addProjectileCallback - Callback pour ajouter le projectile à un tableau extérieur
     * @returns {Array} - Les projectiles créés
     */
    shoot(addProjectileCallback) {
        let projectiles = [];
        
        // Projectile principal (toujours présent)
        const mainProjectile = this.scene.add.sprite(
            this.shipGroup.x,
            this.shipGroup.y - 20,
            this.projectileType
        );
        
        // Ajouter des propriétés personnalisées au projectile
        mainProjectile.power = this.projectilePower;
        mainProjectile.speed = this.projectileSpeed;
        
        // Ajouter un petit effet de zoom au tir
        this.scene.tweens.add({
            targets: mainProjectile,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 50,
            yoyo: true
        });
        
        projectiles.push(mainProjectile);
        
        // Ajouter des projectiles supplémentaires selon le niveau de tir
        if (this.shootLevel >= 2) {
            // Niveau 2: ajouter un projectile décalé à gauche
            const leftProjectile = this.scene.add.sprite(
                this.shipGroup.x - 15,
                this.shipGroup.y - 10,
                this.projectileType
            );
            leftProjectile.power = this.projectilePower;
            leftProjectile.speed = this.projectileSpeed;
            leftProjectile.setScale(0.8);
            projectiles.push(leftProjectile);
        }
        
        if (this.shootLevel >= 3) {
            // Niveau 3: ajouter un projectile décalé à droite
            const rightProjectile = this.scene.add.sprite(
                this.shipGroup.x + 15,
                this.shipGroup.y - 10,
                this.projectileType
            );
            rightProjectile.power = this.projectilePower;
            rightProjectile.speed = this.projectileSpeed;
            rightProjectile.setScale(0.8);
            projectiles.push(rightProjectile);
        }
        

        
        // Ajouter les projectiles via le callback
        if (addProjectileCallback) {
            projectiles.forEach(projectile => {
                addProjectileCallback(projectile);
            });
        }
        
        return projectiles;
    }
    
    /**
     * Améliore le niveau de tir du vaisseau
     */
    upgradeShoot() {
        // Limiter le niveau à un maximum de 3
        if (this.shootLevel < 3) {
            this.shootLevel++;
            // L'effet visuel est maintenant géré par GameScene.createWeaponPowerupEffect()
        }
    }
    
    /**
     * Retourne les limites du sprite du vaisseau pour la détection de collision
     * @returns {Phaser.Geom.Rectangle} - Rectangle de collision du vaisseau
     */
    getBounds() {
        // Créer une hitbox plus large pour inclure les ailes du vaisseau
        const spriteWidth = this.sprite.width * this.sprite.scaleX;
        const spriteHeight = this.sprite.height * this.sprite.scaleY;
        
        // Élargir la hitbox horizontalement pour mieux couvrir les ailes
        // Tout en gardant une hauteur appropriée
        const widthMultiplier = 1.5; // 50% plus large pour inclure les ailes
        const heightMultiplier = 0.7; // Légèrement plus petit en hauteur pour plus de précision
        
        // Créer un rectangle correspondant à la position du groupe avec les dimensions ajustées
        const bounds = new Phaser.Geom.Rectangle(
            this.shipGroup.x - (spriteWidth * this.shipGroup.scale * widthMultiplier) / 2,
            this.shipGroup.y - (spriteHeight * this.shipGroup.scale * heightMultiplier) / 2,
            spriteWidth * this.shipGroup.scale * widthMultiplier,
            spriteHeight * this.shipGroup.scale * heightMultiplier
        );
        
        return bounds;
    }
    
    /**
     * Détruit le vaisseau et ses sprites associés
     */
    destroy() {
        if (this.shipGroup) {
            this.shipGroup.destroy();
        }
    }

    /**
     * Déplace le vaisseau vers la gauche
     * @param {number} speed - La vitesse de déplacement
     */
    moveLeft(speed) {
        this.shipGroup.x -= speed;
        
        // Maintenir le vaisseau dans les limites de l'écran
        this.shipGroup.x = Phaser.Math.Clamp(
            this.shipGroup.x, 
            20, 
            this.scene.game.config.width - 20
        );
    }

    /**
     * Déplace le vaisseau vers la droite
     * @param {number} speed - La vitesse de déplacement
     */
    moveRight(speed) {
        this.shipGroup.x += speed;
        
        // Maintenir le vaisseau dans les limites de l'écran
        this.shipGroup.x = Phaser.Math.Clamp(
            this.shipGroup.x, 
            20, 
            this.scene.game.config.width - 20
        );
    }

    /**
     * Déplace le vaisseau vers le haut
     * @param {number} speed - La vitesse de déplacement
     */
    moveUp(speed) {
        this.shipGroup.y -= speed;
        
        // Maintenir le vaisseau dans les limites de l'écran
        this.shipGroup.y = Phaser.Math.Clamp(
            this.shipGroup.y, 
            20, 
            this.scene.game.config.height - 20
        );
    }

    /**
     * Déplace le vaisseau vers le bas
     * @param {number} speed - La vitesse de déplacement
     */
    moveDown(speed) {
        this.shipGroup.y += speed;
        
        // Maintenir le vaisseau dans les limites de l'écran
        this.shipGroup.y = Phaser.Math.Clamp(
            this.shipGroup.y, 
            20, 
            this.scene.game.config.height - 20
        );
    }
}

export default Ship; 