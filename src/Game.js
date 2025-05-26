/**
 * Classe Game - Conteneur pour les données globales du jeu
 */
class GameManager {
    constructor() {
        // Version du jeu
        this.version = '1.0.0';
        
        // Constantes du jeu
        this.constants = {
            WIDTH: 360,
            HEIGHT: 640,
            DEBUG: false
        };
        
        // Données globales partagées entre les scènes
        this.gameData = {
            highScore: 0,
            leaderboard: []
        };
        
        // Charger le leaderboard depuis le stockage local
        this.loadLeaderboard();
        
        // Initialiser avec des scores par défaut si le leaderboard est vide
        this.initializeDefaultScores();
    }
    
    /**
     * Obtient le meilleur score
     */
    getHighScore() {
        // Tenter de récupérer depuis le stockage local
        const savedScore = localStorage.getItem('warpZone_highScore');
        if (savedScore) {
            this.gameData.highScore = parseInt(savedScore);
        }
        
        return this.gameData.highScore;
    }
    
    /**
     * Définit un nouveau meilleur score si supérieur
     * @param {number} score - Le score à vérifier
     * @returns {boolean} - True si c'est un nouveau meilleur score
     */
    setHighScore(score) {
        if (score > this.gameData.highScore) {
            this.gameData.highScore = score;
            
            // Sauvegarder dans le stockage local
            localStorage.setItem('warpZone_highScore', score.toString());
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Charge le leaderboard depuis le stockage local
     */
    loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('warpZone_leaderboard');
        if (savedLeaderboard) {
            try {
                this.gameData.leaderboard = JSON.parse(savedLeaderboard);
            } catch (e) {
                this.gameData.leaderboard = [];
            }
        } else {
            this.gameData.leaderboard = [];
        }
    }
    
    /**
     * Sauvegarde le leaderboard dans le stockage local
     */
    saveLeaderboard() {
        localStorage.setItem('warpZone_leaderboard', JSON.stringify(this.gameData.leaderboard));
    }
    
    /**
     * Vérifie si un score fait partie du top 10
     * @param {number} score - Le score à vérifier
     * @returns {boolean} - True si le score fait partie du top 10
     */
    isTopScore(score) {
        if (this.gameData.leaderboard.length < 10) {
            return true;
        }
        
        // Vérifier si le score est supérieur au plus petit score du top 10
        const lowestScore = this.gameData.leaderboard[this.gameData.leaderboard.length - 1].score;
        return score > lowestScore;
    }
    
    /**
     * Ajoute un score au leaderboard
     * @param {string} playerName - Nom du joueur (3 lettres)
     * @param {number} score - Score obtenu
     * @param {string} shipKey - Clé du vaisseau utilisé
     */
    addScore(playerName, score, shipKey) {
        // Créer l'entrée du score
        const scoreEntry = {
            name: playerName.toUpperCase(),
            score: score,
            ship: shipKey,
            date: new Date().toISOString()
        };
        
        // Ajouter au leaderboard
        this.gameData.leaderboard.push(scoreEntry);
        
        // Trier par score décroissant
        this.gameData.leaderboard.sort((a, b) => b.score - a.score);
        
        // Garder seulement les 10 meilleurs
        if (this.gameData.leaderboard.length > 10) {
            this.gameData.leaderboard = this.gameData.leaderboard.slice(0, 10);
        }
        
        // Sauvegarder
        this.saveLeaderboard();
        
        // Mettre à jour le high score si nécessaire
        this.setHighScore(score);
    }
    
    /**
     * Obtient le leaderboard
     * @returns {Array} - Tableau des scores triés
     */
    getLeaderboard() {
        return this.gameData.leaderboard;
    }
    
    /**
     * Obtient l'image du pilote correspondant à un vaisseau
     * @param {string} shipKey - Clé du vaisseau
     * @returns {string} - Clé de l'image du pilote
     */
    getPilotImageKey(shipKey) {
        const pilotMap = {
            'spaceship1': 'spaceship1_pilot',
            'spaceship2': 'spaceship2_pilot',
            'spaceship3': 'spaceship3_pilot'
        };
        
        return pilotMap[shipKey] || 'spaceship1_pilot';
    }
    
    /**
     * Initialise le leaderboard avec des scores par défaut si vide
     */
    initializeDefaultScores() {
        // Si le leaderboard est vide, ajouter des scores par défaut
        if (this.gameData.leaderboard.length === 0) {
            const defaultScores = [
                { name: 'ACE', score: 110, ship: 'spaceship1', date: new Date().toISOString() },
                { name: 'MAX', score: 100, ship: 'spaceship2', date: new Date().toISOString() },
                { name: 'ZEN', score: 90, ship: 'spaceship3', date: new Date().toISOString() },
                { name: 'REX', score: 80, ship: 'spaceship1', date: new Date().toISOString() },
                { name: 'SKY', score: 70, ship: 'spaceship2', date: new Date().toISOString() },
                { name: 'JET', score: 60, ship: 'spaceship3', date: new Date().toISOString() },
                { name: 'FOX', score: 50, ship: 'spaceship1', date: new Date().toISOString() },
                { name: 'ICE', score: 40, ship: 'spaceship2', date: new Date().toISOString() },
                { name: 'RAY', score: 30, ship: 'spaceship3', date: new Date().toISOString() },
                { name: 'NEO', score: 20, ship: 'spaceship1', date: new Date().toISOString() }
            ];
            
            // Ajouter les scores par défaut
            this.gameData.leaderboard = [...defaultScores];
            
            // Mettre à jour le high score avec le meilleur score par défaut
            this.gameData.highScore = defaultScores[0].score;
            
            // Sauvegarder immédiatement
            this.saveLeaderboard();
            localStorage.setItem('warpZone_highScore', this.gameData.highScore.toString());
        }
    }
}

// Créer une instance unique
const gameManager = new GameManager();

// Exporter l'instance du gestionnaire de jeu
export default gameManager;