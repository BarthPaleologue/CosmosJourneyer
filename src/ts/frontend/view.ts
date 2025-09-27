import { type Scene } from "@babylonjs/core/scene";

/**
 * A view is a super set of a scene. In order to prevent interactions between post-processes and the GUI, we actually
 * need to use multiple scenes (layers), hence the concept of a view that is composed of multiple scenes.
 */
export interface View {
    /**
     * Renders the view. It is composed of multiple scene layers: a main scene (bottom layer) and other scenes to handle the UI for example.
     */
    render(): void;

    /**
     * Remove user input to ensure the player does not interact with the view when another view is displayed
     */
    detachControl(): void;

    /**
     * Attach user input to the view to allow the player to interact with it
     */
    attachControl(): void;

    /**
     * Returns the bottom layer scene of the view. This is useful for taking a screenshot of the view for example as we can only use one camera at a time.
     */
    getMainScene(): Scene;
}
