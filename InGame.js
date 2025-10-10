const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = 1280;
canvas.height = 720;
ctx.antiAliasing = false;
let mapWidth = 20;
let mapHeight = 20;
let blockSize = 10;
let plr = {x: (mapWidth*blockSize)*2048+(mapWidth/2)*blockSize-5, y: (mapHeight*blockSize)*2048+(mapHeight/2)*blockSize+5, d: 0, vx: 0, vy: 0, radius: 1, moveSpeed: 0, moveDirction: 0, alive: false};
let FOV = Math.PI/2;
let QUALITY = 128;
let keysDown = {};
let returnQuality = 0.1;
const WALLHEIGHT = 4000;
let viewDistance = 1500;
let mouseDX = 0;
let mouseDY = 0;
let mouseX, mouseY = 0;
let mousetimeoutFrames = 0;
let then = Date.now();
let deltaTime = 0.1;
let dv = (canvas.width/2)/Math.tan(FOV/2);
let started = false;
let temporaryRaycastData = [];
let score = 0;
const RESISTANCE = 1.2;
if(Number(localStorage.getItem("HighScore")) == NaN){
    localStorage.setItem("HighScore", 0);
}
let pB = Math.round(Number(localStorage.getItem("HighScore")));
const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
grad.addColorStop(0, 'rgb(128, 128, 128)');
grad.addColorStop(0.5, "black");
grad.addColorStop(1, 'rgb(128, 96, 32)');
class Entity {
    constructor(image, sound, speed, range, x, y, volume) {
        this.img = new Image(50, 50);
        this.img.src = image;
        this.sound = new Audio(sound);
        this.sound.loop = true;
        this.speed = speed;
        this.range = range;
        this.x = x;
        this.y = y;
        this.d = 0;
        this.mv = volume;
        this.type = 'entity';
        this.vx = 0;
        this.vy = 0;
    }
}
class ExitPortal {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    spawn(){
        this.x = plr.x + (Math.random()-0.5)*400;
        this.y = plr.y + (Math.random()-0.5)*400;
        if(getDistanceFrom(this.x, this.y, plr.x, plr.y) < 100){
            this.spawn();
        }
    }
}
let map = [
    1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1,
    1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1,
    0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0,
    1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0,
    1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1,
    0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1,
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0,
    1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1,
    1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1,
    1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1,
    0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1,
    1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
];
let loadedEntities = [];
window.addEventListener("keydown", function(input){keysDown[input.key.toLowerCase()] = true;});
window.addEventListener("keyup", function(input){keysDown[input.key.toLowerCase()] = false;});
function start(){
    console.log(document.getElementById("qualityButton"));
    console.log(document.getElementById('qualityButton').innerHTML);
    switch (document.getElementById('qualityButton').innerHTML) {
        case "UNPLAYABLE":
            QUALITY = 32;
            break;
        
        case "LOW":
            QUALITY = 64;
            break;

        case "MEDIUM":
            QUALITY = 128;
            break;

        case "HIGH":
            QUALITY = 256;
            break;

        case "ULTRA":
            QUALITY = 512;
            break;

        default: QUALITY = 128; break;
    }
    canvas.style.visibility = 'visible';
    console.log(canvas.style.visibility)
    document.getElementById("mainMenu").style.visibility = 'hidden';
    canvas.requestPointerLock();
    if(!started){
        plr.alive = true;
        started = true;
        loadedEntities = [
            new ExitPortal(0, 0),
            new Entity('assets/fsh.jpg', 'assets/goofy-ahh-song.mp3', 0.06, 75, plr.x + 120, plr.y + 0, 1),
            new Entity('assets/Chatticussabluddington.webp', 'assets/chat.mp3', 0.04, 50, plr.x + 0, plr.y - 120, 1),
            new Entity('assets/nred.jpg', 'assets/nerd.mp3', 0.04, 30, plr.x + 60, plr.y + 60, 0.5),
            new Entity('assets/kee surhg.jpg', 'assets/kee.mp3', 0.08, 100, 15, 10, 1),
        ];
        loadedEntities[0].spawn();
        requestAnimationFrame(step);
        for(let i = 1; i < loadedEntities.length; i++){
            loadedEntities[i].sound.playbackRate = 16;
            loadedEntities[i].sound.volume = 0;
            loadedEntities[i].sound.play();
            }
        setTimeout(function(){
            for(let i = 1; i < loadedEntities.length; i++){
                loadedEntities[i].sound.playbackRate = 1;
            }
        }, 2000);
    }
}
window.addEventListener("mousemove", function(event){mouseDX = event.movementX; mouseDY = event.movementY; mouseY += mouseDY; mouseX += mouseDX;});
function getDistanceFrom(x1, y1, x2, y2){
    return Math.sqrt(Math.abs((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)));
}

