import { LandingPad } from "../assets/procedural/landingPad/landingPad";

export interface ManagesLandingPads {
    handleLandingRequest(): LandingPad | null;
}