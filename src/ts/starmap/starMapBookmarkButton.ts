import i18n from "../i18n";
import { Player } from "../player/player";
import { Sounds } from "../assets/sounds";
import { StarSystemCoordinates, starSystemCoordinatesEquals } from "../saveFile/universeCoordinates";

export class StarMapBookmarkButton {
    readonly rootNode: HTMLElement;
    private readonly player: Player;

    private selectedSystemCoordinates: StarSystemCoordinates | null = null;
    private isSelectedSystemBookmarked = false;

    constructor(player: Player) {
        this.rootNode = document.createElement("button");
        this.rootNode.classList.add("bookmarkButton");
        this.rootNode.textContent = i18n.t("starMap:bookmark");

        this.player = player;

        this.rootNode.addEventListener("click", () => {
            if (this.selectedSystemCoordinates === null) return;
            Sounds.MENU_SELECT_SOUND.play();

            const currentSystemSeed = this.selectedSystemCoordinates;

            if (!this.isSelectedSystemBookmarked) {
                this.player.systemBookmarks.push(this.selectedSystemCoordinates);
                this.rootNode.classList.add("bookmarked");
                this.rootNode.textContent = i18n.t("starMap:bookmarked");
            } else {
                this.player.systemBookmarks = this.player.systemBookmarks.filter((bookmark) => !starSystemCoordinatesEquals(bookmark, currentSystemSeed));
                this.rootNode.classList.remove("bookmarked");
                this.rootNode.textContent = i18n.t("starMap:bookmark");
            }

            this.isSelectedSystemBookmarked = !this.isSelectedSystemBookmarked;
        });
    }

    setSelectedSystemSeed(starSystemCoordinates: StarSystemCoordinates) {
        this.selectedSystemCoordinates = starSystemCoordinates;
        this.isSelectedSystemBookmarked = this.player.systemBookmarks.find((bookmark) => !starSystemCoordinatesEquals(bookmark, starSystemCoordinates)) !== undefined;
        this.rootNode.classList.toggle("bookmarked", this.isSelectedSystemBookmarked);
        this.rootNode.textContent = this.isSelectedSystemBookmarked ? i18n.t("starMap:bookmarked") : i18n.t("starMap:bookmark");
    }
}
