// Space Blaster 3D - A fun arcade space shooter

// ============== GAME STATE ==============
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};

let state = GameState.MENU;
let score = 0;
let wave = 1;
let health = 100;
let shield = 100;
let boost = 100;
let isBoostActive = false;
let lastShot = 0;
let shootCooldown = 150;
let barrelRollCooldown = 0;
let isBarrelRolling = false;
let barrelRollAngle = 0;

// ============== THREE.JS SETUP ==============
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ============== LIGHTING ==============
const ambientLight = new THREE.AmbientLight(0x333366, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(0, 0, 10);
scene.add(pointLight);

// ============== STARFIELD ==============
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

        const color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.5, 0.8, 0.8);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    return new THREE.Points(starGeometry, starMaterial);
}

const starfield = createStarfield();
scene.add(starfield);

// ============== PLAYER SHIP ==============
function createPlayerShip() {
    const group = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x00aaff,
        emissive: 0x003366,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x004444,
        transparent: true,
        opacity: 0.8
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.z = -0.3;
    group.add(cockpit);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(2.5, 0.05, 0.8);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0x0066aa,
        emissive: 0x002244
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = 0.3;
    group.add(wings);

    // Engine glow
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = 1.1;
    engine.name = 'engine';
    group.add(engine);

    // Engine particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const particlePositions = new Float32Array(particleCount * 3);
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff4400,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.name = 'engineParticles';
    group.add(particles);

    return group;
}

const player = createPlayerShip();
player.position.z = 0;
scene.add(player);

camera.position.z = 8;
camera.position.y = 2;
camera.lookAt(player.position);

// ============== GAME OBJECTS ==============
const bullets = [];
const enemyBullets = [];
const asteroids = [];
const enemies = [];
const explosions = [];
const powerups = [];

// ============== CREATE BULLET ==============
function createBullet(position, direction, isEnemy = false) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: isEnemy ? 0xff0000 : 0x00ff00,
        transparent: true,
        opacity: 0.9
    });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(position);
    bullet.velocity = direction.clone().multiplyScalar(isEnemy ? 0.5 : 1.2);
    bullet.isEnemy = isEnemy;

    // Bullet trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(30);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMaterial = new THREE.LineBasicMaterial({
        color: isEnemy ? 0xff0000 : 0x00ff00,
        transparent: true,
        opacity: 0.5
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    bullet.trail = trail;
    bullet.trailPositions = [];

    scene.add(bullet);
    scene.add(trail);

    if (isEnemy) {
        enemyBullets.push(bullet);
    } else {
        bullets.push(bullet);
    }

    return bullet;
}

// ============== CREATE ASTEROID ==============
function createAsteroid(position) {
    const size = Math.random() * 1.5 + 0.5;
    const geometry = new THREE.IcosahedronGeometry(size, 0);

    // Distort vertices for rocky look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.3);
        positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.3);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.3);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
        color: 0x666666,
        flatShading: true,
        emissive: 0x111111
    });

    const asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.copy(position);
    asteroid.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        0.1 + Math.random() * 0.1
    );
    asteroid.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
    );
    asteroid.size = size;
    asteroid.health = Math.ceil(size * 2);

    scene.add(asteroid);
    asteroids.push(asteroid);

    return asteroid;
}

// ============== CREATE ENEMY ==============
function createEnemy(position) {
    const group = new THREE.Group();

    // Enemy ship body - menacing design
    const bodyGeometry = new THREE.OctahedronGeometry(0.6, 0);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0044,
        emissive: 0x440011,
        flatShading: true
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Enemy wings
    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xaa0033,
        emissive: 0x330011
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    group.add(wings);

    // Engine glow
    const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = 0.5;
    group.add(glow);

    group.position.copy(position);
    group.velocity = new THREE.Vector3(0, 0, 0.15);
    group.health = 3;
    group.lastShot = 0;
    group.shootInterval = 1500 + Math.random() * 1000;
    group.behavior = Math.random() < 0.5 ? 'chase' : 'strafe';
    group.strafeDir = Math.random() < 0.5 ? 1 : -1;
    group.strafeTime = 0;

    scene.add(group);
    enemies.push(group);

    return group;
}

