uniform sampler2D agents;
void main(){
    vec2 uv = texture2D(agents,uv).xy;
    /* 
        I think that uv is the xy position of the agents (to be drawn).
        So using it for anything other than the agents is stupid.
        The xy position of the screen should be used for that, but gl_Position is being changed to fit uv.
    */
    gl_Position=vec4(uv*2.0-1.,0.,1.);
    gl_PointSize = 1.;
}