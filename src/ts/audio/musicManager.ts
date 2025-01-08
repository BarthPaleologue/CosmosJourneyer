import { Sound } from "@babylonjs/core/Audio/sound";
import { Musics } from "../assets/musics";
import { StarSystemView } from "../starSystem/starSystemView";
import { OrbitalObjectType } from "../architecture/orbitalObject";

export class MusicManager {
    private currentMusic: Sound | null = null;

    private volume = 1;
    private readonly fadeSeconds = 1;

    private readonly starSystemView: StarSystemView;

    constructor(starSystemView: StarSystemView) {
        this.starSystemView = starSystemView;
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

    public update(isPaused: boolean, isInStarSystemView: boolean, isInMainMenu: boolean) {
        if (isPaused && this.currentMusic?.isPlaying) {
            this.currentMusic.pause();
            return;
        } else if (!isPaused && this.currentMusic?.isPaused) {
            this.currentMusic.play();
            return;
        }

        const spaceship = this.starSystemView.getSpaceshipControls().getSpaceship();
        const isOnFoot = this.starSystemView.scene.getActiveControls() === this.starSystemView.getCharacterControls();
        const playerPosition = this.starSystemView.scene.getActiveControls().getTransform().getAbsolutePosition();
        const closestOrbitalObject = this.starSystemView.getStarSystem().getNearestOrbitalObject(playerPosition);

        const musicPriorityMap = new Map<Sound, number>();
        if (!isInStarSystemView) {
            musicPriorityMap.set(Musics.STAR_MAP, (musicPriorityMap.get(Musics.STAR_MAP) ?? 0) + 200);
        }
        if (isInMainMenu) {
            musicPriorityMap.set(Musics.MAIN_MENU, (musicPriorityMap.get(Musics.MAIN_MENU) ?? 0) + 190);
        }
        if (spaceship.isLanding()) {
            musicPriorityMap.set(Musics.STRAUSS_BLUE_DANUBE, (musicPriorityMap.get(Musics.STRAUSS_BLUE_DANUBE) ?? 0) + 180);
        }
        if (!spaceship.isLanded() && closestOrbitalObject.model.type === OrbitalObjectType.BLACK_HOLE) {
            musicPriorityMap.set(Musics.ECHOES_OF_TIME, (musicPriorityMap.get(Musics.ECHOES_OF_TIME) ?? 0) + 170);
        }
        if (spaceship.isWarpDriveEnabled()) {
            const suitableMusics = [Musics.ATLANTEAN_TWILIGHT, Musics.INFINITE_PERSPECTIVE, Musics.DANSE_MORIALTA];
            if (this.currentMusic !== null && suitableMusics.includes(this.currentMusic)) {
                musicPriorityMap.set(this.currentMusic, (musicPriorityMap.get(this.currentMusic) ?? 0) + 160);
            } else {
                suitableMusics.forEach((music) => musicPriorityMap.set(music, (musicPriorityMap.get(music) ?? 0) + 160));
            }
        }
        if (!spaceship.isLanded() && !spaceship.isWarpDriveEnabled()) {
            const suitableMusics = [Musics.THAT_ZEN_MOMENT, Musics.DEEP_RELAXATION, Musics.PEACE_OF_MIND];
            if (this.currentMusic !== null && suitableMusics.includes(this.currentMusic)) {
                musicPriorityMap.set(this.currentMusic, (musicPriorityMap.get(this.currentMusic) ?? 0) + 150);
            } else {
                suitableMusics.forEach((music) => musicPriorityMap.set(music, (musicPriorityMap.get(music) ?? 0) + 150));
            }
        }
        if (isOnFoot) {
            const suitableMusics = [Musics.THAT_ZEN_MOMENT, Musics.DEEP_RELAXATION, Musics.PEACE_OF_MIND];
            if (this.currentMusic !== null && suitableMusics.includes(this.currentMusic)) {
                musicPriorityMap.set(this.currentMusic, (musicPriorityMap.get(this.currentMusic) ?? 0) + 140);
            } else {
                suitableMusics.forEach((music) => musicPriorityMap.set(music, (musicPriorityMap.get(music) ?? 0) + 140));
            }
        }

        const sortedMusic = Array.from(musicPriorityMap.entries()).sort((a, b) => b[1] - a[1]);
        const highestPriorityMusic = sortedMusic.at(0);
        if (highestPriorityMusic === undefined) {
            return;
        }

        const highestPriority = highestPriorityMusic[1];
        const possibleMusics = sortedMusic.filter((music) => music[1] === highestPriority);
        if (possibleMusics.length === 0) {
            return;
        }

        const randomIndex = Math.floor(Math.random() * possibleMusics.length);
        this.setMusic(possibleMusics[randomIndex][0]);
    }
}
