import i18n from "../i18n";
import { SystemSeed } from "../utils/systemSeed";
import { Player } from "../player/player";
import { Sounds } from "../assets/sounds";

export class StarMapBookmarkButton {
    readonly rootNode: HTMLElement;
    private readonly player: Player;

    private selectedSystemSeed: SystemSeed | null = null;
    private isSelectedSystemBookmarked = false;

    constructor(player: Player) {
        this.rootNode = document.createElement("button");
        this.rootNode.classList.add("bookmarkButton");
        this.rootNode.textContent = i18n.t("starMap:bookmark");

        this.player = player;

        this.rootNode.addEventListener("click", () => {
            if (this.selectedSystemSeed === null) return;
            Sounds.MENU_SELECT_SOUND.play();

            const currentSystemSeed = this.selectedSystemSeed;

            if (!this.isSelectedSystemBookmarked) {
                this.player.systemBookmarks.push(this.selectedSystemSeed);
                this.rootNode.classList.add("bookmarked");
                this.rootNode.textContent = i18n.t("starMap:bookmarked");
            } else {
                this.player.systemBookmarks = this.player.systemBookmarks.filter((bookmark) => !bookmark.equals(currentSystemSeed));
                this.rootNode.classList.remove("bookmarked");
                this.rootNode.textContent = i18n.t("starMap:bookmark");
            }

            this.isSelectedSystemBookmarked = !this.isSelectedSystemBookmarked;
        });
    }

    setSelectedSystemSeed(seed: SystemSeed) {
        this.selectedSystemSeed = seed;
        this.isSelectedSystemBookmarked = this.player.systemBookmarks.find((bookmark) => bookmark.equals(seed)) !== undefined;
        this.rootNode.classList.toggle("bookmarked", this.isSelectedSystemBookmarked);
        this.rootNode.textContent = this.isSelectedSystemBookmarked ? i18n.t("starMap:bookmarked") : i18n.t("starMap:bookmark");
    }
}
