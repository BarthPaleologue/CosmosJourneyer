import { InputMap } from "./inputMap";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { CharacterInputs } from "../spacelegs/characterControlsInputs";
import { DefaultControlsInputs } from "../defaultController/defaultControlsInputs";

export const InputMaps: InputMap<any>[] = [
    SpaceShipControlsInputs,
    CharacterInputs,
    DefaultControlsInputs
];