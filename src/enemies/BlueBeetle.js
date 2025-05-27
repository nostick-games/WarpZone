/**
 * Classe représentant le boss final BlueBeetle
 * Version composite avec tronc et ailes séparées
 */
class BlueBeetle {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Créer un conteneur pour tous les composants du boss
        this.container = scene.add.container(x, y);
        this.container.setDepth(10);
        
        // Créer les sprites des composants avec leurs positions relatives
        this.troncSprite = scene.add.sprite(0, 0, 'bluebeetle_tronc').setScale(2);
        
        // Ailes arrière (au milieu du boss)
        this.aileArDroiteSprite = scene.add.sprite(60, 20, 'bluebeetle_aile_ar_droite').setScale(2);
        this.aileArGaucheSprite = scene.add.sprite(-60, 20, 'bluebeetle_aile_ar_gauche').setScale(2);
        
        // Ailes avant (en bas du boss)
        this.aileAvDroiteSprite = scene.add.sprite(80, 100, 'bluebeetle_aile_av_droite').setScale(2);
        this.aileAvGaucheSprite = scene.add.sprite(-80, 100, 'bluebeetle_aile_av_gauche').setScale(2);
        
        // Ajouter les sprites au conteneur dans l'ordre de profondeur
        // (ailes arrière en premier, puis ailes avant, puis tronc au centre)
        this.container.add([
            this.aileArDroiteSprite,
            this.aileArGaucheSprite,
            this.aileAvDroiteSprite,
            this.aileAvGaucheSprite,
            this.troncSprite
        ]);
        
        // Propriétés de santé pour chaque composant
        this.troncHealth = 500;
        this.troncMaxHealth = 500;
        this.aileArDroiteHealth = 250;
        this.aileArDroiteMaxHealth = 250;
        this.aileArGaucheHealth = 250;
        this.aileArGaucheMaxHealth = 250;
        this.aileAvDroiteHealth = 250;
        this.aileAvDroiteMaxHealth = 250;
        this.aileAvGaucheHealth = 250;
        this.aileAvGaucheMaxHealth = 250;
        
        // État des composants
        this.aileArDroiteDestroyed = false;
        this.aileArGaucheDestroyed = false;
        this.aileAvDroiteDestroyed = false;
        this.aileAvGaucheDestroyed = false;
        this.troncDestroyed = false;
        
        // Propriétés générales du boss
        this.active = true;
        this.points = 10000;
        this.speed = 50;
        
        // État du boss
        this.phase = 'entering';
        this.moveCount = 0;
        this.maxMoves = 3;
        this.isMoving = false;
        this.attackInProgress = false;
        this.attackType = 'bullets';
        
        // Position d'entrée et cible
        this.entryY = y;
        this.targetY = 150;
        this.targetX = scene.game.config.width / 2;
        
        // Bullets du boss
        this.bullets = [];
        
        // Animation du tronc
        if (scene.anims.exists('bluebeetle_tronc_fly')) {
            this.troncSprite.play('bluebeetle_tronc_fly');
        }
        
        // Référence du sprite principal pour la compatibilité avec EnemyManager
        this.sprite = this.container;
        
        // Les zones de collision correspondent maintenant aux positions réelles des sprites
        // (les sprites étant maintenant positionnés correctement, on utilise leurs bounds directement)
        
