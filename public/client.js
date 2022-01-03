import * as THREE from "three";
import Stats from "/jsm/libs/stats.module.js";
import { FirstPersonControls } from "/jsm/controls/FirstPersonControls.js";
import { GUI } from "/jsm/libs/dat.gui.module.js";
import { ColladaLoader } from "/jsm/loaders/ColladaLoader.js";
import { AxesHelper } from "three";
let clock = new THREE.Clock();
let rotationSpeed = 0.003;
let rotate = false;

init();

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
skybox();
winResize();
}


function scene(){
    scene = new THREE.Scene();
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    document.body.appendChild(renderer.domElement);

}
function controls(){
    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 400;
    controls.lookSpeed = 0.3;
    controls.noFly = true;
    controls.lookVertical = false;
}
function camera(){
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(400,400,-400);
    camera.lookAt(0,400,0);

}
function ground(){
    let groundGeometry = new THREE.BoxGeometry(100000, 0.01, 100000);
    let groundTexture = new THREE.TextureLoader().load("textures/cobble.jpg");;
    let groundMaterial = new THREE.MeshPhongMaterial({map: groundTexture});
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50,50);
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
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6, 0);
    scene.add(ambientLight);
}
function pointLight(){
    pointLight = new THREE.PointLight(0xffffff, 0.6, 0);
    pointLight.position.set(3000,6000,0);

    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 35000;
    pointLight.castShadow = true;
    scene.add(pointLight);
}
function stats(){
    stats = new Stats();
    document.body.appendChild(stats.dom)
}
function winResize(){
    window.addEventListener("resize", onWindowResize);
}
function skybox(){
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load( 'textures/cube/front.jpg');
    let texture_bk = new THREE.TextureLoader().load( 'textures/cube/back.jpg');
    let texture_up = new THREE.TextureLoader().load( 'textures/cube/up.jpg');
    let texture_dn = new THREE.TextureLoader().load( 'textures/cube/down.jpg');
    let texture_rt = new THREE.TextureLoader().load( 'textures/cube/right.jpg');
    let texture_lf = new THREE.TextureLoader().load( 'textures/cube/left.jpg');
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
       
    for (let i = 0; i < 6; i++)
      materialArray[i].side = THREE.BackSide;
       
    let skyboxGeo = new THREE.BoxGeometry( 10000, 10000, 10000);
    let skybox = new THREE.Mesh( skyboxGeo, materialArray );
    scene.add( skybox );
}