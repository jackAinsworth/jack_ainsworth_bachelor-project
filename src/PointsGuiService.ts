import {GUI} from "dat.gui";
import * as THREE from "three";
import {BufferGeometry, Points, PointsMaterial} from "three";
import {movementState, setIsMove} from "./GlobalStates.js";
import {PointsService} from "./pointsService.js";

export enum state {
    MOVE, ROT, NOTHING
}

export interface GuiXYZ {
    x: number;
    y: number;
    z: number;
}

export interface metaValues {
    obj: Points;
    id: number;
    values: guiValues[];
}

export interface guiValues {
    type: state;
    rotation: GuiXYZ;
    move: GuiXYZ;
    direction: string;
}


/**
 * erstellt eine UI für ein Point Objekt
 *  & speichert die Aktionen an den Objekten in ein Objekt
 */
export class PointsGuiService {

    readonly MOVERANGE = 200;

    gui: GUI;

    render: () => void;

    pointsLogger: metaValues[];

    pointsService: PointsService;

    constructor(render: () => void) {
        //maybe optional min max step values

        this.pointsLogger = [];
        this.pointsService = new PointsService();

        this.gui = new GUI();
        this.render = () => render();
    }


    /**
     * wird aufgerufen wenn ein Gui für eine Punktwolke erzeugt wird
     * & erstellt einen AktionLogger für diese Punktwolke
     */
    private createLogger(obj: Points) {
        let length = this.pointsLogger.length;
        this.pointsLogger.push({
            obj:  obj.clone(), /*JSON.parse(JSON.stringify(obj)),*/
            id: obj.id,
            values: [{
                move: {x: obj.position.x, y: obj.position.y, z: obj.position.z},
                rotation: {x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z},
                /*rotation: {x: 0, y: 0, z: 0},*/
                type: state.NOTHING,
                direction: "x"
            }]
        });

        if (this.pointsLogger[length] ){
            console.log("assin replay mat")
            // this.pointsLogger[length].id = this.pointsLogger[length].obj.id;
            this.pointsLogger[length].obj.material  = new PointsMaterial().copy(obj.material as PointsMaterial);
        }


        /*obj.name = "points";*/
    }


    /**
     * fügt eine neue Aktion in den Logger
     */
    pushNewValues(id: number, type: state, direction: string, value: number) {
        if (direction === "x" || direction === "y" || direction === "z") {

            const index: number = this.pointsLogger.findIndex((value) => value.id === id);

            if (index === -1) {
                return;
            }

            const valuesLength: number   = this.pointsLogger[index].values.length;
            // objekte brauchen ein HardCopy sodass es nicht dasselbe Objekt ist.
            let newValue: guiValues = JSON.parse(JSON.stringify(this.pointsLogger[index].values[valuesLength -1])) ;

            newValue.type = type;
            newValue.direction = direction;

            if (type === state.ROT) {
                newValue.rotation[direction] = value;
            }
            else if (type === state.MOVE) {
                newValue.move[direction] = value;
            }
            this.pointsLogger[index].values = [...this.pointsLogger[index].values,    newValue ]
        }
    }

    /**
     * erzeugt die Ui für eine Punktwolke
     */
    createPointsGui(obj: Points) {
        const gui: GUI = new GUI();
        const objFolder: GUI = gui.addFolder(obj.name);

        this.createLogger(obj);

        this.createRotationFolder(objFolder, obj);
        this.createMoveXYZFolder(objFolder, obj);
        this.createExtrasFolder(objFolder, obj);
        objFolder.open();
    }

