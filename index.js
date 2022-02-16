import 'file-loader?name=[name].[ext]!./src/html/index.html';
import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    Mesh,
    DataTexture,
    RGBAFormat,
    FloatType,
    PlaneBufferGeometry,
    ShaderMaterial,
    Vector2,
    TextureLoader,
    Sprite,
    MeshBasicMaterial,
    RepeatWrapping,
    RGBFormat,
} from 'three';
import PingpongRenderTarget from "./src/PingpongRenderTarget"
import RenderTarget from "./src/RenderTarget"
import dat from "dat.gui";
import Controls from "./src/Controls";


// 0 configure scene
//////////////////////////////////////

let w = window.innerWidth
let h = window.innerHeight

const renderer = new WebGLRenderer({
    alpha: true
});
document.body.appendChild(renderer.domElement);
renderer.setSize(w, h);
const scene = new Scene();
const camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
camera.position.z = 1

// 1 init buffers 
//////////////////////////////////////

let size = 1440 // particles amount = ( size ^ 2 )

let count = size * size;
let pos = new Float32Array(count * 3)
let uvs = new Float32Array(count * 2)
let ptexdata = new Float32Array(count * 4)
// let food = new Float32Array(count * 3); // value for if food, and concentration

let id = 0, u,v;
for (let i = 0; i < count; i++) {

    //point cloud vertex 
    id = i * 3
    pos[id++] = pos[id++] = pos[id++] = 0;

    //computes the uvs
    u = (i % size) / size;
    v = ~~(i / size) / size;
    id = i * 2
    uvs[id++] = u
    uvs[id] = v

    //particle texture values (agents)
    id = i * 4
    ptexdata[id++] = Math.random() // normalized pos x
    ptexdata[id++] = Math.random() // normalized pos y
    ptexdata[id++] = Math.random() // normalized angle
    ptexdata[id++] = 1
}

let foodNodes = [0, 0, 1, 1, 1, 1] // (0, 0) and (w, h) are the corners of the screen 1 is concentration.
// these values are normalized so its actually 0 0 and 1 1
let foodData = new Float32Array(w*h*3);
// x, y, foodValue
let y = -1;
let debugObject = {
    x: 0,
    y: 0,
    distanceBetween: 0,
    foodX: 0,
    foodY: 0,
    foodValue: 0
}
for (let i = 0; i < foodData.length; i+=3) {
    if ((i/3) % (w) == 0) {
        y++;
    }
    foodData[i] = ((i/3) - (y*w)) / w;
    foodData[i + 1] = y / h;
}
for (let i = 0; i < foodNodes.length/3; i++) {
    let foodX = foodNodes[i*3];
    let foodY = foodNodes[i*3+1];
    let foodStrength = foodNodes[i*3+2];
    for (let j = 0; j < foodData.length/3; j++) {
        let x = foodData[j*3];
        let y = foodData[j*3+1]; // these are normalized
        let distanceBetween = Math.abs(Math.sqrt(Math.pow(foodX - x, 2) + Math.pow(foodY - y, 2)));
        let foodValue = Math.abs(foodStrength * (1 - distanceBetween));
        foodData[j*3+2]+=foodValue; // this could be wrong
        debugObject.x = x;
        debugObject.y = y;
        debugObject.distanceBetween = distanceBetween;
        debugObject.foodX = foodX;
        debugObject.foodY = foodY;
        debugObject.foodValue = foodValue;
    }
}



// 2 data & trails 
//////////////////////////////////////

//performs the diffusion and decay 
let diffuse_decay = new ShaderMaterial({
    uniforms: {
        points: { value: null },
        decay: {value: .9 }        
    },
    opacity: 0.5,
    vertexShader: require('./src/glsl/quad_vs.glsl'),
    fragmentShader: require('./src/glsl/diffuse_decay_fs.glsl')
})
let trails = new PingpongRenderTarget(w, h, diffuse_decay, null, foodData)


// 3 agents 
//////////////////////////////////////

//moves agents around
const heightmapTexture = new TextureLoader().load( "heightmaps/georgia.png" );
heightmapTexture.wrapT = RepeatWrapping;
heightmapTexture.repeat.y = - 1;

const heightmapMaterial = new MeshBasicMaterial( {
    map: heightmapTexture,
    transparent: true,
    opacity: 0.6,
 } );
//var sprite = new Sprite( heightmapMaterial );

