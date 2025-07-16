import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createGLTFLoader } from './src/loaders.js'
import './style.scss'

const raycasterObjects = []
const hitboxToObjectMap = new Map()
const scene = new THREE.Scene()
scene.background = new THREE.Color("#141414")

// Use the custom loader
const loader = createGLTFLoader()

// Alternative approach: Load without Draco first, then try with Draco
async function loadModel() {
  try {
    console.log('Attempting to load model...')
    
    const glb = await new Promise((resolve, reject) => {
      loader.load(
        "/models/PortfolioV5.glb",
        resolve,
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
        },
        reject
      )
    })
    
    console.log('Model loaded successfully')
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
    
  } catch (error) {
    console.error('Model loading failed:', error)
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `
    errorDiv.innerHTML = `
      <h3>Model Loading Error</h3>
      <p>The 3D model failed to load. This might be due to:</p>
      <ul style="text-align: left; margin: 10px 0;">
        <li>Network connectivity issues</li>
        <li>Model compression format compatibility</li>
        <li>File path or server issues</li>
      </ul>
      <button onclick="location.reload()" style="
        background: #ff69b4;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">Retry</button>
    `
    document.body.appendChild(errorDiv)
  }
}

// Load the model
loadModel()

function createHitbox(object) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  const geometry = new THREE.BoxGeometry(size.x * 1.5, size.y * 1.5, size.z * 1.5)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0,
    visible: false 
  })
  const hitbox = new THREE.Mesh(geometry, material)
  hitbox.position.copy(center)
  hitbox.userData.originalObject = object
  
  return hitbox
}

// Scene setup
const canvas = document.querySelector("#experience-canvas")
const sizes = { width: window.innerWidth, height: window.innerHeight }

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 200)
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: false, // Disable for better performance
  powerPreference: "high-performance",
  stencil: false,
  depth: true
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = false // Disable shadows for performance
renderer.outputColorSpace = THREE.SRGBColorSpace

// Enable performance optimizations
renderer.info.autoReset = false

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 5)
scene.add(directionalLight)

// Falling Particles System
class CherryBlossom {
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
    
    this.blinkTimer += 0.05
    this.mesh.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(this.blinkTimer))
    
    if (this.mesh.position.y < -10) {
      this.reset()
    }
  }
}

// Firefly System
class FireflySystem {
  constructor(count) {
    this.fireflies = []
    for (let i = 0; i < count; i++) {
      this.fireflies.push(new Firefly())
    }
  }

  getMesh() {
    const group = new THREE.Group()
    this.fireflies.forEach(firefly => {
      group.add(firefly.mesh)
      group.add(firefly.light)
    })
    return group
  }

  update() {
    this.fireflies.forEach(firefly => firefly.update())
  }
}

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
    
    if (Math.random() < 0.02) {
      this.velocity.multiplyScalar(-1)
    }
    
    this.blinkTimer += 0.03
    const intensity = 0.3 + 0.7 * Math.abs(Math.sin(this.blinkTimer))
    this.mesh.material.opacity = intensity
    this.light.intensity = intensity * 2
    
    this.mesh.position.copy(this.position)
    this.light.position.copy(this.position)
  }
}

// Adaptive Quality Settings
class AdaptiveQuality {
  constructor() {
    this.quality = this.detectDeviceCapability()
    this.applyQualitySettings()
  }
  
  detectDeviceCapability() {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) return 'low'
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
    
    // Detect mobile devices
    if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      return 'low'
    }
    
    // Detect integrated graphics
    if (renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno')) {
      return 'medium'
    }
    
    return 'high'
  }
  
  applyQualitySettings() {
    switch (this.quality) {
      case 'low':
        this.maxCherryBlossoms = 20
        this.maxFireflies = 5
        this.updateInterval = 3
        break
      case 'medium':
        this.maxCherryBlossoms = 35
        this.maxFireflies = 10
        this.updateInterval = 2
        break
      case 'high':
        this.maxCherryBlossoms = 50
        this.maxFireflies = 15
        this.updateInterval = 1
        break
    }
  }
}

const adaptiveQuality = new AdaptiveQuality()

// Reduce particle counts for better performance
const cherryBlossoms = []
const maxCherryBlossoms = window.innerWidth < 768 ? 30 : 50 // Reduced from higher numbers

const fireflies = []
const maxFireflies = window.innerWidth < 768 ? 8 : 15 // Reduced from higher numbers

// Initialize with reduced counts
for (let i = 0; i < maxCherryBlossoms; i++) {
  cherryBlossoms.push(new CherryBlossom())
  scene.add(cherryBlossoms[i].mesh)
}

// Use the new FireflySystem
const fireflySystem = new FireflySystem(maxFireflies)
scene.add(fireflySystem.getMesh())

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
  const startPos = camera.position.clone()
  const endPos = new THREE.Vector3(10.5, 2, 25) // Changed Y from 15 to 2 for bottom center
  const startTarget = controls.target.clone()
  const endTarget = new THREE.Vector3(10.5, 2, 10) // Changed Y from 9 to 2 for bottom center
  
  let progress = 0
  const duration = 3000
  const startTime = Date.now()
  
  function animate() {
    const elapsed = Date.now() - startTime
    progress = Math.min(elapsed / duration, 1)
    
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    camera.position.lerpVectors(startPos, endPos, easeProgress)
    controls.target.lerpVectors(startTarget, endTarget, easeProgress)
    controls.update()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  animate()
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
})

// Modal functionality
const modals = {
  aboutme: document.querySelector(".aboutme-modal"),
  projects: document.querySelector(".projects-modal"),
  workexperience: document.querySelector(".workexperience-modal"),
  contact: document.querySelector(".contact-modal")
}

const overlay = document.querySelector(".overlay")
let isModalOpen = false

const showModal = (modal) => {
  if (modal && !isModalOpen) {
    modal.style.display = "flex"
    overlay.style.display = "block"
    isModalOpen = true
  }
}

const hideModal = (modal) => {
  if (modal && isModalOpen) {
    const flash = modal.querySelector('.modal-flash')
    if (flash) {
      flash.classList.add('active')
      setTimeout(() => {
        modal.style.display = "none"
        overlay.style.display = "none"
        isModalOpen = false
        flash.classList.remove('active')
      }, 120)
    } else {
      modal.style.display = "none"
      overlay.style.display = "none"
      isModalOpen = false
    }
  }
}

overlay.addEventListener("click", () => {
  Object.values(modals).forEach(modal => {
    if (modal && modal.style.display === "flex") {
      hideModal(modal)
    }
  })
})

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal")
    if (modal) {
      hideModal(modal)
    }
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
      
      if (objectName.includes("aboutme")) {
        showModal(modals.aboutme)
      } else if (objectName.includes("projects")) {
        showModal(modals.projects)
      } else if (objectName.includes("workexperience")) {
        showModal(modals.workexperience)
      } else if (objectName.includes("contact")) {
        showModal(modals.contact)
      }
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  const originalObject = hitboxToObjectMap.get(objectHitbox)
  if (originalObject) {
    if (isHovering) {
      originalObject.scale.set(
        originalObject.userData.initialScale.x * 1.1,
        originalObject.userData.initialScale.y * 1.1,
        originalObject.userData.initialScale.z * 1.1
      )
    } else {
      originalObject.scale.copy(originalObject.userData.initialScale)
    }
  }
}

canvas.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / sizes.width) * 2 - 1
  pointer.y = -(event.clientY / sizes.height) * 2 + 1
})

let lastTime = 0
const targetFPS = 60
const frameInterval = 1000 / targetFPS

function updateCamera() {
  controls.update()
}

class PerformanceMonitor {
  constructor() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 60
  }
  
  update() {
    this.frameCount++
    const currentTime = performance.now()
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastTime = currentTime
      
      // Auto-adjust quality based on FPS
      if (this.fps < 30) {
        this.reduceQuality()
      }
    }
  }
  
  reduceQuality() {
    // Reduce particle counts if FPS is too low
    if (cherryBlossoms.length > 20) {
      const toRemove = cherryBlossoms.splice(20)
      toRemove.forEach(blossom => scene.remove(blossom.mesh))
    }
  }
}

const performanceMonitor = new PerformanceMonitor()

function animate(currentTime) {
  requestAnimationFrame(animate)
  
  // Throttle frame rate
  if (currentTime - lastTime < frameInterval) {
    return
  }
  lastTime = currentTime
  
  // Update particles less frequently
  if (Math.floor(currentTime / 100) % 2 === 0) { // Every 200ms
    cherryBlossoms.forEach(blossom => blossom.update())
  }
  
  if (Math.floor(currentTime / 50) % 2 === 0) { // Every 100ms
    fireflySystem.update()
  }
  
  // Always update camera and render
  updateCamera()
  renderer.render(scene, camera)
  
  // Raycasting
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(raycasterObjects)
  
  if (intersects.length > 0) {
    if (currentHoveredObject !== intersects[0].object) {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false)
      }
      currentHoveredObject = intersects[0].object
      playHoverAnimation(currentHoveredObject, true)
    }
  } else {
    if (currentHoveredObject) {
      playHoverAnimation(currentHoveredObject, false)
      currentHoveredObject = null
    }
  }
  
  currentIntersects = intersects
  
  // Handle raycaster interaction
  handleRaycasterInteraction()
  
  // Update performance monitor
  performanceMonitor.update()
}

animate()