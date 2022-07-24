export interface IPostProcess {
    /**
     * Updates the post process
     * @param deltaTime The time since the last update
     */
    update(deltaTime: number): void;
}