import { LandingPad, LandingPadSize } from "../assets/procedural/landingPad/landingPad";

export type LandingRequest = {
    minimumPadSize: LandingPadSize;
};

export interface ManagesLandingPads {
    handleLandingRequest(request: LandingRequest): LandingPad | null;

    cancelLandingRequest(pad: LandingPad): void;

    /**
     * Returns all landing pads, including those that are currently in use.
     */
    getLandingPads(): LandingPad[];

    /**
     * Returns all landing pads that are currently available for landing.
     */
    getAvailableLandingPads(): LandingPad[];
}
