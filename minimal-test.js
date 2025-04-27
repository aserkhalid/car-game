// Minimal Three.js Test

// 1. Create scene with solid color background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0000ff); // Pure blue

// 2. Create camera with fixed position
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// 3. Create renderer with explicit size
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Add a simple cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. Animation loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();

console.log('Minimal test running - you should see:');
console.log('- Solid blue background');
console.log('- Rotating red cube');
