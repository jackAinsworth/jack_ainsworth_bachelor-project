import {BufferAttribute, Points, Vector3} from "three";


/**
 * bietet Funktionen um mit Punkten zu interakten oder Informationen über Funktionen erlagen.
 */
export class PointsService {
    readonly MAXALLOWEDDISTANCE: number = 3.85;

    constructor() {}

    /**
     * @name cutOutliers
     * @param points
     * @summary cut points with no close neigbors
     */
    distancesToClosetPoint(points: Points, MAXDIST?: number) {
        let distances: number[] = [];
        let newPoints: Vector3[] = [];

        if (!MAXDIST) {
            MAXDIST = this.MAXALLOWEDDISTANCE;
        }

        let vectorsOfPoints: Vector3[] = this.getGeometryVectors(points.geometry.attributes.position as BufferAttribute);

        for (let i = 0; i < vectorsOfPoints.length; i++) {
            let minDistance: number = Number.MAX_VALUE;

            for (const point of vectorsOfPoints) {
                let distance = vectorsOfPoints[i].distanceTo(point);
                if (distance < minDistance && distance > 0) {
                    minDistance = distance;
                }
            }

            if (minDistance < MAXDIST) {
                newPoints.push(vectorsOfPoints[i]);
                distances.push(minDistance);
            }
        }

        if (newPoints.length == 0) {
            newPoints.push(new Vector3())
        }

        //console.log(newPoints.length/*, newPoints*/, distances);
        return newPoints;
    }


    /**
     * reduciert die Anzahl der Vectoren um einen Faktor (natürliche Zahl)
     */
    reducePoints(factor: number, points: Points){
        let newPoints: Vector3[] = [];
        let vectorsOfPoints: Vector3[] = this.getGeometryVectors(points.geometry.attributes.position as BufferAttribute);

        for (let i = 0; i < vectorsOfPoints.length; i+=factor) {
            let newVector:Vector3 = new Vector3();
            for (let j = 0;  j < factor; j++){

                if (vectorsOfPoints[i+j] === undefined) continue;

                newVector.x += vectorsOfPoints[i+j].x;
                newVector.y += vectorsOfPoints[i+j].y;
                newVector.z += vectorsOfPoints[i+j].z;
            }
            newVector.x = newVector.x / factor;
            newVector.y = newVector.y / factor;
            newVector.z = newVector.z / factor;

            newPoints.push(newVector);
        }

        console.log("old Points", vectorsOfPoints.length, "new points: ", newPoints.length);
        points.geometry.setFromPoints(newPoints);
    }

    reducePointsSimple(factor: number, points: Points){
        let newPoints: Vector3[] = [];
        let vectorsOfPoints: Vector3[] = this.getGeometryVectors(points.geometry.attributes.position as BufferAttribute);

        for (let i = 0; i < vectorsOfPoints.length; i+=factor) {
            if (vectorsOfPoints[i] === undefined) continue;

            let newVector:Vector3 = new Vector3();

            newVector.x += vectorsOfPoints[i].x;
            newVector.y += vectorsOfPoints[i].y;
            newVector.z += vectorsOfPoints[i].z;

            newPoints.push(newVector);
        }

        console.log("old Points", vectorsOfPoints.length, "new points: ", newPoints.length);
        points.geometry.setFromPoints(newPoints);
    }



    /**
     * holt die Vectoren aus dem BufferArray der Geometry
     */
    private getGeometryVectors(points: BufferAttribute): Vector3[] {
        let vectors: Vector3[] = [];
        let maxIndex: number = points.count;

        for (let i = 0; i < maxIndex; i++) {
            vectors.push(new Vector3().fromBufferAttribute(points, i))
        }
        return vectors;
    }
}