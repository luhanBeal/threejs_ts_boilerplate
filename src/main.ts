import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// export default Stats; (thats why its not necessry {})
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "dat.gui";

// Scene extends from Object3d (basic object in 3js)
// const scene = new THREE.Scene();
// scene.background = new THREE.CubeTextureLoader()
//   .setPath('https://sbcode.net/img/')
//   .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);

// scene examples
// 0x refer to hex
const sceneA = new THREE.Scene()
sceneA.background = new THREE.Color(0x123456)
// static background
const sceneB = new THREE.Scene()
sceneB.background = new THREE.TextureLoader()
  .load('https://sbcode.net/img/grid.png')
// skybox -> set img to +x, -x, +y, -y, +z, -z
const sceneC = new THREE.Scene()
sceneC.background = new THREE.CubeTextureLoader()
  .setPath('https://sbcode.net/img/')
  .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
//sceneC.backgroundBlurriness = 0.5

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial({ wireframe: true });

const cube = new THREE.Mesh(geometry, material);
// only one mesh per scene (append the cube to last scene added)
sceneA.add(cube);
sceneB.add(cube);
sceneC.add(cube);

const stats = new Stats();
document.body.appendChild(stats.dom);

// add scenes to GUI 
let activeScene = sceneA
const setScene = {
  sceneA: () => {
    activeScene = sceneA
  },
  sceneB: () => {
    activeScene = sceneB
  },
  sceneC: () => {
    activeScene = sceneC
  },
}

const gui = new GUI()
gui.add(setScene, 'sceneA').name('Scene A')
gui.add(setScene, 'sceneB').name('Scene B')
gui.add(setScene, 'sceneC').name('Scene C')


function animate() {
  requestAnimationFrame(animate);

  // start of animation to analyse
  // stats.begin();
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  // stats.end();

  // all animation to analyse
  stats.update();
  renderer.render(activeScene, camera);
}

animate();
