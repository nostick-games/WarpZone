/**
 * Gestionnaire de Bombes pour GameScene
 * Gère le système complet des bombes : chargement, lancement, animations et effets
 */
class BombManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Utilise une bombe si disponible
     * @returns {boolean} - Vrai si une bombe a été utilisée
     */
    useBomb() {
        if (this.scene.bombCount > 0) {
            this.scene.bombCount--;
            this.scene.uiManager.updateBombDisplay();
            return true;
        }
        return false;
    }

    /**
     * Crée la jauge circulaire de chargement de la bombe
     */
    createBombChargeCircle() {
        // Supprimer l'ancienne jauge si elle existe
        this.removeBombChargeCircle();
        
        // Créer un graphique pour la jauge
        this.scene.bombChargeCircle = this.scene.add.graphics();
        
        // Définir la position et le rayon
        this.scene.bombChargeCircleRadius = 40; // Rayon de la jauge
    }
    
    /**
     * Met à jour la jauge circulaire en fonction de la progression
     * @param {number} progress - Progression du chargement (0 à 1)
     */
    updateBombChargeCircle(progress) {
        if (!this.scene.bombChargeCircle) return;
        
        // Nettoyer le graphique
        this.scene.bombChargeCircle.clear();
        
        // Position du cercle (autour du vaisseau du joueur)
        const x = this.scene.player.shipGroup.x;
        const y = this.scene.player.shipGroup.y;
        
        // Dessiner le cercle de fond (gris transparent)
        this.scene.bombChargeCircle.fillStyle(0xAAAAAA, 0.3);
        this.scene.bombChargeCircle.fillCircle(x, y, this.scene.bombChargeCircleRadius);
        
        // Dessiner le cercle de progression (bleu)
        if (progress > 0) {
            // Calculer l'angle (en radians) pour l'arc de progression
            const startAngle = -Math.PI / 2; // Commencer en haut
            const endAngle = startAngle + (Math.PI * 2 * progress);
            
            // Dessiner l'arc de progression
            this.scene.bombChargeCircle.fillStyle(0x0D7DE4, 0.6);
            this.scene.bombChargeCircle.beginPath();
            this.scene.bombChargeCircle.arc(x, y, this.scene.bombChargeCircleRadius, startAngle, endAngle, false);
            this.scene.bombChargeCircle.lineTo(x, y);
            this.scene.bombChargeCircle.closePath();
            this.scene.bombChargeCircle.fillPath();
            
            // Ajouter un contour au cercle
            this.scene.bombChargeCircle.lineStyle(2, 0x0D7DE4, 1);
            this.scene.bombChargeCircle.strokeCircle(x, y, this.scene.bombChargeCircleRadius);
        }
    }
    
    /**
     * Supprime la jauge circulaire
     */
    removeBombChargeCircle() {
        if (this.scene.bombChargeCircle) {
            this.scene.bombChargeCircle.destroy();
            this.scene.bombChargeCircle = null;
        }
    }
    
    /**
     * Fait vibrer le vaisseau du joueur (effet visuel quand pas de bombe disponible)
     */
    shakePlayer() {
        if (this.scene.player && this.scene.player.shipGroup) {
            // Sauvegarder la position originale
            const originalX = this.scene.player.shipGroup.x;
            
            // Créer une séquence de vibration
            this.scene.tweens.timeline({
                targets: this.scene.player.shipGroup,
                tweens: [
                    { x: originalX - 10, duration: 50 },
                    { x: originalX + 10, duration: 50 },
                    { x: originalX - 8, duration: 50 },
                    { x: originalX + 8, duration: 50 },
                    { x: originalX - 5, duration: 50 },
                    { x: originalX + 5, duration: 50 },
                    { x: originalX, duration: 50 }
                ]
            });
        }
    }

    /**
     * Lance une bombe avec l'animation complète
     */
    launchBomb() {
        // Vérifier si on a des bombes disponibles
        if (this.scene.bombCount <= 0) {
            this.shakePlayer();
            return;
        }
        
        // Marquer l'animation comme en cours pour bloquer d'autres actions
        this.scene.bombAnimationInProgress = true;
        
        // Désactiver les collisions pendant toute l'animation
        this.scene.collisionsDisabled = true;
        
        // Sauvegarder la position actuelle du vaisseau
        const originalX = this.scene.player.shipGroup.x;
        const originalY = this.scene.player.shipGroup.y;
        const originalScale = this.scene.player.shipGroup.scale;
        
        // Position en bas et au centre de l'écran pour l'animation
        const centerX = this.scene.game.config.width / 2;
        const bottomY = this.scene.game.config.height - 60;
        
        // Définir une valeur de depth élevée pour le vaisseau pour qu'il soit au-dessus des autres éléments
        this.scene.player.shipGroup.setDepth(1000);
        
        // Étape 1: Zoom progressif et déplacement vers le bas et au centre
        this.scene.tweens.add({
            targets: this.scene.player.shipGroup,
            scale: 15,
            y: bottomY,
            x: centerX,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // Étape 2: Afficher la bombe devant le vaisseau
                const bombSprite = this.scene.add.image(
                    centerX,  // Position X au centre
                    bottomY - 100, // Juste au-dessus du vaisseau
                    'bomb'
                );
                bombSprite.setScale(10);
                bombSprite.setDepth(5); // Valeur de depth inférieure au vaisseau
                
                // Étape 3: Déplacer la bombe vers le centre de l'écran avec dézoom
                this.scene.tweens.add({
                    targets: bombSprite,
                    scale: 2,
                    y: this.scene.game.config.height / 2,
                    duration: 1200,
                    ease: 'Power1',
                    onComplete: () => {
                        // Supprimer le sprite de la bombe
                        bombSprite.destroy();
                        
                        // Étape 4: Créer les explosions aléatoires
                        this.createRandomExplosions(() => {
                            // Étape 5: Retour du vaisseau à sa position normale
                            this.scene.tweens.add({
                                targets: this.scene.player.shipGroup,
                                scale: originalScale,
                                y: originalY,
                                x: originalX,
                                duration: 1000,
                                ease: 'Power2',
                                onComplete: () => {
                                    // Animation terminée et réactiver les collisions
                                    this.scene.bombAnimationInProgress = false;
                                    this.scene.collisionsDisabled = false;
                                    
                                    // Maintenir la depth élevée du vaisseau pour qu'il reste au premier plan
                                    this.scene.player.shipGroup.setDepth(1000);
                                    
                                    // Activer l'invincibilité pendant 1 seconde
                                    this.scene.effectsManager.setPlayerInvincible(1000);
                                }
                            });
                        });
                        
                        // Appliquer des dégâts aux ennemis
                        if (this.scene.enemyManager) {
                            const score = this.scene.enemyManager.damageAllEnemies(50);
                            if (score > 0) {
                                this.scene.uiManager.updateScore(score);
                            }
                        }
                        
                        // Décrémenter le compteur de bombes
                        this.scene.bombCount--;
                        this.scene.uiManager.updateBombDisplay();
                    }
                });
            }
        });
    }
    
    /**
     * Crée des explosions aléatoires sur l'écran
     * @param {Function} onComplete - Fonction à appeler une fois toutes les explosions terminées
     */
    createRandomExplosions(onComplete) {
        // Nombre d'explosions à créer
        const explosionCount = 12;
        let completedExplosions = 0;
        
        // Zone d'exclusion autour du vaisseau
        const safeZoneY = this.scene.game.config.height - 120;
        
        // Fonction pour créer une explosion à une position aléatoire
        const createExplosion = (index) => {
            // Position aléatoire (éviter le bas de l'écran où se trouve le joueur)
            let x = Phaser.Math.Between(50, this.scene.game.config.width - 50);
            let y = Phaser.Math.Between(50, safeZoneY);
            
            // Délai basé sur l'index
            const delay = index * 100;
            
            // Créer l'explosion après le délai
            this.scene.time.delayedCall(delay, () => {
                const explosion = this.scene.add.sprite(x, y, 'bomb_explosion');
                explosion.setScale(Phaser.Math.FloatBetween(1.0, 2.0));
                explosion.setDepth(6); // Depth plus élevée que la bombe mais inférieure au vaisseau
                
                // Jouer l'animation
                explosion.play('bomb_explode');
                
                // Une fois l'animation terminée
                explosion.on('animationcomplete', () => {
                    // Supprimer le sprite
                    explosion.destroy();
                    
                    // Incrémenter le compteur
                    completedExplosions++;
                    
                    // Si toutes les explosions sont terminées, appeler la fonction de rappel
                    if (completedExplosions >= explosionCount && onComplete) {
                        onComplete();
                    }
                });
            });
        };
        
        // Créer toutes les explosions
        for (let i = 0; i < explosionCount; i++) {
            createExplosion(i);
        }
    }
}

export default BombManager; 