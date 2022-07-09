export interface Input {
    /**
     * Returns a number between -1 and 1 describing the roll intensity
     */
    getRoll: () => number;

    /**
     * Returns a number between -1 and 1 describing the pitch intensity
     */
    getPitch: () => number;

    /**
     * Returns a number between -1 and 1 describing the yaw intensity
     */
    getYaw: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative Z Axis
     */
    getZAxis: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative X Axis
     */
    getXAxis: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative Y Axis
     */
    getYAxis: () => number;

    /**
     * Get Acceleration
     */
    getAcceleration: () => number;
}