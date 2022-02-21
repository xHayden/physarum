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

let foodNodes = [
                1, 0, 1, 1, 
                0, 1, 1, 1
            ] // (0, 0) and (w, h) are the corners of the screen 1 is concentration.
// these values are normalized so its actually 0 0 and 1 1
let foodData = new Float32Array(w*h*4);
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
console.log(uvs.length / 3)
console.log(foodData.length / 4)
for (let i = 0; i < foodData.length; i+=4) {
    // foodData[i] = uvs[(i/4)];
    // foodData[i+1] = uvs[(i/4) + 1];
    if ((i/4) % (w) == 0) {
        y++;
    }
    foodData[i] = ((i/4) - (y*w)) / w;
    foodData[i + 1] = y / h;
}
// it seems like uvs only render at the location of the particles
// we need to render food everywhere, so is this not an option?
let debugObjects = [];
for (let i = 0; i < foodNodes.length/4; i++) {
    let foodX = foodNodes[i*4];
    let foodY = foodNodes[i*4+1];
    let foodStrength = foodNodes[i*4+2];
    let radius = 1.4;
    let steepness = 3;
    for (let j = 0; j < foodData.length/4; j++) {
        debugObject = {}
        let x = foodData[j*4];
        let y = foodData[j*4+1]; // these are normalized
        let distanceBetween = Math.abs(Math.sqrt(Math.pow(foodX - x, 2) + Math.pow(foodY - y, 2)));
        let foodValue;
        if (distanceBetween < radius) {
            let percentageOfMaximumDistance = (1.4143 - (distanceBetween))/1.4143;
            foodValue = Math.sin(Math.PI/2 * Math.pow(percentageOfMaximumDistance, steepness))
        }
        else {
            foodValue = 0;
        }
        foodData[j*4+2] += (foodStrength) * foodValue; // this could be wrong
        debugObject.x = x;
        debugObject.y = y;
        debugObject.distanceBetween = distanceBetween;
        debugObject.foodX = foodX;
        debugObject.foodY = foodY;
        debugObject.foodValue = foodValue;
        debugObject.foodStrength = foodStrength;
        let alpha = 1;
        foodData[j * 4 + 3] = alpha;
        debugObjects.push(debugObject);
    }
}
console.log(debugObjects[0])
let foodTex = new DataTexture(foodData, w, h, RGBAFormat, FloatType);
foodTex.needsUpdate = true;
console.log(foodData)
// x, y, foodValue accum, alpha

// 2 data & trails 
//////////////////////////////////////

//performs the diffusion and decay 
let diffuse_decay = new ShaderMaterial({
    uniforms: {
        points: { 
            value: null 
        },
        decay: {
            value: .9 
        },
        food_texture: {
            value: foodTex
        }
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
        hl: { value: 0.0005 }, // height level
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
let postprocess = new ShaderMaterial({
    uniforms: {
        data: {
            value: null
        },
        heightmap_texture: {
            value: heightmapTexture
        },
        food_texture: {
            value: foodTex
        }
    },
    transparent: true,
    opacity: 1,
    vertexShader: require('./src/glsl/quad_vs.glsl'),
    fragmentShader: require('./src/glsl/postprocess_fs.glsl'),
});

let foodMaterial = new ShaderMaterial({
    uniforms: {
        food_texture: {
            value: foodTex
        }
    },
    opacity: 0.1,
    transparent: true,
    vertexShader: require('./src/glsl/food_vs.glsl'),
    fragmentShader: require('./src/glsl/food_fs.glsl'),
})

let diffuse_decay_mesh = new Mesh(new PlaneBufferGeometry(), diffuse_decay);
let postprocess_mesh = new Mesh(new PlaneBufferGeometry(), postprocess)
var heightmapMesh = new Mesh(new PlaneBufferGeometry(), heightmapMaterial);
var foodMesh = new Mesh(new PlaneBufferGeometry(), foodMaterial);
heightmapMesh.scale.set(w, h, 1)
postprocess_mesh.scale.set(w, h, 1)
foodMesh.scale.set(w, h, 1);
foodMesh.renderOrder = 1;
heightmapMesh.renderOrder = 2;
postprocess_mesh.renderOrder = 0;
//scene.add(diffuse_decay_mesh)

scene.add(postprocess_mesh)


heightmapMesh.material.needsUpdate = true;
postprocess_mesh.material.needsUpdate = true;
scene.add(heightmapMesh);

//scene.add(foodMesh);
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
materials.forEach( (mat)=>{mat.uniforms.resolution.value = resolution;})

let start = Date.now();
let time = 0;

raf()

// settings
//////////////////////////////////////////////////

let gui = new dat.GUI()
gui.add(diffuse_decay.uniforms.decay, "value", 0.01, .99, .01).name("Decay Factor")
gui.add(update_agents.uniforms.sa, "value", 1, 90, .1).name("Sensor Angle (sa)")
gui.add(update_agents.uniforms.ra, "value", 1, 90, .1).name("Rotation Angle (ra)")
gui.add(update_agents.uniforms.so, "value", 1, 90, .1).name("Scaling Factor (so)")
gui.add(update_agents.uniforms.ss, "value", 0.1, 10, .1).name("Sensor Speed (ss)")
gui.add(update_agents.uniforms.hl, "value", 0.00001, 1, .0001).name("Minimum Height Level for Movement").onChange((value) => {
    //update_agents.uniforms.hl = value
})
gui.add(controls, "random").name("Spawn at center")
gui.add(controls, "radius",.001,.25)
gui.add(controls, "count", 1,size*size, 1)

let heightmapOption = {
    heightmap: "georgia"
}
let heightmaps = {
    georgia: "heightmaps/georgia.png",
    florida: "heightmaps/florida.png",
    balkans: "heightmaps/balkans.png",
    sanfranscisco_bay: "heightmaps/sanfranscisco_bay.png",
    germany: "heightmaps/germany.png",
    manaus_amazon: "heightmaps/amazon_manaus.png",
    japan: "heightmaps/japan.png",
    australia_melbourne: "heightmaps/australia_melbourne.png",
    brazil_rio: "heightmaps/brazil_rio.png",
    france_paris: "heightmaps/france_paris.png",
    london: "heightmaps/london.png",
    new_york_city: "heightmaps/new_york_city.png",
    spain_madrid: "heightmaps/spain_madrid.png",
    texas_houston: "heightmaps/texas_houston.png",
    northern_ireland: "heightmaps/northern_ireland.png",
    brunei: "heightmaps/brunei.png",
    singapore: "heightmaps/singapore.png",
}
gui.add(heightmapOption, "heightmap", heightmaps).name("Heightmap").onChange((value) => {
    let heightmapTexture = new TextureLoader().load( value );
    heightmapTexture.wrapT = RepeatWrapping;
    heightmapTexture.repeat.y = - 1;
    let heightmapMaterial = new MeshBasicMaterial( {
        map: heightmapTexture,
        transparent: true,
        opacity: 0.6,
     } );
    heightmapMesh.material = heightmapMaterial;
    update_agents.uniforms.heightmap_texture.value = heightmapTexture;
    postprocess.uniforms.heightmap_texture.value = heightmapTexture;
})