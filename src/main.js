import './style.scss'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

const loader = new GLTFLoader()
const raycasterObjects = []
const hitboxToObjectMap = new Map()
const scene = new THREE.Scene()
scene.background = new THREE.Color("#141414") // Changed from "#343434" to black

// Try multiple possible paths for the model
const modelPaths = [
  "/model/PortfolioV1.glb",  // This should work - public/model/ is served as /model/
  "/model/Portfolio.glb",
  "/model/PortfolioV5.glb",
  "/models/PortfolioV1.glb",
  "/PortfolioV1.glb",
  "/models/Portfolio.glb", 
  "/public/model/Portfolio.glb",
  "/public/models/Portfolio.glb",
  "/models/PortfolioV5.glb",
  "/PortfolioV5.glb",
  "/Portfolio.glb"
]

let currentPathIndex = 0

function tryLoadModel() {
  if (currentPathIndex >= modelPaths.length) {
    console.error('❌ All model paths failed, creating fallback scene')
    createFallbackScene()
    return
  }
  
  const currentPath = modelPaths[currentPathIndex]
  console.log(`🔄 Trying to load model from: ${currentPath}`)
  
  // First, let's check what the server is actually returning
  fetch(currentPath)
    .then(response => {
      console.log(`📊 Response for ${currentPath}:`, {
        status: response.status,
        contentType: response.headers.get('content-type'),
        size: response.headers.get('content-length')
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Check if it's actually a binary file
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/octet-stream') && !contentType.includes('model/gltf-binary')) {
        console.warn(`⚠️ Unexpected content type: ${contentType}`)
      }
      
      return response.arrayBuffer()
    })
    .then(buffer => {
      console.log(`📦 Buffer size: ${buffer.byteLength} bytes`)
      
      // Check if it looks like a GLB file (should start with "glTF")
      const view = new Uint8Array(buffer, 0, 4)
      const magic = String.fromCharCode(...view)
      console.log(`🔍 File magic: "${magic}"`)
      
      if (magic !== 'glTF') {
        throw new Error(`Invalid GLB file - magic is "${magic}", expected "glTF"`)
      }
      
      // If we get here, try loading with GLTFLoader
      loader.load(
        currentPath,
        (glb) => {
          console.log(`✅ Model loaded successfully from ${currentPath}`)
          scene.add(glb.scene)
          
          glb.scene.traverse((child) => {
            console.log('Found object:', child.name, 'Type:', child.type)
            
            // Force all objects to be visible
            child.visible = true
            
            if (child.name.includes('Raycaster')) {
              console.log('*** RAYCASTER OBJECT:', child.name, 'Type:', child.type, 'Visible:', child.visible)
            }
            
            if (child.isMesh) {
              console.log('  - Mesh details:', child.name, 'Position:', child.position, 'Scale:', child.scale)
              
              // Make all meshes visible and ensure proper scale
              child.visible = true
              child.frustumCulled = false
              if (child.scale.x === 0 || child.scale.y === 0 || child.scale.z === 0) {
                child.scale.set(1, 1, 1)
              }
              
              // Add neon glow to existing pink materials only
              if (child.material && child.material.color) {
                const color = child.material.color
                // Only modify if material is already pink (preserve original color)
                if (color.r > 0.8 && color.g < 0.8 && color.b > 0.8) {
                  const originalColor = color.clone()
                  child.material = new THREE.MeshStandardMaterial({
                    color: originalColor,
                    emissive: originalColor.clone().multiplyScalar(0.2),
                    emissiveIntensity: 0.4
                  })
                }
              }
              
              // Make specific text elements white
              if (child.name.includes("Text") || 
                  child.name.includes("text") ||
                  child.name.includes("aboutme_Raycaster_Pointer_Hover") ||
                  child.name.includes("projects_Raycaster_Pointer_Hover") ||
                  child.name.includes("workexperience_Raycaster_Pointer_Hover") ||
                  child.name.includes("contact_Raycaster_Pointer_Hover")) {
                
                child.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
                
                // Only handle the four interactive button texts for raycasting
                if (child.name.includes("aboutme_Raycaster_Pointer_Hover") ||
                    child.name.includes("projects_Raycaster_Pointer_Hover") ||
                    child.name.includes("workexperience_Raycaster_Pointer_Hover") ||
                    child.name.includes("contact_Raycaster_Pointer_Hover")) {
                  
                  child.userData.initialScale = new THREE.Vector3().copy(child.scale)
                  
                  const hitbox = createHitbox(child)
                  scene.add(hitbox)
                  raycasterObjects.push(hitbox)
                  hitboxToObjectMap.set(hitbox, child)
                }
              }
            }
            
            // Make all models visible
            if (child.isMesh && child.material) {
              child.visible = true
              // Preserve original materials unless they're problematic
              if (!child.material.color || child.material.transparent === true) {
                child.material = new THREE.MeshStandardMaterial({ color: 0x888888 })
              }
            }
          })
        },
        (progress) => {
          console.log(`Loading progress for ${currentPath}:`, (progress.loaded / progress.total * 100) + '%')
        },
        (error) => {
          console.error(`❌ GLTFLoader failed for ${currentPath}:`, error)
          currentPathIndex++
          tryLoadModel() // Try next path
        }
      )
    })
    .catch(error => {
      console.error(`❌ Failed to load from ${currentPath}:`, error)
      currentPathIndex++
      tryLoadModel() // Try next path
    })
}

function createFallbackScene() {
  console.log('🎨 Creating fallback 3D scene...')
  
  // Create a simple 3D scene with interactive elements
  const group = new THREE.Group()
  
  // Create interactive buttons as 3D objects
  const buttonData = [
    { name: 'aboutme_Raycaster_Pointer_Hover', position: [8, 10, 10], color: 0xff69b4 },
    { name: 'projects_Raycaster_Pointer_Hover', position: [13, 10, 10], color: 0x69b4ff },
    { name: 'workexperience_Raycaster_Pointer_Hover', position: [8, 8, 10], color: 0xb4ff69 },
    { name: 'contact_Raycaster_Pointer_Hover', position: [13, 8, 10], color: 0xffb469 }
  ]
  
  buttonData.forEach(button => {
    const geometry = new THREE.BoxGeometry(2, 1, 0.5)
    const material = new THREE.MeshStandardMaterial({ 
      color: button.color,
      emissive: button.color,
      emissiveIntensity: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...button.position)
    mesh.name = button.name
    mesh.userData.initialScale = new THREE.Vector3(1, 1, 1)
    
    const hitbox = createHitbox(mesh)
    scene.add(hitbox)
    raycasterObjects.push(hitbox)
    hitboxToObjectMap.set(hitbox, mesh)
    
    group.add(mesh)
  })
  
  scene.add(group)
  console.log('✅ Fallback scene created with interactive elements')
}

// Start loading
tryLoadModel()

function createHitbox(object) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  const hitboxGeometry = new THREE.BoxGeometry(size.x * 1.2, size.y * 1.2, size.z * 1.2)
  const hitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, visible: false })
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial)
  
  hitbox.position.copy(center)
  hitbox.userData.originalObject = object
  
  return hitbox
}

