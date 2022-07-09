import { Input } from "./input";

export class Keyboard implements Input {
    private keys: { [key: string]: boolean } = {}; // le dictionnaire stockant l'état du clavier
    constructor() {
        window.addEventListener("keypress", (e) => (this.keys[e.key] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    }

    getRoll() {
        if(this.isPressed("a")) return 1;
        if(this.isPressed("e")) return -1;
        return 0;
    }

    getPitch() {
        if(this.isPressed("i")) return -1;
        if(this.isPressed("k")) return 1;
        return 0;
    }

    getYaw() {
        if(this.isPressed("j")) return -1;
        if(this.isPressed("l")) return 1;
        return 0;
    }

    getZAxis() {
        if(this.isPressed("z")) return 1;
        if(this.isPressed("s")) return -1;
        return 0;
    }

    getXAxis() {
        if(this.isPressed("q")) return -1;
        if(this.isPressed("d")) return 1;
        return 0;
    }

    getYAxis() {
        if(this.isPressed(" ")) return 1;
        if(this.isPressed("c")) return -1;
        return 0;
    }

    getAcceleration() {
        if (this.isPressed("-")) return -1;
        if (this.isPressed("+")) return 1;
        return 0;
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
