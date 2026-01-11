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
// TREE (Interactable Object)
// ===============================
const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const tree = new THREE.Mesh(treeGeometry, treeMaterial);
tree.position.set(5, 2.5, 0);
scene.add(tree);

// ===============================
// INPUT HANDLING (WASD + Mouse)
// ===============================
const keys = {};
let isRightMouseDown = false;
let isLeftMouseDown = false;
let mouseDeltaX = 0;

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 2) isRightMouseDown = true;
  if (e.button === 0) isLeftMouseDown = true;
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 2) isRightMouseDown = false;
  if (e.button === 0) isLeftMouseDown = false;
});

window.addEventListener("mousemove", (e) => {
  if (isRightMouseDown || isLeftMouseDown) {
    mouseDeltaX = e.movementX;
  }
});

// Prevent context menu on right-click
window.addEventListener("contextmenu", (e) => e.preventDefault());

// ===============================
// PLAYER MOVEMENT
// ===============================
function handlePlayerMovement() {
  const speed = 0.1;
  const direction = new THREE.Vector3();

  if (keys["w"]) direction.z -= 1;
  if (keys["s"]) direction.z += 1;
  if (keys["a"]) direction.x -= 1;
  if (keys["d"]) direction.x += 1;

  direction.normalize();

  // Move based on player's rotation
  const move = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  player.position.add(move.multiplyScalar(speed));
}

// ===============================
// CAMERA ROTATION AROUND PLAYER
// ===============================
let cameraAngle = 0;

function updateCameraFollow() {
  // Rotate camera around player when mouse is held
  if (isRightMouseDown || isLeftMouseDown) {
    cameraAngle -= mouseDeltaX * 0.002; // rotation sensitivity
  }

  mouseDeltaX = 0; // reset after applying

  const radius = 10;
  const offsetY = 5;

  const cameraX = player.position.x + radius * Math.sin(cameraAngle);
  const cameraZ = player.position.z + radius * Math.cos(cameraAngle);
  const cameraY = player.position.y + offsetY;

  camera.position.set(cameraX, cameraY, cameraZ);
  camera.lookAt(player.position);

  // If left mouse is held, rotate the player to face camera direction
  if (isLeftMouseDown) {
    player.rotation.y = cameraAngle;
  }
}

// ===============================
// INTERACTION LOGIC (TREE)
// ===============================
function checkInteraction() {
  const distance = player.position.distanceTo(tree.position);
  const interactionRange = 2.5;

  if (distance <= interactionRange) {
    console.log("🪓 Chopping tree...");
  }
}

// ===============================
// MAIN LOOP
// ===============================
function animate() {
  requestAnimationFrame(animate);

  handlePlayerMovement();
  checkInteraction();
  updateCameraFollow();

  renderer.render(scene, camera);
}

animate();
