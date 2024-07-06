import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// import Stats from 'three/addons/libs/stats.module.js'
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'

const scene = new THREE.Scene()

const light = new THREE.SpotLight(undefined, Math.PI * 1000)
light.position.set(15, 15, 15)
light.angle = Math.PI / 16
light.castShadow = true
scene.add(light)

new RGBELoader().load('img/venice_sunset_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
  scene.background = texture
})

// const gridHelper = new THREE.GridHelper()
// gridHelper.position.y = -0.5
// scene.add(gridHelper)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 2
camera.position.y = 3
camera.position.x = 3
camera.lookAt(5, 5, 5)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)

// -- CANT CHANGE JUST THE CAMERA, OrbitControls will reset the camera, we can do this instead and controls.update() on animate function
camera.lookAt(0.5, 3, 0.5)
controls.target.set(.5, 3, .5)
controls.update()


//-- autorotate --
controls.autoRotate = true
controls.autoRotateSpeed = 1
// -- smooth change when click up
controls.enableDamping = true
// -- Very slow change when click up
controls.dampingFactor = .01
// -- controls with the arrows on keyboard
// controls.listenToKeyEvents(window)
// -- customize keys --
controls.keys = {
    LEFT: 'KeyA', // default 'ArrowLeft'
    UP: 'KeyW', // default 'ArrowUp'
    RIGHT: 'KeyD', // default 'ArrowRight'
    BOTTOM: 'KeyS' // default 'ArrowDown'
}
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
}
controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
}

// const geometry = new THREE.BoxGeometry()
// const material = new THREE.MeshNormalMaterial({ wireframe: true })

// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)
const image = 'models/gold_flare.jpg'
const material = new THREE.MeshPhysicalMaterial()
material.map = new THREE.TextureLoader().load(image)
material.envMapIntensity = 0.7
material.roughness = 0.17
material.metalness = 0.7
material.clearcoat = 0.43
material.iridescence = 0.1
material.transmission = 1
material.thickness = 5.12
// material.ior = 0.78

new GLTFLoader().load('models/egg.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    ;(child as THREE.Mesh).material = material
    // child.rotation.x = -Math.PI / 2
  })
  
  scene.add(gltf.scene)
  
  const textureLoader = new THREE.TextureLoader()
  const textureFlare0 = textureLoader.load('https://cdn.jsdelivr.net/gh/Sean-Bradley/First-Car-Shooter@main/dist/client/img/lensflare0.png')
  const lensflare = new Lensflare()
  lensflare.addElement(new LensflareElement(textureFlare0, 100000, 10))
  light.add(lensflare)
})
scene.traverse((child) => {
  console.log(child.children)
})

// const stats = new Stats()
// document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate)
  
  // scene.traverse((child) => {
  //   child.rotation.y += 0.01
  // })
  
  controls.update()

  renderer.render(scene, camera)

  // stats.update()
}

animate()