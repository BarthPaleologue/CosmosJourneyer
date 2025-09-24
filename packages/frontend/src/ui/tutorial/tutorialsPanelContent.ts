//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Observable } from "@babylonjs/core/Misc/observable";

import i18n from "@/i18n";

import { FlightTutorial } from "./tutorials/flightTutorial";
import { FuelScoopTutorial } from "./tutorials/fuelScoopTutorial";
import { StarMapTutorial } from "./tutorials/starMapTutorial";
import { StationLandingTutorial } from "./tutorials/stationLandingTutorial";
import { type Tutorial } from "./tutorials/tutorial";

export class TutorialsPanelContent {
    readonly htmlRoot: HTMLElement;
    readonly onTutorialSelected: Observable<Tutorial> = new Observable<Tutorial>();

    private readonly availableTutorials: ReadonlyArray<Tutorial>;

    constructor() {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("tutorialsMenuContainer");

        this.availableTutorials = [
            new FlightTutorial(),
            new StationLandingTutorial(),
            new StarMapTutorial(),
            new FuelScoopTutorial(),
        ];

        this.availableTutorials.forEach((tutorial) => {
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

            tutorialDiv.addEventListener("click", () => {
                this.onTutorialSelected.notifyObservers(tutorial);
            });
        });

        const moreWillCome = document.createElement("p");
        moreWillCome.classList.add("moreWillCome");
        moreWillCome.textContent = i18n.t("tutorials:common:moreWillComeSoon");
        this.htmlRoot.appendChild(moreWillCome);
    }
}
