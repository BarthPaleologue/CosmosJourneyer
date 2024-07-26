import { AvailableTutorials } from "../tutorials/availableTutorials";
import i18n from "../i18n";

export function initTutorialsPanel(): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("tutorialsMenuContainer");

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

        container.appendChild(tutorialDiv);
    });

    const moreWillCome = document.createElement("p");
    moreWillCome.classList.add("moreWillCome");
    moreWillCome.textContent = i18n.t("tutorials:common:moreWillComeSoon");
    container.appendChild(moreWillCome);

    return container;
}