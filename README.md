# physarum

[Interactive Demo of Modified Simulation](https://hayden.gg/physarum/build)

This particular fork is a modified version of a Physarum simulation by Nicolas Barradeau that can map over geographic terrain and use food sources for attraction. Analysis of the slime mold to demonstrate natural transport networks (pathfinding) can be found in the paper below.

[Physarum for Effective Transport Networks (2022)](https://drive.google.com/file/d/1AIbqbx7fglW4-EVASQ73j9UP4UPwn18g/view?usp=sharing)

Example with pathfinding over Georgia (US State): 

![Georgia Demo Image](https://img.hayden.gg/3832bf5dafd9d29c6244f470a8df4a30.png)





Original README:

inspired by this [amazing work ](https://www.sagejenson.com/physarum)

implemented from [this paper](http://eprints.uwe.ac.uk/15260/1/artl.2010.16.2.pdf)

you can try the [demo](
https://www.barradeau.com/2019/1103/)
click drag to draw, double click to create a disc with all the particles

the values:
- SA and RA control the changes in direction ( Sensor Angle and Rotation Angle)
- SO and SS are the look ahead distance and step size (speed) respectively.
- radius controls the size of the particle stream when drawing 
- count controls the particle count when drawing 

how to:

> `npm install`

> `npm run dev`

then build with 
> `npm run deploy`

sample images:

![img0](img/img0.png)
![img1](img/img1.png)
![img2](img/img2.png)
![img3](img/img3.png)
![img4](img/img4.png)
