import { AudioInstance } from "./utils/audioInstance";

export const enum AudioMasks {
    STAR_SYSTEM_VIEW,
    STAR_MAP_VIEW,
}

export class AudioManager {

    private static readonly CONTEXTS: Map<AudioMasks, AudioInstance[]> = new Map();

    private static readonly ENABLED_MASKS: Map<AudioMasks, boolean> = new Map();

    public static RegisterSound(sound: AudioInstance, context: AudioMasks) {
        if(!this.CONTEXTS.has(context)) {
            this.CONTEXTS.set(context, []);
        }
        this.CONTEXTS.get(context)?.push(sound);

        if(!this.ENABLED_MASKS.has(context)) this.ENABLED_MASKS.set(context, true);
    }

    public static SetMaskEnabled(context: AudioMasks, enabled: boolean) {
        this.ENABLED_MASKS.set(context, enabled);
    }

    public static Update(deltaSeconds: number) {
        this.CONTEXTS.forEach((sounds: AudioInstance[], context) => {
            sounds.forEach((sound: AudioInstance) => {
                if(!this.ENABLED_MASKS.get(context)) sound.setMaskFactor(0);
                else sound.setMaskFactor(1);
                sound.update(deltaSeconds);
            });
        });
    }
}