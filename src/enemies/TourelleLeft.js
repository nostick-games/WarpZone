/**
 * Classe représentant l'ennemi TourelleLeft - astroport avec tourelle au centre (version gauche)
 */
class TourelleLeft {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Créer le sprite de l'astroport (en miroir vertical)
        this.astroport = scene.add.sprite(x, y, 'astroport').setScale(1);
        // Appliquer le miroir vertical (flipX)
        this.astroport.setFlipX(true);
        
        // Créer le sprite de la tourelle au centre de l'astroport, décalée de 10px vers la gauche
        this.sprite = scene.add.sprite(x - 10, y, 'tourelle_new').setScale(2);
        this.sprite.setFrame(0); // Commencer à la frame 0 (fixe)
        // Appliquer le miroir vertical à la tourelle aussi
        this.sprite.setFlipX(true);
        
        // Propriétés de l'ennemi (seule la tourelle a une hitbox)
        this.health = 100; // Résistance de 100
        this.speed = 30; // Vitesse de déplacement (lente)
        this.active = true; // Indique si l'ennemi est actif
        this.points = 1000; // Points rapportés lors de la destruction
        this.tourelleDestroyed = false; // Indique si la tourelle a été détruite
        
        // Propriétés pour les phases de tir
        this.currentPhase = 0; // 0: descente initiale, 1: premier tir, 2: deuxième tir, 3: troisième tir
        this.phasePositions = [
            scene.game.config.height / 5,     // 1/5 de la fenêtre
            scene.game.config.height * 3/5,   // 3/5 de la fenêtre
            scene.game.config.height * 4/5    // 4/5 de la fenêtre (presque en bas)
        ];
        
        // États des animations et tirs
        this.animationInProgress = false;
        this.bulletSprites = []; // Stockage des bullets tirées
        
