import { AbstractController } from "../../controllers/abstractController";
import { Star } from "../stars/star";
import { BlackHole } from "../blackHole";

export interface Planet {
    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[]): void;
}
