// === THREE.JS BASIC SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f0f); // Mordor sky

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
const light = new THREE.DirectionalLight(0xffaa88, 1);
light.position.set(50, 50, 25);
scene.add(light);

// === TERRAIN ===
const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
geometry.rotateX(-Math.PI / 2);

const positionAttr = geometry.attributes.position;
for (let i = 0; i < positionAttr.count; i++) {
  const y = Math.random() * 3 - 1.5;
  positionAttr.setY(i, y);
}
geometry.computeVertexNormals();

const material = new THREE.MeshStandardMaterial({ color: 0x444444 });
const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

// === PLAYER PLACEHOLDER ===
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
scene.add(player);

// === CAMERA CONTROLS ===
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

// === RESIZE HANDLER ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === GAME LOOP ===
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