// ============== CREATE EXPLOSION ==============
function createExplosion(position, size = 1, color = 0xff6600) {
    const particleCount = 30;
    const group = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1 * size, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3 * size,
            (Math.random() - 0.5) * 0.3 * size,
            (Math.random() - 0.5) * 0.3 * size
        );
        particle.life = 1;
        group.add(particle);
    }

    // Shockwave ring
    const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(camera.position);
    ring.scale.set(1, 1, 1);
    ring.expandRate = 0.2 * size;
    group.ring = ring;
    scene.add(ring);

    scene.add(group);
    explosions.push(group);

    // Screen shake
    screenShake = 10 * size;
}

// ============== CREATE POWERUP ==============
function createPowerup(position, type) {
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    let color;

    switch(type) {
        case 'health': color = 0x00ff00; break;
        case 'shield': color = 0x0088ff; break;
        case 'rapid': color = 0xffff00; break;
        default: color = 0xffffff;
    }

    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
    });

    const powerup = new THREE.Mesh(geometry, material);
    powerup.position.copy(position);
    powerup.type = type;
    powerup.rotationSpeed = 0.05;

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    powerup.add(glow);

    scene.add(powerup);
    powerups.push(powerup);

    return powerup;
}

// ============== INPUT HANDLING ==============
const keys = {};
const mouse = { x: 0, y: 0 };
let screenShake = 0;

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Space' && state === GameState.PLAYING && barrelRollCooldown <= 0) {
        isBarrelRolling = true;
        barrelRollAngle = 0;
        barrelRollCooldown = 2000;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && state === GameState.PLAYING) {
        shoot();
    }
});

// ============== SHOOTING ==============
let rapidFireActive = false;
let rapidFireEnd = 0;

function shoot() {
    const now = Date.now();
    const cooldown = rapidFireActive ? shootCooldown / 3 : shootCooldown;

    if (now - lastShot < cooldown) return;
    lastShot = now;

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(player.quaternion);

    // Shoot from both wing tips
    const offset1 = new THREE.Vector3(0.8, 0, 0);
    const offset2 = new THREE.Vector3(-0.8, 0, 0);
    offset1.applyQuaternion(player.quaternion);
    offset2.applyQuaternion(player.quaternion);

    createBullet(player.position.clone().add(offset1), direction);
    createBullet(player.position.clone().add(offset2), direction);

    // Muzzle flash
    pointLight.intensity = 3;
    setTimeout(() => pointLight.intensity = 1, 50);
}

// Auto-fire when holding mouse
let mouseDown = false;
document.addEventListener('mousedown', () => mouseDown = true);
document.addEventListener('mouseup', () => mouseDown = false);

// ============== COLLISION DETECTION ==============
function checkCollision(obj1, obj2, threshold) {
    return obj1.position.distanceTo(obj2.position) < threshold;
}

// ============== SPAWN WAVES ==============
function spawnWave() {
    const asteroidCount = 10 + wave * 3;
    const enemyCount = Math.min(wave * 2, 15);

    for (let i = 0; i < asteroidCount; i++) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            -50 - Math.random() * 100
        );
        createAsteroid(pos);
    }

    for (let i = 0; i < enemyCount; i++) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20,
            -30 - Math.random() * 50
        );
        createEnemy(pos);
    }
}

