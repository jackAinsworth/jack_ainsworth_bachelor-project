import {PCDLoader} from "three/addons/loaders/PCDLoader.js";
import * as THREE from "three";
import {Box3, Color, Object3D, ObjectLoader, Points, PointsMaterial, Scene, Vector3} from "three";

import {GUI} from "dat.gui";


import {guiValues, metaValues, PointsGuiService, state} from "./PointsGuiService.js";
import {PointsService} from "./pointsService.js";
import {StatsService} from "./statsService.js";


/**
 * das Laden und speichern von Obbjekten und das initialiesieren der Objektbezogenen Services
 * & das UI fürs Laden und speichern
 */
export class ioService {
    loader: PCDLoader;
    gui: GUI;
    scene: Scene;
    pointsService: PointsService;
    statsService: StatsService;
    pointsGui: PointsGuiService;


    render: () => void;

    defaultsLoaded: boolean = false;

    readonly input = document.querySelector("#myInput") as HTMLInputElement;
    readonly inputJson = document.querySelector("#loadScene") as HTMLInputElement;
    readonly loadReplay = document.querySelector("#loadReplay") as HTMLInputElement;


    readonly output = document.querySelector("#saveSceneAsJson") as HTMLAnchorElement;
    readonly outputReplay = document.querySelector("#saveReplay ") as HTMLAnchorElement;

    readonly showScore = document.querySelector("#replayScore");


    constructor(scene: Scene, render: () => void) {
        this.loader = new PCDLoader();
        this.gui = new GUI();
        this.pointsService = new PointsService();
        this.render = () => render();

        this.pointsGui = new PointsGuiService(() => render());

        this.scene = scene;
        this.statsService = new StatsService();


        // events listener im constructor adden sonst schreibt man auf ein obj mehrere
        this.loadEventListener();
        this.replayEventListener();
        this.sceneEventListener();
    }


    /**
     * Lade UI: alle verschiedenen möglichkeite zu laden
     * 1. Laden Point cloud
     * 2. Laden der zwei default Point Clouds u1.pcd & v1.pcd
     * 3. Laden einer vorherigen Scene
     * 4. Laden der Widergabe von Point Clouds
     */
    loadGui(): void {
        let load: GUI = this.gui.addFolder("load");

        let params = {
            loadFile: () => this.loadFile(),
            loadDefaults: () => this.loadDefaults(),
            loadScene: () => this.loadScene(),
            loadReplayFile: () => this.loadReplayFile()
        };

        load.add(params, 'loadFile').name('Load PCD file');
        load.add(params, 'loadDefaults').name('Load default PCD models');
        load.add(params, 'loadScene').name('Load Scene');
        load.add(params, 'loadReplayFile').name('Load Replay');

        load.open();
    }


    /**
     * listener für 1.
     *
     * event listener im constructor hinzufügen --> verhindert das mehrfach laden
     */
    loadEventListener() {
        let file: File;
        this.input.addEventListener('change', (event: Event) => {

            if (this.input.files !== null) {
                file = this.input.files[0];

                let points: Points;

                file.arrayBuffer().then((value) => {
                    points = this.loader.parse(value);
                    this.loadCloud(points);
                });
            }
        });
    }


    // load

    /**
     * eventListener um eine Scene zu laden
     */
    sceneEventListener = (): void => {
        let loader: ObjectLoader = new THREE.ObjectLoader();

        this.inputJson.addEventListener('change', (event: Event) => {

            if (this.inputJson.files !== null) {
                const file = this.inputJson.files[0];
                let blob = new Blob([file], {type: 'application/json'});
                blob.text().then(value => {
                    let obj: Object3D = loader.parse(JSON.parse(value));
                    let points: Points[];
                    points = obj.getObjectsByProperty("name", "points") as Points[];

                    this.scene.add(obj);


                    points.forEach((point) => {
                        // point.geometry.center();
                        // this.calibrateCenter(point);
                        this.pointsGui.createPointsGui(point);

                    });
                });
            }
        });

    }

    /**
     * calibriert den Center Punkt für die Punktwolken in der Scene
     * --> wenn nicht dann dreht sich pwolke um die hauptachsen
     */
    calibrateCenter(points: Points) {
        const box3: Box3 = new Box3().setFromObject(points);
        const vector: Vector3 = new Vector3();
        box3.getCenter(vector); // --> Center rausfinden für das zurücksetzen nach der calibrierung
        points.geometry.center(); // calibrieren für
        // points.geometry.rotateX( Math.PI );
        points.position.x = vector.x;
        points.position.y = vector.y;
        points.position.z = vector.z;
    }

    /**
     * UI für das speichern
     */
    saveGui() {
        let save = this.gui.addFolder("save scene");

        let params = {
            saveScene: () => this.saveScene(),
            replayPoints: () => this.replayPoints(),
            saveReplayPoints: () => this.saveReplayPoints(),
        };
        save.add(params, 'saveScene').name('save Scene');
        save.add(params, 'saveReplayPoints').name('save replay');

        save.add(params, 'replayPoints').name('replay Point clouds');

        save.open();
    }

    /**
     * löst eventlistner für 1 aus
     */
    private loadFile() {
        if (this.input === null) {
            return;
        }
        this.input.click();
    }

    /**
     * eventlistener für 4.
     *
     * obj müssen der scene hizugefügt werden bevor sie abgespielt werden
     * --> gemacht über async chaining
     */
    private replayEventListener() {
        this.loadReplay.addEventListener('change', (event: Event) => {
            let file: File;
            let loader: ObjectLoader = new THREE.ObjectLoader();

            if (this.loadReplay.files !== null) {
                file = this.loadReplay.files[0];
                let obj: metaValues[];


                file.text().then((text) => {
                    obj = JSON.parse(text);
                    this.pointsGui.pointsLogger = obj;

                    for (let i = 0; i < this.pointsGui.pointsLogger.length; i++) {
                        obj[i].obj = loader.parse(obj[i].obj) as Points;

                        this.scene.add(obj[i].obj);
                    }

                    return obj;
                }).then((obj) => {
                    for (let i = 0; i < obj.length; i++) {
                        this.replay(obj[i].values, i, obj[i].obj);
                    }
                });
            }
        });
    }

