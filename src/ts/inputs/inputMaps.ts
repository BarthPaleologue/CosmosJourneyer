import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { CharacterInputs } from "../characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "../defaultControls/defaultControlsInputs";
import { GeneralInputs } from "./generalInputs";
import { StarSystemInputs } from "./starSystemInputs";
import { StarMapInputs } from "../starmap/starMapInputs";
import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";

export const InputMaps = [
    GeneralInputs,
    StarSystemInputs,
    StarMapInputs,
    SpaceShipControlsInputs,
    CharacterInputs,
    DefaultControlsInputs,
    TutorialControlsInputs
] as const;
