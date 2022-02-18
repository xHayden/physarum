import {
    NearestFilter,
    RGBAFormat,
    RGBFormat,
    FloatType,
    WebGLRenderTarget,
    Scene,
    OrthographicCamera,
    PlaneBufferGeometry,
    Mesh,
    DataTexture,
    Vector2
} from "three"

export default class PingpongRenderTarget {

    constructor(width, height, material, data = null, food = null) { // data is ptexdata
        if(data === null) {
            this.textureName = "diffuse_decay"
        }
        else {
            this.textureName = "update_agents"
        }
        this.width = width,
        this.height = height;
        let w = width;
        let h = height;
        let options = {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            type: FloatType
        }

        let rt_a = new WebGLRenderTarget(this.width, this.height, options)
        // rt_a.texture ends up being the texture passed as input
        // the texture is what ends up being data
        let rt_b = new WebGLRenderTarget(this.width, this.height, options)

        this.rt_a = rt_a
        this.rt_b = rt_b
        this.current = this.rt_a
        this.next = this.rt_b

        if( data == null){
            data = new Float32Array(w*h*4) // if !diffuse_decay
        }
        if (food == null) {
            food = new Float32Array(6) // if !food
        }

        // console.log(foodData)
        // console.log(debugObject)



        // let foodTex = new DataTexture(food, w, h, RGBFormat, FloatType)
        //console.log(foodTex);
        let tex = new DataTexture(data, w, h, RGBAFormat, FloatType)
        //console.log(tex)
        tex.needsUpdate = true;
        rt_a.texture = tex.clone()
        rt_b.texture = tex;

        this.material = material        
        this.material.uniforms["input_texture"] = {value: this.texture}; // Place for input_texture, coming from data, ptexdata
        // this.material.uniforms["food_texture"] = {value : foodTex };
        //this.material.uniforms["heightmap_texture"] = {value: this.heightmap_texture}; // my naive self thinking that this was relevant for this shader
        this.material.uniforms["resolution"] = {value : new Vector2(w,h)};
        this.material.uniforms["time"] = {value : 0};
        
        this.material.transparent = true;

        this.mesh = new Mesh(new PlaneBufferGeometry(), this.material)
        this.mesh.scale.set(w, h, 1)

        this.scene = new Scene();
        this.camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
        this.camera.position.z = 1
        this.scene.add(this.mesh)

    }
    
    switch () {
        this.current = this.current == this.rt_a ? this.rt_b : this.rt_a,
        this.next = this.current == this.rt_a ? this.rt_b : this.rt_a
    }
    
    render(renderer, time=0) {
        
        this.switch()
        this.mesh.visible = true;
        
        this.material.uniforms.input_texture.value = this.texture;
        if (this.textureName !== "diffuse_decay") {
            //console.log(this.texture)
        }
        this.material.uniforms.time.value = time;

        renderer.setSize( this.width, this.height )
        renderer.setRenderTarget(this.next)
        renderer.render(this.scene, this.camera)
        renderer.setRenderTarget(null)
        this.mesh.visible = false;
        
    }

    get texture () {
        return this.current.texture
        
    }

}