// ===============================
// SCENE SETUP
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
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
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(10, 20, 10));
scene.add(new THREE.AmbientLight(0x404040));

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
// INVENTORY UI
// ===============================
let woodCount = 0;
function updateUI() {
  const ui = document.getElementById("inventoryUI");
  if (ui) ui.textContent = `Wood: ${woodCount}`;
}

// ===============================
// TREES: MULTIPLE INSTANCES
// ===============================
const trees = [];

function createTree(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  );
  mesh.position.set(x, 2.5, z);
  scene.add(mesh);

  return {
    mesh,
    position: new THREE.Vector3(x, 2.5, z),
    health: 5,
    isDestroyed: false,
    respawnTimer: 0,
  };
}

// Initial tree spawns
trees.push(createTree(5, 0));
trees.push(createTree(-5, 5));
trees.push(createTree(10, -4));

// ===============================
// INPUT
// ===============================
const keys = {};
let isRightMouseDown = false;
let isLeftMouseDown = false;
let mouseDeltaX = 0;
let mouseDeltaY = 0;

window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

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
// CAMERA CONTROL
// ===============================
let cameraYaw = 0;
let cameraPitch = 0.3;
let cameraDistance = 10;
const minZoom = 4, maxZoom = 20;
const minPitch = 0.1, maxPitch = Math.PI / 2 - 0.2;

window.addEventListener("wheel", (e) => {
  cameraDistance += e.deltaY * 0.01;
  cameraDistance = Math.max(minZoom, Math.min(maxZoom, cameraDistance));
});

function updateCamera() {
  if (isLeftMouseDown || isRightMouseDown) {
    cameraYaw -= mouseDeltaX * 0.002;
    cameraPitch -= mouseDeltaY * 0.002;
    cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
  }

  mouseDeltaX = 0;
  mouseDeltaY = 0;

  const x = player.position.x + cameraDistance * Math.sin(cameraPitch) * Math.sin(cameraYaw);
  const y = player.position.y + cameraDistance * Math.cos(cameraPitch);
  const z = player.position.z + cameraDistance * Math.sin(cameraPitch) * Math.cos(cameraYaw);

  camera.position.set(x, y, z);
  camera.lookAt(player.position);

  if (isLeftMouseDown) player.rotation.y = cameraYaw;
}

// ===============================
// PLAYER MOVEMENT
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
// INTERACTION: MULTIPLE TREES
// ===============================
let canChop = true;
const chopCooldown = 1000; // ms

function handleTreeInteraction() {
  for (const tree of trees) {
    if (tree.isDestroyed) continue;

    const dist = player.position.distanceTo(tree.mesh.position);
    if (dist <= 2.5 && canChop) {
      tree.health--;
      canChop = false;

      console.log(`🪓 Chopped tree! HP left: ${tree.health}`);

      if (tree.health <= 0) {
        scene.remove(tree.mesh);
        tree.isDestroyed = true;
        tree.respawnTimer = 20; // seconds
        woodCount++;
        updateUI();
        console.log("🌲 Tree destroyed! +1 Wood");
      }

      setTimeout(() => {
        canChop = true;
      }, chopCooldown);
    }
  }
}

function updateTreeRespawns(deltaTime) {
  for (const tree of trees) {
    if (!tree.isDestroyed) continue;

    tree.respawnTimer -= deltaTime;
    if (tree.respawnTimer <= 0) {
      tree.health = 5;
      tree.isDestroyed = false;
      tree.mesh.position.copy(tree.position);
      scene.add(tree.mesh);
      console.log("🌱 Tree respawned!");
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
  handleTreeInteraction();
  updateTreeRespawns(delta);
  updateCamera();

  renderer.render(scene, camera);
}

updateUI();
animate();
