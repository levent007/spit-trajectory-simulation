/**
 * 痰液轨迹模拟程序
 * 模拟汽车以80km/h行驶时，乘客向外吐痰的轨迹
 */

// 物理参数
const CAR_SPEED = 22.22; // 汽车速度 (m/s)
const SPIT_SPEED = 5;    // 吐痰速度 (m/s)
const GRAVITY = 9.8;     // 重力加速度 (m/s²)
const AIR_DENSITY = 1.225; // 空气密度 (kg/m³)
const SPHERE_RADIUS = 0.01; // 痰液半径 (m)
const SPHERE_MASS = 0.01;   // 痰液质量 (kg)
const DRAG_COEFFICIENT = 0.47; // 球体阻力系数

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 设置天空蓝色背景

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true // 支持透明背景
});
renderer.setPixelRatio(window.devicePixelRatio); // 支持高分辨率屏幕
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);
camera.lookAt(0, 0, 0);

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 添加阻尼效果
controls.dampingFactor = 0.05; // 阻尼系数
controls.screenSpacePanning = true; // 支持触摸平移
controls.maxPolarAngle = Math.PI / 2; // 限制垂直旋转角度

// 添加触摸控制提示
const touchHint = document.createElement('div');
touchHint.style.position = 'absolute';
touchHint.style.bottom = '20px';
touchHint.style.left = '50%';
touchHint.style.transform = 'translateX(-50%)';
touchHint.style.color = 'white';
touchHint.style.fontFamily = 'Arial';
touchHint.style.fontSize = '14px';
touchHint.style.backgroundColor = 'rgba(0,0,0,0.5)';
touchHint.style.padding = '10px';
touchHint.style.borderRadius = '5px';
touchHint.innerHTML = '双指缩放 | 单指旋转 | 双指平移';
document.body.appendChild(touchHint);

// 添加全屏按钮
const fullscreenButton = document.createElement('button');
fullscreenButton.style.position = 'absolute';
fullscreenButton.style.top = '20px';
fullscreenButton.style.right = '20px';
fullscreenButton.style.padding = '10px';
fullscreenButton.style.borderRadius = '5px';
fullscreenButton.style.border = 'none';
fullscreenButton.style.backgroundColor = 'rgba(0,0,0,0.5)';
fullscreenButton.style.color = 'white';
fullscreenButton.style.cursor = 'pointer';
fullscreenButton.innerHTML = '全屏';
document.body.appendChild(fullscreenButton);

fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// 响应式布局
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', onWindowResize);

// 添加坐标轴和标签
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 创建坐标轴标签
function createAxisLabel(text, position, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(1, 1, 1);
    scene.add(sprite);
}

createAxisLabel('X', new THREE.Vector3(6, 0, 0), '#ff0000');
createAxisLabel('Y', new THREE.Vector3(0, 6, 0), '#00ff00');
createAxisLabel('Z', new THREE.Vector3(0, 0, 6), '#0000ff');

// 创建地面
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080, 
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2;
scene.add(ground);

// 创建汽车
const carGeometry = new THREE.BoxGeometry(2, 1, 1);
const carMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    roughness: 0.5,
    metalness: 0.5
});
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, 0.5, 0);
scene.add(car);

// 创建痰液
const spitGeometry = new THREE.SphereGeometry(SPHERE_RADIUS);
const spitMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    roughness: 0.3,
    metalness: 0.7
});
const spit = new THREE.Mesh(spitGeometry, spitMaterial);
scene.add(spit);

// 轨迹点数组
const trajectoryPoints = [];
const trajectoryGeometry = new THREE.BufferGeometry();
const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
scene.add(trajectoryLine);

// 添加调试信息显示
const debugInfo = document.createElement('div');
debugInfo.style.position = 'absolute';
debugInfo.style.top = '10px';
debugInfo.style.left = '10px';
debugInfo.style.color = 'white';
debugInfo.style.fontFamily = 'Arial';
debugInfo.style.fontSize = '14px';
debugInfo.style.backgroundColor = 'rgba(0,0,0,0.5)';
debugInfo.style.padding = '10px';
document.body.appendChild(debugInfo);

// 计算空气阻力
function calculateDragForce(velocity) {
    const speed = velocity.length();
    const dragForce = 0.5 * AIR_DENSITY * speed * speed * DRAG_COEFFICIENT * Math.PI * SPHERE_RADIUS * SPHERE_RADIUS;
    return velocity.clone().normalize().multiplyScalar(-dragForce);
}

// 模拟参数
let time = 0;
const dt = 0.01;
let position = new THREE.Vector3(0, 1.5, 0);
// 修改初始速度：x方向为汽车速度，y方向为吐痰速度，z方向为0
let velocity = new THREE.Vector3(CAR_SPEED, 0, SPIT_SPEED);

// 修改动画循环
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新控制器

    // 更新汽车位置
    car.position.x = time * CAR_SPEED;

    // 更新痰液位置
    if (position.y > 0) {
        // 计算合力
        const dragForce = calculateDragForce(velocity);
        const gravityForce = new THREE.Vector3(0, -GRAVITY * SPHERE_MASS, 0);
        const totalForce = dragForce.add(gravityForce);

        // 更新速度和位置
        const acceleration = totalForce.divideScalar(SPHERE_MASS);
        velocity.add(acceleration.multiplyScalar(dt));
        position.add(velocity.clone().multiplyScalar(dt));

        // 更新痰液位置
        spit.position.copy(position);

        // 添加轨迹点
        trajectoryPoints.push(position.clone());
        trajectoryGeometry.setFromPoints(trajectoryPoints);

        // 更新调试信息
        debugInfo.innerHTML = `
            时间: ${time.toFixed(2)}s<br>
            位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})<br>
            速度: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)})<br>
            轨迹点数: ${trajectoryPoints.length}
        `;
    }

    time += dt;
    renderer.render(scene, camera);
}

animate(); 