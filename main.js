const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// Ground (terrain)
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Player placeholder
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x8888ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 1, 0);
scene.add(player);

// Movement controls
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function handlePlayerMovement() {
  const speed = 0.1;

  if (keys['w'] || keys['arrowup']) {
    player.position.z -= speed;
  }
  if (keys['s'] || keys['arrowdown']) {
    player.position.z += speed;
  }
  if (keys['a'] || keys['arrowleft']) {
    player.position.x -= speed;
  }
  if (keys['d'] || keys['arrowright']) {
    player.position.x += speed;
  }
}

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  handlePlayerMovement();
  controls.update();

  renderer.render(scene, camera);
}

animate();
