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

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===============================
// LIGHTING
// ===============================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

// ===============================
// GROUND
// ===============================
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===============================
// PLAYER
// ===============================
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x8888ff });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
scene.add(player);

// ===============================
// TREE (resource node)
// ===============================
const treeGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
const treeMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const tree = new THREE.Mesh(treeGeo, treeMat);
tree.position.set(5, 2.5, 0);
scene.add(tree);

// ===============================
// INPUT HANDLING
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
// CAMERA FOLLOW + ZOOM
// ===============================
let cameraAngle = 0;
let cameraZoomDistance = 10;
const minZoom = 4;
const maxZoom = 20;

window.addEventListener("wheel", (e) => {
  cameraZoomDistance += e.deltaY * 0.01;
  cameraZoomDistance = Math.max(minZoom, Math.min(maxZoom, cameraZoomDistance));
});

function updateCameraFollow() {
  // Mouse-driven rotation
  if (isRightMouseDown || isLeftMouseDown) {
    cameraAngle -= mouseDeltaX * 0.002;
  }

  mouseDeltaX = 0;

  const offsetY = 5;
  const camX = player.position.x + cameraZoomDistance * Math.sin(cameraAngle);
  const camZ = player.position.z + cameraZoomDistance * Math.cos(cameraAngle);
  const camY = player.position.y + offsetY;

  camera.position.set(camX, camY, camZ);
  camera.lookAt(player.position);

  // If left click held, rotate player to face camera
  if (isLeftMouseDown) {
    player.rotation.y = cameraAngle;
  }
}

// ===============================
// MOVEMENT
// ===============================
function handlePlayerMovement() {
  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  dir.normalize();

  const move = dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  player.position.add(move.multiplyScalar(speed));
}

// ===============================
// INTERACTION
// ===============================
function checkInteraction() {
  const dist = player.position.distanceTo(tree.position);
  const interactionRange = 2.5;

  if (dist <= interactionRange) {
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
