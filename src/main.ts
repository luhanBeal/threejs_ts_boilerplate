import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

const scene = new THREE.Scene()

scene.add(new THREE.GridHelper())

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(-1, 4, 2.5)

const renderer = new THREE.WebGLRenderer({ antialias: true })

// (Default) filters shadow maps using the Percentage-Closer Filtering (PCF) algorithm (default).
renderer.shadowMap.type = THREE.PCFShadowMap // (default)

// filters shadow maps using the Percentage-Closer Soft Shadows (PCSS) algorithm.
//renderer.shadowMap.type = THREE.PCFSoftShadowMap

// gives unfiltered shadow maps - fastest, but lowest quality.
//renderer.shadowMap.type = THREE.BasicShadowMap

// filters shadow maps using the Variance Shadow Map (VSM) algorithm. When using VSMShadowMap all shadow receivers will also cast shadows.
//renderer.shadowMap.type = THREE.VSMShadowMap
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xffffff }))
plane.rotation.x = -Math.PI / 2
// Need need to apply if it receive shadow
plane.receiveShadow = true
// LIGHTS DONT CAST SHADOWS, we need to add them
plane.castShadow = true
scene.add(plane)

const data = {
  color: 0x00ff00,
  lightColor: 0xffffff,
  shadowMapSizeWidth: 512,
  shadowMapSizeHeight: 512,
}

const geometry = new THREE.IcosahedronGeometry(1, 1)

const meshes = [
  new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: data.color })),
  new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({ flatShading: true })),
  new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: data.color, flatShading: true })),
  new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: data.color, flatShading: true })),
]

meshes[0].position.set(-3, 1, 0)
meshes[1].position.set(-1, 1, 0)
meshes[2].position.set(1, 1, 0)
meshes[3].position.set(3, 1, 0)

// meshes[0].castShadow = true
// meshes[1].castShadow = true
// meshes[2].castShadow = true
// meshes[3].castShadow = true
// CAST AND RECEIVE shadow are part of the Mesh, not the material
meshes.map((m) => (m.castShadow = true)) // using array map
meshes.map((m) => (m.receiveShadow = true))

// and instead of using `meshes.map` on two lines in a row, you can use once and share it like,
// meshes.map((m) => {
//   m.castShadow = true
//   m.receiveShadow = true
// })

scene.add(...meshes)

const gui = new GUI()

// #region DirectionalLight

const directionalLight = new THREE.DirectionalLight(data.lightColor, Math.PI)
directionalLight.position.set(1, 1, 1)
// The camera frostrum change to calculate where the shadow should be
directionalLight.castShadow = true
directionalLight.shadow.camera.near = 0
directionalLight.shadow.camera.far = 10
directionalLight.shadow.mapSize.width = data.shadowMapSizeWidth
directionalLight.shadow.mapSize.height = data.shadowMapSizeHeight
scene.add(directionalLight)

// DIRECTION LIGHT HERE IS USING THE CAMERA HELPER!
// It is an ortographic camera, thats why
// set the frostrum just on necessary are for better performance

// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight)
const directionalLightHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
directionalLightHelper.visible = false
scene.add(directionalLightHelper)

