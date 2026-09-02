import { CharacterInputs } from "@/frontend/gameplay/controls/characterControls/characterControlsInputs";
import { DefaultControlsInputs } from "@/frontend/gameplay/controls/defaultControls/defaultControlsInputs";
import { SpaceShipControlsInputs } from "@/frontend/gameplay/spaceship/spaceShipControlsInputs";
import { StarMapInputs } from "@/frontend/presentation/starmap/starMapInputs";
import { TutorialControlsInputs } from "@/frontend/presentation/ui/tutorial/tutorialLayerInputs";

import { VehicleInputs } from "../vehicle/vehicleControlsInputs";
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
    VehicleInputs,
] as const;
