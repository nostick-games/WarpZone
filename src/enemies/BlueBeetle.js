/**
 * Classe représentant le boss final BlueBeetle
 */
class BlueBeetle {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Créer le sprite du boss
        this.sprite = scene.add.sprite(x, y, 'bluebeetle').setScale(2);
        
        // Propriétés du boss
        this.health = 2500; // Très résistant
        this.maxHealth = 2500;
        this.speed = 50; // Vitesse de déplacement
        this.active = true;
        this.points = 10000; // Beaucoup de points pour le boss final
        
        // État du boss
        this.phase = 'entering'; // 'entering', 'moving', 'attacking1', 'attacking2'
        this.moveCount = 0; // Compteur de déplacements
        this.maxMoves = 3; // Nombre de déplacements avant attaque
        this.isMoving = false;
        this.attackInProgress = false;
        this.attackType = 'bullets'; // 'bullets' ou 'laser' - alterne entre les deux
        
        // Position d'entrée et cible
        this.entryY = y;
        this.targetY = 150; // Position finale (haut de l'écran mais visible)
        this.targetX = scene.game.config.width / 2;
        
        // Bullets du boss
        this.bullets = [];
        
        // Animation du sprite
        if (scene.anims.exists('bluebeetle_fly')) {
            this.sprite.play('bluebeetle_fly');
        }
        

        
        // Commencer l'animation d'entrée
        this.startEntryAnimation();
    }
    
    /**
     * Animation d'entrée du boss
     */
    startEntryAnimation() {

        
        // Déplacer le boss vers sa position finale
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.targetY,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {

                this.phase = 'moving';
                this.scheduleNextMove();
            }
        });
    }
    
    /**
     * Programme le prochain déplacement
     */
    scheduleNextMove() {
        if (this.phase !== 'moving' || this.attackInProgress) return;
        
        // Délai avant le prochain mouvement
        const delay = Phaser.Math.Between(1000, 2000);
        
        this.scene.time.delayedCall(delay, () => {
            this.moveToRandomPosition();
        });
    }
    
    /**
     * Déplace le boss vers une position aléatoire
     */
    moveToRandomPosition() {
        if (this.isMoving || this.attackInProgress || !this.active) return;
        
        this.isMoving = true;
        
        // Choisir une position aléatoire (rester dans la partie haute)
        const margin = 100;
        const newX = Phaser.Math.Between(margin, this.scene.game.config.width - margin);
        const newY = Phaser.Math.Between(80, 250);
        

        
        // Animer le déplacement
        this.scene.tweens.add({
            targets: this.sprite,
            x: newX,
            y: newY,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                this.isMoving = false;
                this.moveCount++;
                
                // Vérifier s'il faut attaquer
                if (this.moveCount >= this.maxMoves) {
                    this.startAttack();
                } else {
                    this.scheduleNextMove();
                }
            }
        });
    }
    
    /**
     * Commence une attaque
     */
    startAttack() {
        this.attackInProgress = true;
        
        // Alterner entre bullets et laser
        if (this.attackType === 'bullets') {
            this.bulletStorm();
            this.attackType = 'laser'; // Prochaine attaque sera un laser
        } else {
            this.laserBeam();
            this.attackType = 'bullets'; // Prochaine attaque sera des bullets
        }
    }
    
    /**
     * Attaque 1: Pluie de bullets en arc de cercle
     */
    bulletStorm() {

        
        // Position de départ des bullets (nez du boss)
        const startX = this.sprite.x;
        const startY = this.sprite.y + 89; // Bas du sprite (178/2 = 89)
        
        // Créer 8 bullets en arc de cercle
        const bulletCount = 8;
        const startAngle = Math.PI * 0.25; // 45 degrés
        const endAngle = Math.PI * 0.75; // 135 degrés
        const angleStep = (endAngle - startAngle) / (bulletCount - 1);
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + (angleStep * i);
            
            // Calculer la vélocité
            const speed = 150;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            
            // Créer la bullet avec un délai
            this.scene.time.delayedCall(i * 100, () => {
                this.createBullet(startX, startY, velocityX, velocityY);
            });
        }
        
        // Terminer l'attaque après que toutes les bullets soient tirées
        this.scene.time.delayedCall(bulletCount * 100 + 1000, () => {
            this.endAttack();
        });
    }
    
    /**
     * Attaque 2: Rayon laser composite avec effets visuels
     */
    laserBeam() {

        
        // Position du laser (depuis le nez du boss)
        const laserX = this.sprite.x;
        const laserY = this.sprite.y + 140; // 56 pixels plus haut
        
        // Conteneur pour tous les éléments du laser
        this.laserContainer = this.scene.add.container(laserX, laserY);
        this.laserContainer.setDepth(5);
        
        // Étape 1: Effet de charge (1_charge_effect.png)
        const chargeEffect = this.scene.add.sprite(0, -10, 'charge_effect').setScale(1.5);
        this.laserContainer.add(chargeEffect);
        
        chargeEffect.play('charge_effect_anim');
        
        // Démarrer charge_build au bout de 100ms
        this.scene.time.delayedCall(100, () => {
            // Vérifier si le boss est toujours actif et le container existe
            if (!this.active || !this.laserContainer) return;
            
            // Étape 2: Construction de charge (2_charge_build.png)
            const chargeBuild = this.scene.add.sprite(0, 0, 'charge_build').setScale(2);
            this.laserContainer.add(chargeBuild);
            
            chargeBuild.play('charge_build_anim');
        });
        
        chargeEffect.once('animationcomplete', () => {
            // Effacer l'effet de charge une fois terminé
            chargeEffect.destroy();
            
            // Attendre 1 seconde puis explosion d'allumage
            this.scene.time.delayedCall(1000, () => {
                // Vérifier si le boss est toujours actif et le container existe
                if (!this.active || !this.laserContainer) return;
                
                // Étape 3: Explosion d'allumage (3_ignition_burst.png)
                const ignitionBurst = this.scene.add.sprite(0, 0, 'ignition_burst').setScale(1.5);
                this.laserContainer.add(ignitionBurst);
                
                ignitionBurst.play('ignition_burst_anim');
                ignitionBurst.once('animationcomplete', () => {
                    // Vérifier si le boss est toujours actif et le container existe
                    if (!this.active || !this.laserContainer) return;
                    
                    // Effacer l'explosion d'allumage une fois terminée
                    ignitionBurst.destroy();
                    
                    // Arrêter l'animation de charge build
                    // Chercher et détruire chargeBuild dans le container
                    this.laserContainer.each(child => {
                        if (child.texture && child.texture.key === 'charge_build') {
                            child.destroy();
                        }
                    });
                    
                    // Étape 4: Origine du rayon (4_beam_origin.png)
                    const beamOrigin = this.scene.add.sprite(0, 0, 'beam_origin').setScale(2);
                    this.laserContainer.add(beamOrigin);
                    beamOrigin.play('beam_origin_anim');
                    
                    // Étape 5: Frames du rayon (5_beam_frames.png)
                    // Créer plusieurs segments du rayon pour couvrir toute la hauteur
                    const beamHeight = 128; // Hauteur d'un segment (avant scale)
                    const scaledBeamHeight = beamHeight * 2; // Hauteur après scale x2
                    const beamOriginBottom = 48; // Bottom du beam_origin (48/2 avec scale 2)
                    const totalHeight = this.scene.game.config.height - laserY + 20;
                    const numSegments = Math.ceil((totalHeight - beamOriginBottom) / scaledBeamHeight);
                    
                    this.laserSegments = [];
                    
                    for (let i = 0; i < numSegments; i++) {
                        // Premier segment commence juste en dessous du beam_origin, remonté de 10 pixels au total
                        const segmentY = beamOriginBottom + (i * scaledBeamHeight) + (scaledBeamHeight / 2) - 10;
                        const beamSegment = this.scene.add.sprite(0, segmentY, 'beam_frames').setScale(2);
                        this.laserContainer.add(beamSegment);
                        beamSegment.play('beam_frames_anim');
                        this.laserSegments.push(beamSegment);
                    }
                    
                    // Propriétés du laser pour les collisions
                    this.currentLaser = {
                        x: laserX,
                        y: laserY,
                        width: 32 * 2, // largeur du sprite x scale
                        height: totalHeight,
                        damage: 50,
                        isBossLaser: true,
                        getBounds: function() {
                            return new Phaser.Geom.Rectangle(
                                this.x - this.width / 2,
                                this.y,
                                this.width,
                                this.height
                            );
                        }
                    };
                    

                    
                    // Maintenir le laser pendant 3 secondes
                    this.scene.time.delayedCall(3000, () => {
                        // Vérifier si le boss est toujours actif
                        if (!this.active) return;
                        
                        // Nettoyer tous les éléments du laser
                        if (this.laserContainer) {
                            this.laserContainer.destroy();
                            this.laserContainer = null;
                        }
                        this.laserSegments = [];
                        this.currentLaser = null;
                        
                        this.endAttack();
                    });
                });
            });
        });
    }
    
    /**
     * Termine une attaque et reprend les déplacements
     */
    endAttack() {

        this.attackInProgress = false;
        this.moveCount = 0;
        this.phase = 'moving';
        this.scheduleNextMove();
    }
    
    /**
     * Crée une bullet du boss
     */
    createBullet(x, y, velocityX, velocityY) {
        const bullet = new BlueBeetleBullet(this.scene, x, y, velocityX, velocityY);
        this.bullets.push(bullet);
        
        // Ajouter à la liste des projectiles ennemis de l'EnemyManager
        if (this.scene.enemyManager) {
            this.scene.enemyManager.enemyBullets.push(bullet);
        }
        

    }
    
    /**
     * Met à jour le boss
     */
    update(time) {
        if (!this.active) return;
        
        // Mettre à jour les bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(time);
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Vérifier les collisions du laser avec le joueur
        if (this.currentLaser && this.scene.player && !this.scene.playerInvincible) {
            const playerBounds = this.scene.player.sprite.getBounds();
            const laserBounds = this.currentLaser.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(playerBounds, laserBounds)) {
                this.scene.handlePlayerHit();
            }
        }
    }
    
    /**
     * Gère les dégâts infligés au boss
     */
    hit(damage) {
        this.health -= damage;
        
        // Effet visuel de dégâts
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                if (this.sprite && this.active) {
                    this.sprite.alpha = 1.0;
                }
            }
        });
        

        
        // Vérifier si le boss est vaincu
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    /**
     * Détruit le boss
     */
    destroy() {

        
        this.active = false;
        
        // Nettoyer le laser actuel (nouveau système composite)
        if (this.laserContainer) {
            this.laserContainer.destroy();
            this.laserContainer = null;
        }
        if (this.laserSegments) {
            this.laserSegments = [];
        }
        if (this.currentLaser) {
            this.currentLaser = null;
        }
        
        // Nettoyer toutes les bullets
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
        this.bullets = [];
        
        // Effet d'explosion du boss
        const explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'explosion');
        explosion.setScale(4); // Grande explosion
        explosion.play('explode');
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Détruire le sprite
        this.sprite.destroy();
        
        // Déclencher la victoire avec un petit délai pour permettre au score d'être mis à jour
        this.scene.time.delayedCall(100, () => {
            this.scene.handleBossVictory();
        });
    }
    
    /**
     * Retourne les bullets actives du boss
     */
    getBullets() {
        return this.bullets.filter(bullet => bullet.active);
    }
}

