import './style.scss'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

// Set up the GLTFLoader with Meshopt decoder
const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

const raycasterObjects = []
const hitboxToObjectMap = new Map()
const scene = new THREE.Scene()
scene.background = new THREE.Color("#141414") // Changed from "#343434" to black

// Try multiple possible paths for the model
const modelPaths = [
  "/model/PortfolioCompressed.glb",  // Use the compressed version first
  "/model/duck.glb",  // Keep duck as fallback
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
          
          // Move the entire model below the final camera position (Y: -35)
          glb.scene.position.set(35, -60, 0) // Changed Y from -85 to -50 (below camera's -35)
          
          scene.add(glb.scene)
          
          glb.scene.traverse((child) => {
            console.log('Found object:', child.name, 'Type:', child.type)
            
            // Force all objects to be visible initially
            child.visible = true
            
            // Log ALL objects that contain "Raycaster" or similar interactive terms
            if (child.name.includes('Raycaster') || 
                child.name.includes('about') || 
                child.name.includes('project') || 
                child.name.includes('work') || 
                child.name.includes('contact') ||
                child.name.includes('button') ||
                child.name.includes('interactive')) {
              console.log('*** POTENTIAL INTERACTIVE OBJECT:', child.name, 'Type:', child.type, 'Visible:', child.visible)
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
              
              // COMPLETELY HIDE THE TEXT OBJECT - this is the main text element from your console
              if (child.name === "Text") {
                console.log('🚫 HIDING MAIN TEXT OBJECT:', child.name)
                child.visible = false
                child.material.visible = false
                child.material.opacity = 0
                child.material.transparent = true
                child.scale.set(0, 0, 0) // Make it tiny as well
                child.position.set(0, -1000, 0) // Move it far away
                return // Skip further processing for this object
              }
              
              // Hide any other potential text elements
              if (child.name.includes("Text") || 
                  child.name.includes("text") ||
                  child.name.toLowerCase().includes("about") ||
                  child.name.toLowerCase().includes("project") ||
                  child.name.toLowerCase().includes("work") ||
                  child.name.toLowerCase().includes("contact") ||
                  child.name.toLowerCase().includes("experience") ||
                  child.name.includes("Label") ||
                  child.name.includes("label") ||
                  child.name.includes("Title") ||
                  child.name.includes("title") ||
                  child.name.includes("Button") ||
                  child.name.includes("button") ||
                  child.name.includes("UI") ||
                  child.name.includes("ui")) {
                
                console.log('🚫 HIDING TEXT/UI ELEMENT:', child.name)
                child.visible = false
                if (child.material) {
                  child.material.visible = false
                  child.material.opacity = 0
                  child.material.transparent = true
                }
                child.scale.set(0, 0, 0)
                child.position.set(0, -1000, 0)
                return // Skip further processing
              }
              
              // SPECIAL HANDLING FOR SCROLL OBJECT - Make it interactive with pink glow
              if (child.name === "Scroll_Scroll_0") {
                console.log('📜 SETTING UP SCROLL OBJECT WITH PINK GLOW:', child.name)
                console.log('📍 Scroll position:', child.position)
                
                // Ensure the scroll is visible and properly positioned
                child.visible = true
                child.frustumCulled = false
                
                // Store original material properties
                child.userData.originalMaterial = child.material.clone()
                child.userData.initialScale = new THREE.Vector3().copy(child.scale)
                
                // Create a pink glow material for hover state
                child.userData.glowMaterial = new THREE.MeshStandardMaterial({
                  color: child.material.color,
                  emissive: new THREE.Color(0xff69b4), // Pink glow
                  emissiveIntensity: 0.5,
                  transparent: true,
                  opacity: 1
                })
                
                // Create a larger hitbox for easier clicking
                const scrollHitbox = createScrollHitbox(child)
                scene.add(scrollHitbox)
                raycasterObjects.push(scrollHitbox)
                hitboxToObjectMap.set(scrollHitbox, child)
                
                // Mark this as a special scroll object
                child.userData.isScrollObject = true
                
                console.log('✅ Scroll object setup complete with hitbox')
              }
              
              // Keep interactive hitboxes but make them invisible
              else if (child.name.includes("aboutme_Raycaster_Pointer_Hover") ||
                  child.name.includes("projects_Raycaster_Pointer_Hover") ||
                  child.name.includes("workexperience_Raycaster_Pointer_Hover") ||
                  child.name.includes("contact_Raycaster_Pointer_Hover") ||
                  child.name.includes("Raycaster") ||
                  child.name.includes("Pointer") ||
                  child.name.includes("Hover") ||
                  child.name.includes("Interactive") ||
                  child.name.includes("Clickable") ||
                  child.name.includes("Hitbox")) {
                
                console.log('🎯 ADDING INVISIBLE HITBOX TO RAYCASTER:', child.name)
                
                // Make the hitbox invisible but keep it functional
                child.visible = false
                child.material = new THREE.MeshBasicMaterial({ 
                  transparent: true, 
                  opacity: 0,
                  visible: false 
                })
                
                child.userData.initialScale = new THREE.Vector3().copy(child.scale)
                
                const hitbox = createHitbox(child)
                scene.add(hitbox)
                raycasterObjects.push(hitbox)
                hitboxToObjectMap.set(hitbox, child)
              }
              
              // Since the "Text" object contains all the text elements, create interactive zones
              // based on the known position from your console output
              else if (child.name === "Text") {
                console.log('🎯 CREATING INTERACTIVE AREAS BASED ON TEXT POSITION')
                
                // The text object is at position x: 13.17, y: 9.56, z: 10.13
                // Create 4 interactive zones around this area
                const basePosition = new THREE.Vector3(13.17, 9.56, 10.13)
                
                const zones = [
                  { name: 'aboutme_zone', offset: { x: -3, y: 2, z: 0 } },
                  { name: 'projects_zone', offset: { x: 3, y: 2, z: 0 } },
                  { name: 'workexperience_zone', offset: { x: -3, y: -2, z: 0 } },
                  { name: 'contact_zone', offset: { x: 3, y: -2, z: 0 } }
                ]
                
                zones.forEach(zone => {
                  const zoneGeometry = new THREE.BoxGeometry(2, 1.5, 1)
                  const zoneMaterial = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0,
                    visible: false 
                  })
                  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial)
                  
                  zoneMesh.position.set(
                    basePosition.x + zone.offset.x,
                    basePosition.y + zone.offset.y,
                    basePosition.z + zone.offset.z
                  )
                  zoneMesh.name = zone.name
                  zoneMesh.visible = false
                  zoneMesh.userData.initialScale = new THREE.Vector3(1, 1, 1)
                  
                  const hitbox = createHitbox(zoneMesh)
                  scene.add(hitbox)
                  raycasterObjects.push(hitbox)
                  hitboxToObjectMap.set(hitbox, zoneMesh)
                  
                  scene.add(zoneMesh)
                  console.log(`📍 Created interactive zone: ${zone.name} at position:`, zoneMesh.position)
                })
              }
            }
            
            // Make all other models visible except text elements
            if (child.isMesh && child.material && child.name !== "Text") {
              // Don't override visibility if we already set it to false for text
              if (child.visible !== false) {
                child.visible = true
              }
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
  
  // Create interactive buttons as 3D objects - moved to new Y position
  const buttonData = [
    { name: 'aboutme_Raycaster_Pointer_Hover', position: [33, -78, 10], color: 0xff69b4 },     // Y changed from -43 to -78
    { name: 'projects_Raycaster_Pointer_Hover', position: [38, -78, 10], color: 0x69b4ff },    // Y changed from -43 to -78
    { name: 'workexperience_Raycaster_Pointer_Hover', position: [33, -80, 10], color: 0xb4ff69 }, // Y changed from -45 to -80
    { name: 'contact_Raycaster_Pointer_Hover', position: [38, -80, 10], color: 0xffb469 }      // Y changed from -45 to -80
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

function createScrollHitbox(scrollObject) {
  // Create a larger, more accessible hitbox for the scroll
  const hitboxGeometry = new THREE.BoxGeometry(3, 3, 3) // Larger than default
  const hitboxMaterial = new THREE.MeshBasicMaterial({ 
    transparent: true, 
    opacity: 0,
    visible: false 
  })
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial)
  
  // Position the hitbox at the scroll's world position
  const worldPosition = new THREE.Vector3()
  scrollObject.getWorldPosition(worldPosition)
  hitbox.position.copy(worldPosition)
  
  hitbox.userData.originalObject = scrollObject
  hitbox.name = 'scroll_hitbox'
  
  console.log('📦 Created scroll hitbox at position:', hitbox.position)
  
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
class FireflySystem {
  constructor(count = 15) { // Reduced from default
    this.count = count
    this.positions = new Float32Array(count * 3)
    this.velocities = []
    this.blinkTimers = new Float32Array(count)
    
    // Use instanced mesh for better performance
    const geometry = new THREE.SphereGeometry(0.06, 6, 6) // Reduced segments
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.8
    })
    
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count)
    this.instancedMesh.frustumCulled = true
    
    // Initialize fireflies
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      this.positions[i3] = 35 + (Math.random() - 0.5) * 20
      this.positions[i3 + 1] = -55 + Math.random() * 5
      this.positions[i3 + 2] = 10 + (Math.random() - 0.5) * 20
      
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.01, // Reduced movement
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.01
      ))
      
      this.blinkTimers[i] = Math.random() * Math.PI * 2
    }
  }

  update() {
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3(35, -55, 10)
    
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const position = new THREE.Vector3(
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2]
      )
      
      position.add(this.velocities[i])
      
      // Simplified attraction
      if (position.distanceTo(center) > 15) {
        const attraction = center.clone().sub(position).normalize().multiplyScalar(0.0001)
        this.velocities[i].add(attraction)
      }
      
      // Random direction change (less frequent)
      if (Math.random() < 0.01) {
        this.velocities[i].multiplyScalar(-1)
      }
      
      this.positions[i3] = position.x
      this.positions[i3 + 1] = position.y
      this.positions[i3 + 2] = position.z
      
      // Update blink timer
      this.blinkTimers[i] += 0.02 // Reduced frequency
      
      // Set instance matrix
      matrix.setPosition(position)
      this.instancedMesh.setMatrixAt(i, matrix)
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true
  }

  getMesh() {
    return this.instancedMesh
  }
}