// ============== UPDATE FUNCTIONS ==============
function updatePlayer(delta) {
    const moveSpeed = isBoostActive ? 0.25 : 0.15;
    const targetRotation = { x: 0, y: 0, z: 0 };

    // Movement
    if (keys['KeyW'] || keys['ArrowUp']) {
        player.position.y += moveSpeed;
        targetRotation.x = -0.3;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        player.position.y -= moveSpeed;
        targetRotation.x = 0.3;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.position.x -= moveSpeed;
        targetRotation.z = 0.5;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.position.x += moveSpeed;
        targetRotation.z = -0.5;
    }

    // Boost
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        if (boost > 0) {
            isBoostActive = true;
            boost -= delta * 0.03;
        } else {
            isBoostActive = false;
        }
    } else {
        isBoostActive = false;
        boost = Math.min(100, boost + delta * 0.01);
    }

    // Clamp position
    player.position.x = Math.max(-25, Math.min(25, player.position.x));
    player.position.y = Math.max(-15, Math.min(15, player.position.y));

    // Smooth rotation based on movement
    player.rotation.x += (targetRotation.x - player.rotation.x) * 0.1;
    player.rotation.z += (targetRotation.z - player.rotation.z) * 0.1;

    // Barrel roll
    if (isBarrelRolling) {
        barrelRollAngle += 0.3;
        player.rotation.z = barrelRollAngle;
        if (barrelRollAngle >= Math.PI * 2) {
            isBarrelRolling = false;
            player.rotation.z = 0;
        }
    }

    // Aim towards mouse
    player.rotation.y = mouse.x * 0.3;

    // Update engine glow
    const engine = player.getObjectByName('engine');
    if (engine) {
        engine.material.opacity = isBoostActive ? 1 : 0.6;
        engine.scale.z = isBoostActive ? 2 : 1;
    }

    // Update engine particles
    const particles = player.getObjectByName('engineParticles');
    if (particles) {
        const positions = particles.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            let z = positions.getZ(i);
            z += 0.1;
            if (z > 3) {
                positions.setX(i, player.position.x + (Math.random() - 0.5) * 0.3);
                positions.setY(i, player.position.y + (Math.random() - 0.5) * 0.3);
                z = player.position.z + 1.2;
            }
            positions.setZ(i, z);
        }
        positions.needsUpdate = true;
    }

    // Update point light position
    pointLight.position.copy(player.position);

    // Cooldowns
    if (barrelRollCooldown > 0) barrelRollCooldown -= delta;

    // Rapid fire timer
    if (rapidFireActive && Date.now() > rapidFireEnd) {
        rapidFireActive = false;
    }

    // Auto-fire
    if (mouseDown) {
        shoot();
    }

    // Shield regeneration
    shield = Math.min(100, shield + delta * 0.005);
}

function updateBullets() {
    // Player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);

        // Update trail
        bullet.trailPositions.unshift(bullet.position.clone());
        if (bullet.trailPositions.length > 10) {
            bullet.trailPositions.pop();
        }
        const trailPos = bullet.trail.geometry.attributes.position;
        for (let j = 0; j < bullet.trailPositions.length; j++) {
            trailPos.setXYZ(j,
                bullet.trailPositions[j].x,
                bullet.trailPositions[j].y,
                bullet.trailPositions[j].z
            );
        }
        trailPos.needsUpdate = true;

        // Remove if too far
        if (bullet.position.z < -100 || bullet.position.z > 50) {
            scene.remove(bullet);
            scene.remove(bullet.trail);
            bullets.splice(i, 1);
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.position.add(bullet.velocity);

        // Update trail
        bullet.trailPositions.unshift(bullet.position.clone());
        if (bullet.trailPositions.length > 10) {
            bullet.trailPositions.pop();
        }
        const trailPos = bullet.trail.geometry.attributes.position;
        for (let j = 0; j < bullet.trailPositions.length; j++) {
            trailPos.setXYZ(j,
                bullet.trailPositions[j].x,
                bullet.trailPositions[j].y,
                bullet.trailPositions[j].z
            );
        }
        trailPos.needsUpdate = true;

        // Check collision with player
        if (!isBarrelRolling && checkCollision(bullet, player, 1)) {
            takeDamage(15);
            scene.remove(bullet);
            scene.remove(bullet.trail);
            enemyBullets.splice(i, 1);
            continue;
        }

        // Remove if too far
        if (bullet.position.z > 50 ||
            Math.abs(bullet.position.x) > 50 ||
            Math.abs(bullet.position.y) > 50) {
            scene.remove(bullet);
            scene.remove(bullet.trail);
            enemyBullets.splice(i, 1);
        }
    }
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.position.add(asteroid.velocity);
        asteroid.rotation.x += asteroid.rotationSpeed.x;
        asteroid.rotation.y += asteroid.rotationSpeed.y;
        asteroid.rotation.z += asteroid.rotationSpeed.z;

        // Check collision with player
        if (!isBarrelRolling && checkCollision(asteroid, player, asteroid.size + 0.5)) {
            takeDamage(25);
            createExplosion(asteroid.position, asteroid.size, 0x888888);
            scene.remove(asteroid);
            asteroids.splice(i, 1);
            continue;
        }

        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(asteroid, bullets[j], asteroid.size)) {
                asteroid.health--;
                scene.remove(bullets[j]);
                scene.remove(bullets[j].trail);
                bullets.splice(j, 1);

                if (asteroid.health <= 0) {
                    createExplosion(asteroid.position, asteroid.size * 0.5, 0x888888);
                    score += Math.ceil(asteroid.size * 10);

                    // Chance to spawn powerup
                    if (Math.random() < 0.1) {
                        const types = ['health', 'shield', 'rapid'];
                        createPowerup(asteroid.position.clone(), types[Math.floor(Math.random() * types.length)]);
                    }

                    scene.remove(asteroid);
                    asteroids.splice(i, 1);
                }
                break;
            }
        }

        // Remove if behind camera
        if (asteroid.position.z > 20) {
            scene.remove(asteroid);
            asteroids.splice(i, 1);
        }
    }
}

