import {BufferAttribute, Euler, Points, Vector3} from "three";


/**
 * ermittelt den Score von 2. Punktwolken
 */
export class StatsService {

    constructor() {
    }

    /**
     * ermittelt den Score von 2. Punktwolken
     */
    calculateScore(pcd1: Points, pcd2: Points) {
        let p1: Vector3[];
        let p2: Vector3[];
        let avg: number;

        let cloudDistances: number[] = [];


        //if (this.points.length < 2) return;

        p1 = this.getGeometryVectors(pcd1.geometry.attributes.position as BufferAttribute);
        p2 = this.getGeometryVectors(pcd2.geometry.attributes.position as BufferAttribute);

        p1 = this.calculatePositionOfVectors(p1, pcd1.position, pcd1.rotation);
        p2 = this.calculatePositionOfVectors(p2, pcd2.position, pcd2.rotation);


        cloudDistances = this.distancesToClosetPoint(p1, p2);

        avg = this.calculateAverage(cloudDistances);

        return avg;

    }

    /**
     * holt die Vectoren aus dem BufferArray der Geometry
     */
    private getGeometryVectors(points: BufferAttribute): Vector3[] {
        let vectors: Vector3[] = [];
        let maxIndex = points.count;

        // console.log(points, points.count)
        for (let i = 0; i < maxIndex; i++) {
            vectors.push(new Vector3().fromBufferAttribute(points, i))
        }
        return vectors;
    }

    /**
     * addiert den Lokalen Stand der PoinClouds mit den Globalen Stand in der Welt
     * übergibt eine Kalibriete version des Vectors
     */
    private calculatePositionOfVectors(vectors: Vector3[], position: Vector3, rotation: Euler) {
        let vectorsInWorld: Vector3[] = [];

        for (let i = 0; i < vectors.length; i++) {
            let newPosition: Vector3 = new Vector3();

            newPosition = vectors[i];
            newPosition.applyEuler(rotation);
            newPosition.addVectors(vectors[i], position);

            vectorsInWorld.push(newPosition);

        }
        return vectorsInWorld;
    }

    /**
     * matched 2 Punkte --> findet für jeden punkt der ersten PCD den nährsten Punkt der zweiten PCD
     */
    private distancesToClosetPoint(p1: Vector3[], p2: Vector3[]) {
        let distances: number[] = [];

        for (let i = 0; i < p1.length; i++) {
            let minDistance = Number.MAX_VALUE;

            for (const point of p2) {
                let distance = point.distanceTo(p1[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }

            distances.push(minDistance);
        }
        return distances;
    }

    /**
     * calculiert den avg der Punktwolken
     */
    private calculateAverage(target: number[]): number {
        let sum: number = 0;
        let avg: number;
        target.forEach((value) => sum += value);
        avg = sum / target.length
        console.log(avg);

        return avg;
    }
}