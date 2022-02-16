
uniform sampler2D data; // trails.texture
uniform sampler2D heightmap_texture;
uniform sampler2D food_texture;
varying vec2 vUv;
void main(){

    vec4 src = texture2D(data, vUv);
    vec4 food = texture2D(food_texture, vUv);
    // vec2 maxImageSize = vec2(1024, 1024);
    // vec2 minImageSize = vec2(0, 0);
    // vec4 max_location = texture2D(heightmap_texture, fract(maxImageSize));
    // vec4 min_location = texture2D(heightmap_texture, fract(minImageSize));
    
    gl_FragColor = vec4(src.g, food.b, 0.0, 1.); // ggg
    //gl_FragColor = vec4(1., 1., src., 1.);
    //vec4 src = texture2D(heightmap_texture, vUv);
    //gl_FragColor = src;
    // gl_FragColor = texture2D(heightmap_texture, src.xy);
    // gl_FragColor = vec4(gl_FragColor.ggg, 1.);
    //gl_FragColor = vec4( src.ggg, 1. );
    //gl_FragColor.a = 0.2;
    //gl_FragColor = vec4(1.0,0.0,1.0,1.0);
}