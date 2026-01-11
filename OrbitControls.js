// OrbitControls.js - THREE.js v0.154.0

// This file is adapted from the official Three.js examples
// https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/OrbitControls.js

function OrbitControls(object, domElement) {
  this.object = object;
  this.domElement = domElement || document;

  this.enabled = true;

  this.target = new THREE.Vector3();

  this.minDistance = 0;
  this.maxDistance = Infinity;

  this.minZoom = 0;
  this.maxZoom = Infinity;

  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  this.minAzimuthAngle = -Infinity; // radians
  this.maxAzimuthAngle = Infinity; // radians

  this.enableDamping = false;
  this.dampingFactor = 0.05;

  this.enableZoom = true;
  this.zoomSpeed = 1.0;

  this.enableRotate = true;
  this.rotateSpeed = 1.0;

  this.enablePan = true;
  this.panSpeed = 1.0;
  this.screenSpacePanning = true;

  this.keyPanSpeed = 7.0;

  this.autoRotate = false;
  this.autoRotateSpeed = 2.0;

  this.enableKeys = true;
  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

  // Internal state
  let scope = this;

  // Add everything else you need from the full OrbitControls here
  // (shortened here for brevity)

  // Instead of pasting thousands of lines here, you can download the full version directly from:
  // https://raw.githubusercontent.com/mrdoob/three.js/r154/examples/js/controls/OrbitControls.js
  // And copy/paste it into this file in full.
}
