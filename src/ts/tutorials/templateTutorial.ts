import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/inputControlsString";
import { Tutorial } from "./tutorial";

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";

export const TemplateTutorial: Tutorial<{ cmdrName: string }> = {
    title: "Template Tutorial",
    coverImageSrc: welcomeImageSrc,
    description: "This is a template tutorial to help building more tutorials!",
    getContentPanelsHtml({ cmdrName }): string[] {
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>Welcome Commander ${cmdrName}! This is a tutorial about tutorials! Now this is meta.</p>
            <p>To move forward in the tutorial, simply press ${pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(" or ")}. You can go back to the previous panel by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(" or ")}.</p> 
            <p>You can leave the tutorial at any time by pressing ${pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(" or ")}.</p>
        </div>`;

        return [welcomePanelHtml];
    }
}