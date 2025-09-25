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

export class ContributePanel {
    readonly htmlRoot: HTMLElement;

    constructor() {
        this.htmlRoot = this.createPanelHTML();
    }

    private createPanelHTML(): HTMLElement {
        const panel = document.createElement("div");
        panel.className = "sidePanel";

        // Create title
        const title = document.createElement("h2");
        title.textContent = i18n.t("sidePanel:contribute");
        panel.appendChild(title);

        // Bug reports section
        const bugReportsHeader = document.createElement("h3");
        bugReportsHeader.textContent = i18n.t("sidePanel:bugReports");
        panel.appendChild(bugReportsHeader);

        const bugReportsText = document.createElement("p");
        bugReportsText.innerHTML = i18n.t("sidePanel:bugReportsText");
        panel.appendChild(bugReportsText);

        // Translation section
        const translationHeader = document.createElement("h3");
        translationHeader.textContent = i18n.t("sidePanel:translation");
        panel.appendChild(translationHeader);

        const translationText = document.createElement("p");
        translationText.innerHTML = i18n.t("sidePanel:translationText");
        panel.appendChild(translationText);

        // Know how to code section
        const codeHeader = document.createElement("h3");
        codeHeader.textContent = i18n.t("sidePanel:knowHowToCode");
        panel.appendChild(codeHeader);

        const codeText = document.createElement("p");
        codeText.innerHTML = i18n.t("sidePanel:knowHowToCodeText");
        panel.appendChild(codeText);

        // Support financially section
        const supportHeader = document.createElement("h3");
        supportHeader.textContent = i18n.t("sidePanel:supportFinancially");
        panel.appendChild(supportHeader);

        const supportText = document.createElement("p");
        supportText.innerHTML = i18n.t("sidePanel:supportFinanciallyText");
        panel.appendChild(supportText);

        return panel;
    }
}
