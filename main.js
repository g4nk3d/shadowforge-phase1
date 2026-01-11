// ===============================
// SCENE SETUP
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaec6cf); // Sky blue-gray

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
// LIGHTING (FIXED)
// ===============================
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// ===============================
// GROUND
// ===============================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x3b3b3b })
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
// INVENTORY UI
// ===============================
let woodCount = 0;
function updateUI() {
  const ui = document.getElementById("inventoryUI");
  if (ui) ui.textContent = `Wood: ${woodCount}`;
}

// ===============================
// TREES & COLLISION SYSTEM
// ===============================
const trees = [];
const solidObjects = [];

function createTree(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  );
  mesh.position.set(x, 2.5, z);
  scene.add(mesh);

  const tree = {
    mesh,
    health: 5,
    destroyed: false,
    respawnTimer: 0
  };

  trees.push(tree);
  solidObjects.push(mesh);

  return tree;
}

function spawnTrees() {
  const positions = [
    [5, 0],
    [-5, 5],
    [10, -4],
    [-8, -3],
    [0, -8]
  ];

  positions.forEach(([x, z]) => createTree(x, z));
}

spawnTrees();

// ===============================
// INPUT HANDLING
// ===============================
const keys = {};
let isRightMouseDown = false;
let isLeftMouseDown = false;
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

// ===============================
// CAMERA
// ===============================
let camYaw = 0;
let camPitch = 0.3;
let camDistance = 10;

const MIN_ZOOM = 4;
const MAX_ZOOM = 20;
const MIN_PITCH = 0.1;
const MAX_PITCH = Math.PI / 2 - 0.2;

window.addEventListener("wheel", e => {
  camDistance += e.deltaY * 0.01;
  camDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camDistance));
});

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

// ===============================
// COLLISION DETECTION
// ===============================
function checkCollision(nextPos) {
  const playerRadius = 0.75;

  for (const obj of solidObjects) {
    if (!obj.visible) continue;

    const dist = obj.position.distanceTo(nextPos);
    const objRadius = 0.75;

    if (dist < playerRadius + objRadius) {
      return true;
    }
  }

  return false;
}

// ===============================
// MOVEMENT SYSTEM (With Collision)
// ===============================
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
  if (!checkCollision(nextPos)) {
    player.position.copy(nextPos);
  }
}

// ===============================
// TREE CHOPPING + RESPAWN
// ===============================
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
        if (!solidObjects.includes(tree.mesh)) {
          solidObjects.push(tree.mesh);
        }
        console.log("🌱 Tree respawned");
      }
      continue;
    }

    const dist = player.position.distanceTo(tree.mesh.position);
    if (dist <= 2.5 && canChop) {
      tree.health--;
      canChop = false;

      console.log(`🪓 Tree hit! HP: ${tree.health}`);

      if (tree.health <= 0) {
        tree.destroyed = true;
        tree.respawnTimer = 20;
        tree.mesh.visible = false;
        const i = solidObjects.indexOf(tree.mesh);
        if (i !== -1) solidObjects.splice(i, 1);

        woodCount++;
        updateUI();
        console.log("🌲 Tree destroyed! +1 Wood");
      }

      setTimeout(() => canChop = true, CHOP_COOLDOWN);
    }
  }
}

// ===============================
// MAIN LOOP
// ===============================
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  handleMovement();
  handleTreeInteraction(delta);
  updateCamera();

  renderer.render(scene, camera);
}

updateUI();
animate();
