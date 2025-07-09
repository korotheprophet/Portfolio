# 🌸 Interactive 3D Portfolio - Jedidiah Rollinas

A stunning, interactive 3D portfolio website featuring cherry blossom animations, ambient audio, and immersive Three.js experiences.

## 🎯 Overview

This portfolio showcases a unique blend of traditional Japanese aesthetics with modern web technologies. Built with Three.js, it features a 3D interactive environment with floating particles, fireflies, and smooth animations that create an engaging user experience.

## ✨ Features

### 🎨 Visual Elements
- **3D Interactive Environment**: Built with Three.js for immersive navigation
- **Cherry Blossom Animation**: Falling petals during loading and throughout the experience
- **Particle Systems**: Floating particles and fireflies for ambient atmosphere
- **Neon Glow Effects**: Pink-themed lighting and materials
- **Glass-morphism UI**: Modern translucent interface elements
- **Smooth Transitions**: GSAP-powered animations and camera movements

### 🎵 Audio Experience
- **Background Music**: Auto-playing ambient soundtrack
- **Audio Controls**: Minimalist play/pause toggle
- **Volume Management**: Pre-configured at 30% for optimal experience
- **Browser Compatibility**: Handles autoplay restrictions gracefully

### 🖥️ User Interface
- **Loading Screen**: Animated cherry blossoms with scroll-style enter button
- **Modal System**: File manager-style windows for different sections
- **Responsive Design**: Optimized for desktop and mobile devices
- **Interactive Elements**: Hover effects and click animations
- **Custom Fonts**: NinjaNaruto font for thematic consistency

### 📱 Navigation
- **Mouse Controls**: Left/right click and scroll wheel navigation
- **Touch Support**: One and two-finger gestures for mobile
- **Camera Limits**: Restricted vertical rotation and zoom distance
- **Smooth Transitions**: Animated camera movements between views

## 🏗️ Project Structure

```
portfolio/
├── audio/                          # Audio files and utilities
│   ├── Regina Spektor - While My Guitar Gently Weeps.mp3
│   ├── convert-audio.sh           # Audio conversion script
│   └── README.md                  # Audio setup instructions
├── font/                          # Custom fonts
│   ├── NinjaNaruto-YOn4.ttf      # Primary theme font
│   ├── Zyukiharu-*.ttf/.otf      # Additional fonts
│   └── misc/                      # Font documentation
├── image/                         # Images and assets
│   └── jedi.jpg                   # Profile photo
├── public/                        # Public assets
│   └── models/                    # 3D model files
│       ├── PortfolioV5.glb       # Main 3D scene
│       └── Portfolio*.glb        # Previous versions
├── resume/                        # Resume files
│   └── Resume.pdf                 # Downloadable resume
├── src/                          # Source code
│   ├── main.js                   # Main JavaScript logic
│   └── style.scss                # Styling and animations
├── index.html                    # Main HTML file
├── loading.css                   # Loading screen styles
├── loading.html                  # Loading screen template
├── loading.js                    # Loading functionality
├── package.json                  # Dependencies
└── package-lock.json            # Dependency lock file
```

## 🛠️ Technologies Used

### Core Technologies
- **HTML5**: Semantic markup and structure
- **CSS3/SCSS**: Advanced styling with animations
- **JavaScript ES6+**: Modern JavaScript features
- **Vite**: Build tool and development server

### 3D Graphics & Animation
- **Three.js**: 3D rendering and scene management
- **GSAP**: High-performance animations
- **GLTFLoader**: 3D model loading
- **OrbitControls**: Camera navigation

### Audio
- **Web Audio API**: Background music playback
- **HTML5 Audio**: Cross-browser audio support

### Fonts & Icons
- **Custom Fonts**: NinjaNaruto, Zyukiharu
- **SVG Icons**: Social media and UI icons
- **Google Fonts**: Inter font family

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd portfolio

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Server
```bash
# Start local development server
npm run dev
# Opens at http://localhost:5173
```

### Production Build
```bash
# Create optimized production build
npm run build
# Output in dist/ directory

# Preview production build
npm run preview
```

## 🎵 Audio Setup

### Adding Background Music
1. Place your audio file in the `audio/` directory
2. Rename to match the source in `index.html`
3. Supported formats: MP3, OGG, WAV

### Audio Conversion
Use the provided script to optimize audio files:
```bash
cd audio
./convert-audio.sh your-music-file.wav
```

### Audio Configuration
- **Volume**: Set to 30% by default
- **Loop**: Enabled for continuous playback
- **Autoplay**: Attempts to start on page load
- **Controls**: Minimalist play/pause button

## 🎨 Customization Guide

### Color Scheme
Primary colors used throughout the project:
- **Pink**: `#ff69b4` (Hot Pink)
- **Dark Pink**: `#ff1493` (Deep Pink)
- **Background**: `#343434` (Dark Gray)
- **Text**: `#ccc` (Light Gray)

### Modifying Content

#### Personal Information
Edit in `index.html`:
```html
<!-- About Modal -->
<h1>Your Name</h1>
<p>Your bio description...</p>

<!-- Contact Links -->
<div class="contact-icon" onclick="window.open('your-linkedin-url', '_blank')">
```

