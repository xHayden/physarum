import {
    NearestFilter,
    RGBAFormat,
    FloatType,
    WebGLRenderTarget,
    Scene,
    OrthographicCamera,
    DataTexture,
    Vector2,
    BufferGeometry,
    BufferAttribute,
    Points
} from "three"

export default class RenderTarget {

    constructor(width, height, material, pos, uvs, data=null) {

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

        let rt = new WebGLRenderTarget(this.width, this.height, options)
        this.rt = rt

        if( data == null){
            data = new Float32Array(w*h*4) // 4
        }
        let tex = new DataTexture(data, w, h, RGBAFormat, FloatType) // data goes to tex
        tex.needsUpdate = true;
        rt.texture = tex; // tex goes to rt.texture

        this.material = material
        // for (let i in this.texture.image.data) {
        //     if (this.texture.image.data[i]) {
        //         console.log(this.texture.image.data[i])
        //     }
        // }
        this.material.uniforms["input_texture"] = {value: this.texture}; // rt.texture, tex, data. above check reveals that this is empty?????
        this.material.uniforms["resolution"] = {value : new Vector2(w,h)};
        this.material.uniforms["time"] = {value : 0};
        this.material.transparent = true;

        /*
            Food needs to be an inherent property of a particle.
            Food is a constant. Something does not "become" food.
            It needs to be accessible in both the fragment and vertex shaders.
            Uniform type is best.
            Still needs to be inherent, though.
            Apply as extra position property???
        */

        let pg = new BufferGeometry();
        pg.addAttribute("position", new BufferAttribute(pos, 3, false))
        pg.addAttribute("uv", new BufferAttribute(uvs, 2, true)) // these are used in the vertex shader, vUv is uv in the fragment shader.
        this.mesh = new Points(pg, this.material)
        this.mesh.scale.set(w, h, 1)
        
        this.scene = new Scene();
        this.camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
        this.camera.position.z = 1
        this.scene.add(this.mesh)

    }
    
    render(renderer, time=0) {
        
        this.mesh.visible = true;
        
        this.material.uniforms.time.value = time;

        renderer.setSize( this.width, this.height )
        renderer.setRenderTarget(this.rt)
        renderer.render(this.scene, this.camera)
        renderer.setRenderTarget(null)
        this.mesh.visible = false;
        
    }
    get texture () {
        // for (let i in this.rt.texture.image.data) {
        //     //console.log(this.rt.texture)
        //     if (this.rt.texture.image.data[i]) {
        //         console.log(i)
        //     }
        // }
        return this.rt.texture
    }

}