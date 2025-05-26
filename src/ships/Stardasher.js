import Ship from './Ship.js';

/**
 * Classe spécifique pour le vaisseau Stardasher
 */
class Stardasher extends Ship {
    /**
     * Constructeur du vaisseau Stardasher
     * @param {Phaser.Scene} scene - La scène du jeu
     * @param {number} x - Position horizontale initiale
     * @param {number} y - Position verticale initiale
     */
    constructor(scene, x, y) {
        // Propriétés spécifiques au Stardasher
        const props = {
            moveSpeed: 4,           // Plus rapide que les autres vaisseaux
            projectilePower: 5,     // Puissance moyenne des projectiles
            projectileSpeed: 350,    // Vitesse moyenne des projectiles
            cooldown: 350           // Cadence de tir rapide
        };
        
        // Appeler le constructeur de la classe parent avec la texture spécifique
        super(scene, x, y, 'spaceship1', props);
    }
}

export default Stardasher; 