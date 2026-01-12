// ==========================
// SCENE SETUP
// ==========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

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
// INVENTORY & TOOLBAR
// ==========================
let woodCount = 0;
let woodCount = 0;
const inventory = ["Axe"];
let toolbarSlots = new Array(12).fill(null);
toolbarSlots[0] = "Axe";

let equippedItem = "Axe";
let equippedMesh = null;

// ==========================
// TOOLBAR EQUIPPED ITEM VISUAL
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
    equippedMesh.position.set(0.5, 0.5, 0); // Simulated hand
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
// UI INVENTORY
// ==========================
function updateUI() {
  const invText = document.getElementById("inventoryUI");
  if (invText) {
    invText.textContent =
      `Wood: ${woodCount} | Inventory: ${inventory.join(", ") || "Empty"}`;
  }

  const list = document.getElementById("inventoryList");
  if (list) {
    list.innerHTML = "";
    const counts = {};
    inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);
    for (const item in counts) {
      const li = document.createElement("li");
      li.textContent = `${item} x${counts[item]}`;
      list.appendChild(li);
    }
  }
}

// ==========================
// COLLISION OBJECTS
// ==========================
const solidBoxes = [];

// ==========================
// TREES
// ==========================
const trees = [];

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
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

// Spawn trees
[[5, 0], [-5, 5], [8, -3], [-8, -6], [0, -8]].forEach(p => createTree(p[0], p[1]));

// Tree chopping
let canChop = true;
const CHOP_COOLDOWN = 600;

function tryChopTree() {
  if (!canChop || !equippedItem || equippedItem !== "Axe") return;

  for (const tree of trees) {
    if (tree.destroyed) continue;

    const dist = player.position.distanceTo(tree.mesh.position);
    if (dist <= 2.5) {
      tree.health--;
      canChop = false;

      if (tree.health <= 0) {
        tree.destroyed = true;
        tree.respawnTimer = 20;
        tree.mesh.visible = false;

        const i = solidBoxes.indexOf(tree.box);
        if (i !== -1) solidBoxes.splice(i, 1);

        woodCount++;
        updateUI();
      }

      setTimeout(() => canChop = true, CHOP_COOLDOWN);
      break;
    }
  }
}

function handleTreeRespawn(delta) {
  for (const tree of trees) {
    if (!tree.destroyed) continue;

    tree.respawnTimer -= delta;
    if (tree.respawnTimer <= 0) {
      tree.destroyed = false;
      tree.health = 5;
      tree.mesh.visible = true;
      tree.box.setFromObject(tree.mesh);
      solidBoxes.push(tree.box);
    }
  }
}

// ==========================
// WORKBENCH
// ==========================
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
workbench.position.set(0, 0.5, 1);
scene.add(workbench);

const workbenchBox = new THREE.Box3().setFromObject(workbench);
solidBoxes.push(workbenchBox);

// ==========================
// UI ELEMENT REFERENCES
// ==========================
const craftingMenu = document.getElementById("craftingMenu");
const buildingMenu = document.getElementById("buildingMenu");
const inventoryMenu = document.getElementById("inventoryMenu");
const craftingPrompt = document.getElementById("craftingPrompt");
const placementPrompt = document.getElementById("placementPrompt");
const craftingMessage = document.getElementById("craftingMessage");

function closeUI(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
// ==========================
// INPUT HANDLING
// ==========================
const keys = {};
let leftMouse = false;
let rightMouse = false;
let mouseDX = 0;
let mouseDY = 0;

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "b") {
    buildingMenu.style.display = buildingMenu.style.display === "none" ? "block" : "none";
  }

  if (e.key === "i") {
    inventoryMenu.style.display = inventoryMenu.style.display === "none" ? "block" : "none";
  }

  if (e.key === "e" && nearWorkbench) {
    craftingMenu.style.display = "block";
  }

  if (e.key === "Escape") {
    exitPlacementMode();
  }

  // Equip from toolbar (1-9, 0, -, =)
  const equipKeys = {
    "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
    "6": 5, "7": 6, "8": 7, "9": 8, "0": 9,
    "-": 10, "=": 11
  };
  const slotIndex = equipKeys[e.key];
  if (slotIndex !== undefined) {
    equippedItem = toolbarSlots[slotIndex];
    updateEquippedVisual();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    leftMouse = true;
    tryChopTree();
  }
  if (e.button === 2) {
    rightMouse = true;
  }
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 0) leftMouse = false;
  if (e.button === 2) rightMouse = false;
});

window.addEventListener("mousemove", (e) => {
  mouseDX = e.movementX;
  mouseDY = e.movementY;
});

window.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("wheel", (e) => {
  camDistance += e.deltaY * 0.01;
  camDistance = Math.max(4, Math.min(20, camDistance));
});

// ==========================
// CRAFTING
// ==========================
function craftItem(item) {
  let cost = 0;
  if (item === "Axe") cost = 3;
  if (item === "Wall") cost = 2;

  if (woodCount < cost) {
    craftingMessage.textContent = "Not enough wood!";
    return;
  }

  woodCount -= cost;
  inventory.push(item);
  craftingMessage.textContent = `${item} crafted!`;
  updateUI();
}

// ==========================
// CAMERA CONTROL
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
  if (leftMouse) player.rotation.y = camYaw;
}

// ==========================
// MOVEMENT
// ==========================
function willCollide(nextPos) {
  const box = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(nextPos.x, nextPos.y + 1, nextPos.z),
    new THREE.Vector3(1, 2, 1)
  );
  return solidBoxes.some(b => box.intersectsBox(b));
}

function handleMovement() {
  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  if (!dir.length()) return;

  dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
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

  placementGhost = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 0.5),
    new THREE.MeshStandardMaterial({ opacity: 0.5, transparent: true })
  );
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
      const wall = placementGhost.clone();
      wall.material = new THREE.MeshStandardMaterial({ color: 0x777777 });
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
// TOOLBAR UI UPDATE
// ==========================
function updateEquippedVisual() {
  for (let i = 0; i < 12; i++) {
    const slot = document.getElementById(`slot${i + 1}`);
    if (!slot) continue;
    if (toolbarSlots[i]) {
      slot.textContent = toolbarSlots[i];
      slot.style.backgroundColor = equippedItem === toolbarSlots[i] ? "#aaaaff" : "#dddddd";
    } else {
      slot.textContent = "";
      slot.style.backgroundColor = "#eeeeee";
    }
  }

  // Held item visual
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
}

// ==========================
// WORKBENCH PROXIMITY
// ==========================
let nearWorkbench = false;

function checkWorkbenchProximity() {
  nearWorkbench = player.position.distanceTo(workbench.position) <= 2.5;
  craftingPrompt.style.display = nearWorkbench && craftingMenu.style.display === "none" ? "block" : "none";
}

// ==========================
// GAME LOOP
// ==========================
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  handleMovement();
  updateCamera();
  handlePlacement();
  handleTreeRespawn(delta);
  checkWorkbenchProximity();

  renderer.render(scene, camera);
}

// ==========================
// INITIALIZE GAME
// ==========================
updateUI();
updateEquippedVisual();
animate();


