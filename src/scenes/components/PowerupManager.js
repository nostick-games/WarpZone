/**
 * Classe gérant les power-ups dans le jeu
 */
class PowerupManager {
    /**
     * Crée le gestionnaire de power-ups
     * @param {Phaser.Scene} scene - La scène Phaser à laquelle appartient ce système
     */
    constructor(scene) {
        this.scene = scene;
        
        // Tableau pour stocker les power-ups actifs
        this.powerups = [];
        
        // Pour éviter les doubles collectes au même endroit
        this.recentCollectionPositions = [];
        

    }
    
    /**
     * Vérifie si un powerup est trop proche d'une position récemment collectée
     * @param {number} x - Position X à vérifier
     * @param {number} y - Position Y à vérifier
     * @returns {boolean} - Vrai si la position est trop proche d'une collecte récente
     */
    isNearRecentCollection(x, y) {
        const threshold = 20; // Distance minimale en pixels
        
        for (const pos of this.recentCollectionPositions) {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            if (distance < threshold) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Ajoute une position à la liste des collectes récentes
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    addRecentCollection(x, y) {
        // Ajouter la position
        this.recentCollectionPositions.push({ x, y, time: Date.now() });
        
        // Nettoyer les positions trop anciennes (plus de 500ms)
        this.recentCollectionPositions = this.recentCollectionPositions.filter(
            pos => Date.now() - pos.time < 500
        );
    }
    
    /**
     * Crée un power-up à une position donnée
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} type - Type de power-up ('bomb', 'weapon' ou 'star')
     */
    createPowerup(x, y, type = null) {
        // Si aucun type n'est spécifié, choisir aléatoirement en fonction du niveau de tir du joueur
        if (!type) {
            let weaponProb, bombProb, starProb, bonusX2Prob;
            
            // Vérifier si le joueur existe et a une propriété shootLevel
            const playerShootLevel = this.scene.player && this.scene.player.shootLevel 
                ? this.scene.player.shootLevel 
                : 1;
            
            // Vérifier si le bonus x2 est déjà actif
            const bonusX2Active = this.scene.bonusX2Active || false;
            
            if (playerShootLevel < 3) {
                // Distribution quand le niveau de tir est faible (1-2)
                if (bonusX2Active) {
                    // Si bonus x2 actif : Powerup weapon : 65%, Powerup bombe : 25%, Étoile : 10%
                    weaponProb = 65;
                    bombProb = 25;
                    starProb = 10;
                    bonusX2Prob = 0; // Pas de bonus x2
                } else {
                    // Distribution normale : Powerup weapon : 60%, Powerup bombe : 25%, Étoile : 15%, Bonus x2 : 5%
                    weaponProb = 60;
                    bombProb = 25;
                    starProb = 15;
                    bonusX2Prob = 5;
                }
            } else {
                // Distribution quand le niveau de tir est maximum (3)
                if (bonusX2Active) {
                    // Si bonus x2 actif : Powerup weapon : 15%, Powerup bombe : 15%, Étoile : 70%
                    weaponProb = 15;
                    bombProb = 15;
                    starProb = 70;
                    bonusX2Prob = 0; // Pas de bonus x2
                } else {
                    // Distribution normale : Powerup weapon : 10%, Powerup bombe : 15%, Étoile : 35%, Bonus x2 : 40%
                    weaponProb = 10;
                    bombProb = 15;
                    starProb = 35;
                    bonusX2Prob = 40;
                }
            }
            
            // Déterminer le type de powerup selon les probabilités
            const rand = Math.random() * 100;
            
            if (rand < weaponProb) {
                type = 'weapon';
            } else if (rand < weaponProb + bombProb) {
                type = 'bomb';
            } else if (rand < weaponProb + bombProb + starProb) {
                type = 'star';
            } else {
                type = 'bonusx2';
            }
        }
        
        // Si le type demandé est bonusx2 mais que le bonus est déjà actif, convertir en étoile
        if (type === 'bonusx2' && this.scene.bonusX2Active) {
            type = 'star';
        }
        
        // Vérifier s'il y a déjà un power-up à cet endroit
        const existingPowerup = this.checkForExistingPowerup(x, y);
        if (existingPowerup) {
            return;
        }
        
        // Choisir la texture appropriée selon le type
        let textureKey;
        switch (type) {
            case 'bomb':
                textureKey = 'powerup_bomb';
                break;
            case 'star':
                textureKey = 'star';
                break;
            case 'bonusx2':
                textureKey = 'bonusx2';
                break;
            default: // weapon
                textureKey = 'powerup';
                break;
        }
        
        // Vérifier si la texture existe
        if (!this.scene.textures.exists(textureKey)) {
            return;
        }
        
        // Créer le sprite du power-up
        const powerup = this.scene.add.sprite(x, y, textureKey);
        
        if (!powerup) {
            return;
        }
        
        // Définir l'échelle selon le type
        if (type === 'star') {
            powerup.setScale(1.125); // 0.75 * 1.5 = 1.125
        } else if (type === 'bonusx2') {
            powerup.setScale(0.75); // 0.5 * 1.5 = 0.75 (64x64 -> 48x48)
        } else {
            powerup.setScale(2); // Pour weapon et bomb
        }
        
        // Définir le type
        powerup.type = type;
        
        // Ajouter des propriétés pour le mouvement vertical uniforme comme les astéroïdes
        powerup.speedY = 0.8; // Même vitesse que les astéroïdes
        powerup.active = true;
        
        // Créer l'animation appropriée si elle n'existe pas
        let animKey;
        if (type === 'star') {
            animKey = 'star_anim';
            if (!this.scene.anims.exists(animKey)) {
                try {
                    this.scene.anims.create({
                        key: animKey,
                        frames: this.scene.anims.generateFrameNumbers('star', { start: 0, end: 3 }),
                        frameRate: 10,
                        repeat: -1
                    });
                } catch (error) {
                    // Erreur silencieuse
                }
            }
        } else if (type === 'bonusx2') {
            animKey = 'bonusx2_anim';
            if (!this.scene.anims.exists(animKey)) {
                try {
                    this.scene.anims.create({
                        key: animKey,
                        frames: this.scene.anims.generateFrameNumbers('bonusx2', { start: 0, end: 12 }),
                        frameRate: 10,
                        repeat: -1
                    });
                } catch (error) {
                    // Erreur silencieuse
                }
            }
        } else {
            animKey = type === 'bomb' ? 'powerup_bomb_anim' : 'powerup_anim';
            if (!this.scene.anims.exists(animKey)) {
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        }
        
        // Jouer l'animation
        try {
            powerup.play(animKey);
        } catch (error) {
            // Erreur silencieuse
        }
        
        // Ajouter au tableau des power-ups
        this.powerups.push(powerup);
    }
    
    /**
     * Vérifie s'il y a déjà un power-up à proximité de la position donnée
     * @param {number} x - Position X à vérifier
     * @param {number} y - Position Y à vérifier
     * @returns {Object|null} - Le power-up existant ou null
     */
    checkForExistingPowerup(x, y) {
        const proximityThreshold = 5; // Réduit de 20 à 5 pixels pour éviter les faux positifs
        
        for (const powerup of this.powerups) {
            const distance = Math.sqrt(
                Math.pow(x - powerup.x, 2) + Math.pow(y - powerup.y, 2)
            );
            
            if (distance < proximityThreshold) {
                return powerup;
            }
        }
        
        return null;
    }
    
    /**
     * Met à jour tous les power-ups, gère leur mouvement et les collisions avec le joueur
     * @param {number} delta - Temps écoulé depuis la dernière frame en ms
     * @param {Object} player - Le vaisseau du joueur (doit avoir une propriété .sprite)
     * @param {function} onPowerupCollected - Callback à appeler lorsqu'un power-up est collecté
     */
    update(delta, player, onPowerupCollected) {
        // Itérer sur les power-ups en commençant par la fin (pour éviter les problèmes lors de la suppression)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // Si le power-up n'est plus actif (par exemple, s'il a été détruit après collecte)
            if (!powerup.active) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Mettre à jour la position Y du power-up
            powerup.y += powerup.speedY * (delta / 1000 * 60); // Normaliser la vitesse par rapport à 60fps
            
            // Si le power-up sort de l'écran par le bas
            if (powerup.y > this.scene.game.config.height + 50) {
                powerup.destroy();
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Vérifier la collision avec le joueur si le joueur et son sprite existent
            if (player && player.sprite && this.scene.collisionManager && !this.isNearRecentCollection(powerup.x, powerup.y)) {
                // Collision avec le joueur
                const intersection = this.scene.collisionManager.getCollisionIntersection(player.sprite, powerup, true, 2, 30);

                if (intersection) {
                    // Enregistrer la position de collecte récente
                    this.addRecentCollection(powerup.x, powerup.y);
                    
                    // Appeler le callback de collecte
                    if (onPowerupCollected) {
                        onPowerupCollected(powerup);
                    }
                    
                    // Détruire le sprite du power-up et le marquer comme inactif
                    powerup.destroy();
                    powerup.active = false; // Marquer comme inactif pour la prochaine itération
                    
                    // Pas besoin de splice ici, car la boucle for et la vérification powerup.active s'en chargent
                }
            }
        }
    }
    
    /**
     * Supprime tous les power-ups de l'écran
     */
    reset() { // Anciennement clear()
        // Détruire chaque sprite de power-up
        this.powerups.forEach(powerup => {
            if (powerup && powerup.active) {
                powerup.destroy();
            }
        });
        
        // Vider le tableau
        this.powerups = [];
        this.recentCollectionPositions = []; // Vider aussi les positions récentes
    }
}

export default PowerupManager;