function getTileAt(x, y){
    return map[Math.floor((x%(mapWidth*blockSize))/blockSize)+(Math.floor((y%(mapHeight*blockSize))/blockSize)*mapHeight)];
}

function checkCollision(x, y, size){
    let collided = false;
    return getTileAt(x, y) != 0 || getTileAt(x+size, y+size) != 0 || getTileAt(x-size, y+size) != 0 || getTileAt(x-size, y-size) != 0 || getTileAt(x-size, y-size) != 0 || collided
}

function renderMinimap(){
    let x = 0;
    let y = 0;
    for(i = 0; i < mapWidth*mapHeight; i++){
        if(map[x+(y*mapWidth)] == 1){
            ctx.fillStyle = 'white';
        }else{
            ctx.fillStyle = 'black';
        }
        ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
        x++;
        if(x>=mapWidth){
            x=0;
            y++;
        }

    }
    ctx.fillStyle = 'green';
    ctx.fillRect((plr.x-(plr.radius/2))%(mapWidth*blockSize), (plr.y-(plr.radius/2))%(mapHeight*blockSize), plr.radius+1, plr.radius+1);
    ctx.fillStyle = 'red';
    for(let i = 0; i < loadedEntities.length; i++){
        ctx.fillRect((loadedEntities[i].x-1)%(mapWidth*blockSize), (loadedEntities[i].y-1)%(mapHeight*blockSize), 2, 2);
    }
}

function render(){
    //get distances
    temporaryRaycastData = [{dist: 999999, x: 0, type: 'wall'}];
    let drawIDX = 0;
    let insertX = 0;
    for(i = 1; i < QUALITY+1; i++){
        let r = castRay(plr.x, plr.y, plr.d-Math.atan((i*(canvas.width/QUALITY)-canvas.width/2)/dv), 0.5);
        //r.dist *= Math.cos(Math.atan((i*(canvas.width/QUALITY)-canvas.width/2)/dv));
        drawIDX = 1;
        while(temporaryRaycastData[drawIDX-1].dist < r.dist){
            drawIDX --;
        }
        while(temporaryRaycastData[drawIDX] != undefined && temporaryRaycastData[drawIDX].dist > r.dist){
            drawIDX ++;
        }
        temporaryRaycastData.splice(drawIDX, 0, {dist: r.dist, x: insertX, type: 'wall'});
        insertX += (canvas.width/QUALITY);
    }
    for (let i = 1; i < loadedEntities.length; i++) {
        const e = loadedEntities[i];

        // Perpendicular distance to the camera plane (matches wall metric)
        const dx = e.x - plr.x;
        const dy = e.y - plr.y;
        const distPerp = dx * Math.sin(plr.d) + dy * Math.cos(plr.d);

        // Don’t draw/sort entities that are behind the player
        if (distPerp <= 0 || Number.isNaN(distPerp)) continue;

        // Give the entity a .dist so sorting works with walls
        e.dist = distPerp;

        let drawIDX = 1;
        while (temporaryRaycastData[drawIDX - 1].dist < e.dist) drawIDX--;
        while (temporaryRaycastData[drawIDX] !== undefined && temporaryRaycastData[drawIDX].dist > e.dist) drawIDX++;

        temporaryRaycastData.splice(drawIDX, 0, e);
    }

    //render walls and entities
    for(i = 0; i < temporaryRaycastData.length; i++){
        if(temporaryRaycastData[i].type == 'wall'){
            ctx.fillStyle = 'rgb(' + viewDistance/temporaryRaycastData[i].dist + ', ' + viewDistance/temporaryRaycastData[i].dist + ', 0)';
            ctx.fillRect(Math.floor(temporaryRaycastData[i].x), Math.floor((canvas.height/2-(0))-(WALLHEIGHT/temporaryRaycastData[i].dist)/2), Math.ceil(canvas.width/QUALITY), Math.ceil(WALLHEIGHT/temporaryRaycastData[i].dist));
        }else if(temporaryRaycastData[i].type == 'entity'){
            let entity = temporaryRaycastData[i];
            let distanceToScreen = ((entity.x - plr.x) * Math.sin(plr.d)) + ((entity.y - plr.y) * Math.cos(plr.d));
            let size = Math.floor(8 * (dv / distanceToScreen));
            size = size/100 * getDistanceFrom(0, 0, entity.img.width, entity.img.height);
            if(Math.abs((plr.d-Math.PI) - Math.atan2(plr.x - temporaryRaycastData[i].x, plr.y - temporaryRaycastData[i].y)) < Math.PI/2 || Math.abs((plr.d-Math.PI) - Math.atan2(plr.x - temporaryRaycastData[i].x, plr.y - temporaryRaycastData[i].y)) > Math.PI*1.5){
                ctx.drawImage(entity.img, Math.floor((canvas.width / 2) - (((entity.x - plr.x) * Math.cos(plr.d)) - ((entity.y - plr.y) * Math.sin(plr.d))) * (dv / distanceToScreen) - (size / 2)), canvas.height / 2 - size / 2, size, size);
            }
            if(Number((-getDistanceFrom(entity.x, entity.y, plr.x, plr.y)/entity.range)+1)*entity.mv > 0){
                entity.sound.volume = ((-getDistanceFrom(entity.x, entity.y, plr.x, plr.y)/entity.range)+1)*entity.mv;
            }
        }
    }
    // renderMinimap();
}

