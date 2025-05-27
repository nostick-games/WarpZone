/**
 * Gestionnaire des ennemis
 * Gère l'apparition, la mise à jour et les collisions des ennemis
 */
import EnemyBullet from './EnemyBullet.js';
import EnemySpawner from './EnemySpawner.js';

class EnemyManager {
    constructor(scene, startTime, forceDifficultyLevel = null) {
        this.scene = scene;
        
        // Liste des ennemis actifs
        this.enemies = [];
        
        // Liste des projectiles ennemis actifs
        this.enemyBullets = [];
        
        // Propriétés du système d'apparition
        this.nextEnemyTime = 0;
        this.enemySpawnDelay = 1500; // Réduit de 2000 à 1500 ms pour plus de fréquence
        this.minSpawnDelay = 500;    // Délai minimum lorsque la difficulté augmente
        
        // Propriétés de difficulté
        this.difficultyLevel = forceDifficultyLevel !== null ? forceDifficultyLevel : 1; // Permettre de forcer un niveau de difficulté
        this.difficultyIncreaseTime = 30000; // 30 secondes
        this.lastDifficultyIncrease = startTime || 0; // Utiliser startTime, fallback à 0 si non fourni pour rétrocompatibilité
        
        // Propriétés spéciales pour PurpleDeath
        this.lastPurpleDeathSpawn = 0;
        this.purpleDeathSpawnInterval = 15000; // 15 secondes entre chaque PurpleDeath (réduit pour test)
        
        // Propriétés spéciales pour Tourelle
        this.lastTourelleSpawn = 0;
        this.tourelleSpawnInterval = 20000; // 20 secondes entre chaque Tourelle
        
        // Propriétés spéciales pour le boss BlueBeetle
        this.bossSpawned = false; // Indique si le boss a déjà été spawné
        this.boss = null; // Référence au boss actuel
        
        // Débogage visuel des collisions
        this.debugCollision = false; // Mettre à true pour activer le débogage visuel
        
        // Compteurs pour diagnostic
        this.updateCallCount = 0;
        this.lastLogTime = 0;
        
        // Initialiser le gestionnaire d'apparition
        this.spawner = new EnemySpawner(this);
        
        // Chargement des classes d'ennemis
        // Ces classes seront chargées séparément dans le HTML
    }
    
    preloadAssets() {
        // Cette méthode est maintenant vide car le chargement des assets 
        // est géré directement dans GameScene.preload()
        // et les animations dans GameScene.initEnemyManager()
    }
    
    update(time) {
        // Incrémenter le compteur d'appels update
        this.updateCallCount++;
        

        
        // Effacer les graphiques de débogage (géré par CollisionManager)
        if (this.scene.collisionManager && this.debugCollision) {
            // this.scene.collisionManager.clearDebugGraphics(); // Déplacé, car EnemyManager gère le this.debugCollision flag
        }
        
        // Mettre à jour tous les ennemis actifs
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Vérifier si l'ennemi est toujours actif
            if (!enemy.active) {
                // Supprimer de la liste si inactif
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Mettre à jour l'ennemi (passer le temps pour les ennemis qui en ont besoin)
            enemy.update(time);
            
            // Si c'est une tourelle, récupérer ses bullets et les ajouter à la liste globale
            if (enemy.constructor.name === 'Tourelle' && enemy.getBullets) {
                const tourelleBullets = enemy.getBullets();
                for (const bullet of tourelleBullets) {
                    // Vérifier si cette bullet n'est pas déjà dans la liste globale
                    if (!this.enemyBullets.includes(bullet)) {
                        this.enemyBullets.push(bullet);
                    }
                }
            }
        }
        
        // Mettre à jour tous les projectiles ennemis actifs
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // Vérifier si le projectile est toujours actif
            if (!bullet.active) {
                // Supprimer de la liste si inactif
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // Mettre à jour le projectile
            bullet.update(time);
        }
        
        // Vérifier s'il est temps de faire apparaître un nouvel ennemi
        if (time > this.nextEnemyTime) {
            // Au niveau 6, ne plus faire apparaître d'ennemis normaux (seul le boss)
            if (this.difficultyLevel < 6) {
                this.spawner.spawnEnemy(time);
                
                // Ajuster le délai en fonction de la difficulté
                const delay = this.spawner.getSpawnDelay();
                this.nextEnemyTime = time + delay;
                
                // Forcer l'apparition d'un autre ennemi peu après si le niveau de difficulté est élevé
                if (this.difficultyLevel >= 2 && Math.random() < 0.3) {
                    this.scene.time.delayedCall(700, () => {
                        this.spawner.spawnEnemy(time + 700);
                    });
                }
            } else {
                // Au niveau 6, espacer beaucoup les vérifications car plus d'ennemis normaux
                this.nextEnemyTime = time + 10000; // 10 secondes d'attente
            }
        }
        
        // Vérifier s'il est temps d'augmenter la difficulté
        if (time > this.lastDifficultyIncrease + this.difficultyIncreaseTime) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = time;
        }
        