    /**
     * Rotation teil der Ui
     */
    private createRotationFolder(objFolder: GUI, obj: Points) {
        const rotaFolder = objFolder.addFolder('Rotation');
        let angle: GuiXYZ = {x: 0.1, y: 0.1, z: 0.1};

        rotaFolder.add(angle, 'x', 0, Math.PI / 10, 0.0001).onChange(() => {
            obj.rotation.x = angle.x * 20;

            setIsMove(movementState.rot);
            this.pushNewValues(obj.id, state.ROT, 'x', angle.x);
            this.render();
        })
        rotaFolder.add(angle, 'y', 0, Math.PI / 10, 0.0001).onChange(() => {
            obj.rotation.y = angle.y * 20;

            setIsMove(movementState.rot);
            this.pushNewValues(obj.id, state.ROT, 'y', angle.y);

            this.render();
        });
        rotaFolder.add(angle, 'z', 0, Math.PI / 10, 0.0001).onChange(() => {
            obj.rotation.z = angle.z * 20;

            setIsMove(movementState.rot);
            this.pushNewValues(obj.id, state.ROT, 'z', angle.z);
            this.render();
        });
        this.addXYZColorClass(rotaFolder);
        rotaFolder.open();
    }

    /**
     * Transformation Ui teil
     */
    private createMoveXYZFolder(objFolder: GUI, obj: Points) {
        const moveFolder: GUI = objFolder.addFolder('Move XYZ');
        let xyz: GuiXYZ = {x: 1, y: 1, z: 1}

        moveFolder.add(xyz, 'x', -this.MOVERANGE, this.MOVERANGE, 0.01).onChange(() => {
            obj.position.x = xyz.x;

            setIsMove(movementState.move);
            this.pushNewValues(obj.id, state.MOVE, 'x', xyz.x);

            this.render();
        })
        moveFolder.add(xyz, 'y', -this.MOVERANGE, this.MOVERANGE, 0.01).onChange(() => {
            obj.position.y = xyz.y;

            setIsMove(movementState.move);
            this.pushNewValues(obj.id, state.MOVE, 'y', xyz.y);

            this.render();
        })
        moveFolder.add(xyz, 'z', -this.MOVERANGE, this.MOVERANGE, 0.01).onChange(() => {
            obj.position.z = xyz.z;

            setIsMove(movementState.move);
            this.pushNewValues(obj.id, state.MOVE, 'z', xyz.z);

            this.render();
        })
        this.addXYZColorClass(moveFolder);
        moveFolder.open();
    }

    /**
     * size, resize, reduction Folder für UI
     */
    private createExtrasFolder(objFolder: GUI, obj: Points) {
        if (!(obj instanceof Points)) return;
        if (!(obj.material instanceof PointsMaterial)) return;

        const extrasFolder: GUI = objFolder.addFolder('extras');
        let params = {
            color: '#' + obj.material.color.getHexString(),
            size: obj.material.size,
            reductionFactor: 1,
            reductionFactor2: 1
        };

        extrasFolder.add(params, 'size', 0.0001, 3, 0.01).onChange(() => {
            if (!(obj instanceof Points)) return;
            if (!(obj.material instanceof PointsMaterial)) return;

            obj.material.size = params.size;
            this.render();
        })
        extrasFolder.addColor(params, 'color').onChange(() => {
            if (!(obj instanceof Points)) return;
            if (!(obj.material instanceof PointsMaterial)) return;

            obj.material.color = new THREE.Color(params.color);
            this.render();
        })

        // reduce Points slider 1 bis 5 --> ruft Points servcie auf
            // for schleife step 3 -->  avg von immer 3 vectoren in ein array speichern
            // neue Point Cloud setzen
        extrasFolder.add(params, 'reductionFactor', 1).step(1).name('complex reductionFactor ').onChange(()=>{
            this.pointsService.reducePoints(params.reductionFactor, obj as Points);
            this.render();
        })

        extrasFolder.add(params, 'reductionFactor2').name('simple reductionFactor').step(1).onChange(()=>{
            this.pointsService.reducePointsSimple(params.reductionFactor2, obj as Points);
            this.render();
        })

        extrasFolder.open();
    }


    /**
     * ädert die Ui farbe für die xyz werte
     */
    private addXYZColorClass(folder: GUI) {
        //limitations von datGui
        folder.__controllers.forEach((entry) => {
            let elementText = entry.domElement.parentElement?.firstChild?.textContent;
            let className: string;
            if (elementText === 'x') {
                className = 'x';
            } else if (elementText === 'y') {
                className = 'y';
            } else if (elementText === 'z') {
                className = 'z';
            } else {
                return;
            }
            entry.domElement.parentElement?.classList.add(className);
        })
    }

}