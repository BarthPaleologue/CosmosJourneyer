//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Input, InputType } from "./input";

export class Keyboard implements Input {
    readonly type = InputType.KEYBOARD;

    private keysPressed: Map<string, boolean> = new Map();

    private onPressedOnce: Map<string, (() => void)[]> = new Map();

    constructor() {
        window.addEventListener("keypress", (e) => {
            this.keysPressed.set(e.key, true);

            if (!e.repeat) {
                this.onPressedOnce.get(e.key)?.forEach((callback) => {
                    callback();
                });
            }
        });
        window.addEventListener("keyup", (e) => {
            this.keysPressed.set(e.key, false);
        });
    }

    getRoll() {
        if (this.isPressed("a")) return -1;
        if (this.isPressed("e")) return 1;
        return 0;
    }

    getPitch() {
        if (this.isPressed("i")) return -1;
        if (this.isPressed("k")) return 1;
        return 0;
    }

    getYaw() {
        if (this.isPressed("j")) return 1;
        if (this.isPressed("l")) return -1;
        return 0;
    }

    getZAxis() {
        if (this.isPressed("z")) return 1;
        if (this.isPressed("s")) return -1;
        return 0;
    }

    getXAxis() {
        if (this.isPressed("q")) return -1;
        if (this.isPressed("d")) return 1;
        return 0;
    }

    getYAxis() {
        if (this.isPressed(" ")) return 1;
        if (this.isPressed("c")) return -1;
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
        return this.keysPressed.get(key) || false;
    }

    /**
     * Returns whether or not any key from a list is pressed
     * @param keys the list of keys to check
     * @returns true if at least one is pressed, false otherwise
     */
    public isAnyPressed(keys: string[]): boolean {
        for (const key of keys) {
            if (this.keysPressed.get(key)) return true;
        }
        return false;
    }

    public addPressedOnceListener(key: string, callback: () => void) {
        if (!this.onPressedOnce.has(key)) this.onPressedOnce.set(key, []);
        this.onPressedOnce.get(key)?.push(callback);
    }
}
