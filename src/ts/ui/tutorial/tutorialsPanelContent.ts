import { AvailableTutorials } from "../../tutorials/availableTutorials";
import i18n from "../../i18n";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Tutorial } from "../../tutorials/tutorial";

export class TutorialsPanelContent {
    readonly htmlRoot: HTMLElement;

    readonly onTutorialSelected: Observable<Tutorial> = new Observable<Tutorial>();

    constructor() {
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
            });
        });

        const moreWillCome = document.createElement("p");
        moreWillCome.classList.add("moreWillCome");
        moreWillCome.textContent = i18n.t("tutorials:common:moreWillComeSoon");
        this.htmlRoot.appendChild(moreWillCome);
    }
}
