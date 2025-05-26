/**
 * Classe gérant le fond étoilé du jeu
 */
class Starfield {
    /**
     * Crée le gestionnaire de fond étoilé
     * @param {Phaser.Scene} scene - La scène Phaser à laquelle appartient ce système
     */
    constructor(scene) {
        this.scene = scene;
        this.width = scene.game.config.width;
        this.height = scene.game.config.height;
        
        // Conteneurs pour les étoiles
        this.nearStars = null;
        this.farStars = null;
        
        // Vitesses de scrolling
        this.farStarsSpeed = 0.5;
        this.nearStarsSpeed = 2;
        
        this.create();
    }
    
    /**
     * Crée le fond étoilé
     */
    create() {
        // Créer le fond noir
        this.scene.add.rectangle(0, 0, this.width, this.height, 0x000022).setOrigin(0);
        
        // Créer les conteneurs pour les étoiles
        this.nearStars = this.scene.add.container(0, 0);
        this.farStars = this.scene.add.container(0, 0);
        
        // Générer des étoiles lointaines (petites et lentes)
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.width);
            const y = Phaser.Math.Between(0, this.height);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.6);
            
            const star = this.scene.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.farStars.add(star);
        }
        
        // Générer des étoiles proches (plus grandes et rapides)
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, this.width);
            const y = Phaser.Math.Between(0, this.height);
            const size = Phaser.Math.Between(2, 3);
            const alpha = Phaser.Math.FloatBetween(0.7, 1);
            
            const star = this.scene.add.rectangle(x, y, size, size, 0xFFFFFF)
                .setAlpha(alpha);
            
            this.nearStars.add(star);
        }
    }
    
    /**
     * Met à jour l'animation du fond étoilé
     */
    update() {
        // Mettre à jour les étoiles lointaines
        this.farStars.each(star => {
            star.y += this.farStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.width);
            }
        });
        
        // Mettre à jour les étoiles proches
        this.nearStars.each(star => {
            star.y += this.nearStarsSpeed;
            
            // Réinitialiser la position si l'étoile sort de l'écran
            if (star.y > this.height) {
                star.y = -5;
                star.x = Phaser.Math.Between(0, this.width);
            }
        });
    }
}

export default Starfield; 