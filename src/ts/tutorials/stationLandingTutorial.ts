import { TutorialControlsInputs } from "../ui/tutorial/tutorialLayerInputs";
import { pressInteractionToStrings } from "../utils/strings/inputControlsString";
import { Tutorial } from "./tutorial";

import station1ImageSrc from "../../asset/tutorials/stationLandingTutorial/station1.webp";
import stationLandingBayImageSrc from "../../asset/tutorials/stationLandingTutorial/stationLandingBay.webp";
import stationPadApproachImageSrc from "../../asset/tutorials/stationLandingTutorial/stationPadApproach.webp";
import stationServicesImageSrc from "../../asset/tutorials/stationLandingTutorial/stationServices.webp";
import saveData from "../../asset/tutorials/stationLandingTutorial/save.json";
import i18n from "../i18n";
import { getGlobalKeyboardLayoutMap } from "../utils/keyboardAPI";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { parseSaveFileData } from "../saveFile/saveFileData";

const parsedSaveData = parseSaveFileData(JSON.stringify(saveData));
if (parsedSaveData.data === null) {
    throw new Error("StationLandingTutorial: saveData is null");
}

export const StationLandingTutorial: Tutorial = {
    getTitle() {
        return i18n.t("tutorials:stationLanding:title");
    },
    coverImageSrc: station1ImageSrc,
    getDescription() {
        return i18n.t("tutorials:stationLanding:description");
    },
    saveData: parsedSaveData.data,
    async getContentPanelsHtml(): Promise<string[]> {
        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
        const presentationPanelHtml = `
        <div class="tutorialContent">
            <img src="${station1ImageSrc}" alt="Space Station">
            <p>${i18n.t("tutorials:stationLanding:welcome")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:whatAreStations")}</p>
            
            ${i18n.t("tutorials:common:navigationInfo", {
                // This displays a small internationalized text to explain the keys to navigate the tutorial
                nextKeys: pressInteractionToStrings(TutorialControlsInputs.map.nextPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                ),
                previousKeys: pressInteractionToStrings(TutorialControlsInputs.map.prevPanel, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                ),
                quitKeys: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}
        </div>`;

        const landingRequestPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationLandingBayImageSrc}" alt="Space Station's landing bay">
            
            <p>${i18n.t("tutorials:stationLanding:whereLandingBay")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:landingRequest", {
                keys: pressInteractionToStrings(SpaceShipControlsInputs.map.emitLandingRequest, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}</p>
            
        </div>`;

        const landingPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationPadApproachImageSrc}" alt="Space Station">    
            <p>${i18n.t("tutorials:stationLanding:requestAccepted")}</p>
        
            <p>${i18n.t("tutorials:stationLanding:beCareful")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:autoLanding")}</p>
        </div>`;

        const stationServicesPanelHtml = `
        <div class="tutorialContent">
            <img src="${stationServicesImageSrc}" alt="Space Station">
            
            <p>${i18n.t("tutorials:stationLanding:services1")}</p>
            
            <p>${i18n.t("tutorials:stationLanding:services2")}</p>
            
            <p>${i18n.t("tutorials:common:tutorialEnding", {
                // This displays a small internationalized text to explain the keys to end the tutorial
                keyQuit: pressInteractionToStrings(TutorialControlsInputs.map.quitTutorial, keyboardLayoutMap).join(
                    ` ${i18n.t("common:or")} `
                )
            })}
                </p>
        </div>`;

        return [presentationPanelHtml, landingRequestPanelHtml, landingPanelHtml, stationServicesPanelHtml];
    }
};
