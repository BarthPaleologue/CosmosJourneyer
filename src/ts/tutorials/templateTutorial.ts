import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/inputControlsString";
import { Tutorial } from "./tutorial";

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";
import i18n from "../i18n";

export const TemplateTutorial: Tutorial = {
    title: "Template Tutorial",
    coverImageSrc: welcomeImageSrc,
    description: "This is a template tutorial to help building more tutorials!",
    getContentPanelsHtml(): string[] {
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>Welcome, Commander! This is a tutorial about tutorials! Now this is meta.</p>
            
            ${i18n.t("tutorials:common:navigationInfo", {
                // This displays a small internationalized text to explain the keys to navigate the tutorial
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel).join(` ${i18n.t("common:or")} `),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel).join(` ${i18n.t("common:or")} `),
                quitKeys: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        const endPanelHtml = `
        <div class="tutorialContent">
            ${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        return [welcomePanelHtml, endPanelHtml];
    }
};
