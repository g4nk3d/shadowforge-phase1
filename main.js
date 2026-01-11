// === SCENE SETUP ===
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

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0x404040, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(5, 10, 7);
scene.add(light);

// === GROUND ===
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// === PLAYER ===
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);
player.position.set(0, 1, 0);
scene.add(player);

// === UI + INVENTORY ===
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

  for (const item in counts) {
    const li = document.createElement("li");
    li.textContent = `${item} x${counts[item]}`;
    list.appendChild(li);
  }
}
// === COLLISION BOXES ===
const solidBoxes = [];

// === TREES SYSTEM ===
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
    box: box,
    health: 5,
    destroyed: false,
    respawnTimer: 0
  });

  solidBoxes.push(box);
}

function spawnTrees() {
  const positions = [
    [5, 0], [-5, 5], [8, -3], [-8, -6], [0, -8]
  ];
  positions.forEach(([x, z]) => createTree(x, z));
}

spawnTrees();

// === TREE CHOPPING SYSTEM ===
let canChop = true;
const CHOP_COOLDOWN = 1000;

function handleTreeInteraction(delta) {
  for (const tree of trees) {
    if (tree.destroyed) {
      tree.respawnTimer -= delta;
      if (tree.respawnTimer <= 0) {
        tree.destroyed = false;
        tree.health = 5;
        tree.mesh.visible = true;
        tree.box.setFromObject(tree.mesh);
        if (!solidBoxes.includes(tree.box)) {
          solidBoxes.push(tree.box);
        }
      }
      continue;
    }

    const dist = player.position.distanceTo(tree.mesh.position);
    if (dist <= 2.5 && canChop) {
      tree.health--;
      canChop = false;

      if (tree.health <= 0) {
        tree.destroyed = true;
        tree.respawnTimer = 20;
        tree.mesh.visible = false;

        const index = solidBoxes.indexOf(tree.box);
        if (index !== -1) solidBoxes.splice(index, 1);

        woodCount++;
        updateUI();
      }

      setTimeout(() => {
        canChop = true;
      }, CHOP_COOLDOWN);
    }
  }
}

// === WORKBENCH ===
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
workbench.position.set(0, 0.5, 1);
scene.add(workbench);

// ✅ Workbench now has collision
const workbenchBox = new THREE.Box3().setFromObject(workbench);
solidBoxes.push(workbenchBox);
// === UI ELEMENTS ===
const craftingMenu = document.getElementById("craftingMenu");
const buildingMenu = document.getElementById("buildingMenu");
const inventoryMenu = document.getElementById("inventoryMenu");
const craftingPrompt = document.getElementById("craftingPrompt");
const placementPrompt = document.getElementById("placementPrompt");
const craftingMessage = document.getElementById("craftingMessage");

// === CRAFTING LOGIC ===
function craftItem(item, cost) {
  if (woodCount >= cost) {
    woodCount -= cost;
    inventory.push(item);
    updateUI();
    craftingMessage.textContent = `${item} crafted!`;
    craftingMessage.style.color = "#aaffaa";
  } else {
    craftingMessage.textContent = `Not enough wood to craft ${item}`;
    craftingMessage.style.color = "#ff9999";
  }
}

// === INPUT HANDLING ===
const keys = {};
let isLeftMouseDown = false;
let isRightMouseDown = false;
let mouseDX = 0;
let mouseDY = 0;

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "e" && nearWorkbench) {
    craftingMenu.style.display = "block";
  }

  if (e.key.toLowerCase() === "b") {
    buildingMenu.style.display =
      buildingMenu.style.display === "none" ? "block" : "none";
  }

  if (e.key.toLowerCase() === "i") {
    inventoryMenu.style.display =
      inventoryMenu.style.display === "none" ? "block" : "none";
  }

  if (e.key === "Escape") {
    exitPlacementMode();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", e => {
  if (e.button === 0) isLeftMouseDown = true;
  if (e.button === 2) isRightMouseDown = true;
});

window.addEventListener("mouseup", e => {
  if (e.button === 0) isLeftMouseDown = false;
  if (e.button === 2) isRightMouseDown = false;
});

window.addEventListener("mousemove", e => {
  if (isLeftMouseDown || isRightMouseDown) {
    mouseDX = e.movementX;
    mouseDY = e.movementY;
  }
});

window.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener("wheel", e => {
  camDistance += e.deltaY * 0.01;
  camDistance = Math.max(4, Math.min(20, camDistance));
});

// === CAMERA ===
let camYaw = 0;
let camPitch = 0.3;
let camDistance = 10;

function updateCamera() {
  if (isLeftMouseDown || isRightMouseDown) {
    camYaw -= mouseDX * 0.002;
    camPitch -= mouseDY * 0.002;
    camPitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.2, camPitch));
  }

  mouseDX = 0;
  mouseDY = 0;

  const x = player.position.x + camDistance * Math.sin(camPitch) * Math.sin(camYaw);
  const y = player.position.y + camDistance * Math.cos(camPitch);
  const z = player.position.z + camDistance * Math.sin(camPitch) * Math.cos(camYaw);

  camera.position.set(x, y, z);
  camera.lookAt(player.position);

  if (isLeftMouseDown) {
    player.rotation.y = camYaw;
  }
}

// === COLLISION DETECTION ===
function willCollide(nextPos) {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(nextPos.x, nextPos.y + 1, nextPos.z),
    new THREE.Vector3(1, 2, 1)
  );

  return solidBoxes.some(box => box && playerBox.intersectsBox(box));
}

// === MOVEMENT ===
function handleMovement() {
  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;

  if (dir.length() === 0) return;

  dir.normalize();
  const move = dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  const nextPos = player.position.clone().add(move.multiplyScalar(speed));

  if (!willCollide(nextPos)) {
    player.position.copy(nextPos);
  }
}

// === BUILDING SYSTEM ===
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

    if (isLeftMouseDown) {
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

  if (isRightMouseDown) {
    exitPlacementMode();
  }
}
// === WORKBENCH PROXIMITY ===
let nearWorkbench = false;

function checkWorkbenchProximity() {
  const dist = player.position.distanceTo(workbench.position);
  nearWorkbench = dist <= 2.5;

  if (craftingPrompt) {
    craftingPrompt.style.display =
      nearWorkbench && craftingMenu.style.display === "none"
        ? "block"
        : "none";
  }
}

// === ANIMATION LOOP ===
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  handleMovement();
  updateCamera();
  handlePlacement();
  handleTreeInteraction(delta);
  checkWorkbenchProximity();

  // Update tree bounding boxes if not destroyed
  for (const tree of trees) {
    if (!tree.destroyed) {
      tree.box.setFromObject(tree.mesh);
    }
  }

  renderer.render(scene, camera);
}

// === INITIALIZE ===
updateUI();
animate();
