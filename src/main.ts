import './style.css'
import {
  Mesh,
  Color,
  MeshStandardMaterial,
  BufferGeometry,
  Raycaster,
  Scene,
  SpotLight,
  PerspectiveCamera,
  WebGLRenderer,
  VSMShadowMap,
  BoxGeometry,
  CylinderGeometry,
  TetrahedronGeometry,
  PlaneGeometry,
  Vector2,
  Clock,
  EquirectangularReflectionMapping,
  MeshPhongMaterial,
  Vector3,
  MathUtils,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import Stats from 'three/addons/libs/stats.module.js'

function lerp(from: number, to: number, speed: number) {
  const amount = (1 - speed) * from + speed * to
  return Math.abs(from - to) < 0.001 ? to : amount
}

class Pickable extends Mesh {
  hovered = false
  clicked = false
  colorTo: Color
  defaultColor: Color
  geometry: BufferGeometry
  material: MeshStandardMaterial
  v = new Vector3()

  constructor(geometry: BufferGeometry, material: MeshStandardMaterial, colorTo: Color) {
    super()
    this.geometry = geometry
    this.material = material
    this.colorTo = colorTo
    this.defaultColor = material.color.clone()
    this.castShadow = true
  }

  update(delta: number) {
    this.rotation.x += delta / 2
    this.rotation.y += delta / 2

    // Position doesnt get to 1 or 0, use the custom function created in this file (lerp()) to correct that position 
    //console.log(this.position.y)
    // this.clicked
    //   ? (this.position.y = lerp(this.position.y, 1, delta * 5))
    //   : (this.position.y = lerp(this.position.y, 0, delta * 5))
    this.clicked 
      ? (this.position.y = MathUtils.lerp(this.position.y, 1, delta * 5)) 
      : (this.position.y = MathUtils.lerp(this.position.y, 0, delta * 5))

      // Lerp multiple properties (color has a lerp method). Roughness can see the envirement map
    this.hovered
      ? (this.material.color.lerp(this.colorTo, delta * 10),
        (this.material.roughness = lerp(this.material.roughness, 0, delta * 10)),
        (this.material.metalness = lerp(this.material.metalness, 1, delta * 10))
        )
      : (this.material.color.lerp(this.defaultColor, delta),
        (this.material.roughness = lerp(this.material.roughness, 1, delta)),
        (this.material.metalness = lerp(this.material.metalness, 0, delta)))

    // this.clicked
    //   ? this.scale.set(
    //       lerp(this.scale.x, 1.5, delta * 5),
    //       lerp(this.scale.y, 1.5, delta * 5),
    //       lerp(this.scale.z, 1.5, delta * 5)
    //     )
    //   : this.scale.set(
    //       lerp(this.scale.x, 1.0, delta),
    //       lerp(this.scale.y, 1.0, delta),
    //       lerp(this.scale.z, 1.0, delta)
    //     )

    // We can rewrite the lerp scale using V property that we set on Pickables class
    this.clicked ? this.v.set(1.5, 1.5, 1.5) : this.v.set(1.0, 1.0, 1.0)
    this.scale.lerp(this.v, delta * 5)
  }
}

const scene = new Scene()

const spotLight = new SpotLight(0xffffff, 500)
spotLight.position.set(5, 5, 5)
spotLight.angle = 0.3
spotLight.penumbra = 0.5
spotLight.castShadow = true
spotLight.shadow.radius = 20
spotLight.shadow.blurSamples = 20
spotLight.shadow.camera.far = 20
scene.add(spotLight)

await new RGBELoader().loadAsync('img/venice_sunset_1k.hdr').then((texture) => {
  texture.mapping = EquirectangularReflectionMapping
  scene.environment = texture
})

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 2, 4)

const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = VSMShadowMap
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI / 2 + Math.PI / 16 // ~ 100 degrees

const raycaster = new Raycaster()
const pickables: Pickable[] = [] // used in the raycaster intersects methods
let intersects
const mouse = new Vector2()

renderer.domElement.addEventListener('pointerdown', (e) => {
  mouse.set((e.clientX / renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / renderer.domElement.clientHeight) * 2 + 1)

  raycaster.setFromCamera(mouse, camera)

  intersects = raycaster.intersectObjects(pickables, false)

  // toggles `clicked` property for only the Pickable closest to the camera
  intersects.length && ((intersects[0].object as Pickable).clicked = !(intersects[0].object as Pickable).clicked)

  // toggles `clicked` property for all overlapping Pickables detected by the raycaster at the same time
  // intersects.forEach((i) => {
  //   ;(i.object as Pickable).clicked = !(i.object as Pickable).clicked
  // })
})

// To make hover work!
renderer.domElement.addEventListener('mousemove', (e) => {
  mouse.set(
    (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
  )

  raycaster.setFromCamera(mouse, camera)

  intersects = raycaster.intersectObjects(pickables, false)

  pickables.forEach((p) => (p.hovered = false))

  intersects.length && ((intersects[0].object as Pickable).hovered = true)
})

const cylinder = new Pickable(new CylinderGeometry(0.66, 0.66), new MeshStandardMaterial({ color: 'hotpink' }), new Color('gold'))
scene.add(cylinder)
pickables.push(cylinder)

const cube = new Pickable(
  new BoxGeometry(),
  new MeshStandardMaterial({ color: 0x888888 }),
  new Color(0xff2200)
)
cube.position.set(-2, 0, 0)
scene.add(cube)
pickables.push(cube)

const pyramid = new Pickable(
  new TetrahedronGeometry(),
  new MeshStandardMaterial({ color: 0x888888 }),
  new Color(0x0088ff)
)
pyramid.position.set(2, 0, 0)
scene.add(pyramid)
pickables.push(pyramid)

const floor = new Mesh(new PlaneGeometry(20, 20), new MeshPhongMaterial())
floor.rotateX(-Math.PI / 2)
floor.position.y = -1.25
floor.receiveShadow = true
//floor.material.envMapIntensity = 0
scene.add(floor)

const stats = new Stats()
document.body.appendChild(stats.dom)

const clock = new Clock()
let delta = 0

function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()

  pickables.forEach((p) => {
    p.update(delta)
  })

  controls.update()

  renderer.render(scene, camera)

  stats.update()
}

animate()