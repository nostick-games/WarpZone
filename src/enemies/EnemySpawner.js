/**
 * Gestionnaire d'apparition des ennemis
 * Gère l'apparition de tous les types d'ennemis selon la difficulté
 */
class EnemySpawner {
    constructor(enemyManager) {
        this.enemyManager = enemyManager;
        this.scene = enemyManager.scene;
        
        // Compteurs pour diagnostic
        this.spawnCount = 0;
        this.creationSuccessCount = 0;
    }

    /**
     * Fait apparaître un ennemi standard selon le niveau de difficulté
     * @param {number} time - Temps actuel
     */
    spawnEnemy(time) {
        this.spawnCount++;
        
        // Position d'apparition (en haut de l'écran)
        const x = Phaser.Math.Between(50, this.scene.game.config.width - 50);
        const y = -30;
        
        // Vérifier la disponibilité des classes d'ennemis
        if (!this.scene.Unit1 || !this.scene.Saucer) {
            return;
        }
        
        // Vérifier si l'ennemi d'élite est disponible à partir du niveau 3
        const eliteUnitAvailable = this.enemyManager.difficultyLevel >= 3 && this.scene.EliteUnit;
        
        // Sélectionner le type d'ennemi en fonction de la difficulté
        let enemy;
        let enemyType = "";
        
        try {
            if (this.enemyManager.difficultyLevel < 3) {
                // Niveaux 1-2: Unit1 plus probable, Saucer moins probable
                const rand = Phaser.Math.Between(1, 10);
                if (rand <= 7) { // Modifié de 8 à 7 pour augmenter la probabilité de Saucer
                    enemy = new this.scene.Unit1(this.scene, x, y);
                    enemyType = "Unit1";
                } else {
                    enemy = new this.scene.Saucer(this.scene, x, y);
                    enemyType = "Saucer";
                }
            } else {
                // Niveaux 3+: Mélange équilibré avec EliteUnit
                const rand = Phaser.Math.Between(1, 15); // Augmenté à 15 pour inclure EliteUnit
                
                if (rand <= 5) {
                    enemy = new this.scene.Unit1(this.scene, x, y);
                    enemyType = "Unit1";
                } else if (rand <= 10) {
                    enemy = new this.scene.Saucer(this.scene, x, y);
                    enemyType = "Saucer";
                } else if (eliteUnitAvailable) {
                    // 5/15 = 33% chance pour EliteUnit aux niveaux 3+
                    enemy = new this.scene.EliteUnit(this.scene, x, y);
                    enemyType = "EliteUnit";
                } else {
                    // Si EliteUnit n'est pas disponible, fallback sur Saucer
                    enemy = new this.scene.Saucer(this.scene, x, y);
                    enemyType = "Saucer";
                }
            }
            
            // Ajuster les propriétés en fonction de la difficulté
            this.adjustEnemyDifficulty(enemy);
            
            // Ajouter l'ennemi à la liste
            this.enemyManager.enemies.push(enemy);
            this.creationSuccessCount++;
            
            // Pattern particulier pour certains niveaux de difficulté
            if (this.enemyManager.difficultyLevel >= 2) { // Modifié de 3 à 2 pour avoir des groupes plus tôt
                const chanceForGroup = this.enemyManager.difficultyLevel >= 3 ? 30 : 15; // 15% au niveau 2, 30% aux niveaux 3+
                const roll = Phaser.Math.Between(1, 100);
                const willSpawnGroup = roll <= chanceForGroup;
                
                if (willSpawnGroup) {
                    // Chance de faire apparaître un groupe d'ennemis du même type
                    const groupSize = Math.min(3, 1 + Math.floor(this.enemyManager.difficultyLevel / 2));
                    this.spawnEnemyGroup(enemy.constructor, groupSize, time);
                }
            }
        } catch (error) {
            // Erreur silencieuse
        }
    }

    /**
     * Fait apparaître un groupe d'ennemis du même type
     * @param {Class} EnemyClass - Classe de l'ennemi à spawner
     * @param {number} count - Nombre d'ennemis dans le groupe
     * @param {number} time - Temps actuel
     */
    spawnEnemyGroup(EnemyClass, count, time) {
        // Délai entre chaque ennemi du groupe
        const groupDelay = 300;
        
        // Planifier l'apparition des ennemis supplémentaires
        for (let i = 1; i < count; i++) {
            this.scene.time.delayedCall(groupDelay * i, () => {
                // Position d'apparition (en haut de l'écran)
                const x = Phaser.Math.Between(50, this.scene.game.config.width - 50);
                const y = -30;
                
                try {
                    // Créer l'ennemi
                    const enemy = new EnemyClass(this.scene, x, y);
                    
                    // Ajuster les propriétés en fonction de la difficulté
                    this.adjustEnemyDifficulty(enemy);
                    
                    // Ajouter l'ennemi à la liste
                    this.enemyManager.enemies.push(enemy);
                } catch (error) {
                    // Erreur silencieuse
                }
            });
        }
    }