// Cherry Blossom System
class CherryBlossom {
  constructor() {
    // Use simpler geometry and shared materials
    const geometry = new THREE.PlaneGeometry(0.3, 0.3)
    const material = CherryBlossom.getSharedMaterial()
    this.mesh = new THREE.Mesh(geometry, material)
    
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 10,
      (Math.random() - 0.5) * 100
    )
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      -0.05 - Math.random() * 0.03,
      (Math.random() - 0.5) * 0.02
    )
    this.rotationSpeed = (Math.random() - 0.5) * 0.02
    this.blinkTimer = Math.random() * Math.PI * 2
    
    this.mesh.position.copy(this.position)
    this.mesh.frustumCulled = true // Enable frustum culling
  }

  static getSharedMaterial() {
    if (!CherryBlossom.sharedMaterial) {
      CherryBlossom.sharedMaterial = new THREE.MeshBasicMaterial({
        color: 0xffb6c1,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    }
    return CherryBlossom.sharedMaterial
  }

  update() {
    this.mesh.position.add(this.velocity)
    this.mesh.rotation.z += this.rotationSpeed
    
    // Optimize blinking - update less frequently
    this.blinkTimer += 0.03 // Reduced from 0.1
    const shimmer = 0.5 + 0.5 * Math.sin(this.blinkTimer)
    const blink = Math.sin(this.blinkTimer * 0.5) > 0.3 ? 1 : 0.3
    this.mesh.material.opacity = shimmer * blink * 0.6 // Reduced opacity for performance
    
    if (this.mesh.position.y < -10) this.reset()
  }

  reset() {
    this.mesh.position.set(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 10,
      (Math.random() - 0.5) * 100
    )
    this.velocity.set(
      (Math.random() - 0.5) * 0.02,
      -0.05 - Math.random() * 0.03,
      (Math.random() - 0.5) * 0.02
    )
  }
}

// Create particles, fireflies, and cherry blossoms
const particles = []
for (let i = 0; i < 50; i++) {
  const particle = new FallingParticle()
  particles.push(particle)
  scene.add(particle.mesh)
}

const fireflySystem = new FireflySystem(80) // Increased from 35 to 80
scene.add(fireflySystem.getMesh())

const cherryBlossoms = []
for (let i = 0; i < 100; i++) {  // Added cherry blossoms
  const cherryBlossom = new CherryBlossom()
  cherryBlossoms.push(cherryBlossom)
  scene.add(cherryBlossom.mesh)
}

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
// Limit vertical rotation - prevent looking below the model
controls.maxPolarAngle = Math.PI / 2 // 90 degrees (horizontal)
controls.minPolarAngle = 0 // 0 degrees (straight up)
// Increase zoom out distance for better view
controls.maxDistance = 100 // Increased from 50 to 100
controls.minDistance = 10  // Set minimum distance to prevent getting too close

// Start with top view - adjusted for new model positioning
camera.position.set(35, 35, 10) // Keep camera above the model
controls.target.set(35, -35, 10) // Target moved to new model position Y -50
controls.update()

// Smooth transition to front view after loading - ADJUSTED HEIGHT AND ZOOM
function transitionToFrontView() {
  gsap.to(camera.position, {
    x: 35,    // Keep X position
    y: -20,   // Keep camera position
    z: 60,    // Keep zoom
    duration: 3,
    ease: "power2.inOut",
    onUpdate: () => {
      controls.update()
    }
  })
  
  // Update target to new model position
  gsap.to(controls.target, {
    x: 35,    // Keep X position
    y: -50,   // Target moved to new model position Y -50
    z: 10,
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
  main: document.querySelector(".modal.main"),
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
  if (currentIntersects.length > 0 && !isModalOpen) {
    const intersectedObject = currentIntersects[0].object
    const originalObject = hitboxToObjectMap.get(intersectedObject)
    
    if (originalObject) {
      const objectName = originalObject.name.toLowerCase()
      console.log('🖱️ Clicked on:', originalObject.name)
      console.log('📍 Object position:', originalObject.position)
      
      // Handle scroll click - open main page (multiple ways to detect scroll)
      if (objectName.includes("scroll") || 
          originalObject.userData.isScrollObject ||
          objectName === "scroll_scroll_0") {
        console.log('📜 Opening main page from scroll')
        showModal(modals.main)
      } else if (objectName.includes("about")) {
        console.log('Opening about modal')
        showModal(modals.about)
      } else if (objectName.includes("project")) {
        console.log('Opening projects modal')
        showModal(modals.projects)
      } else if (objectName.includes("work") || objectName.includes("experience")) {
        console.log('Opening work modal')
        showModal(modals.work)
      } else if (objectName.includes("contact")) {
        console.log('Opening contact modal')
        showModal(modals.contact)
      } else {
        console.log('⚠️ Unknown interactive object:', originalObject.name)
        // Try opening main modal as fallback for any unrecognized interactive object
        showModal(modals.main)
      }
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  const object = hitboxToObjectMap.get(objectHitbox)
  
  if (!object) return
  
  gsap.killTweensOf(object.scale)
  
  // Special handling for scroll object
  if (object.userData.isScrollObject) {
    if (isHovering) {
      // Apply pink glow material
      object.material = object.userData.glowMaterial
      
      // Scale animation
      gsap.to(object.scale, {
        x: object.userData.initialScale.x * 1.15,
        y: object.userData.initialScale.y * 1.15,
        z: object.userData.initialScale.z * 1.15,
        duration: 0.3,
        ease: "back.out(2)"
      })
      
      // Animate the glow intensity
      gsap.to(object.material, {
        emissiveIntensity: 0.8,
        duration: 0.3,
        ease: "power2.out"
      })
      
      console.log('📜 Scroll hover ON - Pink glow activated')
    } else {
      // Restore original material
      object.material = object.userData.originalMaterial
      
      // Scale back to normal
      gsap.to(object.scale, {
        x: object.userData.initialScale.x,
        y: object.userData.initialScale.y,
        z: object.userData.initialScale.z,
        duration: 0.3,
        ease: "back.out(2)"
      })
      
      console.log('📜 Scroll hover OFF - Original material restored')
    }
  } else {
    // Regular hover animation for other objects
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
}

window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / sizes.width) * 2 - 1
  pointer.y = -(e.clientY / sizes.height) * 2 + 1
})

window.addEventListener("click", handleRaycasterInteraction)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  // Update particles, fireflies, and cherry blossoms
  particles.forEach(particle => particle.update())
  fireflySystem.update()
  cherryBlossoms.forEach(cherryBlossom => cherryBlossom.update())
  
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(raycasterObjects)
    
    if (intersects.length > 0) {
      const hitObject = intersects[0].object
      const originalObject = hitboxToObjectMap.get(hitObject)
      
      if (currentHoveredObject !== hitObject) {
        if (currentHoveredObject) playHoverAnimation(currentHoveredObject, false)
        currentHoveredObject = hitObject
        playHoverAnimation(currentHoveredObject, true)
        document.body.style.cursor = "pointer"
        
        // Debug log for scroll detection
        if (originalObject && originalObject.name.includes("Scroll")) {
          console.log('🎯 Hovering over scroll object:', originalObject.name)
        }
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