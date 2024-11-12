import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { Tutorial } from "./tutorial";

import welcomeImageSrc from "../../asset/tutorials/flightTutorial/welcome.webp";
import i18n from "../i18n";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";

export const TemplateTutorial: Tutorial = {
    getTitle() {
        return "Template Tutorial";
    },
    coverImageSrc: welcomeImageSrc,
    getDescription() {
        return "This is a template tutorial to help building more tutorials!";
    },
    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const welcomePanelHtml = `
        <div class="tutorialContent">
            <img src="${welcomeImageSrc}" alt="Welcome to Cosmos Journeyer">
            <p>Welcome, Commander! This is a tutorial about tutorials! Now this is meta.</p>
            
            ${i18n.t("tutorials:common:navigationInfo", {
                // This displays a small internationalized text to explain the keys to navigate the tutorial
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(` ${i18n.t("common:or")} `),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, keyboardLayoutMap).join(` ${i18n.t("common:or")} `),
                quitKeys: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, keyboardLayoutMap).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        const endPanelHtml = `
        <div class="tutorialContent">
            ${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, keyboardLayoutMap).join(` ${i18n.t("common:or")} `)
            })}
        </div>`;

        return [welcomePanelHtml, endPanelHtml];
    }
};
