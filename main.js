// === SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === LIGHTING ===
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

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

// === UI ===
let woodCount = 0;
const inventory = [];

function updateUI() {
  const ui = document.getElementById("inventoryUI");
  if (ui) ui.textContent = `Wood: ${woodCount}`;
}

// === TREES ===
const trees = [];
const solidBoxes = [];

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  );
  trunk.position.set(x, 2, z);
  scene.add(trunk);

  const box = new THREE.Box3().setFromObject(trunk);

  const tree = {
    mesh: trunk,
    box: box,
    health: 5,
    destroyed: false,
    respawnTimer: 0
  };

  trees.push(tree);
  solidBoxes.push(box);
}

function spawnTrees() {
  const positions = [
    [5, 0], [-5, 5], [8, -3], [-8, -6], [0, -8]
  ];
  positions.forEach(([x, z]) => createTree(x, z));
}
spawnTrees();

// === WORKBENCH ===
const workbench = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
workbench.position.set(0, 0.5, 1);
scene.add(workbench);

// === CRAFTING UI ===
let nearWorkbench = false;
const craftingPrompt = document.getElementById("craftingPrompt");
const craftingMenu = document.getElementById("craftingMenu");
const craftingMessage = document.getElementById("craftingMessage");

function openCraftingMenu() {
  if (craftingMenu) craftingMenu.style.display = "block";
}
function closeCraftingMenu() {
  if (craftingMenu) craftingMenu.style.display = "none";
  if (craftingMessage) craftingMessage.textContent = "";
}

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "e" && nearWorkbench) {
    openCraftingMenu();
  }
});

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

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

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
  camDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camDistance));
});

// === CAMERA ===
let camYaw = 0;
let camPitch = 0.3;
let camDistance = 10;
const MIN_ZOOM = 4;
const MAX_ZOOM = 20;
const MIN_PITCH = 0.1;
const MAX_PITCH = Math.PI / 2 - 0.2;

function updateCamera() {
  if (isLeftMouseDown || isRightMouseDown) {
    camYaw -= mouseDX * 0.002;
    camPitch -= mouseDY * 0.002;
    camPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, camPitch));
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

// === COLLISION ===
function willCollide(nextPos) {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(nextPos.x, nextPos.y + 1, nextPos.z),
    new THREE.Vector3(1, 2, 1)
  );

  for (const solidBox of solidBoxes) {
    if (solidBox && playerBox.intersectsBox(solidBox)) {
      return true;
    }
  }
  return false;
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
  const nextPos = player.position.clone().add(move.clone().multiplyScalar(speed));

  if (!willCollide(nextPos)) {
    player.position.copy(nextPos);
  }
}

// === TREE INTERACTION ===
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
        const i = solidBoxes.indexOf(tree.box);
        if (i !== -1) solidBoxes.splice(i, 1);
        woodCount++;
        updateUI();
      }

      setTimeout(() => canChop = true, CHOP_COOLDOWN);
    }
  }
}

// === WORKBENCH PROXIMITY ===
function checkWorkbenchProximity() {
  const dist = player.position.distanceTo(workbench.position);
  nearWorkbench = dist <= 2.5;
  if (craftingPrompt) {
    craftingPrompt.style.display = nearWorkbench && craftingMenu.style.display === "none"
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
  handleTreeInteraction(delta);
  updateCamera();
  checkWorkbenchProximity();

  for (const tree of trees) {
    if (!tree.destroyed) {
      tree.box.setFromObject(tree.mesh);
    }
  }

  renderer.render(scene, camera);
}

updateUI();
animate();

// === DRAGGING CRAFTING MENU ===
const dragTarget = document.getElementById("craftingMenu");
const dragHeader = document.getElementById("craftingHeader");

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

dragHeader.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - dragTarget.offsetLeft;
  offsetY = e.clientY - dragTarget.offsetTop;
  document.body.style.userSelect = "none";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  document.body.style.userSelect = "auto";
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    dragTarget.style.left = e.clientX - offsetX + "px";
    dragTarget.style.top = e.clientY - offsetY + "px";
    dragTarget.style.transform = "none";
  }
});
