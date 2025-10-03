import { CharacterInputs } from "@cosmos-journeyer/frontend/controls/characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "@cosmos-journeyer/frontend/controls/defaultControls/defaultControlsInputs";
import { SpaceShipControlsInputs } from "@cosmos-journeyer/frontend/spaceship/spaceShipControlsInputs";
import { StarMapInputs } from "@cosmos-journeyer/frontend/starmap/starMapInputs";
import { TutorialControlsInputs } from "@cosmos-journeyer/frontend/ui/tutorial/tutorialLayerInputs";

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
