/**
 * Gestionnaire audio du jeu
 * Gère la lecture des musiques et des effets sonores avec fondus enchaînés
 */
class AudioManager {
    constructor(scene) {
        // Si une instance existe déjà, la retourner (pattern Singleton)
        if (AudioManager.instance) {
            // Mettre à jour la référence de la scène
            AudioManager.instance.scene = scene;
            return AudioManager.instance;
        }
        
        // Sinon, créer une nouvelle instance
        AudioManager.instance = this;
        
        this.scene = scene;
        
        // Références aux musiques
        this.currentMusic = null;
        this.nextMusic = null;
        
        // Volume par défaut pour les musiques
        this.musicVolume = 0.7;
        
        // Durée des fondus enchaînés en millisecondes
        this.fadeInDuration = 1000;
        this.fadeOutDuration = 1000;
        this.crossfadeDuration = 1500;
        
        // État de l'audio
        this.isMuted = false;
        
        // État des transitions
        this.isTransitioning = false;
        
        // Stocker les références aux musiques chargées
        this.musicTracks = {};
        
        console.log("[AudioManager] Instance unique créée");
    }
    
    /**
     * Précharge toutes les ressources audio
     * Doit être appelé dans la méthode preload d'une scène
     */
    preloadAudio(scene) {
        // Musiques principales
        scene.load.audio('background', 'assets/music/background.mp3');
        scene.load.audio('overdrive', 'assets/music/overdrive.mp3');
        scene.load.audio('boss', 'assets/music/boss.mp3');
        scene.load.audio('victory', 'assets/music/victory.mp3');
        scene.load.audio('defeat', 'assets/music/defeat.mp3');
        
        // Effets sonores (à ajouter si nécessaire)
    }
    
    /**
     * Joue une musique avec fondu enchaîné
     * @param {string} key - Clé de la musique à jouer
     * @param {Object} options - Options supplémentaires
     */
    playMusic(key, options = {}) {
        // Options par défaut
        const defaults = {
            volume: this.musicVolume,
            loop: true,
            fadeIn: true,
            stopOthers: true
        };
        
        // Fusionner les options
        const settings = { ...defaults, ...options };
        
        // Si nous sommes déjà en train de jouer cette musique, ne rien faire
        if (this.currentMusic && this.currentMusic.key === key && !this.currentMusic.isPaused) {
            return;
        }
        
        // IMPORTANT: Arrêter TOUTES les musiques en cours avant d'en démarrer une nouvelle
        console.log(`[AudioManager] Changement de musique: ${key}`);
        this.stopAllMusic(true);
        
        // Vérifier si la musique est déjà chargée
        if (this.musicTracks[key]) {
            // Utiliser la musique existante
            this.nextMusic = this.musicTracks[key];
        } else {
            try {
                // Créer une nouvelle instance de musique
                this.nextMusic = this.scene.sound.add(key, {
                    loop: settings.loop,
                    volume: settings.fadeIn ? 0 : settings.volume // Commencer à 0 si fadeIn est activé
                });
                
                // Stocker la référence
                this.musicTracks[key] = this.nextMusic;
                this.nextMusic.key = key;
            } catch (error) {
                console.error(`[AudioManager] Erreur lors du chargement de la musique ${key}:`, error);
                return; // Sortir si erreur
            }
        }
        
        // Si nous sommes en mode muet, s'assurer que la musique est muette
        if (this.isMuted) {
            this.nextMusic.setMute(true);
        }
        
        // Maintenant que toutes les musiques sont arrêtées, simplement jouer la nouvelle musique
        if (settings.fadeIn) {
            this.nextMusic.play();
            this.fadeIn(this.nextMusic, settings.volume);
        } else {
            this.nextMusic.setVolume(settings.volume);
            this.nextMusic.play();
        }
        
        // Mettre à jour la musique actuelle
        this.currentMusic = this.nextMusic;
        this.nextMusic = null;
    }
    
