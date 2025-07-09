import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export function createGLTFLoader() {
  const loader = new GLTFLoader()
  
  try {
    const dracoLoader = new DRACOLoader()
    
    // Try multiple CDN sources
    const dracoSources = [
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
      'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/libs/draco/',
      'https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/'
    ]
    
    dracoLoader.setDecoderPath(dracoSources[0])
    dracoLoader.preload()
    
    loader.setDRACOLoader(dracoLoader)
    console.log('DRACOLoader configured successfully')
    
  } catch (error) {
    console.warn('Failed to setup DRACOLoader:', error)
  }
  
  return loader
}