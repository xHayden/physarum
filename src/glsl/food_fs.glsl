uniform sampler2D food_texture;
varying vec2 vUv;
void main(){
    vec4 food = texture2D(food_texture, vUv);
    gl_FragColor = vec4(food.b, food.b, 0., 1.);
    // g -- up is 1
    // r -- left is 1
}