    /**
     * Fait apparaître PurpleDeath (niveau 2+)
     * @param {number} time - Temps actuel
     */
    spawnPurpleDeath(time) {
        try {
            // Choisir aléatoirement le côté d'apparition
            const fromLeft = Math.random() < 0.5;
            
            let x, y, direction;
            
            if (fromLeft) {
                // Apparition à gauche
                x = -50; // Hors écran à gauche
                y = Phaser.Math.Between(50, this.scene.game.config.height / 3); // Tiers supérieur
                direction = 'left';
            } else {
                // Apparition à droite
                x = this.scene.game.config.width + 50; // Hors écran à droite
                y = Phaser.Math.Between(50, this.scene.game.config.height / 3); // Tiers supérieur
                direction = 'right';
            }
            
            // Créer PurpleDeath
            const purpleDeath = new this.scene.PurpleDeath(this.scene, x, y, direction);
            
            // Ajuster les propriétés en fonction de la difficulté
            if (this.enemyManager.difficultyLevel > 3) {
                purpleDeath.baseSpeed *= (1 + (this.enemyManager.difficultyLevel - 3) * 0.15); // Augmente plus rapidement
                purpleDeath.calculateMovement(); // Recalculer les vitesses
                
                if (this.enemyManager.difficultyLevel >= 6) {
                    purpleDeath.health += (this.enemyManager.difficultyLevel - 5) * 3; // Plus résistant aux niveaux élevés
                }
            }
            
            // Ajouter à la liste des ennemis
            this.enemyManager.enemies.push(purpleDeath);
            
        } catch (error) {
            // Erreur silencieuse
        }
    }

    /**
     * Fait apparaître une Tourelle (niveau 3+)
     * @param {number} time - Temps actuel
     */
    spawnTourelle(time) {
        try {
            // 50% de chance pour chaque type de tourelle
            const useNewTourelleLeft = Math.random() < 0.5;
            
            let x, y, tourelle, tourelleType;
            
            if (useNewTourelleLeft) {
                // Nouvelle TourelleLeft (astroport + tourelle_new) - apparaît depuis la gauche
                // L'astroport fait 206px de large, décalé de 72px vers la gauche
                x = 103 - 72; // 206/2 = 103, centré sur le bord gauche - 72px
                y = -50; // Hors écran en haut
                tourelleType = "TourelleLeft (nouvelle)";
                
                if (!this.scene.TourelleLeft) {
                    return;
                }
                
                // Créer la nouvelle TourelleLeft
                tourelle = new this.scene.TourelleLeft(this.scene, x, y);
                
            } else {
                // Nouvelle tourelle (astroport + tourelle_new) - apparaît depuis la droite
                // L'astroport fait 206px de large, décalé de 72px vers la droite
                x = this.scene.game.config.width - 103 + 62; // 206/2 = 103, centré sur le bord droit + 72px
                y = -50; // Hors écran en haut
                tourelleType = "Tourelle (nouvelle)";
                
                if (!this.scene.Tourelle) {
                    return;
                }
                
                // Créer la nouvelle Tourelle
                tourelle = new this.scene.Tourelle(this.scene, x, y);
            }
            
            // Ajuster les propriétés en fonction de la difficulté
            if (this.enemyManager.difficultyLevel > 2) {
                // Légèrement plus rapide aux niveaux élevés
                tourelle.speed *= (1 + (this.enemyManager.difficultyLevel - 2) * 0.1);
                
                // Plus résistante aux niveaux élevés
                if (this.enemyManager.difficultyLevel >= 5) {
                    tourelle.health += (this.enemyManager.difficultyLevel - 4) * 20; // +20 santé par niveau au-dessus de 4
                }
            }
            
            // Ajouter à la liste des ennemis
            this.enemyManager.enemies.push(tourelle);
            
        } catch (error) {
            // Erreur silencieuse
        }
    }

    /**
     * Fait apparaître le boss BlueBeetle (niveau 6)
     * @param {number} time - Temps actuel
     */
    spawnBoss(time) {
        try {
            // Position du boss (centré en haut)
            const x = this.scene.game.config.width / 2;
            const y = -100; // Hors écran en haut
            
            // Créer le boss BlueBeetle
            const boss = new this.scene.BlueBeetle(this.scene, x, y);
            
            // Marquer le boss comme spawné
            this.enemyManager.bossSpawned = true;
            this.enemyManager.boss = boss;
            
            // Ajouter à la liste des ennemis
            this.enemyManager.enemies.push(boss);
            
            // Jouer la musique du boss si l'audioManager est disponible
            if (this.scene.audioManager) {
                console.log(`[EnemySpawner] Boss spawned, changing music to boss theme`);
                this.scene.audioManager.playMusic('boss', {
                    volume: 0.7,
                    loop: true
                });
            } else {
                console.warn(`[EnemySpawner] audioManager not found in scene!`);
            }
            
        } catch (error) {
            // Erreur silencieuse
        }
    }

    /**
     * Ajuste les propriétés d'un ennemi selon la difficulté
     * @param {Object} enemy - L'ennemi à ajuster
     */
    adjustEnemyDifficulty(enemy) {
        if (this.enemyManager.difficultyLevel > 1) {
            enemy.speed *= (1 + (this.enemyManager.difficultyLevel - 1) * 0.1);
            
            // Augmenter la santé à partir du niveau 4
            if (this.enemyManager.difficultyLevel >= 4) {
                enemy.health += (this.enemyManager.difficultyLevel - 3) * 5;
            }
        }
    }

    /**
     * Retourne le délai de spawn selon la difficulté
     * @returns {number} - Délai en millisecondes
     */
    getSpawnDelay() {
        // Calculer le délai en fonction de la difficulté
        const baseDelay = this.enemyManager.enemySpawnDelay;
        const reductionPerLevel = 150; // Réduction de 150ms par niveau
        const calculatedDelay = baseDelay - (this.enemyManager.difficultyLevel - 1) * reductionPerLevel;
        
        // S'assurer que le délai ne descend pas en dessous du minimum
        return Math.max(calculatedDelay, this.enemyManager.minSpawnDelay);
    }
}

export default EnemySpawner; 