// @vitest-environment jsdom

import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MusicConductor } from "@/frontend/presentation/audio/musicConductor";

import { initI18n } from "@/i18n";

import { AboutPanel } from "./aboutPanel";
import { ContributePanel } from "./contributePanel";
import { CreditsPanel } from "./creditsPanel";
import { SettingsPanel } from "./settingsPanel";
import { TutorialsPanel } from "./tutorialsPanel";

describe("translated side panels", () => {
    let t: TFunction;

    beforeAll(async () => {
        t = await initI18n();
    });

    it("builds each panel with its translated title", () => {
        vi.spyOn(MusicConductor.prototype, "getVolume").mockReturnValue(1);

        const panels = [
            [new SettingsPanel(MusicConductor.prototype, t), "sidePanel:settings"],
            [new TutorialsPanel(t), "sidePanel:tutorials"],
            [new ContributePanel(t), "sidePanel:contribute"],
            [new CreditsPanel(t), "sidePanel:credits"],
            [new AboutPanel(t), "sidePanel:about"],
        ] as const;

        panels.forEach(([panel, titleKey]) => {
            expect(panel.htmlRoot.querySelector("h2")?.textContent).toBe(t(titleKey));
        });
    });
});