let update_agents = new ShaderMaterial({
    uniforms: {
        data: { value: null },
        sa: { value: 2 }, // sensor angle
        ra: { value: 4 }, // rotation angle
        so: { value: 12 }, // look ahead distance
        ss: { value: 1.1 }, // step size (speed)
        heightmap_texture: { value: heightmapTexture },
        hl: { value: 0.28 }, // height level
    },
    vertexShader: require('./src/glsl/quad_vs.glsl'),
    fragmentShader: require('./src/glsl/update_agents_fs.glsl'),
    opacity: 0.5
})
let agents = new PingpongRenderTarget(size, size, update_agents, ptexdata)


// 4 point cloud
//////////////////////////////////////

//renders the updated agents as red dots 
let render_agents = new ShaderMaterial({
    vertexShader: require('./src/glsl/render_agents_vs.glsl'),
    fragmentShader: require('./src/glsl/render_agents_fs.glsl')
})
let render = new RenderTarget(w,h,render_agents, pos, uvs) // no data is sent


// 5 post process
//////////////////////////////////////

//post process the result of the trails (render the trails as greyscale)
let foodTex = new DataTexture(foodData, w, h, RGBFormat, FloatType);
console.log(foodTex);
let postprocess = new ShaderMaterial({
    uniforms: {
        data: {
            value: null
        },
        heightmap_texture: {
            value: heightmapTexture
        },
        food_texture: {
            value: new DataTexture(foodData, w, h, RGBFormat, FloatType)
        }
    },
    opacity: 0.5,
    vertexShader: require('./src/glsl/quad_vs.glsl'),
    fragmentShader: require('./src/glsl/postprocess_fs.glsl')
});
console.log(foodData)
let diffuse_decay_mesh = new Mesh(new PlaneBufferGeometry(), diffuse_decay);
let postprocess_mesh = new Mesh(new PlaneBufferGeometry(), postprocess)
var heightmapMesh = new Mesh(new PlaneBufferGeometry(), heightmapMaterial);
heightmapMesh.scale.set(w, h, 1)
postprocess_mesh.scale.set(w, h, 1)
heightmapMesh.renderOrder = 1;
postprocess_mesh.renderOrder = 0;
//scene.add(diffuse_decay_mesh)

scene.add(postprocess_mesh)


//console.log(heightmapMesh)
scene.add(heightmapMesh);

// 6 interactive controls 
//////////////////////////////////////
let controls = new Controls( renderer, agents )
controls.count = ~~(size * size * .05)


// animation loop 
//////////////////////////////////////

let triggered = false;
function raf(){
    if (time > 2 && !triggered) {
        //console.log(uvs);
        triggered = true;
    //     let values = {};
    //     for (let i of render.texture.image.data) {
    //         values[i] = true
    //     }
    //     console.log(render.texture.image.data.length)
    }
    requestAnimationFrame(raf)

    time = (Date.now() - start) * 0.001
    
    trails.material.uniforms.points.value = render.texture
    trails.render( renderer, time )
    
    agents.material.uniforms.data.value = trails.texture
    agents.render(renderer, time)
    
    render.render( renderer, time )
    
    postprocess_mesh.material.uniforms.data.value = trails.texture
    renderer.setSize(w,h)
    renderer.clear()
    renderer.render(scene, camera)
    
}

//////////////////////////////////////////////////

let materials = [
    diffuse_decay, update_agents, render_agents
]
let resolution = new Vector2(w,h);
materials.forEach( (mat)=>{mat.uniforms.resolution.value = resolution})

let start = Date.now();
let time = 0;

raf()

// settings
//////////////////////////////////////////////////

let gui = new dat.GUI()
gui.add(diffuse_decay.uniforms.decay, "value", 0.01, .99, .01).name("decay")
gui.add(update_agents.uniforms.sa, "value", 1, 90, .1).name("sa")
gui.add(update_agents.uniforms.ra, "value", 1, 90, .1).name("ra")
gui.add(update_agents.uniforms.so, "value", 1, 90, .1).name("so")
gui.add(update_agents.uniforms.ss, "value", 0.1, 10, .1).name("ss")
gui.add(update_agents.uniforms.hl, "value", 0.01, 4, .001).name("hl")
gui.add(controls, "random")
gui.add(controls, "radius",.001,.25)
gui.add(controls, "count", 1,size*size, 1)