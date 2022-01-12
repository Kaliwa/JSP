import * as THREE from "three";
import Stats from "/jsm/libs/stats.module.js";
import { FirstPersonControls } from "/jsm/controls/FirstPersonControls.js";
import { GUI } from "/jsm/libs/dat.gui.module.js";
import { ColladaLoader } from "/jsm/loaders/ColladaLoader.js";
import { ConvexObjectBreaker } from '/jsm/misc/ConvexObjectBreaker.js';
import { ConvexGeometry } from '/jsm/geometries/ConvexGeometry.js';
import { AxesHelper } from "three";
let clock = new THREE.Clock();
let rotationSpeed = 0.003;
let rotate = false;

const startButton = document.getElementById('image');
startButton.addEventListener('click', overlayRemove);
function overlayRemove(){
const overlay = document.getElementById('overlay');
    document.querySelector('html').style.backgroundColor = 'rgb(47, 146, 228)';
    overlay.remove();
    init();
}


function init() {

stats();
renderer();
camera();
controls();
scene();
ground();
axesHelper();
ambientLight();
pointLight();
animate();
panel();
city();
skybox();
onWindowResize();
window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
}
function scene(){
    scene = new THREE.Scene();
}
function animate(){
    requestAnimationFrame(animate);
    stats.update();
    const delta = clock.getDelta();
    controls.update(delta);
    scene.rotation.y += rotationSpeed * rotate;
    renderer.render(scene, camera);
}
function panel(){
    var params = {
        rotationSpeed:0.001,
        switch:false,
        helper:false,
    };
    const gui = new GUI({width:320});
    
    const cameraFolder = gui.addFolder("Camera");
    cameraFolder
    .add(params, "switch")
    .name("Auto rotation")
    .onChange(() =>{
        rotate = !rotate;
    });
    cameraFolder
    .add(params, "rotationSpeed", -0.1, 0.1)
    .name("Rotation Speed")
    .onChange((speed) => {
        rotationSpeed = speed;
    });
    cameraFolder
    .add(params, "helper")
    .name("Axes Helper")
    .onChange(() => {
        AxesHelper.visible = !axesHelper.visible;
    });

    const lightFolder = gui.addFolder("Lights");
    const ambientLightFolder = lightFolder.addFolder("Ambient Light");
    ambientLightFolder.add(ambientLight, "intensity", 0, 1).name("Intensity");
    const pointLightFolder = lightFolder.addFolder("point Light");
    pointLightFolder.add(pointLight, "intensity", 0, 1).name("Intensity");
    pointLightFolder.add(pointLight.position, "x", -5000, 5000).name("X");
    pointLightFolder.add(pointLight.position, "y", 0, 10000).name("Y");
    pointLightFolder.add(pointLight.position, "z", -5000, 5000).name("Z");
    

}
function renderer() {
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.ShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

}
function controls(){
    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 10000;
    controls.lookSpeed = 0.6;
    controls.noFly = true;
    controls.lookVertical = false;
    
}
function camera(){
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000000);
    camera.position.set(10000,2000,-400);
    camera.lookAt(1000,2000,400);
}
function ground(){
    let groundGeometry = new THREE.BoxGeometry(10000000, 1, 10000000);
    let groundTexture = new THREE.TextureLoader().load("textures/cobble.jpg");;
    let groundMaterial = new THREE.MeshPhongMaterial({map: groundTexture});
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10000,10000);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);
}
function axesHelper(){
    axesHelper = new THREE.AxesHelper(10000);
    axesHelper.visible = false;
    scene.add(axesHelper);
}
function ambientLight(){
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8, 0);
    scene.add(ambientLight);
}
function pointLight(){
    pointLight = new THREE.PointLight(0xffffff, 0.6, 0);
    pointLight.position.set(10000,100000,100000);

    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 400000;
    pointLight.castShadow = true;
    scene.add(pointLight);
}
function stats(){
    stats = new Stats();
    document.body.appendChild(stats.dom)
}
function skybox(){
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load( 'textures/cube/ft.jpg');
    let texture_bk = new THREE.TextureLoader().load( 'textures/cube/bk.jpg');
    let texture_up = new THREE.TextureLoader().load( 'textures/cube/up.jpg');
    let texture_dn = new THREE.TextureLoader().load( 'textures/cube/dn.jpg');
    let texture_rt = new THREE.TextureLoader().load( 'textures/cube/rt.jpg');
    let texture_lf = new THREE.TextureLoader().load( 'textures/cube/lf.jpg');
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
       
    for (let i = 0; i < 6; i++)
      materialArray[i].side = THREE.BackSide;
       
    let skyboxGeo = new THREE.BoxGeometry( 10000000, 10000000, 10000000);
    let skybox = new THREE.Mesh( skyboxGeo, materialArray );
    scene.add( skybox );
}
function city(){
    let buildingTexture = new THREE.TextureLoader().load( 'textures/Building/iron.jpg');
    let buildingGeometry = new THREE.BoxGeometry(5000,15000,5000);
    let buildingMaterial = new THREE.MeshPhongMaterial({map:buildingTexture});
    

    let building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 7550;
    building.position.x = 400;
    building.position.z = -400;
    building.receiveShadow = true;
    building.castShadow = true;
    scene.add( building );

    let midTexture = new THREE.TextureLoader().load( 'textures/Building/iron.jpg');
    let midGeometry = new THREE.BoxGeometry(3000,12000,3000);
    let midMaterial = new THREE.MeshPhongMaterial({map:buildingTexture});

    let mid = new THREE.Mesh(midGeometry, midMaterial);
    mid.position.y = 15500;
    mid.position.x = 400;
    mid.position.z = -400;
    mid.receiveShadow = true;
    mid.castShadow = true;
    scene.add( mid );


    let hatTexture = new THREE.TextureLoader().load( 'textures/Building/iron.jpg');
    let hatGeometry = new THREE.BoxGeometry(1500,12000,1500);
    let hatMaterial = new THREE.MeshPhongMaterial({map:hatTexture});

    let hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 25000;
    hat.position.x = 400;
    hat.position.z = -400;
    hat.receiveShadow = true;
    hat.castShadow = true;
    scene.add( hat );
}