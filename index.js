var e131 = require('e131');
const readline = require('readline');

// Allows us to listen for events from stdin
readline.emitKeypressEvents(process.stdin);


var client = new e131.Client('10.0.36.143');  // wled client up
var packet = client.createPacket(243); 
var slotsData = packet.getSlotsData();
packet.setSourceName('test E1.31 client');
packet.setUniverse(0x01);  // make universe number consistent with the client
packet.setOption(packet.Options.PREVIEW, true);  // don't really change any fixture
packet.setPriority(packet.DEFAULT_PRIORITY);  // not strictly needed, done automatically

var gameInterval, tail, tailLength, position, direction, food;
var board = [];

console.log('Use your arrow keys, press q or esc to exit');

function reset()
{
    board = [];
    for(y=0;y<9;y++){
        r = [];
        for(x=0;x<9;x++){
            r.push(0);
        }
        board.push(r);
    }

    direction = [1,0];
    position = [4,4];
    tail = [];
    tailLength = 0;

    gameInterval = setInterval(loop, 250);

    dropFood();
}
reset();

process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    switch(key.name){
        case 'up':
            direction = [1,0];
            break;
        case 'down':
            direction = [-1,0];
            break;
        case 'left':
            direction = [0,1];
            break;
        case 'right':
            direction = [0,-1];
            break;
        case 'escape':
        case 'q':
            process.exit();
    }
});

function dead()
{
    clearInterval(gameInterval);
    setTimeout(reset,1000);
}

function dropFood(){
    while(true)
    {
        foodIndex = Math.floor(Math.random() * 9 * 9);
        foodPos = [Math.floor(foodIndex/9), foodIndex % 9];
        if(board[foodPos[0]][foodPos[1]] == 0){
            food = foodPos;
            board[foodPos[0]][foodPos[1]] = 2;
            break;
        }
    }
}

function loop(){
    
    if(tail.length > tailLength){
        var end = tail.shift();
        board[end[0]][end[1]] = 0;
    }

    position[0]+=direction[0];
    position[1]+=direction[1];

    if(position[0] >= 9 || position[1] >= 9 || position[0] < 0 || position[1] < 0 
        || tail.filter(function(t){return t[0] == position[0] && t[1] == position[1]}).length > 0
        ){
        dead();
        return;
    }

    if(position[0] == food[0] && position[1] == food[1]){
        tailLength ++;
        dropFood();
    }

    board[position[0]][position[1]] = 1;
    tail.push(position.slice());


    /*console.log(board.map(function(r){
        return r.map(function(c){
            return c == 1 ? "██" : "  ";
        }).join('');
    }).join('|\n')+'\n'); */


    var data = board.map(function(r,i){
        return i%2==0 ? r : r.slice().reverse();
    }).flat(1).map(function(p){
        return p == 1 ? [255,255,255] : (p == 2 ? [255,0,0] : [0,0,0]);
    }).flat(1);

    //console.log(data);

    packet.setSlotsData(Buffer.from(data));
    client.send(packet);
    
}