        // Vérifier s'il est temps de faire apparaître PurpleDeath (niveau 2+)
        const purpleDeathTimeCheck = time > this.lastPurpleDeathSpawn + this.purpleDeathSpawnInterval;
        const purpleDeathClassExists = !!this.scene.PurpleDeath;
        
        // Ne pas faire apparaître PurpleDeath si le boss est spawné
        if (this.difficultyLevel >= 2 && purpleDeathTimeCheck && purpleDeathClassExists && !this.bossSpawned) {
            this.spawner.spawnPurpleDeath(time);
            this.lastPurpleDeathSpawn = time;
        }
        
        // Vérifier s'il est temps de faire apparaître une Tourelle (niveau 3+)
        const tourelleTimeCheck = time > this.lastTourelleSpawn + this.tourelleSpawnInterval;
        const tourelleClassExists = !!this.scene.Tourelle;
        
        // Ne pas faire apparaître de Tourelle si le boss est spawné
        if (this.difficultyLevel >= 3 && tourelleTimeCheck && tourelleClassExists && !this.bossSpawned) {
            this.spawner.spawnTourelle(time);
            this.lastTourelleSpawn = time;
        }
        
        // Vérifier s'il faut faire apparaître le boss BlueBeetle (niveau 6 uniquement)
        if (this.difficultyLevel >= 6 && !this.bossSpawned && this.scene.BlueBeetle) {
            this.spawner.spawnBoss(time);
        }
    }

    
    increaseDifficulty() {
        // Incrémenter le niveau de difficulté
        this.difficultyLevel++;
        
        // Réduire le délai entre les apparitions d'ennemis (minimum 500ms)
        const oldDelay = this.enemySpawnDelay;
        
        this.enemySpawnDelay = Math.max(
            this.minSpawnDelay, 
            this.enemySpawnDelay - 200
        );
        

        
        // Le niveau de difficulté est augmenté silencieusement
    }

    
    checkPlayerCollisions(player) {
        if (!this.scene.collisionManager) return false;

        const playerSprite = player.sprite; // Assumant que le joueur a une propriété sprite
        if (!playerSprite) return false;

        // Vérifier les collisions avec les ennemis
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.sprite || !enemy.active) continue;

            // Gestion spéciale pour BlueBeetle composite
            if (enemy.constructor.name === 'BlueBeetle' || enemy instanceof this.scene.BlueBeetle) {
                // Pour BlueBeetle, vérifier les collisions avec chaque composant visible
                const components = [
                    { sprite: enemy.aileArDroiteSprite, destroyed: enemy.aileArDroiteDestroyed },
                    { sprite: enemy.aileArGaucheSprite, destroyed: enemy.aileArGaucheDestroyed },
                    { sprite: enemy.aileAvDroiteSprite, destroyed: enemy.aileAvDroiteDestroyed },
                    { sprite: enemy.aileAvGaucheSprite, destroyed: enemy.aileAvGaucheDestroyed }
                ];
                
                // Ajouter le tronc seulement si toutes les ailes sont détruites
                const allWingsDestroyed = enemy.aileArDroiteDestroyed && enemy.aileArGaucheDestroyed && 
                                          enemy.aileAvDroiteDestroyed && enemy.aileAvGaucheDestroyed;
                if (allWingsDestroyed) {
                    components.push({ sprite: enemy.troncSprite, destroyed: enemy.troncDestroyed });
                }
                
                for (const component of components) {
                    if (!component.destroyed && component.sprite.visible) {
                        // Convertir les coordonnées du sprite du composant en coordonnées mondiales
                        const worldPos = enemy.container.getWorldTransformMatrix().transformPoint(component.sprite.x, component.sprite.y);
                        
                        // Créer un sprite temporaire pour la collision
                        const tempSprite = {
                            x: worldPos.x,
                            y: worldPos.y,
                            width: component.sprite.width * component.sprite.scaleX,
                            height: component.sprite.height * component.sprite.scaleY,
                            getBounds: () => new Phaser.Geom.Rectangle(
                                worldPos.x - (component.sprite.width * component.sprite.scaleX) / 2,
                                worldPos.y - (component.sprite.height * component.sprite.scaleY) / 2,
                                component.sprite.width * component.sprite.scaleX,
                                component.sprite.height * component.sprite.scaleY
                            )
                        };
                        
                        // Vérification de collision simple et efficace
                        const playerBounds = playerSprite.getBounds();
                        const componentBounds = tempSprite.getBounds();
                        
                        if (Phaser.Geom.Rectangle.Overlaps(playerBounds, componentBounds)) {
                            return true; // Collision détectée
                        }
                    }
                }
            } else {
                // Gestion normale pour les autres ennemis
                let targetSprite = enemy.sprite;
                if (enemy.constructor.name === 'Tourelle' && enemy.astroport) {
                    targetSprite = enemy.sprite;
                }

                const intersection = this.scene.collisionManager.getCollisionIntersection(playerSprite, targetSprite, true, 2, 30);

                if (intersection) {
                    if (this.debugCollision) {
                        this.scene.collisionManager.debugDrawCollision(playerSprite, targetSprite, intersection, true);
                    }
                    return true; // Collision détectée
                }
            }
        }
        
        // Vérifier les collisions avec les projectiles ennemis (bullets)
        for (let i = 0; i < this.enemyBullets.length; i++) {
            const bullet = this.enemyBullets[i];
            if (!bullet || !bullet.sprite || !bullet.active) continue;

            const intersection = this.scene.collisionManager.getCollisionIntersection(playerSprite, bullet.sprite, true, 1, 80);

            if (intersection) {
                if (this.debugCollision) {
                    this.scene.collisionManager.debugDrawCollision(playerSprite, bullet.sprite, intersection, true);
                }
                
                // Détruire le bullet après collision
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
                
                return true; // Collision détectée
            }
        }
        
        return false; // Pas de collision
    }
    
    checkProjectileCollisions(projectiles) {
        if (!this.scene.collisionManager) return 0;

        let score = 0;
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            if (!projectile || !projectile.active) continue;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy || !enemy.sprite || !enemy.active) continue;

                                // Gestion spéciale pour BlueBeetle composite
                if (enemy.constructor.name === 'BlueBeetle' || enemy instanceof this.scene.BlueBeetle) {
                    // Pour BlueBeetle, vérifier les collisions avec chaque composant visible
                    let collisionDetected = false;
                    const enablePixelPerfect = !projectile.ignorePixelPerfect;
                    // Vérifier si toutes les ailes sont détruites
                    const allWingsDestroyed = enemy.aileArDroiteDestroyed && enemy.aileArGaucheDestroyed && 
                                              enemy.aileAvDroiteDestroyed && enemy.aileAvGaucheDestroyed;
                    
                    // Vérifier collision avec zones personnalisées pour chaque composant
                    const componentNames = ['aileAvGauche', 'aileAvDroite', 'aileArGauche', 'aileArDroite'];
                    
                    // Ajouter le tronc si toutes les ailes sont détruites
                    if (allWingsDestroyed) {
                        componentNames.push('tronc');
                    }
                    
                    for (const componentName of componentNames) {
                        // Vérifier si le composant est détruit
                        const isDestroyed = (componentName === 'tronc') ? enemy.troncDestroyed : enemy.isWingDestroyed(componentName);
                        if (isDestroyed) continue;
                        
                        // Obtenir la zone de collision du composant
                        const collisionZone = enemy.getComponentCollisionZone(componentName);
                        if (!collisionZone) continue;
                        
                        // Vérifier collision entre projectile et zone de collision avec multi-points
                        const projectileBounds = projectile.getBounds();
                        const zoneBounds = new Phaser.Geom.Rectangle(
                            collisionZone.x,
                            collisionZone.y,
                            collisionZone.width,
                            collisionZone.height
                        );
                        
                        // Tester plusieurs points du projectile pour plus de précision
                        const testPoints = [
                            { x: projectileBounds.centerX, y: projectileBounds.centerY }, // Centre
                            { x: projectileBounds.x + projectileBounds.width * 0.25, y: projectileBounds.centerY }, // Gauche
                            { x: projectileBounds.x + projectileBounds.width * 0.75, y: projectileBounds.centerY }, // Droite
                            { x: projectileBounds.centerX, y: projectileBounds.y + projectileBounds.height * 0.25 }, // Haut
                            { x: projectileBounds.centerX, y: projectileBounds.y + projectileBounds.height * 0.75 }  // Bas
                        ];
                        
                        let collisionFound = false;
                        for (const point of testPoints) {
                            if (zoneBounds.contains(point.x, point.y)) {
                                collisionFound = true;
                                break;
                            }
                        }
                        
                        if (collisionFound) {
                            // Stocker l'information du composant touché
                            projectile.hitComponent = componentName;
                            collisionDetected = true;
                            
                            if (this.debugCollision) {
                                // Dessiner la zone de collision pour le débogage
                                const debugGfx = this.scene.add.graphics();
                                
                                // Zone de collision du composant (vert)
                                debugGfx.lineStyle(2, 0x00FF00, 1);
                                debugGfx.strokeRect(collisionZone.x, collisionZone.y, collisionZone.width, collisionZone.height);
                                
                                // Projectile (rouge)
                                debugGfx.lineStyle(2, 0xFF0000, 1);
                                debugGfx.strokeRect(projectileBounds.x, projectileBounds.y, projectileBounds.width, projectileBounds.height);
                                
                                // Points de test (jaune)
                                debugGfx.lineStyle(1, 0xFFFF00, 1);
                                for (const point of testPoints) {
                                    debugGfx.strokeCircle(point.x, point.y, 2);
                                }
                                
                                this.scene.time.delayedCall(1000, () => {
                                    debugGfx.destroy();
                                });
                            }
                            break;
                        }
                    }
                    
                    if (collisionDetected) {
                        // Pour les projectiles perçants, vérifier si cet ennemi a déjà été touché
                        if (projectile.piercing && projectile.hitEnemies) {
                            if (projectile.hitEnemies.has(enemy)) {
                                continue;
                            }
                            projectile.hitEnemies.add(enemy);
                        }

                        const destroyed = enemy.hit(projectile.power, projectile.hitComponent);
                        score += 50; // 50 points pour chaque hit sur BlueBeetle
                        
                        if (destroyed) {
                            score += 10000; // 10000 points pour le boss BlueBeetle (en plus des 50 du hit)
                            
                            if (this.scene.enemyCounter) {
                                this.scene.enemyCounter.addEnemyKill();
                            }
                        }

                        if (projectile.areaEffect && destroyed) {
                            this.handleAreaEffect(projectile, enemy);
                        }

                        if (!projectile.piercing) {
                            if (projectile.particles) {
                                projectile.particles.destroy();
                            }
                            projectile.destroy();
                            projectiles.splice(i, 1);
                            break; 
                        }
                    }
                } else {
                    // Gestion normale pour les autres ennemis
                    let targetSprite = enemy.sprite;
                    if (enemy.constructor.name === 'Tourelle' && enemy.astroport) {
                        targetSprite = enemy.sprite;
                    }

                    const enablePixelPerfect = !projectile.ignorePixelPerfect;
                    const intersection = this.scene.collisionManager.getCollisionIntersection(projectile, targetSprite, enablePixelPerfect, 2, 30);

                    if (intersection) {
                        if (this.debugCollision) {
                            this.scene.collisionManager.debugDrawCollision(projectile, targetSprite, intersection, enablePixelPerfect);
                        }

                        if (projectile.piercing && projectile.hitEnemies) {
                            if (projectile.hitEnemies.has(enemy)) {
                                continue;
                            }
                            projectile.hitEnemies.add(enemy);
                        }

                        const destroyed = enemy.hit(projectile.power);
                        
                        if (destroyed) {
                            if (enemy instanceof this.scene.Unit1) {
                                score += 100;
                            } else if (enemy instanceof this.scene.Saucer) {
                                score += 200;
                            } else if (enemy instanceof this.scene.EliteUnit) {
                                score += 300;
                            } else if (enemy instanceof this.scene.PurpleDeath) {
                                score += 400;
                            } else if (enemy instanceof this.scene.Tourelle) {
                                score += 1000;
                            } else if (enemy instanceof this.scene.TourelleLeft) {
                                score += 1000;
                            }
                            
                            if (this.scene.enemyCounter) {
                                this.scene.enemyCounter.addEnemyKill();
                            }
                        }

                        if (projectile.areaEffect && destroyed) {
                            this.handleAreaEffect(projectile, enemy);
                        }

                        if (!projectile.piercing) {
                            if (projectile.particles) {
                                projectile.particles.destroy();
                            }
                            projectile.destroy();
                            projectiles.splice(i, 1);
                            break; 
                        }
                    }
                }
            }
        }
        return score;
    }
    
    /**
     * Gère l'effet de zone d'un projectile
     * @param {Phaser.GameObjects.Sprite} projectile - Le projectile qui a causé l'effet
     * @param {Object} sourceEnemy - L'ennemi qui a été détruit
     */
    handleAreaEffect(projectile, sourceEnemy) {
        // Rayon de l'effet
        const radius = projectile.areaRadius || 60;
        
        // Position de l'explosion
        const explosionX = sourceEnemy.sprite.x;
        const explosionY = sourceEnemy.sprite.y;
        
        // Effet visuel d'explosion - cercle initial
        const explosionEffect = this.scene.add.circle(
            explosionX, 
            explosionY, 
            radius, 
            0xff5500, 
            0.4
        );
        
        // Animation d'expansion et de disparition du cercle
        this.scene.tweens.add({
            targets: explosionEffect,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => {
                explosionEffect.destroy();
            }
        });
        
        // Ajouter un système de particules pour l'explosion
        const particles = this.scene.add.particles('explosion');
        
        // Émetteur de particules
        const emitter = particles.createEmitter({
            frame: [0, 1, 2, 3], // Utiliser les différentes frames de l'animation d'explosion
            x: explosionX,
            y: explosionY,
            speed: { min: 20, max: 100 },
            angle: { min: 0, max: 360 }, // Émission dans toutes les directions
            scale: { start: 0.5, end: 0.2 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            quantity: 20,
            frequency: 50,  // Combien de particules par emission
            maxParticles: 30
        });
        
        // Arrêter l'émetteur après un court délai
        this.scene.time.delayedCall(300, () => {
            emitter.stop();
            // Nettoyer les particules après quelles aient disparu
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        });
        
        // Dégâts aux ennemis à proximité
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            // Ne pas affecter l'ennemi source qui a déjà été détruit
            if (enemy === sourceEnemy) continue;
            
            // Calculer la distance entre l'explosion et l'ennemi
            const dx = enemy.sprite.x - explosionX;
            const dy = enemy.sprite.y - explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Si l'ennemi est dans le rayon d'explosion
            if (distance < radius) {
                // Calculer les dégâts en fonction de la distance (plus proche = plus de dégâts)
                const damageRatio = 1 - (distance / radius);
                const damage = Math.round(projectile.power * damageRatio);
                
                // Appliquer les dégâts
                if (damage > 0) {
                    enemy.hit(damage);
                }
                
                // Effet visuel sur l'ennemi touché
                this.scene.tweens.add({
                    targets: enemy.sprite,
                    alpha: 0.2,
                    duration: 100,
                    yoyo: true,
                    repeat: 1,
                });
            }
        }
    }
    
    reset() {
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        // Nettoyer aussi les projectiles ennemis
        this.enemyBullets.forEach(bullet => bullet.destroy());
        this.enemyBullets = [];
        
        this.nextEnemyTime = 0;
        
        // Conserver le niveau de difficulté actuel si nous sommes en mode test
        if (this.scene.isTestingBoss) {
            // Ne pas réinitialiser le difficultyLevel
        } else {
            // Réinitialiser normalement
            this.difficultyLevel = 1;
        }
        
        this.lastDifficultyIncrease = 0;
        this.spawnCount = 0;
        this.creationSuccessCount = 0;
        
        // Réinitialiser les propriétés de PurpleDeath
        this.lastPurpleDeathSpawn = 0;
        
        // Réinitialiser les propriétés de Tourelle
        this.lastTourelleSpawn = 0;
        
        // Réinitialiser les propriétés du boss
        this.bossSpawned = false;
        this.boss = null;
        
        // Effacer les graphiques de débogage lors de la réinitialisation
        if (this.scene.collisionManager) {
            this.scene.collisionManager.clearDebugGraphics();
        }
    }
    
    damageEnemiesInRadius(x, y, radius, damage, useArc = false, startAngle = 0, endAngle = Math.PI * 2, fixedDamage = false) {
        let score = 0;
        

        
        // Pour le débogage visuel
        if (this.debugCollision && this.scene.collisionManager) {
            // Sauvegarder les graphiques de débogage actuels du collisionManager s'ils existent
            // et les restaurer après, ou simplement ne pas appeler clear ici.
            // Pour l'instant, on suppose que debugDrawCollision dans CollisionManager gère son propre cycle clear/draw.
            // Ou, on peut ajouter une méthode dédiée dans CollisionManager pour dessiner des formes de debug.
            
            // Option simple: Créer un graphics temporaire ici si besoin, ou étendre CollisionManager
            let debugGfx = this.scene.add.graphics();
            debugGfx.lineStyle(2, 0x00FFFF, 0.7);
            if (useArc) {
                debugGfx.beginPath();
                debugGfx.arc(x, y, radius, startAngle, endAngle, false);
                debugGfx.strokePath();
            } else {
                debugGfx.strokeCircle(x, y, radius);
            }
            this.scene.time.delayedCall(300, () => {
                debugGfx.destroy();
            });
        }
        
        // Vérifier tous les ennemis
        let enemiesHit = 0;
        let enemiesDestroyed = 0;
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            // Calculer la distance entre l'explosion et l'ennemi
            const dx = enemy.sprite.x - x;
            const dy = enemy.sprite.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Si l'ennemi est dans le rayon d'explosion
            if (distance < radius) {
                
                // Si on utilise un arc, vérifier si l'ennemi est dans l'angle approprié
                let isInAngle = true;
                if (useArc) {
                    // Calculer l'angle de l'ennemi par rapport au centre de l'explosion
                    let angle = Math.atan2(dy, dx) + Math.PI/2; // +PI/2 pour ajuster par rapport au haut
                    if (angle < 0) angle += Math.PI * 2;
                    
                    // Vérifier si l'angle est dans l'arc
                    isInAngle = (angle >= startAngle && angle <= endAngle);
                }
                
                if (isInAngle) {
                    // Calculer les dégâts à appliquer
                    let finalDamage;
                    
                    if (fixedDamage) {
                        // Dégâts fixes quelle que soit la distance
                        finalDamage = damage;
                    } else {
                        // Dégâts variables selon la distance
                        const damageRatio = 1 - (distance / radius);
                        finalDamage = Math.round(damage * damageRatio);
                    }
                    
                    // Appliquer les dégâts
                    if (finalDamage > 0) {
                        enemiesHit++;
                        const destroyed = enemy.hit(finalDamage);
                        
                        // Attribuer des points si l'ennemi est détruit
                        if (destroyed) {
                            enemiesDestroyed++;
                            if (enemy instanceof this.scene.Unit1) {
                                score += 100;
                            } else if (enemy instanceof this.scene.Saucer) {
                                score += 200;
                            } else if (enemy instanceof this.scene.EliteUnit) {
                                score += 300; // Plus de points pour l'ennemi d'élite
                            } else if (enemy instanceof this.scene.PurpleDeath) {
                                score += 400; // Beaucoup de points pour PurpleDeath
                            } else if (enemy instanceof this.scene.Tourelle) {
                                score += 1000; // 1000 points pour la Tourelle
                            } else if (enemy instanceof this.scene.TourelleLeft) {
                                score += 1000; // 1000 points pour la TourelleLeft
                            } else if (enemy instanceof this.scene.BlueBeetle) {
                                score += 10000; // 10000 points pour le boss BlueBeetle
                            }
                            
                            // Incrémenter le compteur d'ennemis détruits
                            if (this.scene.enemyCounter) {
                                this.scene.enemyCounter.addEnemyKill();
                            }
                        }
                        
                        // Effet visuel sur l'ennemi touché
                        this.scene.tweens.add({
                            targets: enemy.sprite,
                            alpha: 0.2,
                            duration: 100,
                            yoyo: true,
                            repeat: 1,
                        });
                    }
                }
            }
        }
        

        
        // Mettre à jour le score dans la scène si nécessaire
        if (score > 0 && this.scene.updateScore) {
            this.scene.updateScore(score);
        }
        
        return score;
    }
    
    /**
     * Inflige des dégâts à tous les ennemis présents à l'écran
     * @param {number} damage - Dégâts à infliger
     * @returns {number} - Score total obtenu
     */
    damageAllEnemies(damage) {
        let totalScore = 0;
        
        // Parcourir tous les ennemis
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Infliger les dégâts (utiliser hit au lieu de takeDamage)
            const killed = enemy.hit(damage);
            
            // Si l'ennemi est tué, ajouter son score
            if (killed) {
                if (enemy instanceof this.scene.Unit1) {
                    totalScore += 100;
                } else if (enemy instanceof this.scene.Saucer) {
                    totalScore += 200;
                } else if (enemy instanceof this.scene.EliteUnit) {
                    totalScore += 300;
                } else if (enemy instanceof this.scene.PurpleDeath) {
                    totalScore += 400;
                } else if (enemy instanceof this.scene.Tourelle) {
                    totalScore += 1000; // 1000 points pour la Tourelle
                } else if (enemy instanceof this.scene.TourelleLeft) {
                    totalScore += 1000; // 1000 points pour la TourelleLeft
                } else if (enemy instanceof this.scene.BlueBeetle) {
                    totalScore += 10000; // 10000 points pour le boss BlueBeetle
                } else if (enemy.scoreValue) {
                    totalScore += enemy.scoreValue;
                }
                
                // Incrémenter le compteur d'ennemis détruits
                if (this.scene.enemyCounter) {
                    this.scene.enemyCounter.addEnemyKill();
                }
            }
        }
        
        return totalScore;
    }
    
    /**
     * Détruit tous les ennemis présents à l'écran
     * @returns {number} - Nombre d'ennemis détruits
     */
    destroyAll() {
        const count = this.enemies.length;
        
        // Détruire tous les ennemis
        this.enemies.forEach(enemy => {
            if (enemy.sprite) {
                // Jouer l'animation d'explosion
                const explosion = this.scene.add.sprite(enemy.sprite.x, enemy.sprite.y, 'explosion');
                explosion.play('explode');
                explosion.once('animationcomplete', () => {
                    explosion.destroy();
                });
                
                // Détruire l'ennemi
                enemy.sprite.destroy();
            }
        });
        
        // Vider le tableau des ennemis
        this.enemies = [];
        
        return count;
    }
    
    /**
     * Vérifie la collision pixel-perfect entre un projectile et un sprite
     * @param {Object} projectile - Le projectile
     * @param {Phaser.GameObjects.Sprite} sprite - Le sprite à tester
     * @param {Object} worldPos - Position mondiale du sprite
     * @returns {boolean} - True si collision détectée
     */
    checkPixelPerfectCollision(projectile, sprite, worldPos) {
        // Obtenir les bounds du projectile
        const projectileBounds = projectile.getBounds();
        
        // Calculer les bounds du sprite avec sa position mondiale et son échelle
        const spriteWidth = sprite.width * sprite.scaleX;
        const spriteHeight = sprite.height * sprite.scaleY;
        const spriteBounds = new Phaser.Geom.Rectangle(
            worldPos.x - spriteWidth / 2,
            worldPos.y - spriteHeight / 2,
            spriteWidth,
            spriteHeight
        );
        
        // Vérification rapide des bounds d'abord
        if (!Phaser.Geom.Rectangle.Overlaps(projectileBounds, spriteBounds)) {
            return false;
        }
        
        // Pour l'instant, utiliser une collision rectangulaire améliorée
        // car l'accès aux pixels des textures est complexe dans Phaser 3
        try {
            // Calculer la zone d'intersection
            const intersection = Phaser.Geom.Rectangle.Intersection(projectileBounds, spriteBounds);
            
            // Si l'intersection est suffisamment grande, considérer comme collision
            const minIntersectionArea = 16; // pixels carrés minimum
            const intersectionArea = intersection.width * intersection.height;
            
            if (intersectionArea >= minIntersectionArea) {
                return true;
            }
            
            // Pour les petites intersections, vérifier si le centre du projectile
            // est dans une zone "solide" du sprite (approximation)
            const projectileCenterX = projectileBounds.centerX;
            const projectileCenterY = projectileBounds.centerY;
            
            // Définir une zone "solide" au centre du sprite (80% de sa taille)
            const solidZoneRatio = 0.8;
            const solidWidth = spriteWidth * solidZoneRatio;
            const solidHeight = spriteHeight * solidZoneRatio;
            const solidBounds = new Phaser.Geom.Rectangle(
                worldPos.x - solidWidth / 2,
                worldPos.y - solidHeight / 2,
                solidWidth,
                solidHeight
            );
            
            return solidBounds.contains(projectileCenterX, projectileCenterY);
            
        } catch (error) {
            // En cas d'erreur, fallback vers collision rectangulaire simple
            console.warn('[BlueBeetle] Erreur collision améliorée, fallback simple:', error);
            return true; // Considérer comme collision pour éviter les bugs
        }
    }

    /**
     * Crée un projectile ennemi (bullet) à la position et avec la vélocité spécifiées
     * @param {number} x - Position X du projectile
     * @param {number} y - Position Y du projectile
     * @param {number} velocityX - Vélocité horizontale
     * @param {number} velocityY - Vélocité verticale
     */
    createEnemyBullet(x, y, velocityX, velocityY) {
        try {
            // Créer un nouveau projectile ennemi
            const bullet = new EnemyBullet(this.scene, x, y, velocityX, velocityY);
            
            // Ajouter à la liste des projectiles ennemis
            this.enemyBullets.push(bullet);
            
        } catch (error) {
            // Erreur silencieuse
        }
    }
}

export default EnemyManager;