import { Sound } from "@babylonjs/core/Audio/sound";
import { Musics } from "../assets/musics";
import { StarSystemView } from "../starSystem/starSystemView";
import { OrbitalObjectType } from "../architecture/orbitalObject";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class MusicConductor {
    private currentMusic: Sound | null = null;

    /**
     * The number of seconds to wait before playing a new music.
     */
    private silenceSeconds = 0;

    private volume = 1;
    private readonly fadeSeconds = 1;

    private readonly starSystemView: StarSystemView;

    constructor(starSystemView: StarSystemView) {
        this.starSystemView = starSystemView;

        const audioEngine = AbstractEngine.audioEngine;

        if (audioEngine === null) {
            throw new Error("Audio context is null");
        }

        audioEngine.onAudioUnlockedObservable.add(() => {
            if (this.currentMusic !== null) {
                const copy = this.currentMusic;
                this.currentMusic = null;
                this.setMusic(copy);
            }
        });
    }

    public setMusicFromSelection(musicSelection: Sound[]) {
        if (this.currentMusic !== null && musicSelection.includes(this.currentMusic)) {
            return;
        }

        this.setMusic(musicSelection[Math.floor(Math.random() * musicSelection.length)]);
    }

    public setMusic(sound: Sound) {
        if (this.currentMusic === sound) {
            return;
        }

        if (this.currentMusic !== null) {
            this.currentMusic.setVolume(0, this.fadeSeconds);
            this.currentMusic.stop(this.fadeSeconds);
        }

        this.currentMusic = sound;
        this.currentMusic.stop();
        this.currentMusic.setVolume(0);
        this.currentMusic.play();
        this.currentMusic.setVolume(this.volume, this.fadeSeconds);
        console.log("currently playing", this.currentMusic.name);
    }

    public setSoundtrackVolume(volume: number) {
        this.volume = volume;
        if (this.currentMusic !== null) {
            this.currentMusic.setVolume(volume);
        }
    }

    public update(isPaused: boolean, isInStarSystemView: boolean, isInMainMenu: boolean, deltaSeconds: number) {
        if (isPaused && this.currentMusic?.isPlaying) {
            this.currentMusic.pause();
            return;
        } else if (!isPaused && this.currentMusic?.isPaused) {
            this.currentMusic.play();
            return;
        }

        // if the music has finished playing, set it to null
        if (!isPaused && this.currentMusic !== null && !this.currentMusic.isPlaying) {
            this.currentMusic = null;
            this.silenceSeconds = 30 + (Math.random() - 0.5) * 20;
        }

        if (this.silenceSeconds > 0) {
            this.silenceSeconds -= deltaSeconds;
            return;
        }

        const spaceship = this.starSystemView.getSpaceshipControls().getSpaceship();
        const isOnFoot = this.starSystemView.scene.getActiveControls() === this.starSystemView.getCharacterControls();
        const playerPosition = this.starSystemView.scene.getActiveControls().getTransform().getAbsolutePosition();
        const closestOrbitalObject = this.starSystemView.getStarSystem().getNearestOrbitalObject(playerPosition);

        const distanceToClosestObject = Vector3.Distance(
            playerPosition,
            closestOrbitalObject.getTransform().getAbsolutePosition()
        );

        if (!isInStarSystemView) {
            this.setMusic(Musics.STAR_MAP);
            return;
        }
        if (isInMainMenu) {
            this.setMusic(Musics.MAIN_MENU);
            return;
        }
        if (spaceship.isLanding()) {
            this.setMusic(Musics.STRAUSS_BLUE_DANUBE);
            return;
        }

        if (!spaceship.isLanded()) {
            switch (closestOrbitalObject.model.type) {
                case OrbitalObjectType.BLACK_HOLE:
                    this.setMusicFromSelection([Musics.ECHOES_OF_TIME]);
                    return;

                case OrbitalObjectType.MANDELBULB:
                case OrbitalObjectType.JULIA_SET:
                case OrbitalObjectType.MANDELBOX:
                case OrbitalObjectType.SIERPINSKI_PYRAMID:
                case OrbitalObjectType.MENGER_SPONGE:
                    if (distanceToClosestObject < closestOrbitalObject.getBoundingRadius() * 100) {
                        this.setMusicFromSelection([Musics.SPACIAL_WINDS]);
                        return;
                    }
                    break;

                case OrbitalObjectType.STAR:
                case OrbitalObjectType.NEUTRON_STAR:
                case OrbitalObjectType.TELLURIC_PLANET:
                case OrbitalObjectType.TELLURIC_SATELLITE:
                case OrbitalObjectType.GAS_PLANET:
                case OrbitalObjectType.SPACE_STATION:
                case OrbitalObjectType.SPACE_ELEVATOR:
                    break;
            }
        }

        if (spaceship.isWarpDriveEnabled()) {
            const suitableMusics = [Musics.ATLANTEAN_TWILIGHT, Musics.INFINITE_PERSPECTIVE, Musics.MESMERIZE];

            this.setMusicFromSelection(suitableMusics);
            return;
        }

        if (!spaceship.isLanded() && !spaceship.isWarpDriveEnabled()) {
            const suitableMusics = [Musics.THAT_ZEN_MOMENT, Musics.DEEP_RELAXATION, Musics.PEACE_OF_MIND];
            this.setMusicFromSelection(suitableMusics);
            return;
        }

        if (isOnFoot) {
            const suitableMusics = [
                Musics.THAT_ZEN_MOMENT,
                Musics.DEEP_RELAXATION,
                Musics.PEACE_OF_MIND,
                Musics.MESMERIZE,
                Musics.REAWAKENING
            ];

            this.setMusicFromSelection(suitableMusics);
            return;
        }
    }
}
