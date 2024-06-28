import { LandingPad } from "../assets/procedural/landingPad/landingPad";

export interface Dockable {
    handleDockingRequest(): LandingPad | null;
}