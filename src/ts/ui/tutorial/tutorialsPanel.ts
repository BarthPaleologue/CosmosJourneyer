import { AvailableTutorials } from "../../tutorials/availableTutorials";
import i18n from "../../i18n";
import { StarSystemView } from "../../starSystem/starSystemView";
import { StarSystemController } from "../../starSystem/starSystemController";
import { SystemSeed } from "../../utils/systemSeed";
import { positionNearObjectAsteroidField } from "../../utils/positionNearObject";
import { Observable } from "@babylonjs/core/Misc/observable";

export class TutorialsPanelContent {
    readonly htmlRoot: HTMLElement;

    readonly onTutorialSelected: Observable<void> = new Observable<void>();

    constructor(starSystemView: StarSystemView) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("tutorialsMenuContainer");

        AvailableTutorials.forEach((tutorial) => {
            const tutorialDiv = document.createElement("div");
            tutorialDiv.classList.add("tutorial");

            const title = document.createElement("h2");
            title.textContent = tutorial.title;
            tutorialDiv.appendChild(title);

            const coverImage = document.createElement("img");
            coverImage.src = tutorial.coverImageSrc;
            coverImage.alt = tutorial.title;
            tutorialDiv.appendChild(coverImage);

            const description = document.createElement("p");
            description.textContent = tutorial.description;
            tutorialDiv.appendChild(description);

            this.htmlRoot.appendChild(tutorialDiv);

            tutorialDiv.addEventListener("click", async () => {
                this.onTutorialSelected.notifyObservers();

                if (tutorial.universeObjectIdentifier !== undefined) {
                    const engine = starSystemView.scene.getEngine();
                    engine.displayLoadingUI();
                    const systemSeed = SystemSeed.Deserialize(tutorial.universeObjectIdentifier.starSystem);
                    await starSystemView.loadStarSystem(new StarSystemController(systemSeed, starSystemView.scene), true);
                    starSystemView.initStarSystem();
                    engine.hideLoadingUI();

                    const orbitalObject = starSystemView.getStarSystem().getOrbitalObjects()[tutorial.universeObjectIdentifier.orbitalObjectIndex];
                    const correspondingCelestialBody = starSystemView
                        .getStarSystem()
                        .getBodies()
                        .find((body) => body.name === orbitalObject.name);
                    if (correspondingCelestialBody === undefined) {
                        throw new Error("No corresponding celestial body found");
                    }

                    starSystemView.switchToSpaceshipControls();
                    positionNearObjectAsteroidField(correspondingCelestialBody, starSystemView.getSpaceshipControls(), starSystemView.getStarSystem());
                }
            });
        });

        const moreWillCome = document.createElement("p");
        moreWillCome.classList.add("moreWillCome");
        moreWillCome.textContent = i18n.t("tutorials:common:moreWillComeSoon");
        this.htmlRoot.appendChild(moreWillCome);
    }
}