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

import i18n from "@/i18n";

import { TutorialsPanelContent } from "../tutorial/tutorialsPanelContent";

export class TutorialsPanel {
    readonly htmlRoot: HTMLElement;
    readonly content: TutorialsPanelContent;

    constructor() {
        this.content = new TutorialsPanelContent();
        this.htmlRoot = this.createPanelHTML();
    }

    private createPanelHTML(): HTMLElement {
        const panel = document.createElement("div");
        panel.classList.add("sidePanel", "tutorials");

        // Create title
        const title = document.createElement("h2");
        title.textContent = i18n.t("sidePanel:tutorials");
        panel.appendChild(title);

        // Create warning paragraph
        const warningParagraph = document.createElement("p");
        warningParagraph.setAttribute("align", "center");
        warningParagraph.textContent = i18n.t("sidePanel:tutorialsWarning");
        panel.appendChild(warningParagraph);

        // Append the content
        panel.appendChild(this.content.htmlRoot);

        return panel;
    }
}
