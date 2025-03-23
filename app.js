const socket = io();

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x007700, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Camera position
camera.position.y = 5;
camera.position.z = 10;

// Player setup
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.5, 0);
scene.add(player);

// Handle other players
const players = {};

socket.on('currentPlayers', (existingPlayers) => {
    for (const id in existingPlayers) {
        if (existingPlayers[id].id === socket.id) {
            // This is the current player
            continue;
        }
        addOtherPlayer(existingPlayers[id]);
    }
});

socket.on('newPlayer', (playerInfo) => {
    addOtherPlayer(playerInfo);
});

socket.on('playerMoved', (playerInfo) => {
    if (players[playerInfo.id]) {
        players[playerInfo.id].position.set(playerInfo.position.x, playerInfo.position.y, playerInfo.position.z);
    }
});

socket.on('disconnect', (playerId) => {
    if (players[playerId]) {
        scene.remove(players[playerId]);
        delete players[playerId];
    }
});

// Function to add another player to the scene
function addOtherPlayer(playerInfo) {
    const otherPlayer = new THREE.Mesh(playerGeometry, new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }));
    otherPlayer.position.set(playerInfo.position.x, playerInfo.position.y, playerInfo.position.z);
    otherPlayer.name = playerInfo.id;
    players[playerInfo.id] = otherPlayer;
    scene.add(otherPlayer);
}

// Handle player movement
const moveSpeed = 0.1; 
window.addEventListener('keydown', (event) => {
    if (event.key === 'w') player.position.z -= moveSpeed;
    if (event.key === 's') player.position.z += moveSpeed;
    if (event.key === 'a') player.position.x -= moveSpeed;
    if (event.key === 'd') player.position.x += moveSpeed;

    // Notify other players about this player's movement
    socket.emit('playerMovement', {
        position: {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
        },
    });
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
