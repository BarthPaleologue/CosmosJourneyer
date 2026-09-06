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

import type { TFunction } from "i18next";

import { renderMarkdownInline } from "@/utils/markdown";

export class ContributePanel {
    readonly htmlRoot: HTMLElement;

    constructor(t: TFunction) {
        this.htmlRoot = this.createPanelHTML(t);
    }

    private createPanelHTML(t: TFunction): HTMLElement {
        const panel = document.createElement("div");
        panel.className = "sidePanel";

        // Create title
        const title = document.createElement("h2");
        title.textContent = t("sidePanel:contribute");
        panel.appendChild(title);

        // Bug reports section
        const bugReportsHeader = document.createElement("h3");
        bugReportsHeader.textContent = t("sidePanel:bugReports");
        panel.appendChild(bugReportsHeader);

        const bugReportsText = document.createElement("p");
        bugReportsText.innerHTML = renderMarkdownInline(t("sidePanel:bugReportsText"));
        panel.appendChild(bugReportsText);

        // Translation section
        const translationHeader = document.createElement("h3");
        translationHeader.textContent = t("sidePanel:translation");
        panel.appendChild(translationHeader);

        const translationText = document.createElement("p");
        translationText.innerHTML = renderMarkdownInline(t("sidePanel:translationText"));
        panel.appendChild(translationText);

        // Know how to code section
        const codeHeader = document.createElement("h3");
        codeHeader.textContent = t("sidePanel:knowHowToCode");
        panel.appendChild(codeHeader);

        const codeText = document.createElement("p");
        codeText.innerHTML = renderMarkdownInline(t("sidePanel:knowHowToCodeText"));
        panel.appendChild(codeText);

        // Support financially section
        const supportHeader = document.createElement("h3");
        supportHeader.textContent = t("sidePanel:supportFinancially");
        panel.appendChild(supportHeader);

        const supportText = document.createElement("p");
        supportText.innerHTML = renderMarkdownInline(t("sidePanel:supportFinanciallyText"));
        panel.appendChild(supportText);

        return panel;
    }
}
