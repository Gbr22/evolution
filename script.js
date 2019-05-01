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
let traits = ["size","speed"];
function createCreature(x,y,parent){
    let mutation = 10;
    let c = {
        x:x,
        y:y,
        traits:{
            speed:Math.floor(Math.random()*10),
            size:Math.floor(Math.random()*50)+10
        },
        food:0,
        facing:Math.floor(Math.random()*360)
    };

    if (parent != undefined){
        c.place = parent.place;
        for (p in parent.traits){
            let t = parent.traits[p];
            let t_mutation = t/100*mutation;
            let mut = Math.floor(Math.random()*t_mutation*2-t_mutation);
            c.traits[p] = parent.traits[p]+mut;
        }
        
    }
    creatures.push(c);
    return c;
}
let resiz = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
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
    for (let i=0; i < 100; i++){
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
    }
    
}
let running = false;
let started;
s.generation = 0;
let runGeneration = function(){
    started = Date.now();
    running = true;
    s.generation++;
}
let outOfBounds = function(c){
    return (c.x < 0 || c.x > canvas.width ||
            c.y < 0 || c.y > canvas.height);
}
let data = {}

let simulate_speed = 2;
function getReproductiveFood(c){
    return c.traits.size/40 * 50;
}
let simulate = function(){
    
    if (running){
        
        for (let i=0; i < creatures.length; i++){
            let e = creatures[i];
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

        }
        
        if (Date.now() - started > 10000/simulate_speed){
            running = false;
            for (let i=0; i < creatures.length; i++){
                let reproductiveFood = getReproductiveFood(creatures[i]);
                if (creatures[i].food < reproductiveFood){
                    creatures.splice(i,1);
                } else {
                    while (creatures[i].food >= reproductiveFood){
                        createCreature(creatures[i].x,creatures[i].y,creatures[i]);
                        
                        creatures[i].food -= reproductiveFood;
                    }
                    
                }
            }
        }
    } else {
        
        genFood();
        runGeneration();
        
    }
    setTimeout(simulate,simulate_speed);
}
simulate();
let draw = function(){
    
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    
    for (let i=0; i < creatures.length; i++){
        let e = creatures[i];
        let hue = e.place/generateFirst;
        hue = 360*hue;

        ctx.fillStyle = `hsl(${hue},50%,50%)`;
        
        ctx.fillRect(e.x-e.traits.size/2,e.y-e.traits.size/2,e.traits.size,e.traits.size);
    }
    ctx.fillStyle = "green";
    for (let i=0; i < food.length; i++){
        let e = food[i];
        ctx.fillRect(e.x-e.width/2,e.y-e.height/2,e.width,e.height);
    }




    


    data.creatures = creatures.length;
    data.foodEntities = food.length;
    data.avgFood = 0;
    for (let i=0; i < traits.length; i++){
        data["avg_trait_"+traits[i]] = 0;
    }
    data.generation = s.generation;
    for (let i=0; i < creatures.length; i++){
        data.avgFood+=creatures[i].food;
        for (let i=0; i < traits.length; i++){
            data["avg_trait_"+traits[i]] += creatures[i].traits[traits[i]];
        }
    }
    data.avgFood = data.avgFood/creatures.length;
    for (let i=0; i < traits.length; i++){
        data["avg_trait_"+traits[i]] /= creatures.length;
    }
    let innerHTML = "";
    for (p in data){
        innerHTML+=`<b>${p}</b>: ${data[p]}<br>`
    }
    document.getElementById("data").innerHTML = innerHTML;
    requestAnimationFrame(draw);
}
draw();
