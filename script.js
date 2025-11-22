// =======================================================
// 1. CONFIGURACIÓN GLOBAL (URLs Base) 
// Ya no usamos 'import', las librerías son variables globales (THREE, GLTFLoader, gsap)
// =======================================================
const BASE_URL = 'https://raw.githubusercontent.com/eri-niviayo10/portafolio-erika-niviayo/main/img/';
const GLB_URL = `${BASE_URL}preload_torus.glb`;

// ARRAY CORRECTO de URLs de Imagen para la Transición del Hero
const textureUrls = [
    `${BASE_URL}hero1.jpg`,
    `${BASE_URL}hero2.jpg`,
    `${BASE_URL}hero3.jpg`,
    `${BASE_URL}hero4.jpg`,
];

// URL del mapa de desplazamiento
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
    
    // Variables para la deformación dinámica
    let uMouse = new THREE.Vector2(0.0, 0.0); 
    
    // =======================================================
    // 3. INICIALIZACIÓN DE THREE.JS Y PARTICLES.JS
    // =======================================================
    
    initParticles();
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, preloaderAnimation.clientWidth / preloaderAnimation.clientHeight, 0.1, 10);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('hero-webgl-canvas'),
        antialias: true,
        alpha: true // Permite que el fondo sea transparente
    });
    renderer.setSize(preloaderAnimation.clientWidth, preloaderAnimation.clientHeight);

    let mesh;
    let material;
    let uniforms;

    // Redimensionar la escena
    window.addEventListener('resize', () => {
        const width = preloaderAnimation.clientWidth;
        const height = preloaderAnimation.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        if (mesh) {
            mesh.scale.set(1, 1, 1);
        }
    });

    // =======================================================
    // 4. FUNCIÓN: Carga del Modelo 3D (Wireframe)
    // =======================================================

    function createDynamicWireframe() {
        // 2. Inicializar el cargador de modelos GLTF
        // ✅ CORRECCIÓN: Usamos THREE.GLTFLoader ya que se cargó globalmente
        const loader = new THREE.GLTFLoader(); 

        loader.load(
            GLB_URL,
            (gltf) => {
                let torus = gltf.scene.children[0]; // Asume que el toro es el primer hijo

                // 3. Configuración de la Malla (Mesh) y Material
                mesh = torus.geometry;
                
                // Definición de uniformes para los shaders
                uniforms = {
                    uProgress: { value: 0.0 },
                    uMouse: { value: uMouse },
                    uTexture1: { value: null }, // Se cargará después
                    uTexture2: { value: null }, // Se cargará después
                    uDisp: { value: null }, // Se cargará después
                };

                // Material con los shaders que definiste en el HTML
                material = new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: document.getElementById('vertex-shader').textContent,
                    fragmentShader: document.getElementById('fragment-shader').textContent,
                    wireframe: true,
                });

                // Crear la malla final
                mesh = new THREE.Mesh(torus.geometry, material);
                scene.add(mesh);
                
                // Ajustar la escala del toro para que se vea bien en el preloader
                mesh.scale.set(0.7, 0.7, 0.7); 

                // Iniciar la animación
                animate();

                console.log('Modelo GLB cargado y añadido a la escena.');
            },
            (xhr) => {
                // Progreso de la carga (opcional)
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
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
            
            // Si el material tiene uniformes, los actualizamos
            if (uniforms) {
                 uniforms.uMouse.value.copy(uMouse);
                 // Opcional: Animar uProgress en el preloader si deseas un efecto visual
                 // uniforms.uProgress.value = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
            }
        }

        renderer.render(scene, camera);
    };

    // =======================================================
    // 6. EVENTOS Y LÓGICA DE INTERFAZ
    // =======================================================

    // Iniciar la carga y animación del wireframe
    createDynamicWireframe();

    // Movimiento del mouse para deformación (si hay un mesh cargado)
    window.addEventListener('mousemove', (e) => {
        // Normalizar coordenadas a [-1, 1]
        uMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        uMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Lógica para mostrar el contenido principal
    enterButton.addEventListener('click', () => {
        // Ocultar preloader con una animación suave (usando GSAP)
        gsap.to(preloader, { 
            opacity: 0, 
            duration: 1, 
            onComplete: () => {
                preloader.classList.add('hidden');
                mainContent.classList.remove('hidden');
                // Opcional: Reiniciar la cámara para la sección hero si el canvas es reutilizado
                // o iniciar el script de la sección hero aquí.
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
    }, 3000); // Cambia el texto cada 3 segundos


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
                        "value": "#00FFC5" // Color verde/cercano a tu estilo
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
                        "color": "#00FFC5",
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