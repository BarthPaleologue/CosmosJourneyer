declare class Slider {
    id: string;
    parent: HTMLElement;
    container: HTMLElement;
    slider: HTMLInputElement;
    handle: HTMLElement;
    min: number;
    max: number;
    initialValue: number;
    onSlide: (val: number) => void;
    /**
     * Creates a new Slider with a unique ID, a Parent Node, min and max value, initial value and callback
     * @param id Slider HTML id used to define internal HTML elements
     * @param parent Parent HTML container
     * @param min Slider min value
     * @param max Slider max value
     * @param initialValue Slider initial value
     * @param onSlide Slider onSlide callback
     */
    constructor(id: string, parent: HTMLElement, min: number, max: number, initialValue: number, onSlide?: (val: number) => void);
    /**
     * Increment slider value and call slider onSlide callback
     */
    increment(): void;
    /**
     * Decrement slider value and call slider onSlide callback
     */
    decrement(): void;
    /**
     * Get slider's value as a number
     * @returns the number associated to slider's value
     */
    getValue(): number;
    /**
     * Set Slider's value and call onSlide callback
     * @param value the slider's new value
     */
    setValue(value: number): void;
    /**
     * Set Slider's new value without calling onSlide callback
     * @param value the slider's new value
     */
    setValueWithoutCallback(value: number): void;
    /**
     * Updates hanle position to match slider value without calling onSlide callback
     */
    updateWithoutCallback(): void;
    /**
     * Changes handle value and position to match slider value then call onSlide callback
     */
    update(): void;
    /**
     * Resets slider to its initial state and calling onSlide callback
     */
    reset(): void;
    /**
     * Resets slider to its initial state without calling onSlide callback
     */
    resetWithoutCallback(): void;
    /**
     * Remove every HTML element related to the Slider
     */
    remove(): void;
}