#### Resume
Replace `resume/Resume.pdf` with your resume file.

#### Profile Photo
Replace `image/jedi.jpg` with your photo (recommended: 400x400px).

### 3D Model Customization
The 3D scene uses `public/models/PortfolioV5.glb`. To modify:
1. Create/edit your 3D model in Blender
2. Export as GLB format
3. Replace the existing file
4. Update object names in `main.js` if needed

### Animation Timing
Modify timing in `main.js`:
```javascript
// Loading screen duration
setTimeout(() => {
  // Change 5000 to desired milliseconds
}, 5000);

// Camera transition speed
gsap.to(camera.position, {
  duration: 3, // Change duration
  ease: "power2.inOut"
});
```

## 🔧 Configuration Options

### Camera Settings
```javascript
// In main.js
controls.maxPolarAngle = Math.PI / 2; // Vertical limit
controls.minPolarAngle = 0;           // Vertical limit
controls.maxDistance = 50;            // Zoom out limit
```

### Particle System
```javascript
// Adjust particle count
for (let i = 0; i < 50; i++) {        // Falling particles
for (let i = 0; i < 35; i++) {        // Fireflies
```

### Audio Settings
```javascript
// Volume control (0.0 to 1.0)
audio.volume = 0.3;

// Loop setting
<audio id="backgroundAudio" loop>
```

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: 88+ (Recommended)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Required Features
- WebGL 2.0 support
- ES6+ JavaScript support
- CSS Grid and Flexbox
- HTML5 Audio API

### Mobile Optimization
- Touch gesture support
- Responsive design breakpoints
- Optimized particle counts
- Reduced animation complexity

## 🎯 Performance Optimization

### 3D Rendering
- **Frustum Culling**: Enabled for off-screen objects
- **LOD System**: Multiple model versions for distance
- **Texture Optimization**: Compressed textures
- **Particle Limits**: Controlled particle counts

### Loading Optimization
- **Asset Preloading**: Critical resources loaded first
- **Progressive Loading**: Non-critical assets loaded after
- **Compression**: Gzip compression for text assets
- **Caching**: Browser caching for static assets

### Audio Optimization
- **Bitrate**: 128kbps for web delivery
- **Format**: MP3 primary, OGG fallback
- **Compression**: Optimized file sizes
- **Lazy Loading**: Audio loads after user interaction

## 🐛 Troubleshooting

### Common Issues

#### Audio Not Playing
```javascript
// Check browser autoplay policy
audio.play().catch(e => {
  console.log('Autoplay blocked:', e);
  // Audio will play after user interaction
});
```

#### 3D Model Not Loading
1. Check file path in `main.js`
2. Verify GLB file format
3. Check browser console for errors
4. Ensure WebGL is enabled

#### Performance Issues
1. Reduce particle counts in `main.js`
2. Lower texture quality in 3D models
3. Disable shadows if needed
4. Check GPU compatibility

#### Mobile Touch Issues
1. Verify touch event listeners
2. Check viewport meta tag
3. Test gesture recognition
4. Validate responsive breakpoints

### Debug Mode
Enable debug logging:
```javascript
// Add to main.js
console.log('Debug mode enabled');
scene.add(new THREE.AxesHelper(5)); // Show axes
```

## 🚀 Deployment

### Static Hosting
Compatible with:
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **GitHub Pages**: Free hosting option
- **AWS S3**: Scalable cloud hosting

### Build Process
```bash
# Production build
npm run build

# Deploy dist/ folder contents
# Ensure all paths are relative
# Configure server for SPA routing
```

### Environment Variables
Create `.env` file for configuration:
```env
VITE_AUDIO_VOLUME=0.3
VITE_PARTICLE_COUNT=50
VITE_DEBUG_MODE=false
```

## 📄 License & Credits

### Dependencies
- **Three.js**: MIT License
- **GSAP**: Commercial license required for commercial use
- **Vite**: MIT License

### Assets
- **Fonts**: Custom fonts with appropriate licenses
- **Audio**: Ensure proper licensing for background music
- **3D Models**: Original creations or properly licensed

### Attribution
When using this template:
1. Credit original creator
2. Maintain license notices
3. Update personal information
4. Replace copyrighted assets

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description

### Code Standards
- **JavaScript**: ES6+ with consistent formatting
- **CSS**: SCSS with BEM methodology
- **HTML**: Semantic markup
- **Comments**: Document complex logic

### Testing
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks
- Accessibility compliance

## 📄 License

**Code**: All rights reserved. This code is proprietary and may not be copied or distributed.

**3D Models**: Based on modified third-party assets. Original models are freely available for use in other projects.

## 📞 Support & Contact

### Contact Information
- **Developer**: Jedidiah T. Rollinas
- **Email**: jedidiahrollinas8245@gmail.com
- **LinkedIn**: [Profile Link](https://www.linkedin.com/in/jedidiah-rollinas)

---

*Built with ❤️ and lots of ☕ by Jedidiah T. Rollinas*