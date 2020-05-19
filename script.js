let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let s = {};
let creatures = [];
s.creatures = creatures;
let food = [];
s.food = food;

setInterval(function(){
    localStorage.setItem("s",JSON.stringify(s) );
},1000);
function createFood(){
    let f = {
        x:Math.floor(Math.random()*canvas.width),
        y:Math.floor(Math.random()*canvas.height),
        width:15,
        height:15
    }
    food.push(f);
}
let generateFirst = 50;
let traits = ["size","speed","hue","offspringTime"];
function reset(){
    localStorage.removeItem("s");
    window.location.href = window.location.href;
}
function createCreature(x,y,parent){
    let mutation = 0.10; //percent 
    let c = {
        x:x,
        y:y,
        traits:{
            speed:Math.floor(Math.random()*10),
            size:Math.floor(Math.random()*50)+10,
            hue:100,
            offspringTime:Math.floor(Math.random()*10)+10
        },
        alivefor:0,
        food:0,
        facing:Math.floor(Math.random()*360)
    };

    
    if (parent != undefined){
        c.place = parent.place;
        
        
        for (p in parent.traits){
            
            
            let parentval = parent.traits[p];
            let isPlus = Math.random() > 0.5;
            let rnd = Math.random() * mutation;
            let mut_multiplier = isPlus ? 1+rnd : 1-rnd;
            let val = mut_multiplier * parentval;
            
            c.traits[p] = val;
            
            /* console.log(mut_multiplier); */
            /* console.log(p, divideSmallerFromBigger(parentval,val)); */
            
        }
        
    }
    creatures.push(c);
    return c;
}
let resiz = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resiz();
onresize = function(){
    resiz();
}
let divideSmallerFromBigger = function(a,b){
    if (a > b){
        return a-b;
    } else {
        return b-a;
    }
}
let getClosestBorder = function(c){
    let middle = {
        x:canvas.width/2,
        y:canvas.height/2
    }
    let closest = {
        
    }
    if (c.x < middle.x){
        closest.x = 0;
    } else {
        closest.x = canvas.width;
    }
    if (c.y < middle.y){
        closest.y = 0;
    } else {
        closest.y = canvas.height;
    }
    if (divideSmallerFromBigger(c.x,closest.x) < divideSmallerFromBigger(c.y,closest.y)){
        return {pos:"x",val:closest.x};
    } else {
        return {pos:"y",val:closest.y};
    }
    
}
let genFood = function(){
    let pixels = canvas.width*canvas.height;
    let foodPerPixel = 1 / 2500;
    let count = Math.floor(foodPerPixel * pixels);
    console.table({
        count,
        pixels,
        foodPerPixel
    });
    for (let i=0; i < count; i++){
        createFood();
    }
}
onload = function(){
    resiz();
    if (localStorage.getItem("s") != undefined){
        s = JSON.parse(localStorage.getItem("s"));
        creatures = s.creatures;
        food = s.food;
        runGeneration();
    } else {
        for (let i=0; i < generateFirst; i++){
            let c = createCreature(
                Math.floor(Math.random()*canvas.width),
                Math.floor(Math.random()*canvas.height),
                {place:i}
            );
            let border = getClosestBorder(c);
            c[border.pos] = border.val;
        }
        resiz();
        genFood();
        runGeneration();
        runXTicks(500);
    }
    
}
let running = false;
let started;
s.generation = 0;
let runGeneration = function(){
    running = true;
    started = Date.now();
}
let outOfBounds = function(c){
    return (c.x < 0 || c.x > canvas.width ||
            c.y < 0 || c.y > canvas.height);
}
let data = {}

let simulate_speed = 5;
function getReproductiveFood(c){
    return c.traits.size/40 * 80;
}
function tryReproduce(i){
    let reproductiveFood = getReproductiveFood(creatures[i]);
    if (creatures[i].food < reproductiveFood){
        creatures.splice(i,1);
    } else {
        if (creatures[i].food >= reproductiveFood){
            createCreature(creatures[i].x,creatures[i].y,creatures[i]);
            
            creatures[i].food -= reproductiveFood;
        }
        
    }
}
let ticks = 0;

function runTick(){
    for (let i=0; i < creatures.length; i++){
        let e = creatures[i];
        e.alivefor++;
        let reproductiveFood = getReproductiveFood(e);
        if (e.food < 150){
            e.x += Math.sin((180/Math.PI)*e.facing) * e.traits.speed;
            e.y -= Math.cos((180/Math.PI)*e.facing) * e.traits.speed;
            e.food -= e.traits.speed/10;
            e.food -= e.traits.size/100;
            if (e.food < -reproductiveFood){
                creatures.splice(i,1);
            }
        }
        
        for (let j=0; j < food.length; j++){
            let f = food[j];
            if (f.x > e.x-e.traits.size/2 && f.x < e.x+e.traits.size/2 &&
                f.y > e.y-e.traits.size/2 && f.y < e.y+e.traits.size/2){
                    food.splice(j,1);
                    j--;
                    e.food += 100;
            }
        }
        if (outOfBounds(e)){
            e.facing += Math.floor(Math.random()*360);
            if (e.facing > 360){
                e.facing -= 360;
            }
        }
        if (e.alivefor % Math.floor(e.traits.offspringTime) == 0){
            tryReproduce(i);
        }
    }
    if (ticks % 1 == 0){
        for (i of new Array(5)){
            createFood();
        }
    }
    ticks++;

}
function runXTicks(num){
    for (let i=0; i < num; i++){
        runTick();
    }
}
let simulate = function(){
    
    if (running){
        runTick();
    }
    
    setTimeout(simulate,simulate_speed);
}
simulate();
function numToBounds(num,min,max){
    while(num > max){
        num = num - max + min;
    }
    return num;
}
let draw = function(){
    
    
    
    

    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    
    for (let i=0; i < creatures.length; i++){
        let e = creatures[i];
        let hue = e.traits.hue/100;
        hue = 360*hue;
        /* hue = numToBounds(360*hue, 0, 360); */
        /* console.table({t:e.traits.hue,hue}); */

        ctx.fillStyle = `hsl(${hue},50%,50%)`;
        
        ctx.fillRect(e.x-e.traits.size/2,e.y-e.traits.size/2,e.traits.size,e.traits.size);
    }
    ctx.fillStyle = "green";
    for (let i=0; i < food.length; i++){
        let e = food[i];
        ctx.fillRect(e.x-e.width/2,e.y-e.height/2,e.width,e.height);
    }




    

    var lc = [...creatures];
    data.creatures = lc.length;
    data.foodEntities = food.length;
    data.avgFood = 0;
    data.avgAge = 0;
    for (let i=0; i < traits.length; i++){
        data["avg_trait_"+traits[i]] = 0;
    }
    data.ticks = ticks;

    
    for (let i=0; i < lc.length; i++){
        
        data.avgFood+=lc[i].food;
        data.avgAge+=lc[i].alivefor;
        for (let j=0; j < traits.length; j++){
            data["avg_trait_"+traits[j]] += lc[i].traits[traits[j]];
        }
        
    }
    data.avgFood = data.avgFood/lc.length;
    data.avgAge = data.avgAge/lc.length;
    for (let i=0; i < traits.length; i++){
        data["avg_trait_"+traits[i]] /= lc.length;
    }
    let innerHTML = "";
    for (p in data){
        innerHTML+=`<b>${p}</b>: ${data[p]}<br>`
    }
    document.getElementById("data").innerHTML = innerHTML;
    requestAnimationFrame(draw);
}
draw();
