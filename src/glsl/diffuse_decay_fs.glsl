
uniform sampler2D points; // render.texture
uniform sampler2D input_texture; // large array that seems to be empty? confuzzled.
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
    
    //blur box size
    const float dim = 1.;

    //weight
    float weight = 1. / pow( 2. * dim + 1., 2. );
    //float weight = 1. / 9.;
    // if (pos - (2. * floor(pos / 2.)) > 0.) {
    //     weight = 1. / 18.;
    // }

    for( float i = -dim; i <= dim; i++ ){
    
        for( float j = -dim; j <= dim; j++ ){
    
            vec3 val = texture2D( input_texture, fract( vUv+res*vec2(i,j) ) ).rgb; // fract returns the decimal on a number. 
            col += val.r * weight + val.g * weight * .5;

        }
    }

    vec4 fin = vec4( pos * decay, col * decay, .5, 1. );
    gl_FragColor = clamp( fin, 0.01, 1. );
    //gl_FragColor = vec4(1,1,1,test);

}