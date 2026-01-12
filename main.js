// ==========================
// SCENE SETUP
// ==========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("gameCanvas"),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================
// LIGHTING
// ==========================
scene.add(new THREE.AmbientLight(0x404040, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(5, 10, 7);
scene.add(light);

// ==========================
// GROUND
// ==========================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ==========================
// PLAYER
// ==========================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);
player.position.set(0, 1, 0);
scene.add(player);

// ==========================
// INVENTORY + TOOLBAR
// ==========================
let woodCount = 0;
const inventory = [];
let equippedItem = null;
let equippedMesh = null;
let toolbarSlots = new Array(12).fill(null);

// ==========================
// UI ELEMENTS
// ==========================
const craftingMenu = document.getElementById("craftingMenu");
const buildingMenu = document.getElementById("buildingMenu");
const inventoryMenu = document.getElementById("inventoryMenu");
const craftingPrompt = document.getElementById("craftingPrompt");
const placementPrompt = document.getElementById("placementPrompt");
const craftingMessage = document.getElementById("craftingMessage");

// 🔴 FORCE UI HIDDEN ON START
[craftingMenu, buildingMenu, inventoryMenu, craftingPrompt, placementPrompt]
  .forEach(el => el && (el.style.display = "none"));

// ==========================
// UI HELPERS
// ==========================
function toggleMenu(el) {
  if (!el) return;
  el.style.display = (el.style.display === "block") ? "none" : "block";
}

function closeUI(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// ==========================
// EQUIPPED VISUAL
// ==========================
function updateEquippedVisual() {
  if (equippedMesh) {
    player.remove(equippedMesh);
    equippedMesh = null;
  }

  if (equippedItem) {
    equippedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    equippedMesh.position.set(0.5, 0.5, 0);
    player.add(equippedMesh);
  }

  for (let i = 0; i < 12; i++) {
    const slot = document.getElementById(`slot${i + 1}`);
    if (!slot) continue;
    slot.textContent = toolbarSlots[i] || "";
    slot.style.backgroundColor =
      toolbarSlots[i] === equippedItem ? "#aaaaff" : "#dddddd";
  }
}

// ==========================
// INPUT
// ==========================
const keys = {};
let leftMouse = false;
let rightMouse = false;
let mouseDX = 0;
let mouseDY = 0;

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "b") toggleMenu(buildingMenu);
  if (k === "i") toggleMenu(inventoryMenu);
  if (k === "e" && nearWorkbench) toggleMenu(craftingMenu);
  if (k === "escape") exitPlacementMode();

  const equipKeys = {
    "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
    "6": 5, "7": 6, "8": 7, "9": 8, "0": 9,
    "-": 10, "=": 11
  };

  if (equipKeys[k] !== undefined) {
    equippedItem = toolbarSlots[equipKeys[k]];
    updateEquippedVisual();
  }
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousedown", e => {
  if (e.button === 0) leftMouse = true;
  if (e.button === 2) rightMouse = true;
});

window.addEventListener("mouseup", e => {
  if (e.button === 0) leftMouse = false;
  if (e.button === 2) rightMouse = false;
});

window.addEventListener("mousemove", e => {
  mouseDX = e.movementX;
  mouseDY = e.movementY;
});

window.addEventListener("contextmenu", e => e.preventDefault());

// ==========================
// CAMERA
// ==========================
let camYaw = 0;
let camPitch = 0.35;
let camDistance = 10;

function updateCamera() {
  if (leftMouse || rightMouse) {
    camYaw -= mouseDX * 0.002;
    camPitch -= mouseDY * 0.002;
    camPitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.2, camPitch));
  }

  mouseDX = mouseDY = 0;

  camera.position.set(
    player.position.x + camDistance * Math.sin(camPitch) * Math.sin(camYaw),
    player.position.y + camDistance * Math.cos(camPitch),
    player.position.z + camDistance * Math.sin(camPitch) * Math.cos(camYaw)
  );

  camera.lookAt(player.position);
}

// ==========================
// GAME LOOP
// ==========================
function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}

updateEquippedVisual();
animate();
