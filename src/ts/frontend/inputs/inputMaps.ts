import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "@/frontend/controls/defaultControls/defaultControlsInputs";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { StarMapInputs } from "@/frontend/starmap/starMapInputs";
import { TutorialControlsInputs } from "@/frontend/ui/tutorial/tutorialLayerInputs";

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
