import { InputMap } from "./inputMap";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { CharacterInputs } from "../characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "../defaultControls/defaultControlsInputs";
import { GeneralInputs } from "./generalInputs";
import { StarSystemInputs } from "./starSystemInputs";
import { StarMapInputs } from "./starMapInputs";

export const InputMaps: InputMap<any>[] = [GeneralInputs, StarSystemInputs, StarMapInputs, SpaceShipControlsInputs, CharacterInputs, DefaultControlsInputs];
