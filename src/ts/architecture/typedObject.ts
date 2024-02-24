export interface TypedObject {
    /**
     * Returns the type name of the object. This is used as a short identifier in the UI Overlay of the object
     */
    getTypeName(): string;
}