const directionalLightFolder = gui.addFolder('DirectionalLight')
directionalLightFolder.add(directionalLight, 'visible')
directionalLightFolder.addColor(data, 'lightColor').onChange(() => {
  directionalLight.color.set(data.lightColor)
})
directionalLightFolder.add(directionalLight, 'intensity', 0, Math.PI * 10)
directionalLightFolder.add(directionalLight.position, 'x', -5, 5, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.position, 'y', -5, 5, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.position, 'z', -5, 5, 0.001).onChange(() => {
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLightHelper, 'visible').name('Helper Visible')
directionalLightFolder.add(directionalLight.shadow.camera, 'left', -10, -1, 0.1).onChange(() => {
  // Need to update the shadow
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.shadow.camera, 'right', 1, 10, 0.1).onChange(() => {
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.shadow.camera, 'top', 1, 10, 0.1).onChange(() => {
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.shadow.camera, 'bottom', -10, -1, 0.1).onChange(() => {
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.shadow.camera, 'near', 0, 100).onChange(() => {
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})
directionalLightFolder.add(directionalLight.shadow.camera, 'far', 0.1, 100).onChange(() => {
  directionalLight.shadow.camera.updateProjectionMatrix()
  directionalLightHelper.update()
})

// MEMORY USED TO CALCULATE SHADOWS, It renders like another camera. 
directionalLightFolder.add(data, 'shadowMapSizeWidth', [256, 512, 1024, 2048, 4096]).onChange(() => updateDirectionalLightShadowMapSize())
directionalLightFolder.add(data, 'shadowMapSizeHeight', [256, 512, 1024, 2048, 4096]).onChange(() => updateDirectionalLightShadowMapSize())
// Better performance on low
directionalLightFolder.add(directionalLight.shadow, 'radius', 1, 10, 1).name('radius (PCF | VSM)') // PCFShadowMap or VSMShadowMap
directionalLightFolder.add(directionalLight.shadow, 'blurSamples', 1, 20, 1).name('blurSamples (VSM)') // VSMShadowMap only
directionalLightFolder.open()

function updateDirectionalLightShadowMapSize() {
  directionalLight.shadow.mapSize.width = data.shadowMapSizeWidth
  directionalLight.shadow.mapSize.height = data.shadowMapSizeHeight
  directionalLight.shadow.map = null
}
// #endregion

// #region Pointlight
// shadows render as a perspective camera

const pointLight = new THREE.PointLight(data.lightColor, Math.PI)
pointLight.position.set(2, 1, 0)
pointLight.visible = false
pointLight.castShadow = true
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight)
pointLightHelper.visible = false
scene.add(pointLightHelper)

const pointLightFolder = gui.addFolder('Pointlight')
pointLightFolder.add(pointLight, 'visible')
pointLightFolder.addColor(data, 'lightColor').onChange(() => {
  pointLight.color.set(data.lightColor)
})
pointLightFolder.add(pointLight, 'intensity', 0, Math.PI * 10)
pointLightFolder.add(pointLight.position, 'x', -10, 10)
pointLightFolder.add(pointLight.position, 'y', -10, 10)
pointLightFolder.add(pointLight.position, 'z', -10, 10)
pointLightFolder.add(pointLight, 'distance', 0.01, 20)
pointLightFolder.add(pointLight, 'decay', 0, 10)
pointLightFolder.add(pointLightHelper, 'visible').name('Helper Visible')
pointLightFolder.add(pointLight.shadow.camera, 'near', 0.01, 100).onChange(() => {
  pointLight.shadow.camera.updateProjectionMatrix()
  pointLightHelper.update()
})
pointLightFolder.add(pointLight.shadow.camera, 'far', 0.1, 100).onChange(() => {
  pointLight.shadow.camera.updateProjectionMatrix()
  pointLightHelper.update()
})
pointLightFolder.add(data, 'shadowMapSizeWidth', [256, 512, 1024, 2048, 4096]).onChange(() => updatePointLightShadowMapSize())
pointLightFolder.add(data, 'shadowMapSizeHeight', [256, 512, 1024, 2048, 4096]).onChange(() => updatePointLightShadowMapSize())
pointLightFolder.add(pointLight.shadow, 'radius', 1, 10, 1).name('radius (PCF | VSM)') // PCFShadowMap or VSMShadowMap
pointLightFolder.add(pointLight.shadow, 'blurSamples', 1, 20, 1).name('blurSamples (VSM)') // VSMShadowMap only
pointLightFolder.close()

function updatePointLightShadowMapSize() {
  pointLight.shadow.mapSize.width = data.shadowMapSizeWidth
  pointLight.shadow.mapSize.height = data.shadowMapSizeHeight
  pointLight.shadow.map = null
}

// #endregion

// #region Spotlight
// Render a perspective camera to draw the shadows

const spotLight = new THREE.SpotLight(data.lightColor, Math.PI)
spotLight.position.set(3, 2.5, 1)
spotLight.visible = false
//spotLight.target.position.set(5, 0, -5)
spotLight.castShadow = true
scene.add(spotLight)

//const spotLightHelper = new THREE.SpotLightHelper(spotLight)
const spotLightHelper = new THREE.CameraHelper(spotLight.shadow.camera)
spotLightHelper.visible = false
scene.add(spotLightHelper)

const spotLightFolder = gui.addFolder('Spotlight')
spotLightFolder.add(spotLight, 'visible')
spotLightFolder.addColor(data, 'lightColor').onChange(() => {
  spotLight.color.set(data.lightColor)
})
spotLightFolder.add(spotLight, 'intensity', 0, Math.PI * 10)
spotLightFolder.add(spotLight.position, 'x', -10, 10).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight.position, 'y', -10, 10).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight.position, 'z', -10, 10).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight, 'distance', 0.01, 100).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight, 'decay', 0, 10).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight, 'angle', 0, 1).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLight, 'penumbra', 0, 1, 0.001).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(spotLightHelper, 'visible').name('Helper Visible')
spotLightFolder.add(spotLight.shadow.camera, 'near', 0.01, 100).onChange(() => {
  spotLight.shadow.camera.updateProjectionMatrix()
  spotLightHelper.update()
})
spotLightFolder.add(data, 'shadowMapSizeWidth', [256, 512, 1024, 2048, 4096]).onChange(() => updateSpotLightShadowMapSize())
spotLightFolder.add(data, 'shadowMapSizeHeight', [256, 512, 1024, 2048, 4096]).onChange(() => updateSpotLightShadowMapSize())
spotLightFolder.add(spotLight.shadow, 'radius', 1, 10, 1).name('radius (PCF | VSM)') // PCFShadowMap or VSMShadowMap
spotLightFolder.add(spotLight.shadow, 'blurSamples', 1, 20, 1).name('blurSamples (VSM)') // VSMShadowMap only
spotLightFolder.close()

function updateSpotLightShadowMapSize() {
  spotLight.shadow.mapSize.width = data.shadowMapSizeWidth
  spotLight.shadow.mapSize.height = data.shadowMapSizeHeight
  spotLight.shadow.map = null
}

// #endregion

const stats = new Stats()
document.body.appendChild(stats.dom)

const labels = document.querySelectorAll<HTMLDivElement>('.label')

let x, y
const v = new THREE.Vector3()

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  for (let i = 0; i < 4; i++) {
    v.copy(meshes[i].position)
    v.project(camera)

    x = ((1 + v.x) / 2) * innerWidth - 50
    y = ((1 - v.y) / 2) * innerHeight

    labels[i].style.left = x + 'px'
    labels[i].style.top = y + 'px'
  }

  renderer.render(scene, camera)

  stats.update()
}

animate()