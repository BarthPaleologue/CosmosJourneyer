import { AudioInstance } from "../utils/audioInstance";

export class AudioManager {
    private static ENABLED_MASK = 0b1111;

    private static readonly SOUNDS: AudioInstance[] = [];

    public static RegisterSound(sound: AudioInstance) {
        this.SOUNDS.push(sound);
    }

    public static SetMask(mask: number) {
        this.ENABLED_MASK = mask;
    }

    public static Update(deltaSeconds: number) {
        this.SOUNDS.forEach((sound) => {
            const isSoundEnabled = (sound.mask & this.ENABLED_MASK) !== 0;
            sound.setMaskFactor(isSoundEnabled ? 1 : 0);
            sound.update(deltaSeconds);
        });
    }

    static DisposeSound(audioInstance: AudioInstance) {
        const index = this.SOUNDS.indexOf(audioInstance);
        if (index === -1) {
            throw new Error("Sound not found");
        }
        this.SOUNDS.splice(index, 1);
        audioInstance.dispose();
    }
}