function moveEntities(){
    let moving = false;
    plr.d -= mouseDX/100;
    if(plr.d < 0){
        plr.d = Math.PI*2;
    }else if(plr.d > Math.PI*2){
        plr.d = 0;
    }
    plr.d = Math.round(plr.d/(FOV/QUALITY))*(FOV/QUALITY);
    plr.moveDirction = plr.d;
    if(keysDown['w']){
        moving = true;
    }
    if(keysDown['s']){
        plr.moveDirction -= Math.PI;
        moving = true;
    }
    if(keysDown['d']){
        if(keysDown['w']){
            plr.moveDirction -= Math.PI/4;
        }else if(keysDown['s']){
            plr.moveDirction += Math.PI/4;
        }else{
            plr.moveDirction -= Math.PI/2;
        }
        moving = true;
    }
    if(keysDown['a']){
        if(keysDown['w']){
            plr.moveDirction += Math.PI/4;
        }else if(keysDown['s']){
            plr.moveDirction -= Math.PI/4;
        }else{
            plr.moveDirction += Math.PI/2;
        }
        moving = true;
    }
    if(keysDown['shift']){
        plr.moveSpeed = 0.1;
    }else{
        plr.moveSpeed = 0.06;
    }
    if(keysDown['insert']){
    }
    if(moving){
        plr.vx += Math.sin(plr.moveDirction)*plr.moveSpeed;
        plr.vy += Math.cos(plr.moveDirction)*plr.moveSpeed;
        plr.vx /= RESISTANCE;
        plr.vy /= RESISTANCE;
        plr.x += plr.vx*(deltaTime/17);
        if(checkCollision(plr.x, plr.y, plr.radius) != 0){
            plr.x -= plr.vx*(deltaTime/17);
            plr.vx = 0;
        }
        plr.y += plr.vy*(deltaTime/17);
        if(checkCollision(plr.x, plr.y, plr.radius) != 0){
            plr.y -= plr.vy*(deltaTime/17);
            plr.vy = 0;
        }
    }else{
        plr.vx = 0;
        plr.vy = 0;
    }
    //move entities
    for(let i = 0; i < loadedEntities.length; i++){
        //let dX, dY, dir;
        if(getDistanceFrom(loadedEntities[i].x, loadedEntities[i].y, plr.x, plr.y) < loadedEntities[i].range){
            loadedEntities[i].d = Math.atan2(plr.x - loadedEntities[i].x, plr.y - loadedEntities[i].y);
        }else{
            if(Date.now()%200 == 0){
                loadedEntities[i].d = Math.random()*(Math.PI*2);
            }
        }
        loadedEntities[i].vx += (Math.sin(loadedEntities[i].d)*(loadedEntities[i].speed));
        loadedEntities[i].vy += (Math.cos(loadedEntities[i].d)*(loadedEntities[i].speed));
        loadedEntities[i].vx /= RESISTANCE;
        loadedEntities[i].vy /= RESISTANCE;
        if(loadedEntities[i].vx != NaN){
            loadedEntities[i].x += loadedEntities[i].vx*(deltaTime/17);
        }
        if(checkCollision(loadedEntities[i].x, loadedEntities[i].y, 1) != 0){
            loadedEntities[i].x -= loadedEntities[i].vx*(deltaTime/17);
            loadedEntities[i].vx = 0;
        }
        if(loadedEntities[i].vy != NaN){
            loadedEntities[i].y += loadedEntities[i].vy*(deltaTime/17);
        }
        if(checkCollision(loadedEntities[i].x, loadedEntities[i].y, 1) != 0){
            loadedEntities[i].y -= loadedEntities[i].vy*(deltaTime/17);
            loadedEntities[i].vy = 0;
        }
        if(getDistanceFrom(loadedEntities[i].x, loadedEntities[i].y, plr.x, plr.y) < 2){
            if(score > pB){
                localStorage.setItem("HighScore", score);
            }
            localStorage.setItem("PevScore", score);
            loadedEntities = [];
            new Audio("./assets/vine boom.mp3").play();
            location.reload();
        }

        if(getDistanceFrom(loadedEntities[i].x, loadedEntities[i].y, plr.x, plr.y) > 120){
            loadedEntities[i].x = plr.x + (Math.random() - 0.5) * 100;
            loadedEntities[i].y = plr.y + (Math.random() - 0.5) * 100;
            while(checkCollision(loadedEntities[i].x, loadedEntities[i].y, 1) != 0 || getDistanceFrom(loadedEntities[i].x, loadedEntities[i].y, plr.x, plr.y) < blockSize * 3){
                loadedEntities[i].x += 1;
                loadedEntities[i].y += 1;
            }
        }
    }
}

