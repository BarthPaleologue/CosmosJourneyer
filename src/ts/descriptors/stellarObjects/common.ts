export enum STELLAR_TYPE {
    /** 30,000 - 50,000 K */
    O,
    /** 10,000 - 30,000 K */
    B,
    /** 7,500 - 10,000 K */
    A,
    /** 6,000 - 7,500 K */
    F,
    /** 5,000 - 6,000 K */
    G,
    /** 3,500 - 5,000 K */
    K,
    /** 2,700 - 3,500 K */
    M,
    /** Black hole */
    BLACK_HOLE
}

export function getStellarTypeString(type: STELLAR_TYPE): string {
    switch (type) {
        case STELLAR_TYPE.O:
            return "O";
        case STELLAR_TYPE.B:
            return "B";
        case STELLAR_TYPE.A:
            return "A";
        case STELLAR_TYPE.F:
            return "F";
        case STELLAR_TYPE.G:
            return "G";
        case STELLAR_TYPE.K:
            return "K";
        case STELLAR_TYPE.M:
            return "M";
        case STELLAR_TYPE.BLACK_HOLE:
            return "Black hole";
    }
}