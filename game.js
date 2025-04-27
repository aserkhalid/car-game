// Add at the VERY START of game.js
console.log('Three.js version:', THREE.REVISION);

if (!THREE) {
    alert('Three.js failed to load! Check browser console (F12)');
    throw new Error('Three.js not loaded');
}

try {
    console.log('Three.js loaders available');
} catch (err) {
    console.error('Loader error:', err);
    alert('Missing Three.js components - ensure three.min.js includes loaders');
}

// Procedural 3D Game Environment

// Main variables
let scene, camera, renderer, car, environment;
const keys = {};
const carPhysics = {
    speed: 0,
    maxSpeed: 0.5,
    acceleration: 0.05,
    deceleration: 0.94,
    turnSpeed: 0.04,
    direction: new THREE.Vector3()
};
const obstacles = [];
let licensePlate;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 150);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('keydown', (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
            keys[e.key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
            keys[e.key] = false;
        }
    });

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(100, 100, 50);
    directional.castShadow = true;
    scene.add(directional);

    // Create procedural car
    createProceduralCar();
    
    // Create procedural environment
    createProceduralEnvironment();

    // Start animation
    animate();
}

function createProceduralCar() {
    car = new THREE.Group();
    
    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.2, 5),
        new THREE.MeshPhongMaterial({ 
            color: 0xFF4136,
            flatShading: true,
            shininess: 100 
        })
    );
    body.position.y = 1.2;
    car.add(body);
    
    // Cab
    const cab = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.8, 2),
        new THREE.MeshPhongMaterial({ color: 0x222222 })
    );
    cab.position.set(0, 2, 0.5);
    car.add(cab);
    
    // Windows
    const windowGeo = new THREE.BoxGeometry(2.6, 0.6, 1.8);
    const windowMat = new THREE.MeshPhongMaterial({ 
        color: 0x87CEEB, 
        transparent: true, 
        opacity: 0.7,
        refractionRatio: 0.5
    });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.set(0, 2.2, 0.5);
    car.add(windows);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32);
    const wheelMat = new THREE.MeshPhongMaterial({ 
        color: 0x111111,
        flatShading: true
    });
    
    const positions = [
        [1.4, 0.6, 2], [1.4, 0.6, -1.5],
        [-1.4, 0.6, 2], [-1.4, 0.6, -1.5]
    ];
    
    positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI/2;
        wheel.position.set(...pos);
        
        // Wheel hubs
        const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.41, 12);
        const hubMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.z = Math.PI/2;
        wheel.add(hub);
        
        car.add(wheel);
    });
    
    // Headlights
    const headlightGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headlightMat = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFAA,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    
    const headlights = [
        new THREE.Mesh(headlightGeo, headlightMat),
        new THREE.Mesh(headlightGeo, headlightMat)
    ];
    headlights[0].position.set(1, 1.8, 2.2);
    headlights[1].position.set(-1, 1.8, 2.2);
    car.add(...headlights);
    
    // License plate
    const plateGeo = new THREE.PlaneGeometry(1, 0.3);
    const plateMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    licensePlate = new THREE.Mesh(plateGeo, plateMat);
    licensePlate.position.set(0, 1, -2.5);
    licensePlate.scale.x = -1;  // Mirror the plate geometry
    
    // Create canvas texture for text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = 'Bold 48px Arial';
    ctx.textAlign = 'center';
    // Draw text normally (not mirrored)
    ctx.fillText('ALASER', canvas.width/2, canvas.height/2 + 16);
    
    const plateTexture = new THREE.CanvasTexture(canvas);
    licensePlate.material.map = plateTexture;
    
    car.add(licensePlate);
    
    scene.add(car);
}

