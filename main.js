// ===============================
// BASIC SETUP
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

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
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===============================
// PLAYER
// ===============================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);
player.position.set(0, 1, 0);
scene.add(player);

// ===============================
// TREE
// ===============================
const tree = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.8, 5, 8),
  new THREE.MeshStandardMaterial({ color: 0x228b22 })
);
tree.position.set(5, 2.5, 0);
scene.add(tree);

// ===============================
// INPUT HANDLING
// ===============================
const keys = {};
let isRightMouseDown = false;
let isLeftMouseDown = false;
let mouseDeltaX = 0;
let mouseDeltaY = 0;

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
    mouseDeltaY = e.movementY;
  }
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

// ===============================
// CAMERA VARIABLES
// ===============================
let cameraYaw = 0;         // left-right
let cameraPitch = 0.3;     // up-down
let cameraDistance = 10;
const minZoom = 4;
const maxZoom = 20;
const minPitch = 0.1;         // ~5 degrees
const maxPitch = Math.PI / 2 - 0.2; // ~80 degrees

window.addEventListener("wheel", (e) => {
  cameraDistance += e.deltaY * 0.01;
  cameraDistance = Math.max(minZoom, Math.min(maxZoom, cameraDistance));
});

// ===============================
// UPDATE CAMERA POSITION
// ===============================
function updateCamera() {
  if (isLeftMouseDown || isRightMouseDown) {
    cameraYaw -= mouseDeltaX * 0.002;
    cameraPitch -= mouseDeltaY * 0.002;
    cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
  }

  mouseDeltaX = 0;
  mouseDeltaY = 0;

  // Convert spherical coordinates to Cartesian
  const x = player.position.x + cameraDistance * Math.sin(cameraPitch) * Math.sin(cameraYaw);
  const y = player.position.y + cameraDistance * Math.cos(cameraPitch);
  const z = player.position.z + cameraDistance * Math.sin(cameraPitch) * Math.cos(cameraYaw);

  camera.position.set(x, y, z);
  camera.lookAt(player.position);

  if (isLeftMouseDown) {
    player.rotation.y = cameraYaw;
  }
}

// ===============================
// MOVEMENT
// ===============================
function handleMovement() {
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

  handleMovement();
  checkInteraction();
  updateCamera();

  renderer.render(scene, camera);
}

animate();
