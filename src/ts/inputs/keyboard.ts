/**
 * Classe gérant la lecture du clavier
 */
export class Keyboard {
    private keys: { [key: string]: boolean } = {}; // le dictionnaire stockant l'état du clavier
    constructor() {
        window.addEventListener("keypress", (e) => (this.keys[e.key] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    }
    /**
     * Returns whether or not a key is pressed
     * @param key the key to check the state
     * @returns whether the key is pressed or not
     */
    public isPressed(key: string): boolean {
        return this.keys[key];
    }

    /**
     * Returns whether or not any key from a list is pressed
     * @param keys the list of keys to check
     * @returns true if at least one is pressed, false otherwise
     */
    public isAnyPressed(keys: string[]): boolean {
        for (const key of keys) {
            if (this.keys[key]) return true;
        }
        return false;
    }
}
