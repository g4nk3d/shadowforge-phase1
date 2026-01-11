// ===============================
// BASIC SCENE SETUP
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===============================
// LIGHTING
// ===============================
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// ===============================
// GROUND / TERRAIN
// ===============================
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===============================
// PLAYER
// ===============================
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x8888ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 1, 0);
scene.add(player);

// ===============================
// INTERACTABLE TREE (RESOURCE NODE)
// ===============================
const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const tree = new THREE.Mesh(treeGeometry, treeMaterial);
tree.position.set(5, 2.5, 0);
scene.add(tree);

// ===============================
// INPUT HANDLING (WASD)
// ===============================
const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ===============================
// PLAYER MOVEMENT
// ===============================
function handlePlayerMovement() {
  const speed = 0.1;

  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;
}

// ===============================
// CAMERA FOLLOW (GAME-STYLE)
// ===============================
function updateCameraFollow() {
  const offset = new THREE.Vector3(0, 5, 10);
  const targetPosition = player.position.clone().add(offset);

  camera.position.lerp(targetPosition, 0.1);
  camera.lookAt(player.position);
}

// ===============================
// INTERACTION CHECK (TREE)
// ===============================
function checkInteraction() {
  const distance = player.position.distanceTo(tree.position);
  const interactionRange = 2.5;

  if (distance <= interactionRange) {
    console.log("🪓 Chopping tree...");
  }
}

// ===============================
// ORBIT CONTROLS (REDUCED SENSITIVITY)
// ===============================
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enableKeys = false;
controls.rotateSpeed = 0.3;
controls.zoomSpeed = 0.4;
controls.panSpeed = 0.3;
controls.maxPolarAngle = Math.PI / 2;

// Optional: disable right-click pan
controls.mouseButtons.RIGHT = null;

// ===============================
// ANIMATION LOOP
// ===============================
function animate() {
  requestAnimationFrame(animate);

  handlePlayerMovement();
  checkInteraction();
  updateCameraFollow();
  controls.update();

  renderer.render(scene, camera);
}

animate();
