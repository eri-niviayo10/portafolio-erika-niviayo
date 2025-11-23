// =======================================================
// ** PORTAFOLIO ERI NIVIAYO **
// Versión 6.6: Corrección final del Scope y Material
// =======================================================

// =======================================================
// 1. CONFIGURACIÓN GLOBAL (URLs Base)
// Las librerías Three.js y GLTFLoader se cargan globalmente en index.html
// =======================================================
const BASE_URL = 'https://raw.githubusercontent.com/eri-niviayo10/portafolio-erika-niviayo/main/img/';
const GLB_URL = `${BASE_URL}preload_torus.glb`;

const textureUrls = [
    `${BASE_URL}hero1.jpg`,
    `${BASE_URL}hero2.jpg`,
    `${BASE_URL}hero3.jpg`,
    `${BASE_URL}hero4.jpg`,
];

const displacementUrl = `${BASE_URL}disp.jpg`;


// =======================================================
// 2. ELEMENTOS DEL DOM y Variables de Control
// =======================================================
document.addEventListener('DOMContentLoaded', () => {

    // Variables DOM
    const preloader = document.querySelector('.preloader');
    const mainContent = document.querySelector('.main-content');
    const enterButton = document.getElementById('enter-button');
    const menuToggle = document.querySelector('.menu-toggle');
    const navUL = document.querySelector('.main-nav ul');
    const preloaderAnimation = document.querySelector('.preloader-animation');

    
    // Elementos para la rotación de roles en el Hero
    const roleChangerWords = document.querySelectorAll('.rotating-role-word');
    let currentRoleIndex = 0;
    
    // ✅ Variables GLOBALES para Three.js (Scope Corregido)
    let scene, camera, renderer;
    let mesh;
    let material;
    let uniforms;
    let uMouse = new THREE.Vector2(0.0, 0.0); 
    
    // ✅ Inicialización del GLTFLoader
    // Se crea fuera de la función de carga para asegurar su disponibilidad
    const loader = new THREE.GLTFLoader(); 

    // =======================================================
    // 3. INICIALIZACIÓN DE THREE.JS Y PARTICLES.JS
    // =======================================================
    
    initParticles();
    
    scene = new THREE.Scene();
    
    // Usamos clientWidth/Height del contenedor para el aspecto y tamaño
    const width = preloaderAnimation.clientWidth;
    const height = preloaderAnimation.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10);
    camera.position.z = 2.5;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('hero-webgl-canvas'),
        antialias: true,
        alpha: true 
    });
    renderer.setSize(width, height);
    
    // Redimensionar la escena
    window.addEventListener('resize', () => {
        const newWidth = preloaderAnimation.clientWidth;
        const newHeight = preloaderAnimation.clientHeight;

        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
    });


    // =======================================================
    // 4. FUNCIÓN: Carga del Modelo 3D (Wireframe)
    // =======================================================

    function createDynamicWireframe() {

        loader.load(
            GLB_URL,
            (gltf) => {
                // El modelo GLB es una escena, tomamos el primer objeto como el toro
                let torus = gltf.scene.children[0];
                
                // Si el modelo GLB tiene más de una malla, podríamos necesitar un bucle:
                // torus.traverse((child) => { if (child.isMesh) { torus = child; } });

                // ✅ CORRECCIÓN FINAL: Usamos MeshBasicMaterial para el wireframe simple
                material = new THREE.MeshBasicMaterial({
                    color: 0x4D105C,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8
                });

                // Crear la malla final
                // NOTA: Si torus.geometry es null, aquí fallaría.
                // Asumimos que el primer hijo de la escena GLTF tiene una geometría.
                if (torus && torus.geometry) {
                    mesh = new THREE.Mesh(torus.geometry, material);
                    scene.add(mesh);
                    
                    // Ajustar la escala del toro

                    mesh.position.y = -1.1;

                    // Ajustar la escala del toro

                    mesh.scale.set(0.4, 0.4, 0.4);

                    // Iniciar la animación una vez que el mesh está listo
                    animate();
                    
                    console.log('Modelo GLB cargado y añadido a la escena.');
                } else {
                    console.error('El modelo GLB fue cargado, pero no se encontró geometría válida.');
                }
            },
            
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100).toFixed(0) + '% cargado');
            },
            
            (error) => {
                console.error('Error al cargar el modelo GLB:', error);
            }
        );
    }

    // =======================================================
    // 5. FUNCIÓN: Animación
    // =======================================================

    const animate = () => {
        requestAnimationFrame(animate);

        if (mesh) {
            // Animación de rotación simple
            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.005;
            
            // La rotación es visible en 3D
        }

        // Renderizar la escena
        renderer.render(scene, camera);
    };

    // =======================================================
    // 6. EVENTOS Y LÓGICA DE INTERFAZ
    // =======================================================

    // Iniciar la carga y animación del wireframe
    createDynamicWireframe(); // Llama a la función ahora que todas las dependencias están definidas

    // Movimiento del mouse (solo afecta a uMouse, no usado por el MeshBasicMaterial)
    window.addEventListener('mousemove', (e) => {
        uMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        uMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Lógica para mostrar el contenido principal
    enterButton.addEventListener('click', () => {
        gsap.to(preloader, { 
            opacity: 0, 
            duration: 1, 
            onComplete: () => {
                preloader.classList.add('hidden');
                mainContent.classList.remove('hidden');
            }
        });
    });

    // Lógica para el toggle del menú
    menuToggle.addEventListener('click', () => {
        navUL.classList.toggle('active');
        menuToggle.querySelector('i').classList.toggle('fa-bars');
        menuToggle.querySelector('i').classList.toggle('fa-xmark');
    });

    // Lógica para el cambio de rol (animación de texto)
    setInterval(() => {
        const nextIndex = (currentRoleIndex + 1) % roleChangerWords.length;
        
        gsap.to(roleChangerWords[currentRoleIndex], { opacity: 0, duration: 0.5 });
        gsap.to(roleChangerWords[nextIndex], { opacity: 1, duration: 0.5 });
        
        roleChangerWords[currentRoleIndex].classList.remove('active');
        roleChangerWords[nextIndex].classList.add('active');
        
        currentRoleIndex = nextIndex;
    }, 3000);


    // =======================================================
    // 7. FUNCIÓN: PARTÍCULAS (particles.js)
    // =======================================================

    function initParticles() {
        if (window.particlesJS) {
            particlesJS('particles-js', {
                "particles": {
                    "number": {
                        "value": 80,
                        "density": {
                            "enable": true,
                            "value_area": 800
                        }
                    },
                    "color": {
                        "value": "#A9A9A9"
                    },
                    "shape": {
                        "type": "circle",
                        "stroke": {
                            "width": 0,
                            "color": "#000000"
                        },
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": false,
                    },
                    "size": {
                        "value": 3,
                        "random": true,
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 150,
                        "color": "#A9A9A9",
                        "opacity": 0.4,
                        "width": 1
                    },
                    "move": {
                        "enable": true,
                        "speed": 6,
                        "direction": "none",
                        "random": false,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false,
                        "attract": {
                            "enable": false,
                            "rotateX": 600,
                            "rotateY": 1200
                        }
                    }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "repulse"
                        },
                        "onclick": {
                            "enable": true,
                            "mode": "push"
                        },
                        "resize": true
                    },
                    "modes": {
                        "grab": {
                            "distance": 400,
                            "line_linked": {
                                "opacity": 1
                            }
                        },
                        "bubble": {
                            "distance": 400,
                            "size": 40,
                            "duration": 2,
                            "opacity": 8,
                            "speed": 3
                        },
                        "repulse": {
                            "distance": 200,
                            "duration": 0.4
                        },
                        "push": {
                            "particles_nb": 4
                        },
                        "remove": {
                            "particles_nb": 2
                        }
                    }
                },
                "retina_detect": true
            });
        }
    }


}); // Fin de DOMContentLoaded