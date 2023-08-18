import * as THREE from "three";
import {BufferGeometry, Group, Line, LineBasicMaterial, PerspectiveCamera, Points, Scene, WebGLRenderer} from "three";

import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {ioService} from "./ioService.js";
import {StatsService} from "./statsService.js";
import {isMove, movementState, setIsMove} from "./GlobalStates.js";

const canvas = document.querySelector('#c');
let showScore = document.querySelector("#scoreHistory");


let renderer: WebGLRenderer;
let scene: Scene;
let camera: PerspectiveCamera;

let statsService: StatsService;
statsService = new StatsService();



main();


/**
 *rendered die Scene
 */
function render() {
    let avg: number | undefined;

    if (isMove === movementState.nothing) {
        renderer.render(scene, camera);
        return;
    }

    let points = scene.getObjectsByProperty("name", "points") as Points[];

    if (points.length >= 2) {
        avg = statsService.calculateScore(points[0], points[1]);
    }

    if (avg && showScore) {
        showScore.textContent = "Score: " + avg.toString();
    }

    renderer.render(scene, camera);
}


/**
 * render verschönerungen
 */
function resizeRendererToDisplaySize(renderer: WebGLRenderer): void {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }

}


/**
 * xyz guide axsis
 */
function createXYZLines(): void {
    const materials: LineBasicMaterial[] = [new THREE.LineBasicMaterial({
            color: 0x00ff00
        }), new THREE.LineBasicMaterial({
            color: 0x0000ff
        }), new THREE.LineBasicMaterial({
            color: 0xff0000
        }),]

    ;

    const pointsY = [];
    pointsY.push(new THREE.Vector3(0, 0, 0));
    pointsY.push(new THREE.Vector3(0, 100, 0));
    const geometryY: BufferGeometry = new THREE.BufferGeometry().setFromPoints(pointsY);

    const pointsZ = [];
    pointsZ.push(new THREE.Vector3(0, 0, 0));
    pointsZ.push(new THREE.Vector3(0, 0, 100));
    const geometryZ: BufferGeometry = new THREE.BufferGeometry().setFromPoints(pointsZ);

    const pointsX = [];
    pointsX.push(new THREE.Vector3(0, 0, 0));
    pointsX.push(new THREE.Vector3(100, 0, 0));
    const geometryX: BufferGeometry = new THREE.BufferGeometry().setFromPoints(pointsX);

    const lineX: Line = new THREE.Line(geometryX, materials[0]);
    const lineY: Line = new THREE.Line(geometryY, materials[1]);
    const lineZ: Line = new THREE.Line(geometryZ, materials[2]);

    const group = new Group();

    group.add(lineX);
    group.add(lineY);
    group.add(lineZ);

    scene.add(group);


    render();
}


/**
 * führt das Programm aus
 * setzt init werte
 * erstellt dem den Load Save Gui
 */
function main() {
    // const canvas = document.querySelector('#c');
    if (canvas === null) {
        return;
    }
    if (canvas === undefined) {
        return;
    }


    renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    resizeRendererToDisplaySize(renderer);


    const fov = 75;
    const aspect = canvas.clientWidth / canvas.clientHeight;  // the canvas default
    const near = 0.01;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 100;

    scene = new THREE.Scene();

    const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', () => {
        setIsMove(movementState.nothing);
        render();
    }); // use if there is no animation loop


    const pcdLoader = new ioService(scene, () => render());
    pcdLoader.loadGui();
    pcdLoader.saveGui();

    createXYZLines();

    renderer.render(scene, camera);
}