// Scene setup
const canvas = document.querySelector("#experience-canvas")
const sizes = { width: window.innerWidth, height: window.innerHeight }

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 200)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 5)
scene.add(directionalLight)

// Falling Particles System
class FallingParticle {
  constructor() {
    const geometry = new THREE.SphereGeometry(0.05, 6, 6)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.reset()
    this.blinkTimer = Math.random() * Math.PI * 2
  }
  
  reset() {
    this.mesh.position.set(
      (Math.random() - 0.5) * 100,
      50 + Math.random() * 20,
      (Math.random() - 0.5) * 100
    )
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      -0.2 - Math.random() * 0.3,
      (Math.random() - 0.5) * 0.1
    )
  }
  
  update() {
    this.mesh.position.add(this.velocity)
    this.blinkTimer += 0.1
    
    // Shimmer and blink effect
    const shimmer = 0.5 + 0.5 * Math.sin(this.blinkTimer)
    const blink = Math.sin(this.blinkTimer * 0.5) > 0.3 ? 1 : 0.3
    this.mesh.material.opacity = shimmer * blink
    
    if (this.mesh.position.y < -10) this.reset()
  }
}

// Firefly System
class Firefly {
  constructor() {
    const geometry = new THREE.SphereGeometry(0.08, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.8
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.light = new THREE.PointLight(0xffff88, 1, 5)
    
    this.position = new THREE.Vector3(
      10.5 + (Math.random() - 0.5) * 20,
      5 + Math.random() * 10,
      10 + (Math.random() - 0.5) * 20
    )
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.02
    )
    this.blinkTimer = Math.random() * Math.PI * 2
  }
  