function updateEnemies(delta) {
    const now = Date.now();

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // AI behavior
        if (enemy.behavior === 'chase') {
            const toPlayer = player.position.clone().sub(enemy.position);
            toPlayer.normalize().multiplyScalar(0.05);
            enemy.velocity.x += toPlayer.x * 0.1;
            enemy.velocity.y += toPlayer.y * 0.1;
        } else {
            // Strafe
            enemy.strafeTime += delta;
            if (enemy.strafeTime > 1000) {
                enemy.strafeDir *= -1;
                enemy.strafeTime = 0;
            }
            enemy.velocity.x = enemy.strafeDir * 0.1;
        }

        enemy.velocity.z = 0.08;
        enemy.position.add(enemy.velocity);

        // Look at player
        enemy.lookAt(player.position);

        // Shooting
        if (now - enemy.lastShot > enemy.shootInterval && enemy.position.z > -40) {
            enemy.lastShot = now;
            const direction = player.position.clone().sub(enemy.position).normalize();
            createBullet(enemy.position.clone(), direction, true);
        }

        // Check collision with player
        if (!isBarrelRolling && checkCollision(enemy, player, 1.5)) {
            takeDamage(30);
            createExplosion(enemy.position, 1.5, 0xff4400);
            scene.remove(enemy);
            enemies.splice(i, 1);
            continue;
        }

        // Check collision with player bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(enemy, bullets[j], 1)) {
                enemy.health--;
                scene.remove(bullets[j]);
                scene.remove(bullets[j].trail);
                bullets.splice(j, 1);

                if (enemy.health <= 0) {
                    createExplosion(enemy.position, 1.5, 0xff4400);
                    score += 50;

                    // Higher chance for powerup from enemies
                    if (Math.random() < 0.2) {
                        const types = ['health', 'shield', 'rapid'];
                        createPowerup(enemy.position.clone(), types[Math.floor(Math.random() * types.length)]);
                    }

                    scene.remove(enemy);
                    enemies.splice(i, 1);
                }
                break;
            }
        }

        // Remove if behind camera
        if (enemy.position.z > 20) {
            scene.remove(enemy);
            enemies.splice(i, 1);
        }
    }
}

function updateExplosions(delta) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const group = explosions[i];
        let allDead = true;

        group.children.forEach(particle => {
            particle.position.add(particle.velocity);
            particle.life -= delta * 0.002;
            particle.material.opacity = particle.life;

            if (particle.life > 0) allDead = false;
        });

        // Update shockwave ring
        if (group.ring) {
            group.ring.scale.x += group.ring.expandRate;
            group.ring.scale.y += group.ring.expandRate;
            group.ring.material.opacity -= 0.05;

            if (group.ring.material.opacity <= 0) {
                scene.remove(group.ring);
                group.ring = null;
            }
        }

        if (allDead && !group.ring) {
            scene.remove(group);
            explosions.splice(i, 1);
        }
    }
}

function updatePowerups(delta) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.rotation.y += powerup.rotationSpeed;
        powerup.position.z += 0.05;

        // Check collision with player
        if (checkCollision(powerup, player, 1)) {
            switch(powerup.type) {
                case 'health':
                    health = Math.min(100, health + 30);
                    break;
                case 'shield':
                    shield = Math.min(100, shield + 50);
                    break;
                case 'rapid':
                    rapidFireActive = true;
                    rapidFireEnd = Date.now() + 5000;
                    break;
            }
            scene.remove(powerup);
            powerups.splice(i, 1);
            continue;
        }

        // Remove if behind camera
        if (powerup.position.z > 15) {
            scene.remove(powerup);
            powerups.splice(i, 1);
        }
    }
}