    /**
     * Effectue un fondu enchaîné entre deux musiques
     * @param {Phaser.Sound.BaseSound} from - Musique à arrêter progressivement
     * @param {Phaser.Sound.BaseSound} to - Musique à démarrer progressivement
     * @param {number} targetVolume - Volume cible
     */
    crossfade(from, to, targetVolume) {
        // Marquer comme en transition
        this.isTransitioning = true;
        
        // Commencer à jouer la nouvelle musique (à volume 0)
        to.setVolume(0);
        to.play();
        
        // Créer un tween pour le fondu de sortie
        this.scene.tweens.add({
            targets: from,
            volume: 0,
            duration: this.crossfadeDuration,
            ease: 'Linear',
            onComplete: () => {
                from.stop();
            }
        });
        
        // Créer un tween pour le fondu d'entrée
        this.scene.tweens.add({
            targets: to,
            volume: targetVolume,
            duration: this.crossfadeDuration,
            ease: 'Linear',
            onComplete: () => {
                // Mettre à jour la musique actuelle
                this.currentMusic = to;
                this.nextMusic = null;
                this.isTransitioning = false;
            }
        });
    }
    
    /**
     * Fait un fondu d'entrée sur une musique
     * @param {Phaser.Sound.BaseSound} music - Musique à manipuler
     * @param {number} targetVolume - Volume cible
     */
    fadeIn(music, targetVolume) {
        this.scene.tweens.add({
            targets: music,
            volume: targetVolume,
            duration: this.fadeInDuration,
            ease: 'Linear'
        });
    }
    
    /**
     * Fait un fondu de sortie sur une musique
     * @param {Phaser.Sound.BaseSound} music - Musique à manipuler
     * @param {boolean} stopAfter - Arrêter la musique après le fondu
     */
    fadeOut(music, stopAfter = true) {
        this.scene.tweens.add({
            targets: music,
            volume: 0,
            duration: this.fadeOutDuration,
            ease: 'Linear',
            onComplete: () => {
                if (stopAfter) {
                    music.stop();
                }
            }
        });
    }
    
    /**
     * Arrête toutes les musiques
     * @param {boolean} withFade - Utiliser un fondu de sortie
     */
    stopAllMusic(withFade = true) {
        // Parcourir toutes les musiques stockées
        Object.values(this.musicTracks).forEach(music => {
            if (music && music.isPlaying) {
                if (withFade) {
                    this.fadeOut(music, true);
                } else {
                    music.stop();
                }
            }
        });
        
        // Réinitialiser les références
        this.currentMusic = null;
        this.nextMusic = null;
    }
    
    /**
     * Arrête la musique en cours
     * @param {boolean} withFade - Utiliser un fondu de sortie
     */
    stopCurrentMusic(withFade = true) {
        if (this.currentMusic) {
            if (withFade) {
                this.fadeOut(this.currentMusic, true);
            } else {
                this.currentMusic.stop();
            }
            this.currentMusic = null;
        }
    }
    
    /**
     * Met en pause la musique en cours
     * @param {boolean} withFade - Utiliser un fondu de sortie
     */
    pauseCurrentMusic(withFade = true) {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            if (withFade) {
                this.scene.tweens.add({
                    targets: this.currentMusic,
                    volume: 0,
                    duration: this.fadeOutDuration / 2, // Plus rapide pour une pause
                    ease: 'Linear',
                    onComplete: () => {
                        this.currentMusic.pause();
                    }
                });
            } else {
                this.currentMusic.pause();
            }
        }
    }
    
    /**
     * Reprend la musique en pause
     * @param {boolean} withFade - Utiliser un fondu d'entrée
     */
    resumeCurrentMusic(withFade = true) {
        if (this.currentMusic && this.currentMusic.isPaused) {
            if (withFade) {
                this.currentMusic.resume();
                this.fadeIn(this.currentMusic, this.musicVolume);
            } else {
                this.currentMusic.resume();
            }
        }
    }
    
    /**
     * Active/désactive le son
     * @param {boolean} muted - État de mise en sourdine
     */
    setMute(muted) {
        this.isMuted = muted;
        
        // Appliquer à toutes les musiques
        Object.values(this.musicTracks).forEach(music => {
            music.setMute(muted);
        });
    }
    
    /**
     * Change le volume de toutes les musiques
     * @param {number} volume - Nouveau volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        
        // Appliquer à la musique en cours
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }
    
    /**
     * Nettoie les ressources en quittant la scène
     * Note: ne détruit pas l'instance car elle doit être partagée entre les scènes
     */
    destroy() {
        // NE PAS vider le this.musicTracks pour conserver les références entre les scènes
        // NE PAS mettre à null l'instance AudioManager.instance
        
        // Conserver les musiques actives mais mettre à jour la référence de la scène
        console.log(`[AudioManager] Mise à jour du contexte de scène uniquement`);
    }
}

// Initialiser la propriété statique pour le singleton
AudioManager.instance = null;

export default AudioManager; 