function createProceduralEnvironment() {
    environment = new THREE.Group();
    
    // Detailed ground with texture
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500, 50, 50),
        new THREE.MeshStandardMaterial({ 
            color: 0x3D9970,
            roughness: 0.8,
            metalness: 0.1
        })
    );
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    environment.add(ground);
    
    // Terrain features
    const rockGeo = new THREE.DodecahedronGeometry(3, 1);
    const rockMat = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.3
    });
    
    for (let i = 0; i < 50; i++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            (Math.random() - 0.5) * 400,
            0,
            (Math.random() - 0.5) * 400
        );
        rock.scale.setScalar(Math.random() * 2 + 0.5);
        rock.castShadow = true;
        rock.receiveShadow = true;
        environment.add(rock);
    }
    
    // Detailed trees
    const treeTrunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.9
    });
    
    const treeTopGeo = new THREE.ConeGeometry(3, 8, 5);
    const treeTopMat = new THREE.MeshStandardMaterial({ 
        color: 0x2ECC40,
        roughness: 0.5
    });
    
    for (let i = 0; i < 100; i++) {
        const tree = new THREE.Group();
        
        const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        const top = new THREE.Mesh(treeTopGeo, treeTopMat);
        top.position.y = 7;
        top.castShadow = true;
        
        tree.add(trunk);
        tree.add(top);
        tree.position.set(
            (Math.random() - 0.5) * 400,
            0,
            (Math.random() - 0.5) * 400
        );
        
        if (Math.abs(tree.position.x) < 30) tree.position.x += 60;
        if (Math.abs(tree.position.z) < 30) tree.position.z += 60;
        
        environment.add(tree);
    }
    
    // Add collision boxes to obstacles
    obstacles.length = 0; // Clear previous
    
    scene.traverse(object => {
        if (object.isMesh && (object !== ground && object !== car)) {
            obstacles.push({
                mesh: object,
                box: new THREE.Box3().setFromObject(object)
            });
        }
    });
    
    scene.add(environment);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Car controls
    if (keys['w'] || keys['ArrowUp']) {
        carPhysics.speed = Math.min(carPhysics.speed + carPhysics.acceleration, carPhysics.maxSpeed);
    } else if (keys['s'] || keys['ArrowDown']) {
        carPhysics.speed = Math.max(carPhysics.speed - carPhysics.acceleration, -carPhysics.maxSpeed/2);
    } else {
        carPhysics.speed *= carPhysics.deceleration;
    }
    
    if (keys['a'] || keys['ArrowLeft']) {
        // Reverse steering direction when moving backward
        const turnDirection = carPhysics.speed > 0 ? 1 : -1;
        car.rotation.y += carPhysics.turnSpeed * turnDirection;
    }
    if (keys['d'] || keys['ArrowRight']) {
        // Reverse steering direction when moving backward
        const turnDirection = carPhysics.speed > 0 ? 1 : -1;
        car.rotation.y -= carPhysics.turnSpeed * turnDirection;
    }
    
    // Move car
    carPhysics.direction.set(0, 0, 1).applyQuaternion(car.quaternion);
    car.position.add(carPhysics.direction.multiplyScalar(carPhysics.speed));
    
    // Collision detection
    const carBox = new THREE.Box3().setFromObject(car);
    const carSphere = new THREE.Sphere();
    carBox.getBoundingSphere(carSphere);

    for (const obstacle of obstacles) {
        const obstacleSphere = new THREE.Sphere();
        obstacle.box.getBoundingSphere(obstacleSphere);
        
        if (carSphere.intersectsSphere(obstacleSphere) && 
            carBox.intersectsBox(obstacle.box)) {
            // More precise collision response
            const bounceDirection = carPhysics.direction.clone().negate();
            car.position.add(bounceDirection.multiplyScalar(carPhysics.speed * 1.5));
            carPhysics.speed = Math.max(-carPhysics.maxSpeed/2, -carPhysics.speed * 0.7);
            break;
        }
    }
    
    // Camera follow
    const targetPosition = new THREE.Vector3();
    car.getWorldPosition(targetPosition);

    // Calculate offset behind and above car
    const offset = new THREE.Vector3(
        Math.sin(car.rotation.y) * -8, // X offset
        5,  // Height
        Math.cos(car.rotation.y) * -8  // Z offset
    );

    targetPosition.add(offset);

    // Smooth camera movement
    const smoothFactor = 0.1;
    camera.position.x += (targetPosition.x - camera.position.x) * smoothFactor;
    camera.position.y += (targetPosition.y - camera.position.y) * smoothFactor;
    camera.position.z += (targetPosition.z - camera.position.z) * smoothFactor;

    camera.lookAt(car.position);
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
init();
