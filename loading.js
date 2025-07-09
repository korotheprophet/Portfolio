// Cherry blossom petal animation
function createPetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';
    
    // Random starting position
    petal.style.left = Math.random() * 100 + 'vw';
    
    // Random animation duration and delay
    const duration = Math.random() * 3 + 4; // 4-7 seconds
    const delay = Math.random() * 2; // 0-2 seconds delay
    
    petal.style.animationDuration = duration + 's';
    petal.style.animationDelay = delay + 's';
    
    // Random size variation
    const size = Math.random() * 8 + 8; // 8-16px
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    
    document.getElementById('cherry-blossoms').appendChild(petal);
    
    // Remove petal after animation
    setTimeout(() => {
        if (petal.parentNode) {
            petal.parentNode.removeChild(petal);
        }
    }, (duration + delay) * 1000);
}

// Create petals continuously
function startPetalAnimation() {
    setInterval(createPetal, 300); // Create new petal every 300ms
}

// Simulate loading
function simulateLoading() {
    // Step 1: Loading text (already visible)
    setTimeout(() => {
        // Step 2: Hide loading text, show instruction text
        document.getElementById('loading-text').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-text').textContent = 'Click and drag to explore';
            document.getElementById('loading-text').style.opacity = '1';
            setTimeout(() => {
                // Step 3: Hide instruction text, show enter button
                document.getElementById('loading-text').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('enter-button').classList.remove('hidden');
                }, 500);
            }, 3000);
        }, 500);
    }, 3000);
}

// Enter button functionality
document.getElementById('enter-button').addEventListener('click', () => {
    document.getElementById('loading-screen').style.opacity = '0';
    document.getElementById('loading-screen').style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
        window.location.href = 'index.html'; // Navigate to main portfolio
    }, 1000);
});

// Start animations when page loads
window.addEventListener('load', () => {
    startPetalAnimation();
    simulateLoading();
});