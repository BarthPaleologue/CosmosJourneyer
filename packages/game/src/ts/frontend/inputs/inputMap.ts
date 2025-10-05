import Action from "@brianchirls/game-input/Action";
import Interaction from "@brianchirls/game-input/interactions/Interaction";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InputMap<T extends Record<string, Action<any> | Interaction>> {
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
            } else if (actionOrInteraction instanceof Interaction) {
                actionOrInteraction.action.enabled = enabled;
            }
        }
    }
}