/**
 * Classe pour les bullets du boss BlueBeetle
 */
class BlueBeetleBullet {
    constructor(scene, x, y, velocityX, velocityY) {
        this.scene = scene;
        this.active = true;
        
        // Créer le sprite de la bullet
        this.sprite = scene.add.sprite(x, y, 'bullet').setScale(2);
        
        // Propriétés de mouvement
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        
        // Propriétés de la bullet
        this.damage = 1;
        this.lifetime = 10000; // 10 secondes
        this.creationTime = scene.time.now;
        
        // Animation de la bullet
        if (scene.anims.exists('bullet_anim')) {
            this.sprite.play('bullet_anim');
        }
        
        // Référence pour l'accès facile
        this.sprite.parentBullet = this;
    }
    
    /**
     * Met à jour la bullet
     */
    update(time) {
        if (!this.active) return;
        
        // Mouvement
        const deltaSeconds = 1/60;
        this.sprite.x += this.velocityX * deltaSeconds;
        this.sprite.y += this.velocityY * deltaSeconds;
        
        // Vérifier si hors écran
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        if (this.sprite.x < -50 || this.sprite.x > gameWidth + 50 || 
            this.sprite.y < -50 || this.sprite.y > gameHeight + 50) {
            this.destroy();
            return;
        }
        
        // Vérifier la durée de vie
        if (time - this.creationTime > this.lifetime) {
            this.destroy();
        }
    }
    
    /**
     * Détruit la bullet
     */
    destroy() {
        this.active = false;
        
        if (this.sprite && this.sprite.scene) {
            this.sprite.destroy();
        }
    }
    
    /**
     * Retourne les limites pour la collision
     */
    getBounds() {
        if (!this.sprite || !this.active) return null;
        return this.sprite.getBounds();
    }
}

export default BlueBeetle; 