/**
 * Classe gérant la détection de collision, y compris pixel-perfect.
 */
class CollisionManager {
    /**
     * Constructeur du gestionnaire de collisions.
     * @param {Phaser.Scene} scene - La scène Phaser à laquelle ce gestionnaire est attaché.
     */
    constructor(scene) {
        this.scene = scene;
        this.tempCanvas = null;
        this.tempContext = null;
        this.debugGraphics = null; // Pour le dessin de débogage
        // console.log("[CollisionManager] Initialisé"); // Commenté
    }

    /**
     * Récupère la frame de texture actuelle pour un sprite.
     * @param {Phaser.GameObjects.Sprite} sprite - Le sprite.
     * @returns {Phaser.Textures.Frame | null} La frame de texture ou null.
     */
    getTextureFrame(sprite) {
        const textureKey = sprite && sprite.texture ? sprite.texture.key : 'unknown_texture';


        if (!sprite || !sprite.texture || !sprite.texture.source) {
            console.warn(`[CM] getTextureFrame: Sprite, texture, ou source invalide pour ${textureKey}. Sprite:`, sprite); // Important warning
            return null;
        }
        
        if (sprite.anims && sprite.anims.currentFrame) {
            if (!sprite.anims.currentFrame.frame) { 
                 console.warn(`[CM] getTextureFrame: ${textureKey} - Voie de l'animation choisie, mais sprite.anims.currentFrame.frame est MANQUANTE. currentFrame:`, sprite.anims.currentFrame); // Important warning
                 return null; 
            }
            return sprite.anims.currentFrame.frame; 
        }
        
        const staticFrame = sprite.texture.get();
        if (!staticFrame) {
            console.warn(`[CM] getTextureFrame: ${textureKey} - Voie de la texture statique choisie, mais sprite.texture.get() a retourné null/undefined. Texture:`, sprite.texture); // Important warning
        }
        return staticFrame;
    }

    /**
     * Vérifie si un pixel d'une frame est opaque.
     * @param {Phaser.Textures.Frame} frame - La frame de texture.
     * @param {number} x - Coordonnée X du pixel dans la frame.
     * @param {number} y - Coordonnée Y du pixel dans la frame.
     * @param {number} threshold - Seuil d'alpha pour considérer le pixel comme opaque.
     * @returns {boolean} Vrai si le pixel est opaque.
     */
    isPixelOpaque(frame, x, y, threshold = 10) {
        if (!frame || !frame.source || !frame.source.image) {
            console.warn("[CollisionManager] Frame ou source d'image invalide pour isPixelOpaque. Frame:", frame); // Important warning
            return false; 
        }

        if (x < 0 || y < 0 || x >= frame.cutWidth || y >= frame.cutHeight) {
            return false; 
        }

        try {
            if (!this.tempCanvas) {
                this.tempCanvas = document.createElement('canvas');
                this.tempContext = this.tempCanvas.getContext('2d', { willReadFrequently: true });
            }
            
            this.tempCanvas.width = frame.cutWidth;
            this.tempCanvas.height = frame.cutHeight;
            
            this.tempContext.clearRect(0, 0, frame.cutWidth, frame.cutHeight);
            this.tempContext.drawImage(
                frame.source.image,
                frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 
                0, 0, frame.cutWidth, frame.cutHeight 
            );
            
            const pixelData = this.tempContext.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
            return pixelData[3] > threshold;

        } catch (e) {
            console.warn("[CollisionManager] Erreur lors de l'accès aux données de pixel:", e); // Important warning
            return true; 
        }
    }