        // Commencer l'animation d'entrée
        this.startEntryAnimation();
    }
    
    /**
     * Animation d'entrée du boss
     */
    startEntryAnimation() {
        // Déplacer le boss vers sa position finale
        this.scene.tweens.add({
            targets: this.container,
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
        
        const margin = 100;
        const newX = Phaser.Math.Between(margin, this.scene.game.config.width - margin);
        const newY = Phaser.Math.Between(80, 250);
        
        this.scene.tweens.add({
            targets: this.container,
            x: newX,
            y: newY,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                this.isMoving = false;
                this.moveCount++;
                
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
        
        if (this.attackType === 'bullets') {
            this.bulletStorm();
            this.attackType = 'laser';
        } else {
            this.laserBeam();
            this.attackType = 'bullets';
        }
    }
    
    /**
     * Attaque 1: Pluie de bullets en arc de cercle
     */
    bulletStorm() {
        const startX = this.container.x;
        const startY = this.container.y + 98; // Remonté de 80 pixels (178 - 80 = 98)
        
        const bulletCount = 8;
        const startAngle = Math.PI * 0.25;
        const endAngle = Math.PI * 0.75;
        const angleStep = (endAngle - startAngle) / (bulletCount - 1);
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = startAngle + (angleStep * i);
            
            const speed = 150;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            
            this.scene.time.delayedCall(i * 100, () => {
                this.createBullet(startX, startY, velocityX, velocityY);
            });
        }
        
        this.scene.time.delayedCall(bulletCount * 100 + 1000, () => {
            this.endAttack();
        });
    }
    
    /**
     * Attaque 2: Rayon laser composite avec effets visuels
     */
    laserBeam() {
        const laserX = this.container.x;
        const laserY = this.container.y + 200; // Remonté de 80 pixels (280 - 80 = 200)
        
        this.laserContainer = this.scene.add.container(laserX, laserY);
        this.laserContainer.setDepth(15); // Au-dessus du boss (depth 10)
        
        const chargeEffect = this.scene.add.sprite(0, -10, 'charge_effect').setScale(1.5);
        this.laserContainer.add(chargeEffect);
        
        chargeEffect.play('charge_effect_anim');
        
        this.scene.time.delayedCall(100, () => {
            if (!this.active || !this.laserContainer) return;
            
            const chargeBuild = this.scene.add.sprite(0, 0, 'charge_build').setScale(2);
            this.laserContainer.add(chargeBuild);
            
            chargeBuild.play('charge_build_anim');
        });
        
        chargeEffect.once('animationcomplete', () => {
            if (!this.active || !this.laserContainer) return;
            
            // Effacer l'effet de charge
            chargeEffect.destroy();
            
            const ignitionBurst = this.scene.add.sprite(0, 0, 'ignition_burst').setScale(2);
            this.laserContainer.add(ignitionBurst);
            
            ignitionBurst.play('ignition_burst_anim');
            
            ignitionBurst.once('animationcomplete', () => {
                if (!this.active || !this.laserContainer) return;
                
                // Effacer l'effet d'ignition
                ignitionBurst.destroy();
                
                const beamOrigin = this.scene.add.sprite(0, 0, 'beam_origin').setScale(2);
                this.laserContainer.add(beamOrigin);
                beamOrigin.play('beam_origin_anim');
                
                this.laserSegments = [];
                const segmentHeight = 128;
                const gameHeight = this.scene.game.config.height;
                const segmentCount = Math.ceil((gameHeight - laserY) / segmentHeight) + 1;
                
                for (let i = 0; i < segmentCount; i++) {
                    const segment = this.scene.add.sprite(0, (i + 1) * segmentHeight + 30, 'beam_frames').setScale(2); // +30 pixels vers le bas
                    this.laserContainer.add(segment);
                    segment.play('beam_frames_anim');
                    this.laserSegments.push(segment);
                }
                
                this.currentLaser = {
                    getBounds: () => {
                        if (!this.laserContainer || !this.active) return null;
                        return new Phaser.Geom.Rectangle(
                            laserX - 32,
                            laserY + 30, // Ajuster la collision pour correspondre au déplacement visuel
                            64,
                            gameHeight - (laserY + 30)
                        );
                    }
                };
                
                this.scene.time.delayedCall(2000, () => {
                    this.endAttack();
                });
            });
        });
    }
    
    /**
     * Termine l'attaque en cours
     */
    endAttack() {
        this.attackInProgress = false;
        this.moveCount = 0;
        
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
        
        this.scheduleNextMove();
    }
    
    /**
     * Crée un projectile du boss
     */
    createBullet(x, y, velocityX, velocityY) {
        const bullet = new BlueBeetleBullet(this.scene, x, y, velocityX, velocityY);
        this.bullets.push(bullet);
        
        if (this.scene.enemyManager) {
            this.scene.enemyManager.enemyBullets.push(bullet);
        }
    }
    
    /**
     * Met à jour le boss
     */
    update(time) {
        if (!this.active) return;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(time);
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
            }
        }
        
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
     * Détermine quel composant a été touché et applique les dégâts
     */
    hit(damage, hitComponent = null) {
        // Vérifier si toutes les ailes sont détruites
        const allWingsDestroyed = this.aileArDroiteDestroyed && this.aileArGaucheDestroyed && 
                                  this.aileAvDroiteDestroyed && this.aileAvGaucheDestroyed;
        
        // Si un composant spécifique a été touché
        if (hitComponent) {
            if (hitComponent === 'tronc' && allWingsDestroyed && !this.troncDestroyed) {
                // Dégâts au tronc
                this.troncHealth -= damage;
                this.showDamageEffect(this.troncSprite);
                
                if (this.troncHealth <= 0) {
                    this.troncDestroyed = true;
                    this.troncSprite.setVisible(false);
                    this.destroy();
                    return true;
                }
            } else if (hitComponent !== 'tronc') {
                // Vérifier si l'aile touchée n'est pas déjà détruite
                const isWingDestroyed = this.isWingDestroyed(hitComponent);
                if (!isWingDestroyed) {
                    // Dégâts à une aile spécifique
                    this.damageWing(hitComponent, damage);
                }
            }
        } else {
            // Logique de fallback : comportement aléatoire si pas de composant spécifié
            if (allWingsDestroyed && !this.troncDestroyed) {
                this.troncHealth -= damage;
                this.showDamageEffect(this.troncSprite);
                
                if (this.troncHealth <= 0) {
                    this.troncDestroyed = true;
                    this.troncSprite.setVisible(false);
                    this.destroy();
                    return true;
                }
            } else {
                // Endommager une aile aléatoire qui n'est pas encore détruite
                const availableWings = [];
                
                if (!this.aileArDroiteDestroyed) availableWings.push('aileArDroite');
                if (!this.aileArGaucheDestroyed) availableWings.push('aileArGauche');
                if (!this.aileAvDroiteDestroyed) availableWings.push('aileAvDroite');
                if (!this.aileAvGaucheDestroyed) availableWings.push('aileAvGauche');
                
                if (availableWings.length > 0) {
                    const randomWing = availableWings[Math.floor(Math.random() * availableWings.length)];
                    this.damageWing(randomWing, damage);
                }
            }
        }
        
        return false;
    }
    
    /**
     * Vérifie si une aile est détruite
     */
    isWingDestroyed(wingName) {
        switch (wingName) {
            case 'aileArDroite':
                return this.aileArDroiteDestroyed;
            case 'aileArGauche':
                return this.aileArGaucheDestroyed;
            case 'aileAvDroite':
                return this.aileAvDroiteDestroyed;
            case 'aileAvGauche':
                return this.aileAvGaucheDestroyed;
            default:
                return false;
        }
    }

    /**
     * Obtient la zone de collision d'un composant en coordonnées mondiales
     */
    getComponentCollisionZone(componentName) {
        let sprite = null;
        
        // Obtenir le sprite correspondant
        switch (componentName) {
            case 'aileArDroite':
                sprite = this.aileArDroiteSprite;
                break;
            case 'aileArGauche':
                sprite = this.aileArGaucheSprite;
                break;
            case 'aileAvDroite':
                sprite = this.aileAvDroiteSprite;
                break;
            case 'aileAvGauche':
                sprite = this.aileAvGaucheSprite;
                break;
            case 'tronc':
                sprite = this.troncSprite;
                break;
            default:
                return null;
        }
        
        if (!sprite || !sprite.visible) return null;
        
        // Convertir les coordonnées locales du sprite en coordonnées mondiales
        const worldPos = this.container.getWorldTransformMatrix().transformPoint(sprite.x, sprite.y);
        
        // Calculer les bounds en coordonnées mondiales avec réduction pour plus de précision
        const fullWidth = sprite.width * sprite.scaleX;
        const fullHeight = sprite.height * sprite.scaleY;
        
        // Facteurs de réduction pour chaque composant (ajustés selon la forme réelle)
        let widthReduction = 0.8;  // Réduire de 20% par défaut
        let heightReduction = 0.8;
        
        switch (componentName) {
            case 'aileArDroite':
            case 'aileArGauche':
                // Ailes arrière : plus étroites, forme allongée
                widthReduction = 0.7;
                heightReduction = 0.8;
                break;
            case 'aileAvDroite':
            case 'aileAvGauche':
                // Ailes avant : plus larges mais plus courtes
                widthReduction = 0.8;
                heightReduction = 0.7;
                break;
            case 'tronc':
                // Tronc : forme plus compacte au centre
                widthReduction = 0.6;
                heightReduction = 0.8;
                break;
        }
        
        const width = fullWidth * widthReduction;
        const height = fullHeight * heightReduction;
        
        return {
            x: worldPos.x - width / 2,
            y: worldPos.y - height / 2,
            width: width,
            height: height,
            centerX: worldPos.x,
            centerY: worldPos.y
        };
    }

    /**
     * Endommage une aile spécifique
     */
    damageWing(wingName, damage) {
        switch (wingName) {
            case 'aileArDroite':
                this.aileArDroiteHealth -= damage;
                this.showDamageEffect(this.aileArDroiteSprite);
                if (this.aileArDroiteHealth <= 0) {
                    this.aileArDroiteDestroyed = true;
                    this.aileArDroiteSprite.setVisible(false);
                    this.createWingExplosion(this.aileArDroiteSprite);
                }
                break;
            case 'aileArGauche':
                this.aileArGaucheHealth -= damage;
                this.showDamageEffect(this.aileArGaucheSprite);
                if (this.aileArGaucheHealth <= 0) {
                    this.aileArGaucheDestroyed = true;
                    this.aileArGaucheSprite.setVisible(false);
                    this.createWingExplosion(this.aileArGaucheSprite);
                }
                break;
            case 'aileAvDroite':
                this.aileAvDroiteHealth -= damage;
                this.showDamageEffect(this.aileAvDroiteSprite);
                if (this.aileAvDroiteHealth <= 0) {
                    this.aileAvDroiteDestroyed = true;
                    this.aileAvDroiteSprite.setVisible(false);
                    this.createWingExplosion(this.aileAvDroiteSprite);
                }
                break;
            case 'aileAvGauche':
                this.aileAvGaucheHealth -= damage;
                this.showDamageEffect(this.aileAvGaucheSprite);
                if (this.aileAvGaucheHealth <= 0) {
                    this.aileAvGaucheDestroyed = true;
                    this.aileAvGaucheSprite.setVisible(false);
                    this.createWingExplosion(this.aileAvGaucheSprite);
                }
                break;
        }
    }
    
    /**
     * Affiche un effet visuel de dégâts sur un sprite
     */
    showDamageEffect(sprite) {
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                if (sprite && this.active) {
                    sprite.alpha = 1.0;
                }
            }
        });
    }
    
    /**
     * Crée une explosion spectaculaire pour une aile détruite
     */
    createWingExplosion(wingSprite) {
        const worldPos = this.container.getWorldTransformMatrix().transformPoint(wingSprite.x, wingSprite.y);
        
        // 1. Explosion principale avec bomb_explosion (15 frames, 64x64)
        const mainExplosion = this.scene.add.sprite(worldPos.x, worldPos.y, 'bomb_explosion');
        mainExplosion.setScale(2); // Échelle x2 pour plus d'impact
        mainExplosion.setDepth(20); // Au-dessus de tout
        mainExplosion.play('bomb_explode');
        mainExplosion.once('animationcomplete', () => {
            mainExplosion.destroy();
        });
        
        // 2. Effets de dégâts persistants (BlueBeetle_degat1 et BlueBeetle_degat2)
        // Créer plusieurs particules de dégâts à des positions aléatoires autour de l'explosion
        const damageEffects = [];
        const numEffects = 8; // Nombre d'effets de dégâts
        
        for (let i = 0; i < numEffects; i++) {
            // Position aléatoire autour de l'explosion
            const offsetX = Phaser.Math.Between(-40, 40);
            const offsetY = Phaser.Math.Between(-40, 40);
            const effectX = worldPos.x + offsetX;
            const effectY = worldPos.y + offsetY;
            
            // Alterner entre degat1 et degat2
            const damageType = (i % 2 === 0) ? 'bluebeetle_degat1' : 'bluebeetle_degat2';
            const animKey = (i % 2 === 0) ? 'bluebeetle_degat1_anim' : 'bluebeetle_degat2_anim';
            
            const damageEffect = this.scene.add.sprite(effectX, effectY, damageType);
            damageEffect.setScale(Phaser.Math.FloatBetween(1.5, 3)); // Échelle variable pour plus de variété
            damageEffect.setDepth(15); // Sous l'explosion principale mais au-dessus du boss
            damageEffect.play(animKey);
            
            // Ajouter un léger mouvement aléatoire sur toute la durée
            this.scene.tweens.add({
                targets: damageEffect,
                x: effectX + Phaser.Math.Between(-30, 30),
                y: effectY + Phaser.Math.Between(-30, 30),
                alpha: { from: 1, to: 0.4 },
                duration: 2500, // Mouvement sur 2.5 secondes
                ease: 'Power2'
            });
            
            damageEffects.push(damageEffect);
        }
        
        // 3. Faire disparaître tous les effets de dégâts après 3 secondes
        this.scene.time.delayedCall(3000, () => {
            damageEffects.forEach(effect => {
                if (effect && effect.active) {
                    // Animation de disparition
                    this.scene.tweens.add({
                        targets: effect,
                        alpha: 0,
                        scale: 0.5,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            effect.destroy();
                        }
                    });
                }
            });
        });
        
        // 4. Effet de secousse de la caméra pour plus d'impact
        this.scene.cameras.main.shake(300, 0.01);
    }
    
    /**
     * Détruit le boss
     */
    destroy() {
        this.active = false;
        
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
        
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
        this.bullets = [];
        
        const explosion = this.scene.add.sprite(this.container.x, this.container.y, 'explosion');
        explosion.setScale(4);
        explosion.play('explode');
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });
        
        this.container.destroy();
        
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
        
        this.sprite = scene.add.sprite(x, y, 'bullet').setScale(2);
        
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        
        this.damage = 1;
        this.lifetime = 10000;
        this.creationTime = scene.time.now;
        
        if (scene.anims.exists('bullet_anim')) {
            this.sprite.play('bullet_anim');
        }
        
        this.sprite.parentBullet = this;
    }
    
    update(time) {
        if (!this.active) return;
        
        const deltaSeconds = 1/60;
        this.sprite.x += this.velocityX * deltaSeconds;
        this.sprite.y += this.velocityY * deltaSeconds;
        
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        if (this.sprite.x < -50 || this.sprite.x > gameWidth + 50 || 
            this.sprite.y < -50 || this.sprite.y > gameHeight + 50) {
            this.destroy();
            return;
        }
        
        if (time - this.creationTime > this.lifetime) {
            this.destroy();
        }
    }
    
    destroy() {
        this.active = false;
        
        if (this.sprite && this.sprite.scene) {
            this.sprite.destroy();
        }
    }
    
    getBounds() {
        if (!this.sprite || !this.active) return null;
        return this.sprite.getBounds();
    }
}

export default BlueBeetle; 