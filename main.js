// ==========================
// SCENE SETUP
// ==========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
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

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// ==========================
// GROUND
// ==========================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228b22 })
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
// UI STATE
// ==========================
let woodCount = 0;
const inventory = [];

function updateUI() {
  document.getElementById("inventoryUI").textContent =
    `Wood: ${woodCount} | Inventory: ${inventory.join(", ") || "Empty"}`;

  const list = document.getElementById("inventoryList");
  if (!list) return;
  list.innerHTML = "";

  const counts = {};
  inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);

  Object.entries(counts).forEach(([item, count]) => {
    const li = document.createElement("li");
    li.textContent = `${item} x${count}`;
    list.appendChild(li);
  });
}

// ==========================
// COLLISION STORAGE
// ==========================
const solidBoxes = [];

// ==========================
// TREES
// ==========================
const trees = [];

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  trunk.position.set(x, 2, z);
  scene.add(trunk);

  const box = new THREE.Box3().setFromObject(trunk);

  trees.push({
    mesh: trunk,
    box,
    health: 5,
    destroyed: false,
    respawnTimer: 0
  });

  solidBoxes.push(box);
}

[[5, 0], [-5, 5], [8, -3], [-8, -6], [0, -8]].forEach(p => createTree(p[0], p[1]));

// ==========================
// WORKBENCH (WITH COLLISION)
// ==========================
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
workbench.position.set(0, 0.5, 1);
scene.add(workbench);

/* 🔴 THIS IS THE FIX YOU ASKED FOR 🔴 */
const workbenchBox = new THREE.Box3().setFromObject(workbench);
solidBoxes.push(workbenchBox);
/* 🔴 END FIX 🔴 */

// ==========================
// UI ELEMENTS
// ==========================
let nearWorkbench = false;
const craftingMenu = document.getElementById("craftingMenu");
const buildingMenu = document.getElementById("buildingMenu");
const inventoryMenu = document.getElementById("inventoryMenu");
const craftingPrompt = document.getElementById("craftingPrompt");
const placementPrompt = document.getElementById("placementPrompt");
const craftingMessage = document.getElementById("craftingMessage");

// ==========================
// CRAFTING
// ==========================
function craftItem(item, cost) {
  if (woodCount < cost) {
    craftingMessage.textContent = "Not enough wood";
    return;
  }
  woodCount -= cost;
  inventory.push(item);
  updateUI();
  craftingMessage.textContent = `${item} crafted`;
}

// ==========================
// INPUT
// ==========================
const keys = {};
let mouseDX = 0;
let mouseDY = 0;
let leftMouse = false;
let rightMouse = false;

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "b") buildingMenu.style.display =
    buildingMenu.style.display === "none" ? "block" : "none";

  if (e.key === "i") inventoryMenu.style.display =
    inventoryMenu.style.display === "none" ? "block" : "none";

  if (e.key === "e" && nearWorkbench) craftingMenu.style.display = "block";

  if (e.key === "Escape") exitPlacementMode();
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
let camPitch = 0.4;
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
  if (leftMouse) player.rotation.y = camYaw;
}

// ==========================
// MOVEMENT & COLLISION
// ==========================
function willCollide(nextPos) {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(nextPos.x, nextPos.y + 1, nextPos.z),
    new THREE.Vector3(1, 2, 1)
  );

  return solidBoxes.some(b => b && playerBox.intersectsBox(b));
}

function handleMovement() {
  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  if (dir.length() === 0) return;

  dir.normalize();
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

  const next = player.position.clone().add(dir.multiplyScalar(speed));
  if (!willCollide(next)) player.position.copy(next);
}

// ==========================
// BUILDING SYSTEM
// ==========================
let placementMode = false;
let placementGhost = null;
let placementType = null;
const raycaster = new THREE.Raycaster();

function startBuilding(type) {
  if (!inventory.includes(type)) return;

  placementMode = true;
  placementType = type;
  placementPrompt.style.display = "block";

  const geo = new THREE.BoxGeometry(2, 2, 0.5);
  const mat = new THREE.MeshStandardMaterial({ opacity: 0.5, transparent: true });
  placementGhost = new THREE.Mesh(geo, mat);
  scene.add(placementGhost);
}

function exitPlacementMode() {
  placementMode = false;
  placementPrompt.style.display = "none";
  if (placementGhost) scene.remove(placementGhost);
  placementGhost = null;
}

function handlePlacement() {
  if (!placementMode || !placementGhost) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObject(ground);

  if (hit.length) {
    const p = hit[0].point;
    const gx = Math.round(p.x / 2) * 2;
    const gz = Math.round(p.z / 2) * 2;
    placementGhost.position.set(gx, 1, gz);

    if (leftMouse) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x777777 })
      );
      wall.position.set(gx, 1, gz);
      scene.add(wall);

      solidBoxes.push(new THREE.Box3().setFromObject(wall));
      inventory.splice(inventory.indexOf(placementType), 1);
      updateUI();
      exitPlacementMode();
    }
  }

  if (rightMouse) exitPlacementMode();
}

// ==========================
// WORKBENCH CHECK
// ==========================
function checkWorkbenchProximity() {
  nearWorkbench = player.position.distanceTo(workbench.position) < 2.5;
  craftingPrompt.style.display = nearWorkbench ? "block" : "none";
}

// ==========================
// LOOP
// ==========================
function animate() {
  requestAnimationFrame(animate);
  handleMovement();
  updateCamera();
  handlePlacement();
  checkWorkbenchProximity();
  renderer.render(scene, camera);
}

updateUI();
animate();