        // Ajouter une référence à cet objet dans le sprite pour faciliter l'accès
        this.sprite.parentEnemy = this;
        

    }
    
    /**
     * Démarre l'animation de tir selon la phase
     * @param {number} phase - Phase de tir (1, 2 ou 3)
     */
    startFireAnimation(phase) {
        if (!this.active || this.animationInProgress) return;
        
        this.animationInProgress = true;
        
        let animKey;
        let startFrame, endFrame;
        
        switch (phase) {
            case 1: // Frame 1 à 11
                animKey = 'tourelle_left_new_fire1';
                startFrame = 1;
                endFrame = 11;
                break;
            case 2: // Frame 11 à 5 (rembobinage)
                animKey = 'tourelle_left_new_fire2';
                startFrame = 11;
                endFrame = 5;
                break;
            case 3: // Frame 5 à 2 (rembobinage final)
                animKey = 'tourelle_left_new_fire3';
                startFrame = 5;
                endFrame = 2;
                break;
        }
        
        // Créer l'animation si elle n'existe pas
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers('tourelle_new', { start: startFrame, end: endFrame }),
                frameRate: 8,
                repeat: 0
            });
        }
        
        // Jouer l'animation
        try {
            this.sprite.play(animKey);
            
            // Écouter la fin de l'animation pour tirer les bullets
            this.sprite.once('animationcomplete', () => {
                if (this.active) {
                    this.fireBullets();
                    this.animationInProgress = false;
                }
            });
            
        } catch (error) {
            console.warn(`Impossible de jouer l'animation ${animKey}:`, error);
            this.animationInProgress = false;
        }
    }
    
    /**
     * Tire quatre bullets en arc de cercle vers la droite (inverse de la tourelle de droite)
     */
    fireBullets() {
        if (!this.active) return;
        
        // Position de départ des bullets (centre de la tourelle)
        const startX = this.sprite.x;
        const startY = this.sprite.y;
        
        // Créer 4 bullets en arc de cercle vers la droite (inverse de la tourelle de droite)
        const bulletCount = 4;
        const baseAngle = 0; // 0° (vers la droite, inverse de Math.PI pour la gauche)
        const arcSpread = Math.PI / 3; // 60° d'arc total
        const angleStep = arcSpread / (bulletCount - 1);
        
        for (let i = 0; i < bulletCount; i++) {
            // Calculer l'angle pour cette bullet (inverse de la tourelle de droite)
            const angle = baseAngle - arcSpread/2 + (i * angleStep);
            
            // Calculer les vitesses
            const bulletSpeed = 150;
            const velocityX = Math.cos(angle) * bulletSpeed;
            const velocityY = Math.sin(angle) * bulletSpeed;
            
            // Créer la bullet
            const bullet = new TourelleLeftBullet(this.scene, startX, startY, velocityX, velocityY);
            this.bulletSprites.push(bullet);
            
            // Ajouter la bullet au gestionnaire d'ennemis
            if (this.scene.enemyManager) {
                this.scene.enemyManager.enemyBullets.push(bullet);
            }
        }
    }
    
    /**
     * Méthode statique pour précharger les assets
     */
    static preload(scene) {
        scene.load.image('astroport', 'assets/enemies/astroport.png');
        scene.load.spritesheet('tourelle_new', 'assets/enemies/tourelle_new.png', { frameWidth: 32, frameHeight: 32 });
    }
    
    /**
     * Met à jour la tourelle
     */
    update(time) {
        if (!this.active) return;
        
        // Déplacer l'astroport vers le bas (toujours)
        this.astroport.y += this.speed * (1/60);
        
        // Déplacer la tourelle seulement si elle n'est pas détruite
        if (!this.tourelleDestroyed && this.sprite) {
            this.sprite.y += this.speed * (1/60);
            // Maintenir le décalage de 10 pixels vers la gauche pour la tourelle
            this.sprite.x = this.astroport.x - 10;
            
            // Vérifier les phases de tir seulement si la tourelle existe
            if (this.currentPhase < 3 && this.sprite.y >= this.phasePositions[this.currentPhase] && !this.animationInProgress) {
                this.currentPhase++;
                this.startFireAnimation(this.currentPhase);
            }
        }
        
        // Nettoyer les bullets inactives
        for (let i = this.bulletSprites.length - 1; i >= 0; i--) {
            const bullet = this.bulletSprites[i];
            if (!bullet.active) {
                this.bulletSprites.splice(i, 1);
            } else {
                bullet.update(time);
            }
        }
        
        // Détruire l'ensemble si l'astroport est sorti de l'écran
        if (this.astroport.y > this.scene.game.config.height + 100) {
            this.destroy();
        }
    }
    
    /**
     * Gère les dégâts infligés à la tourelle
     */
    hit(damage) {
        if (!this.active || this.tourelleDestroyed) return false;
        
        this.health -= damage;
        
        // Effet visuel de dégâts (seule la tourelle clignote)
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // S'assurer que l'alpha revient à 1 après le clignotement
                if (this.sprite && this.sprite.active) {
                    this.sprite.setAlpha(1);
                }
            }
        });
        
        if (this.health <= 0) {
            
            // Créer une explosion sur la tourelle uniquement (pas sur l'astroport)
            const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'explosion');
            explosion.setScale(1.5); // Explosion un peu plus petite pour correspondre à la tourelle
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Détruire seulement la tourelle, pas l'astroport
            this.destroyTourelle();
            return true; // Ennemi détruit
        }
        
        return false; // Ennemi toujours vivant
    }
    
    /**
     * Détruit seulement la tourelle, l'astroport continue à descendre
     */
    destroyTourelle() {
        this.tourelleDestroyed = true;
        
        // Détruire seulement le sprite de la tourelle
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        // Détruire toutes les bullets associées
        this.bulletSprites.forEach(bullet => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
        this.bulletSprites = [];
    }

    /**
     * Détruit la tourelle et nettoie les ressources
     */
    destroy() {
        if (!this.active) return;
        
        this.active = false;
        
        // Détruire les sprites
        if (this.astroport) {
            this.astroport.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        // Détruire toutes les bullets associées
        this.bulletSprites.forEach(bullet => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
        this.bulletSprites = [];
    }
    
    /**
     * Retourne les bullets de la tourelle
     */
    getBullets() {
        return this.bulletSprites.filter(bullet => bullet.active);
    }
}

/**
 * Classe représentant les projectiles de la tourelle gauche
 */
class TourelleLeftBullet {
    constructor(scene, x, y, velocityX, velocityY) {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, 'bullet');
        this.sprite.setScale(2);
        
        // Propriétés du projectile
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.active = true;
        this.power = 10; // Dégâts infligés au joueur
        
        // Jouer l'animation si elle existe
        if (scene.anims.exists('bullet_anim')) {
            this.sprite.play('bullet_anim');
        }
        

    }
    
    /**
     * Met à jour le projectile
     */
    update(time) {
        if (!this.active) return;
        
        // Déplacer le projectile
        this.sprite.x += this.velocityX * (1/60);
        this.sprite.y += this.velocityY * (1/60);
        
        // Détruire si sorti de l'écran
        if (this.sprite.x < -50 || this.sprite.x > this.scene.game.config.width + 50 ||
            this.sprite.y < -50 || this.sprite.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
    }
    
    /**
     * Détruit le projectile
     */
    destroy() {
        if (!this.active) return;
        
        this.active = false;
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
    
    /**
     * Retourne les limites du projectile pour les collisions
     */
    getBounds() {
        if (!this.sprite || !this.active) return null;
        return this.sprite.getBounds();
    }
}

// Exporter la classe pour l'utiliser ailleurs
export default TourelleLeft; 