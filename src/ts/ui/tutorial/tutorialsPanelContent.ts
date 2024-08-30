import { AvailableTutorials } from "../../tutorials/availableTutorials";
import i18n from "../../i18n";
import { StarSystemView } from "../../starSystem/starSystemView";
import { StarSystemController } from "../../starSystem/starSystemController";
import { SystemSeed } from "../../utils/systemSeed";
import { positionNearObjectAsteroidField } from "../../utils/positionNearObject";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tutorial } from "../../tutorials/tutorial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SystemObjectType } from "../../saveFile/universeCoordinates";

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
                this.onTutorialSelected.notifyObservers(tutorial);

                if (tutorial.universeObjectId !== undefined) {
                    const engine = starSystemView.scene.getEngine();
                    engine.displayLoadingUI();
                    const systemSeed = SystemSeed.Deserialize(tutorial.universeObjectId.starSystem);
                    await starSystemView.loadStarSystem(new StarSystemController(systemSeed, starSystemView.scene), true);
                    starSystemView.initStarSystem();
                    engine.hideLoadingUI();

                    let orbitalObject;
                    switch (tutorial.universeObjectId.objectType) {
                        case SystemObjectType.STELLAR_OBJECT:
                            orbitalObject = starSystemView.getStarSystem().stellarObjects[tutorial.universeObjectId.index];
                            break;
                        case SystemObjectType.ANOMALY:
                            orbitalObject = starSystemView.getStarSystem().anomalies[tutorial.universeObjectId.index];
                            break;
                        case SystemObjectType.PLANETARY_MASS_OBJECT:
                            orbitalObject = starSystemView.getStarSystem().planets[tutorial.universeObjectId.index];
                            break;
                        case SystemObjectType.SPACE_STATION:
                            orbitalObject = starSystemView.getStarSystem().spaceStations[tutorial.universeObjectId.index];
                            break;
                    }

                    const correspondingCelestialBody = starSystemView
                        .getStarSystem()
                        .getBodies()
                        .find((body) => body.name === orbitalObject.name);
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
