import * as THREE from "three";
import Stats from "/jsm/libs/stats.module.js";
import { FirstPersonControls } from "/jsm/controls/FirstPersonControls.js";
import { GUI } from "/jsm/libs/dat.gui.module.js";
import { ColladaLoader } from "/jsm/loaders/ColladaLoader.js";
import { ConvexObjectBreaker } from "/jsm/misc/ConvexObjectBreaker.js";
import { ConvexGeometry } from "/jsm/geometries/ConvexGeometry.js";
let clock = new THREE.Clock();
let rotationSpeed = 0.003;
let rotate = false;

let started = 0;

let stats;
let renderer;
let camera;
let controls;
let scene;

let ballConf = {
  mass: 100,
  speed: 100,
  radius: 10,
};

let physics = {
  gravity: 9.81,
};

let gui;

let ambientLight;
let pointLight;

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });

let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;
const margin = 0.05;

const convexBreaker = new ConvexObjectBreaker();

const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
let transformAux1;
let tempBtVec3_1;

const objectsToRemove = [];

for (let i = 0; i < 500; i++) {
  objectsToRemove[i] = null;
}

document.addEventListener("keydown", (event) => {
  const nomTouche = event.key;

  if (nomTouche == "b") {
    controls.enabled = !controls.enabled;
    return;
  }
});

let numObjectsToRemove = 0;

const impactPoint = new THREE.Vector3();
const impactNormal = new THREE.Vector3();

Ammo().then(function (AmmoLib) {
  Ammo = AmmoLib;

  animate();
});

const startButton = document.getElementById("image");
startButton.addEventListener("click", overlayRemove);
function overlayRemove() {
  started = 1;
  const overlay = document.getElementById("overlay");
  document.querySelector("html").style.backgroundColor = "rgb(47, 146, 228)";
  overlay.remove();
  init();
}

function init() {
  statsInit();
  rendererInit();
  cameraInit();
  controlsInit();
  sceneInit();
  ambientLightInit();
  pointLightInit();
  initInput();
  initPhysics();
  animate();
  panel();
  city();
  skybox();
  onWindowResize();
  window.addEventListener("resize", onWindowResize);
}
function initInput() {
  window.addEventListener("pointerdown", function (event) {
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballConf.radius, 14, 10),
      ballMaterial
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    const ballShape = new Ammo.btSphereShape(ballConf.radius);
    ballShape.setMargin(margin);
    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);
    quat.set(0, 0, 0, 1);
    const ballBody = createRigidBody(ball, ballShape, ballConf.mass, pos, quat);

    pos.copy(raycaster.ray.direction);
    pos.multiplyScalar(24);
    ballBody.setLinearVelocity(
      new Ammo.btVector3(
        pos.x * ballConf.speed,
        pos.y * ballConf.speed,
        pos.z * ballConf.speed
      )
    );
  });
}
function initPhysics() {
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -physics.gravity, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  controls.handleResize();
}
function sceneInit() {
  scene = new THREE.Scene();
}
function animate() {
  requestAnimationFrame(animate);
  if (started == 1) {
    stats.update();
    const delta = clock.getDelta();
    controls.update(delta);
    updatePhysics(delta);
    scene.rotation.y += rotationSpeed * rotate;
    renderer.render(scene, camera);
  }
}

