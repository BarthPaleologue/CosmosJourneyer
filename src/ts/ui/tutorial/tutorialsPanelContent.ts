import { AvailableTutorials } from "../../tutorials/availableTutorials";
import i18n from "../../i18n";
import { StarSystemView } from "../../starSystem/starSystemView";
import { positionNearObjectAsteroidField } from "../../utils/positionNearObject";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tutorial } from "../../tutorials/tutorial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { getSystemModelFromCoordinates } from "../../starSystem/modelFromCoordinates";
import { getObjectBySystemId } from "../../utils/coordinates/orbitalObjectId";

export class TutorialsPanelContent {
    readonly htmlRoot: HTMLElement;

    readonly onTutorialSelected: Observable<Tutorial> = new Observable<Tutorial>();

    constructor(starSystemView: StarSystemView) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("tutorialsMenuContainer");

        AvailableTutorials.forEach((tutorial) => {
            const tutorialDiv = document.createElement("div");
            tutorialDiv.classList.add("tutorial");

            const title = document.createElement("h2");
            title.textContent = tutorial.getTitle();
            tutorialDiv.appendChild(title);

            const coverImage = document.createElement("img");
            coverImage.src = tutorial.coverImageSrc;
            coverImage.alt = tutorial.getTitle();
            tutorialDiv.appendChild(coverImage);

            const description = document.createElement("p");
            description.textContent = tutorial.getDescription();
            tutorialDiv.appendChild(description);

            this.htmlRoot.appendChild(tutorialDiv);

            tutorialDiv.addEventListener("click", async () => {
                this.onTutorialSelected.notifyObservers(tutorial);

                if (tutorial.universeObjectId !== undefined) {
                    const engine = starSystemView.scene.getEngine();
                    engine.displayLoadingUI();
                    const systemModel = getSystemModelFromCoordinates(tutorial.universeObjectId.starSystemCoordinates);
                    await starSystemView.loadStarSystem(systemModel);
                    starSystemView.initStarSystem();
                    engine.hideLoadingUI();

                    const orbitalObject = getObjectBySystemId(tutorial.universeObjectId, starSystemView.getStarSystem());
                    if (orbitalObject === null) {
                        throw new Error(`Orbital object not found for tutorial ${tutorial.getTitle()}. ID: ${JSON.stringify(tutorial.universeObjectId)}`);
                    }

                    const correspondingCelestialBody = starSystemView
                        .getStarSystem()
                        .getCelestialBodies()
                        .find((body) => body === orbitalObject);
                    if (correspondingCelestialBody === undefined) {
                        throw new Error("No corresponding celestial body found");
                    }

                    starSystemView.switchToSpaceshipControls();
                    const position = positionNearObjectAsteroidField(correspondingCelestialBody, starSystemView.getStarSystem());
                    const ship = starSystemView.getSpaceshipControls();
                    ship.getTransform().setAbsolutePosition(position);
                    ship.getTransform().lookAt(correspondingCelestialBody.getTransform().getAbsolutePosition());
                    starSystemView.getStarSystem().translateEverythingNow(ship.getTransform().getAbsolutePosition().negate());
                    ship.getTransform().setAbsolutePosition(Vector3.Zero());
                }
            });
        });

        const moreWillCome = document.createElement("p");
        moreWillCome.classList.add("moreWillCome");
        moreWillCome.textContent = i18n.t("tutorials:common:moreWillComeSoon");
        this.htmlRoot.appendChild(moreWillCome);
    }
}
