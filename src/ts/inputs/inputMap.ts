import Action from "@brianchirls/game-input/Action";
import Interaction from "@brianchirls/game-input/interactions/Interaction";

export class InputMap<T extends { [key: string]: Action<any> | Interaction<any> }> {
    readonly name: string;
    readonly map: T;

    constructor(name: string, map: T) {
        this.name = name;
        this.map = map;
    }

    setEnabled(enabled: boolean) {
        for (const actionOrInteraction of Object.values(this.map)) {
            if (actionOrInteraction instanceof Action) {
                actionOrInteraction.enabled = enabled;
            } else {
                actionOrInteraction.action.enabled = enabled;
            }
        }
    }
}
