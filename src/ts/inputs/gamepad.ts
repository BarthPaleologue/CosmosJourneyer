//  This file is part of CosmosJourneyer
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

/**
 * All possible buttons on a gamepad
 */
import { Input, InputType } from "./input";

export enum GamepadButton {
    B,
    A,
    X,
    Y,
    L,
    R,
    ZL,
    ZR,
    Select,
    Start,
    LStick,
    RStick,
    DPadUp,
    DPadDown,
    DPadLeft,
    DPadRight,
    Home,
    Screenshot
}

/**
 * All directions on a gamepad
 */
export enum GamepadAxis {
    LX,
    LY,
    RX,
    RY
}

//https://stackoverflow.com/questions/54542318/using-an-enum-as-a-dictionary-key
type EnumDictionary<T extends string | symbol | number, U> = { [K in T]: U };

/**
 * Classe gérant les intéractions avec le gamepad
 */
export class Gamepad implements Input {
    readonly type = InputType.GAMEPAD;

    private gamepad: globalThis.Gamepad | null;
    // Provisoire ne fonctionne que avec la manette switch
    private buttonMapping: EnumDictionary<GamepadButton, number> = {
        [GamepadButton.B]: 0,
        [GamepadButton.A]: 1,
        [GamepadButton.X]: 2,
        [GamepadButton.Y]: 3,
        [GamepadButton.L]: 4,
        [GamepadButton.R]: 5,
        [GamepadButton.ZL]: 6,
        [GamepadButton.ZR]: 7,
        [GamepadButton.Select]: 8,
        [GamepadButton.Start]: 9,
        [GamepadButton.LStick]: 10,
        [GamepadButton.RStick]: 11,
        [GamepadButton.DPadUp]: 12,
        [GamepadButton.DPadDown]: 13,
        [GamepadButton.DPadLeft]: 14,
        [GamepadButton.DPadRight]: 15,
        [GamepadButton.Home]: 16,
        [GamepadButton.Screenshot]: 17
    };
    // correspondance axe <=> index de l'axe (configuration de la switch ici aussi)
    private axisMapping: EnumDictionary<GamepadAxis, number> = {
        [GamepadAxis.LX]: 0,
        [GamepadAxis.LY]: 1,
        [GamepadAxis.RX]: 2,
        [GamepadAxis.RY]: 3
    };
    constructor() {
        this.gamepad = null;
        console.warn("Gamepad non connecté !");

        //https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
        window.addEventListener("gamepadconnected", (e) => {
            console.log(
                "%cGamepad connected at index %d: %s. %d buttons, %d axes.",
                "background: #222; color: #bada55",
                e.gamepad.index,
                e.gamepad.id,
                e.gamepad.buttons.length,
                e.gamepad.axes.length
            );

            this.gamepad = e.gamepad;
        });
    }

    getRoll() {
        this.update();
        if (this.getPressedValue(GamepadButton.L) > 0) return 1;
        if (this.getPressedValue(GamepadButton.R) > 0) return -1;
        return 0;
    }

    getPitch() {
        this.update();
        return this.getAxisValue(GamepadAxis.RY);
    }

    getYaw() {
        this.update();
        return this.getAxisValue(GamepadAxis.RX);
    }

    getZAxis() {
        this.update();
        return -this.getAxisValue(GamepadAxis.LY);
    }

    getXAxis() {
        this.update();
        return this.getAxisValue(GamepadAxis.LX);
    }

    getYAxis() {
        this.update();
        if (this.getPressedValue(GamepadButton.ZR) > 0) {
            return this.getPressedValue(GamepadButton.ZR);
        }
        return this.getPressedValue(GamepadButton.ZL);
    }

    getAcceleration() {
        this.update();
        if (this.isPressed(GamepadButton.Start)) return 1;
        if (this.isPressed(GamepadButton.Select)) return -1;
        return 0;
    }

    /**
     * Fonction à exécuter à chaque frame pour update les états des boutons (à cause Chrome ça)
     */
    public update() {
        this.gamepad = navigator.getGamepads()[0];
    }
    /**
     * Retourne true si le bouton est pressé, false sinon
     * @param button le bouton à écouter
     * @returns si il est pressé ou non
     */
    public isPressed(button: GamepadButton): boolean {
        return this.gamepad?.buttons[this.buttonMapping[button]].pressed || false;
    }

    /**
     * Renvoie la liste des bouttons pressés (debug)
     */
    private list() {
        const r = [];
        for (let i = 0; i < (this.gamepad?.buttons.length || 0); ++i) {
            if (this.gamepad?.buttons[i].pressed) r.push(i);
        }
        if (r.length > 0) console.log(r);
    }

    /**
     * Retourne la valeur de pression du bouton (voir gachettes analogiques)
     * @param button le bouton à écouter
     * @returns la valeur de la pression (0 si le gamepad n'est pas connecté)
     */
    public getPressedValue(button: GamepadButton): number {
        return this.gamepad?.buttons[this.buttonMapping[button]].value || 0;
    }
    /**
     * Retourne la valeur d'un axe donné
     * @param axis l'axe à écouter
     * @returns la valeur de cette axe
     */
    public getAxisValue(axis: GamepadAxis): number {
        return this.gamepad?.axes[this.axisMapping[axis]] || 0;
    }
}