function castRay(x, y, D, quality){
    let rayDirY = Math.sin(D);
    let rayDirX = Math.cos(D);
    let mapX = Math.floor(x / blockSize);
    let mapY = Math.floor(y / blockSize);
    const deltaXDist = Math.abs(blockSize / rayDirX);
    const deltaYDist = Math.abs(blockSize / rayDirY);
    let stepX, stepY, sideDistX, sideDistY;

    if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (x - mapX * blockSize) * deltaXDist / blockSize;
    } else {
        stepX = 1;
        sideDistX = ((mapX + 1) * blockSize - x) * deltaXDist / blockSize;
    }

    if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (y - mapY * blockSize) * deltaYDist / blockSize;
    } else {
        stepY = 1;
        sideDistX = ((mapY + 1) * blockSize - y) * deltaYDist / blockSize;
    }

    let hit = false;
    let side = 0;
    
    while (!hit) {
        if (sideDistX < sideDistY){
            sideDistX += deltaXDist;
            mapX += stepX;
            side = 0;
        } else {
            sideDistY += deltaYDist;
            mapY += stepY;
            side = 1;
        }

        const worldX = mapX * blockSize + blockSize / 2;
        const worldY = mapY * blockSize + blockSize / 2;

        hit = (getTileAt(worldX, worldY) !== 0);
    }

    let dist;
    if (side === 0) {
        dist = ((mapX * blockSize) - x + (1 - stepX) * blockSize / 2) / rayDirX;
    } else {
        dist = ((mapY * blockSize) - y + (1 - stepY) * blockSize / 2) / rayDirY;
    }

    return {
        hit: {x: x + rayDirX * dist, y: y + rayDirY * dist},
        dist: dist,
        side: side,
    }
}

function step(){
    deltaTime = Date.now() - then;
    then = Date.now();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.drawImage(level1, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    moveEntities();
    render();
    if(mouseDX != 0){
        mouseDX = 0;
    }
    if(mouseDY != 0){
        mouseDY = 0;
    }
    score = Math.round(getDistanceFrom(plr.x, plr.y, (mapWidth*blockSize)*2048+(mapWidth/2)*blockSize-5, (mapHeight*blockSize)*2048+(mapHeight/2)*blockSize+5));
    ctx.fillStyle = 'red';
    ctx.fillText('Score: ' + score, 50, 50);
    requestAnimationFrame(step);
}