function panel() {
  var params = {
    rotationSpeed: 0.0003,
    switch: false,
    helper: false,
  };
  gui = new GUI({ width: 320 });

  const cameraFolder = gui.addFolder("Camera");
  cameraFolder
    .add(params, "switch")
    .name("Auto rotation")
    .onChange(() => {
      rotate = !rotate;
    });
  cameraFolder
    .add(params, "rotationSpeed", -0.001, 0.001)
    .name("Rotation Speed")
    .onChange((speed) => {
      rotationSpeed = speed;
    });

  const lightFolder = gui.addFolder("Lights");
  const ambientLightFolder = lightFolder.addFolder("Ambient Light");
  ambientLightFolder.add(ambientLight, "intensity", 0, 1).name("Intensity");
  const pointLightFolder = lightFolder.addFolder("point Light");
  pointLightFolder.add(pointLight, "intensity", 0, 1).name("Intensity");
  pointLightFolder.add(pointLight.position, "x", -5000, 5000).name("X");
  pointLightFolder.add(pointLight.position, "y", 0, 10000).name("Y");
  pointLightFolder.add(pointLight.position, "z", -5000, 5000).name("Z");

  const balls = gui.addFolder("Balls");
  balls.add(ballConf, "mass", 1, 1000).name("Balls mass");
  balls.add(ballConf, "speed", 1, 1000).name("Balls speed");
  balls.add(ballConf, "radius", 1, 1000).name("Balls size");
}
function rendererInit() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.ShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}
function controlsInit() {
  controls = new FirstPersonControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.movementSpeed = 100;
  controls.lookSpeed = 0.2;
  controls.noFly = true;
  controls.lookVertical = false;
}
function cameraInit() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    20000
  );
  camera.position.set(-2000, 100, 2000);
  camera.lookAt(0, 0, 0);
}
function ambientLightInit() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.8, 0);
  scene.add(ambientLight);
}
function pointLightInit() {
  pointLight = new THREE.PointLight(0xffffff, 0.6, 0);
  pointLight.position.set(10000, 100000, 100000);

  pointLight.shadow.camera.near = 0.1;
  pointLight.shadow.camera.far = 400000;
  pointLight.castShadow = true;
  scene.add(pointLight);
}
function statsInit() {
  stats = new Stats();
  document.body.appendChild(stats.dom);
}
function skybox() {
  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load("textures/cube/ft.jpg");
  let texture_bk = new THREE.TextureLoader().load("textures/cube/bk.jpg");
  let texture_up = new THREE.TextureLoader().load("textures/cube/up.jpg");
  let texture_dn = new THREE.TextureLoader().load("textures/cube/dn.jpg");
  let texture_rt = new THREE.TextureLoader().load("textures/cube/rt.jpg");
  let texture_lf = new THREE.TextureLoader().load("textures/cube/lf.jpg");
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

  for (let i = 0; i < 6; i++) materialArray[i].side = THREE.BackSide;

  let skyboxGeo = new THREE.BoxGeometry(100000, 100000, 100000);
  let skybox = new THREE.Mesh(skyboxGeo, materialArray);
  scene.add(skybox);
}
function createObject(mass, halfExtents, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(
      halfExtents.x * 2,
      halfExtents.y * 2,
      halfExtents.z * 2
    ),
    material
  );
  object.position.copy(pos);
  object.quaternion.copy(quat);
  convexBreaker.prepareBreakableObject(
    object,
    mass,
    new THREE.Vector3(),
    new THREE.Vector3(),
    true
  );
  createDebrisFromBreakableObject(object);
}

function city() {
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);
  const ground = createParalellepipedWithPhysics(
    10000,
    1,
    10000,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  ground.receiveShadow = true;
  new THREE.TextureLoader().load("textures/cobble.jpg", function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);
    ground.material.map = texture;
    ground.material.needsUpdate = true;
  });

  let tex = new THREE.TextureLoader().load("textures/Building/iron.jpg");
  let mat = new THREE.MeshBasicMaterial({ map: tex });
  // Tower 1
  const towerMass = 100;
  const towerHalfExtents = new THREE.Vector3(200, 500, 200);
  pos.set(-300, 500, 0);
  quat.set(0, 0, 0, 1);
  createObject(towerMass, towerHalfExtents, pos, quat, mat);

  // Tower 2
  pos.set(300, 500, 0);
  quat.set(0, 0, 0, 1);
  createObject(towerMass, towerHalfExtents, pos, quat, mat);
}
function createParalellepipedWithPhysics(
  sx,
  sy,
  sz,
  mass,
  pos,
  quat,
  material
) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
    material
  );
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);

  createRigidBody(object, shape, mass, pos, quat);

  return object;
}
function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  if (pos) {
    object.position.copy(pos);
  } else {
    pos = object.position;
  }

  if (quat) {
    object.quaternion.copy(quat);
  } else {
    quat = object.quaternion;
  }

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);

  if (mass > 0) {
    rigidBodies.push(object);

    // Disable deactivation
    body.setActivationState(4);
  }

  physicsWorld.addRigidBody(body);

  return body;
}
function createDebrisFromBreakableObject(object) {
  object.castShadow = true;
  object.receiveShadow = true;

  const shape = createConvexHullPhysicsShape(
    object.geometry.attributes.position.array
  );
  shape.setMargin(margin);

  const body = createRigidBody(
    object,
    shape,
    object.userData.mass,
    null,
    null,
    object.userData.velocity,
    object.userData.angularVelocity
  );

  // Set pointer back to the three object only in the debris objects
  const btVecUserData = new Ammo.btVector3(0, 0, 0);
  btVecUserData.threeObject = object;
  body.setUserPointer(btVecUserData);
}

