
const camDis = 10, radius = camDis/5, frontCol = 0x193E8A, backCol = 0x7594CC, frontRed = 0xFF5EAA, backRed = 0xFF94CC, rotateInterval = 30, rotateAng = 0.0001 * rotateInterval, overEndTime = 40, overHalfTime = overEndTime/2;
const icosaHedronArr = [], dotArr = [];

var camera, scene, renderer, controls, light, totalGroup, mouse, raycaster, mousePos;

$( document ).ready(function() {
	init();
	loadModel();
	animate();
	const {innerHeight, innerWidth} = window, frameW = innerHeight * 0.8, posT = innerHeight * 0.1, posB = innerHeight - posT, posL = innerWidth/2 - frameW/2, posR = innerWidth - posL;
	window.addEventListener('mousemove', e => {
		const {pageX, pageY, clientX, clientY} = e;
		if (pageX > posL && pageX < posR && pageY > posT && pageY < posB) {
			mousePos = {
				x:GetRoundNum((pageY - innerHeight / 2) / frameW * 4),
				y:GetRoundNum((pageX - innerWidth / 2) / frameW * 4),
			};
			mouse.set( (clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1 );
			raycaster.setFromCamera(mouse, camera)
		
			const intersect = raycaster.intersectObjects(dotArr, false)[0];
			if (intersect) {
				intersect.object.overTime = overEndTime;
				// intersect.object.material.color.setHex(intersect.object.redColor);
			}
		} else mousePos = null;
	})
	setInterval(() => { rotateIcosaHedron(); }, rotateInterval);
});

function GetRoundNum(val, size = 4) {
	return Math.round(val * Math.pow(10, size)) / Math.pow(10, 4);
}

function rotateIcosaHedron() {
	icosaHedronArr.forEach(icosaHedron => {
		const {dir} = icosaHedron;
		if (mousePos) {
			const rotUnit = rotateAng * 2;
			if 		(Math.abs(icosaHedron.rotation.z) > rotUnit) icosaHedron.rotation.z -= dir * rotUnit;
			else if (Math.abs(icosaHedron.rotation.z) <=rotUnit) icosaHedron.rotation.z = 0;
			const targetRot = {x:mousePos.x, y:mousePos.y};
			['x', 'y'].forEach(axis => {
				icosaHedron.rotation[axis] += targetRot[axis] * rotUnit;
				if (Math.abs(icosaHedron.rotation[axis]) >= Math.PI * 2) icosaHedron.rotation[axis] = 0;
			});
		} else {
			['x', 'y', 'z'].forEach(axis => {
				icosaHedron.rotation[axis] += dir * rotateAng;
				if (Math.abs(icosaHedron.rotation[axis]) >= Math.PI * 2) icosaHedron.rotation[axis] = 0;
			});
		}
		icosaHedron.children.forEach(dot => {
			if (dot.overTime > 0) {
				var delta, dScl;
				if (dot.overTime > overHalfTime) {
					delta = (overEndTime - dot.overTime)/overHalfTime;
				} else {
					delta = dot.overTime/overHalfTime;
				}
				dScl = 1 + delta;
				dot.overTime--;
				if (dot.overTime===0) {
					delta = 0; dScl = 1;
					dot.material.color.setHex(dot.oriColor);
				}
			}
		});
	});
}

function init() {
	mouse = new THREE.Vector2(); raycaster = new THREE.Raycaster();
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("container").appendChild(renderer.domElement);
	renderer.setClearColor(0xFFFFFF, 1);
	
	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1,  1000);
	camera.position.set(0, 0, -camDis);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enabled = false;

	scene = new THREE.Scene();
	scene.fog = new THREE. Fog( 0xFFFFFF, camDis * 0.8, camDis * 1.15);
	totalGroup = new THREE.Group(); scene.add(totalGroup);

	const ambient = new THREE.AmbientLight(0xFFFFFF, 0.3); scene.add(ambient);
	const light = new THREE.DirectionalLight( 0xFFFFFF, 0.7); scene.add(light);
}

function getIcosaHedron(color, dir) {
	const icosaGeo = new THREE.OctahedronGeometry(radius, 1);
	const icosaMat = new THREE.MeshBasicMaterial({wireframe:true, color});
	const icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
	const verArr = [], {vertices} = icosaGeo;
	vertices.forEach(ver => {
		verArr.push({x:ver.x/2, y:ver.y/2, z:ver.z/2});
	});
	const verGeo = new THREE.SphereGeometry(1, 32, 32),
		verMat = new THREE.MeshBasicMaterial({color}),
		verMesh = new THREE.Mesh(verGeo, verMat),
		sclArr = [0.04, 0.06, 0.08];

	verArr.forEach((ver, verIdx) => {
		const cloneVer = verMesh.clone(), scl = sclArr[verIdx%3], dScl = dir===1?0.7:1, realScl = scl * dScl, redColor = dir===-1?frontRed:backRed;
		cloneVer.material = new THREE.MeshBasicMaterial({color});
		cloneVer.scale.set(realScl, realScl, realScl);
		cloneVer.position.set(ver.x * radius, ver.y * radius, ver.z * radius);
		icosaMesh.add(cloneVer);
		// if (dir===1) return;
		cloneVer.overTime = 0;
		cloneVer.oriColor = color;
		cloneVer.redColor = redColor;
		const inVer = verMesh.clone(); inVer.visible = false;
		inVer.material = new THREE.MeshStandardMaterial({transparent:true, color:redColor, opacity:0});
		cloneVer.add(inVer);
		dotArr.push(cloneVer);
	});
	return icosaMesh;
}

function loadModel() {
	[-1, 1].forEach(dir => {
		const icosaMesh = getIcosaHedron(dir===-1?frontCol:backCol, dir);
		icosaMesh.position.z = dir * radius * 0.4;
		const scl = 1 + dir * 0.07; // 0.1
		icosaMesh.scale.set(scl, scl, scl);
		icosaMesh.dir = dir;
		icosaHedronArr.push(icosaMesh);
		const outGroup = new THREE.Group(); outGroup.add(icosaMesh)
		// if (dir===1) outGroup.scale.z = 0.2;
		totalGroup.add(outGroup);
	});
}

function animate() {
	if (camera && scene) {
		renderer.render(scene, camera);
	}
	requestAnimationFrame(animate);
}