function takeDamage(amount) {
    if (isBarrelRolling) return;

    // Shield absorbs damage first
    if (shield > 0) {
        const shieldDamage = Math.min(shield, amount * 0.7);
        shield -= shieldDamage;
        amount -= shieldDamage;
    }

    health -= amount;
    screenShake = 15;

    if (health <= 0) {
        gameOver();
    }
}

// ============== MINIMAP ==============
function updateMinimap() {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    const size = 150;
    const scale = 3;

    ctx.clearRect(0, 0, size, size);

    // Draw radar circles
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(size/2, size/2, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size/2, size/2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(size/2, size/2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        const dx = (enemy.position.x - player.position.x) * scale + size/2;
        const dz = (enemy.position.z - player.position.z) * scale + size/2;
        if (dx > 0 && dx < size && dz > 0 && dz < size) {
            ctx.beginPath();
            ctx.arc(dx, dz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw asteroids
    ctx.fillStyle = '#888888';
    asteroids.forEach(asteroid => {
        const dx = (asteroid.position.x - player.position.x) * scale + size/2;
        const dz = (asteroid.position.z - player.position.z) * scale + size/2;
        if (dx > 0 && dx < size && dz > 0 && dz < size) {
            ctx.beginPath();
            ctx.arc(dx, dz, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw powerups
    ctx.fillStyle = '#ffff00';
    powerups.forEach(powerup => {
        const dx = (powerup.position.x - player.position.x) * scale + size/2;
        const dz = (powerup.position.z - player.position.z) * scale + size/2;
        if (dx > 0 && dx < size && dz > 0 && dz < size) {
            ctx.beginPath();
            ctx.arc(dx, dz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ============== UI UPDATE ==============
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('wave').textContent = wave;
    document.getElementById('healthFill').style.width = health + '%';
    document.getElementById('shieldFill').style.width = shield + '%';
    document.getElementById('boostAmount').textContent = Math.floor(boost);
}

// ============== GAME STATES ==============
function startGame() {
    state = GameState.PLAYING;
    score = 0;
    wave = 1;
    health = 100;
    shield = 100;
    boost = 100;

    // Clear all objects
    [...bullets, ...enemyBullets, ...asteroids, ...enemies, ...explosions, ...powerups].forEach(obj => {
        if (obj.trail) scene.remove(obj.trail);
        scene.remove(obj);
    });
    bullets.length = 0;
    enemyBullets.length = 0;
    asteroids.length = 0;
    enemies.length = 0;
    explosions.length = 0;
    powerups.length = 0;

    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');
    document.getElementById('minimap').classList.remove('hidden');
    document.getElementById('boostIndicator').classList.remove('hidden');

    spawnWave();
}

function gameOver() {
    state = GameState.GAMEOVER;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('crosshair').classList.add('hidden');
}

// ============== MAIN GAME LOOP ==============
let lastTime = 0;
let waveTimer = 0;

function animate(time) {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    lastTime = time;

    if (state === GameState.PLAYING) {
        updatePlayer(delta);
        updateBullets();
        updateAsteroids();
        updateEnemies(delta);
        updateExplosions(delta);
        updatePowerups(delta);
        updateMinimap();
        updateUI();

        // Check for wave completion
        if (asteroids.length === 0 && enemies.length === 0) {
            waveTimer += delta;
            if (waveTimer > 2000) {
                wave++;
                waveTimer = 0;
                spawnWave();
            }
        }

        // Screen shake
        if (screenShake > 0) {
            camera.position.x = 0 + (Math.random() - 0.5) * screenShake * 0.02;
            camera.position.y = 2 + (Math.random() - 0.5) * screenShake * 0.02;
            screenShake -= delta * 0.05;
        } else {
            camera.position.x = 0;
            camera.position.y = 2;
        }
    }

    // Rotate starfield slowly
    starfield.rotation.z += 0.0001;

    renderer.render(scene, camera);
}

// ============== EVENT LISTENERS ==============
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Prevent context menu on right-click
document.addEventListener('contextmenu', e => e.preventDefault());

// Start the game loop
animate(0);