function removeDebris(object) {
  scene.remove(object);

  physicsWorld.removeRigidBody(object.userData.physicsBody);
}

function createConvexHullPhysicsShape(coords) {
  const shape = new Ammo.btConvexHullShape();

  for (let i = 0, il = coords.length; i < il; i += 3) {
    tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
    const lastOne = i >= il - 3;
    shape.addPoint(tempBtVec3_1, lastOne);
  }

  return shape;
}
function createMaterial(color) {
  color = color || createRandomColor();
  return new THREE.MeshPhongMaterial({ color: color });
}
function updatePhysics(deltaTime) {
  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rigid bodies
  for (let i = 0, il = rigidBodies.length; i < il; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      objThree.userData.collided = false;
    }
  }

  for (let i = 0, il = dispatcher.getNumManifolds(); i < il; i++) {
    const contactManifold = dispatcher.getManifoldByIndexInternal(i);
    const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
    const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);

    const threeObject0 = Ammo.castObject(
      rb0.getUserPointer(),
      Ammo.btVector3
    ).threeObject;
    const threeObject1 = Ammo.castObject(
      rb1.getUserPointer(),
      Ammo.btVector3
    ).threeObject;

    if (!threeObject0 && !threeObject1) {
      continue;
    }

    const userData0 = threeObject0 ? threeObject0.userData : null;
    const userData1 = threeObject1 ? threeObject1.userData : null;

    const breakable0 = userData0 ? userData0.breakable : false;
    const breakable1 = userData1 ? userData1.breakable : false;

    const collided0 = userData0 ? userData0.collided : false;
    const collided1 = userData1 ? userData1.collided : false;

    if ((!breakable0 && !breakable1) || (collided0 && collided1)) {
      continue;
    }

    let contact = false;
    let maxImpulse = 0;
    for (let j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {
      const contactPoint = contactManifold.getContactPoint(j);

      if (contactPoint.getDistance() < 0) {
        contact = true;
        const impulse = contactPoint.getAppliedImpulse();

        if (impulse > maxImpulse) {
          maxImpulse = impulse;
          const pos = contactPoint.get_m_positionWorldOnB();
          const normal = contactPoint.get_m_normalWorldOnB();
          impactPoint.set(pos.x(), pos.y(), pos.z());
          impactNormal.set(normal.x(), normal.y(), normal.z());
        }

        break;
      }
    }

    // If no point has contact, abort
    if (!contact) continue;

    // Subdivision

    const fractureImpulse = 250;

    if (breakable0 && !collided0 && maxImpulse > fractureImpulse) {
      const debris = convexBreaker.subdivideByImpact(
        threeObject0,
        impactPoint,
        impactNormal,
        1,
        2,
        1.5
      );

      const numObjects = debris.length;
      for (let j = 0; j < numObjects; j++) {
        const vel = rb0.getLinearVelocity();
        const angVel = rb0.getAngularVelocity();
        const fragment = debris[j];
        fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
        fragment.userData.angularVelocity.set(
          angVel.x(),
          angVel.y(),
          angVel.z()
        );

        createDebrisFromBreakableObject(fragment);
      }

      objectsToRemove[numObjectsToRemove++] = threeObject0;
      userData0.collided = true;
    }

    if (breakable1 && !collided1 && maxImpulse > fractureImpulse) {
      const debris = convexBreaker.subdivideByImpact(
        threeObject1,
        impactPoint,
        impactNormal,
        1,
        2,
        1.5
      );

      const numObjects = debris.length;
      for (let j = 0; j < numObjects; j++) {
        const vel = rb1.getLinearVelocity();
        const angVel = rb1.getAngularVelocity();
        const fragment = debris[j];
        fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
        fragment.userData.angularVelocity.set(
          angVel.x(),
          angVel.y(),
          angVel.z()
        );

        createDebrisFromBreakableObject(fragment);
      }

      objectsToRemove[numObjectsToRemove++] = threeObject1;
      userData1.collided = true;
    }
  }

  for (let i = 0; i < numObjectsToRemove; i++) {
    removeDebris(objectsToRemove[i]);
  }

  numObjectsToRemove = 0;
}
