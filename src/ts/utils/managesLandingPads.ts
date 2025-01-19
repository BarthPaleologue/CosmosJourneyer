import { LandingPad, LandingPadSize } from "../assets/procedural/landingPad/landingPad";

export type LandingRequest = {
    minimumPadSize: LandingPadSize;
};

export interface ManagesLandingPads {
    handleLandingRequest(request: LandingRequest): LandingPad | null;

    cancelLandingRequest(pad: LandingPad): void;

    getLandingPads(): LandingPad[];
}
