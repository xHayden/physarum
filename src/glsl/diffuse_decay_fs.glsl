
uniform sampler2D points; // render.texture
uniform sampler2D input_texture; // large array that seems to be empty? confuzzled.
uniform sampler2D food_texture; // food texture :)
uniform vec2 resolution;
uniform float time;
uniform float decay;
varying vec2 vUv;
// Varyings are variables that are passed from the vertex shader to the fragment shader. For each fragment, the value of each varying will be smoothly interpolated from the values of adjacent vertices.
void main(){

    vec2 res = 1. / resolution;
    float pos = texture2D(points, vUv).r;
    
    //accumulator
    float col = 0.;
    float foodCol = 0.;
    
    //blur box size
    const float dim = 1.;

    //weight
    float weight = 1. / pow( 2. * dim + 1., 2. );
    //float weight = 1. / 9.;
    // if (pos - (2. * floor(pos / 2.)) > 0.) {
    //     weight = 1. / 18.;
    // }

    for( float i = -dim; i <= dim; i++ ){ // -1, 0, 1
        for( float j = -dim; j <= dim; j++ ){ // 9 elements now, in a square around point 0,0
            vec3 val = texture2D( input_texture, fract( vUv+(res*vec2(i,j)) ) ).rgb; // fract returns the decimal on a number. 
            // retrieves the textel at coordinates fract( vUv+res*vec2(i,j) ) ).rgb on the input texture.
            // uv is the coordinates, res is the resolution of the texture, 1/vec2(width, height), vec2(i,j) is the position in relation to the center particle.
            // .rgb returns the first three values of the texture.
            // example: [5, 9] + ([1/10, 1/10] * [-1, 1]) = [-1/10, 1/10] + [5, 9] = [4.9, 9.1]
            // fract is going to change that to [.9, 0.1]
            // the input texture at that position is 0? input_texture has no data, I thought?
            // something about that and vUv is wrong in my head.
            col += val.r * weight + val.g * weight * .5;
        }
    }


    const float foodRadius = 40.;
    // for( float i = -foodRadius; i <= foodRadius; i++ ){ // -1, 0, 1
    //     for( float j = -foodRadius; j <= foodRadius; j++ ){ // 9 elements now, in a square around point 0,0
    //         // vec3 val2 = texture2D(food_texture, fract(vUv +(vec2(i, j)*res))).rgb;

    //         // this sampling is not going to work because the input texture is different than the food texture.
    //         // food has (x, y, foodStrength)
    //         // input has (normalizedX, normalizedY, angle, 1)
    //         // so first I have to normalize the food texture.

    //         // fract returns the decimal on a number. 
    //         // retrieves the textel at coordinates fract( vUv+res*vec2(i,j) ) ).rgb on the input texture.
    //         // uv is the coordinates, res is the resolution of the texture, 1/vec2(width, height), vec2(i,j) is the position in relation to the center particle.
    //         // .rgb returns the first three values of the texture.
    //         // example: [5, 9] + ([1/10, 1/10] * [-1, 1]) = [-1/10, 1/10] + [5, 9] = [4.9, 9.1]
    //         // fract is going to change that to [.9, 0.1]
    //         // the input texture at that position is 0? input_texture has no data, I thought?
    //         // something about that and vUv is wrong in my head.
    //         // float foodWeight = 10000.;//val2.b;
    //         // foodCol += val2.r * foodWeight + val2.g * foodWeight * .5;

    //         // this is done for every pixel so is this even the right implementation?
    //         // shouldnt I create a foodCol of a large value at every pixel in n range?
    //         // in that case, it should loop through every nearby pixel and see if that pixel is food.

    //         // another approach is to create the food texture with the diffuses on it initially.
    //         // that is probably better, as it doesn't have to be calculated every frame.
    //     }
    // }
    //float foodStrength = texture2D(food_texture, vUv).r;
    //foodStrength = vUv.x;

    vec4 fin = vec4( pos * decay, (col) * decay, .5, 1. );
    gl_FragColor = clamp( fin, 0.01, 10. );
    //gl_FragColor = fin;
    //gl_FragColor = vec4(1,1,1,test);

}