    /**
     * Vérifie si deux sprites se chevauchent au niveau du pixel dans une zone d'intersection donnée.
     * @param {Phaser.GameObjects.Sprite} sprite1 - Premier sprite.
     * @param {Phaser.GameObjects.Sprite} sprite2 - Second sprite.
     * @param {Phaser.Textures.Frame} frame1 - Frame du premier sprite.
     * @param {Phaser.Textures.Frame} frame2 - Frame du second sprite.
     * @param {Phaser.Geom.Rectangle} intersection - Zone d'intersection rectangulaire.
     * @param {number} [alphaThreshold=30] - Seuil d'alpha pour la détection.
     * @param {number} [customStep=2] - Pas pour la vérification des pixels.
     * @returns {boolean} Vrai si une collision pixel-perfect est détectée.
     */
    checkPixelOverlap(sprite1, sprite2, frame1, frame2, intersection, alphaThreshold = 30, customStep = 2) {
        const scaleX1 = sprite1.scaleX * (sprite1.parentContainer ? sprite1.parentContainer.scaleX : 1);
        const scaleY1 = sprite1.scaleY * (sprite1.parentContainer ? sprite1.parentContainer.scaleY : 1);
        const scaleX2 = sprite2.scaleX * (sprite2.parentContainer ? sprite2.parentContainer.scaleX : 1);
        const scaleY2 = sprite2.scaleY * (sprite2.parentContainer ? sprite2.parentContainer.scaleY : 1);

        const bounds1 = sprite1.getBounds();
        const bounds2 = sprite2.getBounds();
        
        const step = Math.max(1, Math.floor(customStep));

        for (let x = 0; x < intersection.width; x += step) {
            for (let y = 0; y < intersection.height; y += step) {
                const globalX = intersection.x + x;
                const globalY = intersection.y + y;
                let localX1 = (globalX - bounds1.x) / scaleX1;
                let localY1 = (globalY - bounds1.y) / scaleY1;
                let localX2 = (globalX - bounds2.x) / scaleX2;
                let localY2 = (globalY - bounds2.y) / scaleY2;

                if (this.isPixelOpaque(frame1, localX1, localY1, alphaThreshold) &&
                    this.isPixelOpaque(frame2, localX2, localY2, alphaThreshold)) {
                    // console.log(`[CM] checkPixelOverlap: PIXEL HIT! Global (${globalX.toFixed(1)},${globalY.toFixed(1)}) | ${sprite1.texture.key}_local (${localX1.toFixed(1)},${localY1.toFixed(1)}) | ${sprite2.texture.key}_local (${localX2.toFixed(1)},${localY2.toFixed(1)})`); // Commenté
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Vérifie la collision entre deux objets de jeu (sprites).
     * @param {Phaser.GameObjects.Sprite} objectA - Le premier sprite.
     * @param {Phaser.GameObjects.Sprite} objectB - Le second sprite.
     * @param {boolean} [enablePixelPerfect=true] - Activer la détection pixel-perfect si la collision rectangulaire est positive.
     * @param {number} [pixelPerfectStep=1] - Pas pour la détection pixel-perfect.
     * @param {number} [alphaThreshold=80] - Seuil d'alpha pour la détection pixel-perfect.
     * @returns {Phaser.Geom.Rectangle | null} L'objet intersection si collision, sinon null.
     */
    getCollisionIntersection(objectA, objectB, enablePixelPerfect = true, pixelPerfectStep = 1, alphaThreshold = 80) {
        const nameA = objectA && objectA.texture ? objectA.texture.key : (objectA && objectA.name ? objectA.name : 'ObjetA');
        const nameB = objectB && objectB.texture ? objectB.texture.key : (objectB && objectB.name ? objectB.name : 'ObjetB');

        if (!objectA || !objectA.active || !objectA.visible || !objectB || !objectB.active || !objectB.visible) {
            return null;
        }
        if (typeof objectA.getBounds !== 'function' || typeof objectB.getBounds !== 'function') {
            console.warn("[CM] getCollisionIntersection: Un objet n'a pas de méthode getBounds."); // Important warning
            return null;
        }

        const boundsA = objectA.getBounds();
        const boundsB = objectB.getBounds();

        if (Phaser.Geom.Rectangle.Overlaps(boundsA, boundsB)) {
            const intersection = Phaser.Geom.Rectangle.Intersection(boundsA, boundsB);
            if (intersection.width < 1 || intersection.height < 1) {
                return null;
            }

            if (!enablePixelPerfect) {
                return intersection;
            }

            const frameA = this.getTextureFrame(objectA);
            const frameB = this.getTextureFrame(objectB);

            if (!frameA || !frameB) {
                console.warn(`[CM] getCollisionIntersection: Frame manquante pour pixel-perfect (${nameA}: ${!!frameA}, ${nameB}: ${!!frameB}). RETOURNE intersection rectangulaire comme fallback.`); // Important warning
                return intersection;
            }
            
            // console.log("[CM] getCollisionIntersection: Passage à la vérification pixel-perfect..."); // Commenté
            if (this.checkPixelOverlap(objectA, objectB, frameA, frameB, intersection, alphaThreshold, pixelPerfectStep)) {
                // console.log("[CM] getCollisionIntersection: Collision pixel-perfect CONFIRMÉE. RETOURNE intersection."); // Commenté
                return intersection;
            } else {
                // console.log("[CM] getCollisionIntersection: Collision pixel-perfect NON confirmée. RETOURNE null."); // Commenté
                return null;
            }
        }
        // console.log(`[CM] getCollisionIntersection: Chevauchement des rectangles englobants NON détecté pour ${nameA} et ${nameB}. RETOURNE null.`); // Commenté
        return null;
    }
    
    /**
     * Affiche visuellement la zone d'intersection pour le débogage.
     * @param {Phaser.GameObjects.Sprite} sprite1 - Premier sprite.
     * @param {Phaser.GameObjects.Sprite} sprite2 - Second sprite.
     * @param {Phaser.Geom.Rectangle} intersection - Rectangle d'intersection.
     * @param {boolean} pixelPerfectHit - Si la collision pixel perfect a été positive.
     */
    debugDrawCollision(sprite1, sprite2, intersection, pixelPerfectHit) {
        if (!this.debugGraphics) {
            this.debugGraphics = this.scene.add.graphics().setDepth(999); 
        }
        this.debugGraphics.clear();

        const bounds1 = sprite1.getBounds();
        const bounds2 = sprite2.getBounds();

        this.debugGraphics.lineStyle(1, 0xff0000, 0.5);
        this.debugGraphics.strokeRectShape(bounds1);

        this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
        this.debugGraphics.strokeRectShape(bounds2);

        const intersectionColor = pixelPerfectHit ? 0x0000ff : 0x00ffff;
        this.debugGraphics.lineStyle(2, intersectionColor, 0.8);
        this.debugGraphics.strokeRectShape(intersection);
        
        // Points de test dans l'intersection (jaunes) - Commenté
        /*
        this.debugGraphics.fillStyle(0xffff00, 0.5);
        const step = 4;
        for (let x = 0; x < intersection.width; x += step) {
            for (let y = 0; y < intersection.height; y += step) {
                const globalX = intersection.x + x;
                const globalY = intersection.y + y;
                this.debugGraphics.fillRect(globalX - 1, globalY - 1, 2, 2);
            }
        }
        */
    }

    clearDebugGraphics() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    /**
     * Nettoie les ressources temporaires (comme le canvas).
     */
    destroy() {
        if (this.tempCanvas) {
            this.tempCanvas = null;
            this.tempContext = null;
        }
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
        // console.log("[CollisionManager] Détruit"); // Commenté
    }
}

export default CollisionManager; 