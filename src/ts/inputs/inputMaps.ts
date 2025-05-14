import { CharacterInputs } from "../characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "../defaultControls/defaultControlsInputs";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { StarMapInputs } from "../starmap/starMapInputs";
import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { GeneralInputs } from "./generalInputs";
import { StarSystemInputs } from "./starSystemInputs";

export const InputMaps = [
    GeneralInputs,
    StarSystemInputs,
    StarMapInputs,
    SpaceShipControlsInputs,
    CharacterInputs,
    DefaultControlsInputs,
    TutorialControlsInputs,
] as const;
