/**
 * This represents custom typesafe animations
 */
export interface CustomAnimation {
    /**
     * Updates the animation
     * @param deltaSeconds The time elapsed since the last update
     */
    update(deltaSeconds: number): void;

    /**
     * Returns whether the animation is finished
     */
    isFinished(): boolean;

    /**
     * Returns the progress of the animation (between 0 and 1)
     */
    getProgress(): number;
}