  update() {
    this.position.add(this.velocity)
    this.blinkTimer += 0.05
    
    // Keep near model
    const center = new THREE.Vector3(10.5, 9, 10)
    if (this.position.distanceTo(center) > 15) {
      this.velocity.add(center.clone().sub(this.position).normalize().multiplyScalar(0.001))
    }
    
    this.mesh.position.copy(this.position)
    this.light.position.copy(this.position)
    
    const blink = 0.3 + 0.7 * Math.abs(Math.sin(this.blinkTimer))
    this.mesh.material.opacity = blink
    this.light.intensity = blink * 1.5
  }
}

// Create particles and fireflies
const particles = []
for (let i = 0; i < 50; i++) {
  const particle = new FallingParticle()
  particles.push(particle)
  scene.add(particle.mesh)
}

const fireflies = []
for (let i = 0; i < 35; i++) {
  const firefly = new Firefly()
  fireflies.push(firefly)
  scene.add(firefly.mesh)
  scene.add(firefly.light)
}

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
// Limit vertical rotation - prevent looking below the model
controls.maxPolarAngle = Math.PI / 2 // 90 degrees (horizontal)
controls.minPolarAngle = 0 // 0 degrees (straight up)
// Limit zoom out distance
controls.maxDistance = 50

// Start with top view
camera.position.set(10.5, 25, 10)
controls.target.set(10.5, 9, 10)
controls.update()

// Smooth transition to front view after loading
function transitionToFrontView() {
  gsap.to(camera.position, {
    x: 10.5,
    y: 9,
    z: 30,
    duration: 3,
    ease: "power2.inOut",
    onUpdate: () => {
      controls.update()
    }
  })
}

// Listen for loading screen completion
let hasTransitioned = false
function checkLoadingComplete() {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen && loadingScreen.style.display === 'none' && !hasTransitioned) {
    hasTransitioned = true
    setTimeout(transitionToFrontView, 500)
  }
}
setInterval(checkLoadingComplete, 100)

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Modal functionality
const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  projects: document.querySelector(".modal.projects"),
  contact: document.querySelector(".modal.contact"),
}

const overlay = document.querySelector(".overlay")
let isModalOpen = false

const showModal = (modal) => {
  modal.style.display = "block"
  overlay.style.display = "block"
  isModalOpen = true
  controls.enabled = false
  
  gsap.fromTo(modal, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" })
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 })
}

const hideModal = (modal) => {
  // Immediately disable interactions to prevent glitch
  isModalOpen = true // Keep this true during animation
  
  gsap.to([modal, overlay], { 
    opacity: 0, 
    duration: 0.2,
    ease: "power2.out",
    onComplete: () => {
      modal.style.display = "none"
      overlay.style.display = "none"
      isModalOpen = false
      controls.enabled = true
      // Reset any hover states
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false)
        currentHoveredObject = null
        document.body.style.cursor = "default"
      }
    }
  })
}

overlay.addEventListener("click", () => {
  const modal = document.querySelector('.modal[style*="display: block"]')
  if (modal) hideModal(modal)
})

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal")
    hideModal(modal)
  })
})

// Raycaster setup
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let currentIntersects = []
let currentHoveredObject = null

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const hitbox = currentIntersects[0].object
    const object = hitboxToObjectMap.get(hitbox)
    
    if (object.name.includes("aboutme_Raycaster_Pointer_Hover")) {
      showModal(modals.about)
    } else if (object.name.includes("projects_Raycaster_Pointer_Hover")) {
      showModal(modals.projects)
    } else if (object.name.includes("workexperience_Raycaster_Pointer_Hover")) {
      showModal(modals.work)
    } else if (object.name.includes("contact_Raycaster_Pointer_Hover")) {
      showModal(modals.contact)
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  const object = hitboxToObjectMap.get(objectHitbox)
  gsap.killTweensOf(object.scale)
  
  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      y: object.userData.initialScale.y * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.3,
      ease: "back.out(2)"
    })
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)"
    })
  }
}

window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / sizes.width) * 2 - 1
  pointer.y = -(e.clientY / sizes.height) * 2 + 1
})

window.addEventListener("click", handleRaycasterInteraction)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  // Update particles and fireflies
  particles.forEach(particle => particle.update())
  fireflies.forEach(firefly => firefly.update())
  
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(raycasterObjects)
    
    if (intersects.length > 0) {
      if (currentHoveredObject !== intersects[0].object) {
        if (currentHoveredObject) playHoverAnimation(currentHoveredObject, false)
        currentHoveredObject = intersects[0].object
        playHoverAnimation(currentHoveredObject, true)
        document.body.style.cursor = "pointer"
      }
      currentIntersects = intersects
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false)
        currentHoveredObject = null
        document.body.style.cursor = "default"
      }
      currentIntersects = []
    }
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()