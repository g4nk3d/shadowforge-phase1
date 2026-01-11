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
// ✅ LIGHTING (RESTORED — THIS FIXES BLACK SCREEN)
// ==========================
scene.add(new THREE.AmbientLight(0x404040, 1.5));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

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
// EQUIPPED ITEM VISUAL
// ==========================
let equippedItem = null;
let equippedMesh = null;

function updateEquippedVisual() {
  if (equippedMesh) {
    player.remove(equippedMesh);
    equippedMesh = null;
  }

  if (!equippedItem) return;

  equippedMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.8, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  equippedMesh.position.set(0.6, 0.5, 0);
  player.add(equippedMesh);
}

// ==========================
// UI + INVENTORY
// ==========================
let woodCount = 0;
const inventory = [];
const toolbarSlots = new Array(12).fill(null);

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

// ==========================
// COLLISION
// ==========================
const solidBoxes = [];

// ==========================
// TREES
// ==========================
const trees = [];
let canChop = true;
const CHOP_COOLDOWN = 600;

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

[[5,0],[-5,5],[8,-3],[-8,-6],[0,-8]].forEach(p => createTree(p[0], p[1]));

function tryChopTree() {
  if (!canChop || equippedItem !== "Axe") return;

  for (const tree of trees) {
    if (tree.destroyed) continue;

    if (player.position.distanceTo(tree.mesh.position) <= 2.5) {
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
  new THREE.BoxGeometry(2,1,1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
workbench.position.set(0,0.5,1);
scene.add(workbench);

solidBoxes.push(new THREE.Box3().setFromObject(workbench));

// ==========================
// INPUT
// ==========================
const keys = {};
let leftMouse = false;
let rightMouse = false;
let mouseDX = 0;
let mouseDY = 0;

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  const equipKeys = {
    "1":0,"2":1,"3":2,"4":3,"5":4,"6":5,
    "7":6,"8":7,"9":8,"0":9,"-":10,"=":11
  };

  if (equipKeys[e.key] !== undefined) {
    equippedItem = toolbarSlots[equipKeys[e.key]];
    updateEquippedVisual();
  }
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousedown", e => {
  if (e.button === 0) {
    leftMouse = true;
    tryChopTree();
  }
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
    camPitch = Math.max(0.1, Math.min(Math.PI/2-0.2, camPitch));
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
    new THREE.Vector3(nextPos.x, nextPos.y+1, nextPos.z),
    new THREE.Vector3(1,2,1)
  );
  return solidBoxes.some(b => box.intersectsBox(b));
}

function handleMovement() {
  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys.w) dir.z -= 1;
  if (keys.s) dir.z += 1;
  if (keys.a) dir.x -= 1;
  if (keys.d) dir.x += 1;

  if (!dir.length()) return;

  dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y);
  const next = player.position.clone().add(dir.multiplyScalar(speed));
  if (!willCollide(next)) player.position.copy(next);
}

// ==========================
// LOOP
// ==========================
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  handleMovement();
  updateCamera();
  handleTreeRespawn(delta);

  renderer.render(scene, camera);
}

updateUI();
animate();
