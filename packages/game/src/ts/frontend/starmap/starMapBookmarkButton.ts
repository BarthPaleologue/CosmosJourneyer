import { starSystemCoordinatesEquals } from "@cosmos-journeyer/universe-model";
import type { StarSystemCoordinates } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import type { ISoundPlayer } from "@/frontend/audio/soundPlayer";

import type { Player } from "../player/player";

export class StarMapBookmarkButton {
    readonly rootNode: HTMLElement;
    private readonly player: Player;

    private selectedSystemCoordinates: StarSystemCoordinates | null = null;
    private isSelectedSystemBookmarked = false;
    private readonly t: TFunction;

    constructor(player: Player, soundPlayer: ISoundPlayer, t: TFunction) {
        this.rootNode = document.createElement("button");
        this.rootNode.classList.add("bookmarkButton");
        this.rootNode.textContent = t("starMap:bookmark");

        this.player = player;
        this.t = t;

        this.rootNode.addEventListener("click", () => {
            if (this.selectedSystemCoordinates === null) {
                return;
            }
            soundPlayer.playNow("click");

            const currentSystemSeed = this.selectedSystemCoordinates;

            if (!this.isSelectedSystemBookmarked) {
                this.player.systemBookmarks.push(this.selectedSystemCoordinates);
                this.rootNode.classList.add("bookmarked");
                this.rootNode.textContent = this.t("starMap:bookmarked");
            } else {
                this.player.systemBookmarks = this.player.systemBookmarks.filter(
                    (bookmark) => !starSystemCoordinatesEquals(bookmark, currentSystemSeed),
                );
                this.rootNode.classList.remove("bookmarked");
                this.rootNode.textContent = this.t("starMap:bookmark");
            }

            this.isSelectedSystemBookmarked = !this.isSelectedSystemBookmarked;
        });
    }

    setSelectedSystemSeed(starSystemCoordinates: StarSystemCoordinates): void {
        this.selectedSystemCoordinates = starSystemCoordinates;
        this.isSelectedSystemBookmarked =
            this.player.systemBookmarks.find((bookmark) =>
                starSystemCoordinatesEquals(bookmark, starSystemCoordinates),
            ) !== undefined;
        this.rootNode.classList.toggle("bookmarked", this.isSelectedSystemBookmarked);
        this.rootNode.textContent = this.isSelectedSystemBookmarked
            ? this.t("starMap:bookmarked")
            : this.t("starMap:bookmark");
    }
}
