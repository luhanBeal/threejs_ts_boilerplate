import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import TWEEN from '@tweenjs/tween.js'

const scene = new THREE.Scene()

const gridHelper = new THREE.GridHelper()
gridHelper.position.y = -1
scene.add(gridHelper)

await new RGBELoader().loadAsync('img/venice_sunset_1k.hdr').then((texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
})

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1, 4)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.8
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  // render when resizing the aspect of the window
  render() //this line is unnecessary if you are re-rendering within the animation loop
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
// render only when orbitControls are changing
controls.addEventListener('change', render) //this line is unnecessary if you are re-rendering within the animation loop

let suzanne: THREE.Mesh, plane: THREE.Mesh

new GLTFLoader().load('models/suzanne_scene.glb', (gltf) => {
  suzanne = gltf.scene.getObjectByName('Suzanne') as THREE.Mesh
  suzanne.castShadow = true
    ; ((suzanne.material as THREE.MeshStandardMaterial).map as THREE.Texture).colorSpace = THREE.LinearSRGBColorSpace

  plane = gltf.scene.getObjectByName('Plane') as THREE.Mesh
  plane.scale.set(50, 1, 50)
    ; (plane.material as THREE.MeshStandardMaterial).envMap = scene.environment // since three@163, we need to set `envMap` before changing `envMapIntensity` has any effect.
    ; (plane.material as THREE.MeshStandardMaterial).envMapIntensity = 0.05
  plane.receiveShadow = true

  const spotLight = gltf.scene.getObjectByName('Spot') as THREE.SpotLight
  spotLight.intensity /= 500
  spotLight.castShadow = true
  // Spotlight targeting suzanne
  spotLight.target = suzanne

  scene.add(gltf.scene)

  // render after load the meshes
  render()
})

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

renderer.domElement.addEventListener('dblclick', (e) => {
  mouse.set((e.clientX / renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / renderer.domElement.clientHeight) * 2 + 1)

  raycaster.setFromCamera(mouse, camera)

  // const intersects = raycaster.intersectObjects([suzanne, plane], false)
  // intersect only the plane (raycaster get only the position of the plane)
  const intersects = raycaster.intersectObjects([plane], false)

  if (intersects.length) {
    const p = intersects[0].point

    // controls.target.set(p.x, p.y, p.z)

    //  Tweening controls.target
    // new TWEEN.Tween(controls.target)
    //   .to(
    //     {
    //       x: p.x,
    //       y: p.y,
    //       z: p.z
    //     },
    //     500
    //   )
    //   // .delay (1000)
    //   .easing(TWEEN.Easing.Cubic.Out)
    //   // render the screen only when animating
    //   //.onUpdate(() => render())
    //   .start()

    // // slding x,z
    new TWEEN.Tween(suzanne.position)
      .to(
        {
          x: p.x,
          z: p.z
        },
        500
      )
      // render the screen only when animating
      .onUpdate(() => render())
      .start()

    // going up
    new TWEEN.Tween(suzanne.position)
      .to(
        {
          y: p.y + 3
        },
        250
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => render())
      .start()
      .onComplete(() => {
        // going down
        new TWEEN.Tween(suzanne.position)
          .to(
            {
              y: p.y + 1
            },
            250
          )
          // .delay(250)
          .onUpdate(() => render())
          .easing(TWEEN.Easing.Bounce.Out)
          .start()
      })
  }
})

const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  TWEEN.update()

  // we are rendering only where is necessary
  // render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}

animate()