    /**
     * löst eventlistner für 4 aus
     */
    private loadReplayFile() {

        if (this.input === null) {
            return;
        }
        this.loadReplay.click();

    }

    /**
     * 3. lädt 2 Point Clouds
     */
    private loadDefaults() {
        if (this.defaultsLoaded) {
            return;
        }
        this.defaultsLoaded = true;

        this.loadPCD('v1.pcd', new Color(200, 0, 50));
        this.loadPCD('u1.pcd', new Color(0, 50, 200));
    }

    /**
     * lädt eine Pointcloud
     * & tested die Outlier funktion --> Wert muss im Code angepasst werden
     *
     */
    private loadPCD = (pcdUrl: string, color: Color): void => {

        this.loader.load(pcdUrl, (points) => {

            // lädt und testet die outlier Funktion
            let pointsWithoutOutliers: Vector3[] = this.pointsService.distancesToClosetPoint(points, 3.86);

            points.geometry.setFromPoints(pointsWithoutOutliers);

            // console.log(points.geometry.attributes.position.count);

            if (points.material instanceof PointsMaterial) {
                points.material.color = color;
                points.material.size = 1;
            }

            this.calibrateCenter(points);
            points.name = "points";

            this.scene.add(points);
            this.pointsGui.createPointsGui(points);
            this.render();

        });
    }

    // helper

    /**
     *  fügt ein Points Objekt der Scene zu und initialisiert die standart werte
     */
    private loadCloud(points: Points):void {
        if (points.material instanceof PointsMaterial) {
            points.material.color = new Color(200, 100, 20);
            points.material.size = 1;
        }
        points.name = "points";
        this.calibrateCenter(points);
        this.scene.add(points);

        this.pointsGui.createPointsGui(points);
        this.render();
    }

    /**
     * lädt eine Scene
     */
    private loadScene() {
        if (this.inputJson === null) {
            return;
        }
        this.scene.clear();
        this.inputJson.click();

    }

    /**
     * adds the new obj from the rep history into the scene
     * & ruft die replay func auf für jedes diser Obj.
     */
    private replayPoints() {
        for (let i: number = 0; i < this.pointsGui.pointsLogger.length; i++) {
            this.scene.add(this.pointsGui.pointsLogger[i].obj)
        }

        for (let i: number = 0; i < this.pointsGui.pointsLogger.length; i++) {
            const history: guiValues[] = this.pointsGui.pointsLogger[i].values;

            this.replay(history, i);
        }
    }


    //save

    /**
     *spielt the replay ab von den abgespiecherten obj. und werten
     * & berechent score für das erste replay obj mit dem 2.
     *
     * setInterval führt eine aktion im intervall aus bis der intervall gestoppt wird
     */
    private replay(history: guiValues[], index: number, loadedObj?: Points) {
        let points: Points = loadedObj ? loadedObj as Points : this.pointsGui.pointsLogger[index].obj;


        this.calibrateCenter(points);

        let i = -1;
        const interval: NodeJS.Timer = setInterval(() => {
            if (i < history.length - 1) {
                ++i;

                let direction = history[i].direction;

                if (direction === "x" || direction === "y" || direction === "z") {
                    if (history[i].type === state.ROT) {
                        // console.log(direction)
                        points.rotation[direction] = history[i].rotation[direction] * 20;
                    }
                    if (history[i].type === state.MOVE) {
                        points.position[direction] = history[i].move[direction];
                    }
                }

                // console.log(points.rotation, this.scene.getObjectById(this.pointsGui.pointsLogger[0].id)?.rotation);

                if (this.pointsGui.pointsLogger.length >= 2) {
                    let avg = this.statsService.calculateScore(this.pointsGui.pointsLogger[0].obj, this.pointsGui.pointsLogger[1].obj);
                    if (avg && this.showScore) {
                        this.showScore.textContent = "Score: " + avg.toString();
                    }
                }
                //console.log(this.scene, this.scene.getObjectById(0))
                if (this.pointsGui.pointsLogger.length == 1 && this.scene.getObjectById(14)) {
                    let obj  = this.scene.getObjectById(14);
                    console.log(this.scene, obj)
                    let avg = this.statsService.calculateScore(obj as Points, this.pointsGui.pointsLogger[0].obj);
                    if (avg && this.showScore) {
                        this.showScore.textContent = "Score: " + avg.toString();
                    }
                }

                // console.log("change ", history[i].type, history[i])
                //todo state zu nothing setzen
                this.render();
            } else {
                // console.log("end")
                clearInterval(interval);
            }
        }, 30)
    }

    /**
     * eine Ganze Scne speichern Scene Speichern
     */
    private saveScene() {
        let json = this.scene.toJSON();
        let save = JSON.stringify(json);
        this.output.href = URL.createObjectURL(new Blob([save], {type: "application/json"}));
        this.output.download = "save";

        this.output.click();
    }

    /**
     * speichern der Points aktion history mit und deren Objekte die geändert worden wurden
     */
    private saveReplayPoints() {
        let json = JSON.stringify(this.pointsGui.pointsLogger);
        this.outputReplay.href = URL.createObjectURL(new Blob([json], {type: "application/json"}));
        this.outputReplay.download = "saveReplay";

        this.outputReplay.click();

    }
}