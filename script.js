/**
 * Script.js para el Portafolio de Eri Niviayo
 * Incluye: Animación 3D de Malla de Alambre (Three.js), Partículas (particles.js),
 * Transición de Entrada (GSAP), Rotación de Palabras (GSAP) y Menú Móvil.
 * * Versión 6.5: Corrección CLAVE de ReferenceError: Arreglo de URLs en array textureUrls
 * y reestructuración de variables de configuración.
 */

// =======================================================
// 1. CONFIGURACIÓN GLOBAL (URLs Base) 👈 NUEVA POSICIÓN
// =======================================================

// URL base del repositorio para las imágenes (útil si todas están en la misma carpeta)
const BASE_URL = 'https://raw.githubusercontent.com/eri-niviayo10/portafolio-erika-niviayo/main/img/';
const GLB_URL = `${BASE_URL}preload_torus.glb`;

// ✅ CÓDIGO CORREGIDO para resolver el error "Three.js not defined"
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// 👈 Array CORRECTO de URLs de imagen para la transición del Hero
// USAMOS comillas simples/dobles o backticks para definir strings
const textureUrls = [ 
    // Ahora usamos la BASE_URL y concatenamos el nombre del archivo
    `${BASE_URL}hero1.jpg`,
    `${BASE_URL}hero2.jpg`,
    `${BASE_URL}hero3.jpg`,
    `${BASE_URL}hero4.jpg`,
];

// URL del mapa de desplazamiento
const displacementUrl = `${BASE_URL}disp.jpg`;


document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de Elementos DOM
    const preloader = document.querySelector('.preloader');
    const mainContent = document.querySelector('.main-content');
    const enterButton = document.getElementById('enter-button');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNavUl = document.querySelector('.main-nav ul');
    const preloaderAnimationDiv = document.querySelector('.preloader-animation');
    
    // Elementos para la rotación de roles en el Hero
    const roleWords = document.querySelectorAll('.rotating-role-word');
    let currentRoleIndex = 0;
    
    // Variables para la deformación dinámica
    let geometry;
    let time = 0; // Para la función sin/cos de la deformación

    // =======================================================
    // 7. THREE.JS DISPLACEMENT SHADER LOGIC (AREA HERO) VARIABLES
    // =======================================================
    let heroScene, heroCamera, heroRenderer; // Nueva escena para el área Hero
    let textures = []; // Array para almacenar las texturas de imagen
    let displacementMap; // La textura del mapa de desplazamiento/ruido
    let mesh; // La malla de plano con el ShaderMaterial
    // ❌ ELIMINADO: contentImages (reemplazado por textureUrls en la parte superior)
    
    let currentImageIndex = 0; // Índice de la imagen que se muestra actualmente
    let isTransitioning = false;
    const transitionDuration = 1.5; // Duración de la transición GSAP (en segundos)
    const container = document.getElementById('hero-webgl-canvas'); // Contenedor del canvas principal

    // =======================================================
    // 7.6. Lógica de Transición y Bucle Automático
    // =======================================================
    
    /**
     * Ejecuta la transición de una textura a otra usando el shader y GSAP.
     * @param {number} newIndex - El índice de la textura de destino.
     */
    function changeTexture(newIndex) {
        // Si el índice es el mismo o estamos en transición, salimos
        if (currentImageIndex === newIndex || isTransitioning || !mesh) return; 
        
        isTransitioning = true;
        
        // 1. Asignar la nueva imagen (newIndex) como uTexture2
        mesh.material.uniforms.uTexture2.value = textures[newIndex];
        
        // 2. Animar el progreso de 0 a 1
        gsap.to(mesh.material.uniforms.uProgress, {
            duration: transitionDuration, 
            value: 1.0, 
            ease: 'power2.inOut', 
            
            onComplete: () => {
                // 3. Al finalizar, la imagen 2 pasa a ser la imagen 1.
                mesh.material.uniforms.uTexture1.value = textures[newIndex];
                // 4. Reiniciamos uProgress.
                mesh.material.uniforms.uProgress.value = 0.0;
                
                currentImageIndex = newIndex;
                isTransitioning = false;
            }
        });
    }

    /**
     * Inicia la siguiente transición en el bucle automático.
     */
    function startTransition() {
        if (isTransitioning || !textures.length) return;
        
        // Calcula el siguiente índice
        let nextIndex = (currentImageIndex + 1) % textures.length;
        
        // Llama a la función de transición
        changeTexture(nextIndex);
    }

    /**
     * Inicia el bucle automático (setInterval).
     */
    function startImageLoop() {
        // Solo inicia el bucle si hay más de una textura
        if (textures.length > 1) { 
            // Transición cada 4 segundos (4000ms)
            setInterval(startTransition, 4000); 
        }
    }

    // =======================================================
    // 2. ANIMACIÓN 3D CON THREE.JS (MALLA DE ALAMBRE DINÁMICA)
    // =======================================================
    let scene, camera, renderer, wireframeGroup, lineSegments;
    let frameId;
    let isDisintegrating = false; 
    const isMobile = window.innerWidth <= 768;

    /**
     * Crea un objeto 3D con una malla de alambre compleja que se deforma.
     */
    const createDynamicWireframe = async () => { // 👈 HACER ASÍNCRONA
    if (!preloaderAnimationDiv) return;
    
    // 1. Crear la URL completa del modelo GLB
    const fullGLBPath = BASE_URL + GLB_URL;

    // 2. Inicializar el cargador de modelos GLTF
    const loader = new GLTFLoader();
    
    try {
        // 3. Cargar el modelo de forma asíncrona
        const gltf = await loader.loadAsync(fullGLBPath);

        // 4. El objeto cargado es el `wireframeGroup` ahora.
        wireframeGroup = gltf.scene; 
        
        // 5. Opcional: Recorrer para aplicar material de malla de alambre y capturar la geometría/malla.
        wireframeGroup.traverse((child) => {
            if (child.isMesh) {
                // Almacenamos la malla principal como `lineSegments` para reutilizar la lógica de deformación/dispersión
                lineSegments = new THREE.LineSegments( 
                    new THREE.WireframeGeometry( child.geometry ), // Usamos la geometría del modelo
                    new THREE.LineBasicMaterial({ 
                        color: 0x00FFFF, // Cyan
                        linewidth: 2,    
                        transparent: true,
                        opacity: 0.9,
                        blending: THREE.AdditiveBlending 
                    }) 
                );
                // NOTA: Debes eliminar el `child` original de su padre si solo quieres el wireframe.
                // En este caso, simplemente lo añadiremos al grupo.
            }
        });
        
        // Si no se encontró ninguna malla, salimos.
        if (!lineSegments) {
             console.error('Modelo GLB cargado pero no se encontró una malla válida.');
             return;
        }

        // Reemplazar el `wireframeGroup` con la nueva malla de alambre
        wireframeGroup = new THREE.Group();
        wireframeGroup.add(lineSegments);


        // --- Lógica de Dispersión y Posiciones Iniciales (REUSADA) ---
        // Debes mover la lógica de dispersión que estaba en el original
        // y aplicarla a `lineSegments.geometry` aquí.
        const initialPositions = Array.from(lineSegments.geometry.attributes.position.array);
        lineSegments.geometry.setAttribute('initialPosition', new THREE.BufferAttribute(new Float32Array(initialPositions), 3));
        lineSegments.geometry.attributes.position.disperseVector = []; 
        
        const positions = lineSegments.geometry.attributes.position.array;
        for(let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i+1];
            const z = positions[i+2];
            lineSegments.geometry.attributes.position.disperseVector.push(
                new THREE.Vector3(x, y, z).normalize().multiplyScalar(3 + Math.random() * 2)
            );
        }
        lineSegments.geometry.attributes.position.originalArray = initialPositions;
        // -----------------------------------------------------------


        // Ajuste de escala (si es necesario)
        wireframeGroup.scale.set(1.5, 1.5, 1.5);
        
        scene.add(wireframeGroup);
        
    } catch (error) {
        console.error('Error al cargar el modelo GLB:', fullGLBPath, error);
    }
};
       
    /**
     * Aplica una sutil deformación sinusoidal (pulsación) al objeto 3D.
     */
    const updateDynamicDeformation = () => {
        time += 0.01;
        const positions = lineSegments.geometry.attributes.position.array;
        const original = lineSegments.geometry.attributes.position.originalArray;
        
        for(let i = 0; i < positions.length; i += 3) {
            const x = original[i];
            const y = original[i + 1];
            const z = original[i + 2];
            
            // Calculamos la distancia desde el centro
            const distance = Math.sqrt(x*x + y*y + z*z);
            
            // Deformación basada en el tiempo y la distancia para un efecto de pulsación
            const offset = (Math.sin(distance * 5 + time * 3) + 1) * 0.05; 
            
            // Aplicamos el desplazamiento en la dirección de la normal (alejándose del centro)
            positions[i] = x * (1 + offset);
            positions[i + 1] = y * (1 + offset);
            positions[i + 2] = z * (1 + offset);
        }
        
        lineSegments.geometry.attributes.position.needsUpdate = true;
    };


    /**
     * Bucle de animación principal del Preloader.
     */
    const animateThreeJs = (time) => {
        frameId = requestAnimationFrame(animateThreeJs);
        
        if (wireframeGroup && !isDisintegrating) {
            // Rotación constante mientras se espera el click
            wireframeGroup.rotation.x += 0.003; 
            wireframeGroup.rotation.y += 0.005; 
            
            // Aplicamos la deformación constante para el efecto de energía
            updateDynamicDeformation();
        }
        
        renderer.render(scene, camera);
    };


    /**
 * Inicializa la escena, cámara y renderizador de Three.js (Preloader).
 */
const initThreeJs = () => {
    if (typeof THREE === 'undefined') {
        console.error("Three.js not defined.");
        return;
    }

    scene = new THREE.Scene();
    
    const width = preloaderAnimationDiv.clientWidth;
    const height = preloaderAnimationDiv.clientHeight;

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000); 
    camera.position.z = 5; 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); 
    renderer.setSize(width, height);
    
    preloaderAnimationDiv.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 5); 
    scene.add(ambientLight);
    
    // LLAMADA CLAVE MODIFICADA: Ahora espera a que el modelo GLB se cargue.
    createDynamicWireframe().then(() => {
        animateThreeJs();
    });
    
    // *** EVENTO DE CLICK ***
    if (enterButton) {
        enterButton.addEventListener('click', disintegrate);
    }
};
    /**
     * Ejecuta la animación de desintegración de la malla de alambre.
     */
    const disintegrate = () => {
        if (isDisintegrating) return; // Previene múltiples clicks
        isDisintegrating = true;
        const duration = 1.0; // Reducido para acelerar la desintegración

        // Deshabilita el botón
        enterButton.disabled = true;

        const positions = lineSegments.geometry.attributes.position.array;
        const initialPositions = lineSegments.geometry.attributes.position.originalArray;
        const disperseVectors = lineSegments.geometry.attributes.position.disperseVector;

        // Desintegración de los puntos de la malla (volando hacia afuera)
        for (let i = 0; i < initialPositions.length; i += 3) {
            const delay = Math.random() * 0.2; // Reducido el delay de dispersión
            const disperseMagnitude = 1 + Math.random() * 2; 
            
            gsap.to(positions, {
                [i]: initialPositions[i] + disperseVectors[i/3].x * disperseMagnitude,
                [i + 1]: initialPositions[i+1] + disperseVectors[i/3].y * disperseMagnitude,
                [i + 2]: initialPositions[i+2] + disperseVectors[i/3].z * disperseMagnitude,
                duration: duration,
                delay: delay,
                ease: "power3.out",
                onUpdate: () => {
                    lineSegments.geometry.attributes.position.needsUpdate = true;
                }
            });
        }
        
        // Desvanecimiento de la malla
        gsap.to(lineSegments.material, {
            opacity: 0,
            duration: duration * 1.2,
            delay: 0.1, // Reducido el retraso
            ease: "power2.in"
        });
        
        // Ocultar el texto y el botón
        gsap.to(".preloader-text, .enter-button", {
            opacity: 0,
            duration: 0.3, // Reducido el tiempo de desvanecimiento
            delay: 0,
            ease: "power1.in"
        });


        // 4. Transición del Preloader (solapada con el final de la desintegración)
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.6, // Muy rápido
            delay: duration * 0.6, // Comienza a la mitad de la desintegración
            ease: "power2.inOut",
            onComplete: finalizeEntry
        });
    };
    
    /**
     * Finaliza la entrada y muestra el contenido principal.
     */
    const finalizeEntry = () => {
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
        preloader.style.display = 'none';
        mainContent.classList.remove('hidden');
        
        // El contenido principal aparece con un fade-in inmediato después de que el preloader se oculte.
        gsap.from(mainContent, {
            opacity: 0,
            duration: 1.0, // Mantenemos una duración de fade-in suave
            onStart: () => {
                startRoleRotation();
                // 🎯 LLAMADA CLAVE: INICIAMOS EL SISTEMA DE THREE.JS DEL HERO AQUÍ
                initHeroThreeJs(); 
            }
        });
    }


    // =======================================================
    // 7. THREE.JS DISPLACEMENT SHADER LOGIC (AREA HERO) - FUNCIONES
    // =======================================================

    // --- 7.1. Inicialización de la Escena del Hero ---
    function initHeroThreeJs() {
    if (typeof THREE === 'undefined' || !container) {
        console.error("Three.js not defined or canvas container missing.");
        return;
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    heroScene = new THREE.Scene();

    // Usamos una cámara Ortográfica para la escena 2D 
    heroCamera = new THREE.OrthographicCamera(
        -width / 2, width / 2, 
        height / 2, -height / 2, 
        0.1, 1000 // 🛑 CORRECCIÓN: Near plane a 0.1 para asegurar que Z=0 se vea.
    );
    heroCamera.position.z = 1; 

    heroRenderer = new THREE.WebGLRenderer({ 
        canvas: container, 
        antialias: true, 
        alpha: true 
    });
    heroRenderer.setSize(width, height);
    heroRenderer.setPixelRatio(window.devicePixelRatio);
    heroRenderer.setClearColor(0x000000, 0); 
    
    // Manejar el redimensionamiento del canvas del Hero
    window.addEventListener('resize', onHeroResize);

    // Cargar los recursos
    loadTextures();
}

// --- 7.2. Manejo de Redimensionamiento del Hero ---
function onHeroResize() {
    if (heroCamera && heroRenderer && mesh) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 1. Ajustar la cámara
        heroCamera.left = -width / 2;
        heroCamera.right = width / 2;
        heroCamera.top = height / 2;
        heroCamera.bottom = -height / 2;
        heroCamera.updateProjectionMatrix();

        // 2. Ajustar el renderizador
        heroRenderer.setSize(width, height);

        // 4. Recalcular el uniforme de resolución (Aspect Ratio)
        if (textures.length > 0) {
            const imageAspect = textures[0].image.width / textures[0].image.height;
            const canvasAspect = width / height;

            if (canvasAspect > imageAspect) {
                mesh.material.uniforms.uResolution.value.x = canvasAspect / imageAspect;
                mesh.material.uniforms.uResolution.value.y = 1;
            } else {
                mesh.material.uniforms.uResolution.value.x = 1;
                mesh.material.uniforms.uResolution.value.y = imageAspect / canvasAspect;
            }
        }
    }
}


// --- 7.3. Carga de Texturas (Imágenes y Mapa de Ruido) ---
function loadTextures() {
    const loader = new THREE.TextureLoader();
    const loadPromises = [];

    // Cargar imágenes de contenido
    // 🚨 USAMOS el array 'textureUrls' definido arriba 
    textureUrls.forEach(src => {
        const promise = new Promise((resolve, reject) => {
            loader.load(src, (texture) => {
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                textures.push(texture);
                resolve();
            }, undefined, reject);
        });
        loadPromises.push(promise);
    });

    // Cargar mapa de desplazamiento
    const displacementPromise = new Promise((resolve, reject) => {
        // 🚨 USAMOS la variable 'displacementUrl'
        loader.load(displacementUrl, (texture) => { 
            displacementMap = texture;
            displacementMap.wrapS = THREE.RepeatWrapping;
            displacementMap.wrapT = THREE.RepeatWrapping;
            resolve();
        }, undefined, reject);
    });
    loadPromises.push(displacementPromise);

    // Cuando todos los recursos estén cargados:
    Promise.all(loadPromises).then(() => {
        console.log('Todas las texturas cargadas. Iniciando Hero Scene.');
        createMesh();
        animateHero(); // Bucle de renderizado
        startImageLoop(); // 👈 LLAMADA CLAVE: Inicia el bucle automático
    }).catch(error => {
        console.error("Error al cargar las texturas:", error);
    });
}

// --- 7.4. Creación de la Malla (Mesh) con el Shader ---
function createMesh() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 🛑 LOG DE DEPURACIÓN 1
    console.log('Dimensiones del Contenedor:', width, height); 
    
    // 1. Definir la Geometría: Un plano simple
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

    // 2. Definir los Uniforms
    const uniforms = {
        uProgress: { value: 0.0 },
        uTexture1: { value: textures[0] }, 
        uTexture2: { value: textures[1] || textures[0] }, 
        uDisp: { value: displacementMap },
        uMouse: { value: new THREE.Vector2(0, 0) }, 
        uResolution: { value: new THREE.Vector4(1, 1, 0, 0) } 
    };
    
    // 3. Crear el Shader Material
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertex-shader').textContent,
        fragmentShader: document.getElementById('fragment-shader').textContent,
        transparent: true
    });

    // 4. Crear la Malla y Añadir a la Escena
    mesh = new THREE.Mesh(geometry, material);
    
    // 🛑 CORRECCIÓN CRÍTICA: Mover la malla fuera del near plane de la cámara
    mesh.position.z = 0; 
    
    heroScene.add(mesh);

    // 🛑 LOGS DE DEPURACIÓN 2
    console.log('Posición Z de la malla:', mesh.position.z);
    console.log('Malla es visible:', mesh.visible);

    // Ajuste inicial de la resolución
    onHeroResize();
}

// --- 7.5. Bucle de Renderizado del Hero ---
function animateHero() {
    requestAnimationFrame(animateHero); 
    heroRenderer.render(heroScene, heroCamera); 
}

// Ajustar el canvas al cambiar el tamaño de la ventana
// NOTA: Esta sección no usa `mesh` ni `heroRenderer`, solo ajusta las partículas, lo dejamos.
window.addEventListener('resize', () => {
    if (camera && renderer && preloaderAnimationDiv) {
        const width = preloaderAnimationDiv.clientWidth;
        const height = preloaderAnimationDiv.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
});

    // =======================================================
    // 3. LÓGICA DE PARTICLES.JS
    // =======================================================

    /**
     * Inicializa particles.js para el fondo animado.
     */
    const initParticles = () => {
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 80, density: { enable: true, value_area: 800 } },
                    color: { value: "#ffffff" },
                    shape: { type: "circle", stroke: { width: 0, color: "#000000" }, polygon: { nb_sides: 5 } },
                    opacity: { value: 0.5, random: false, anim: { enable: false } },
                    size: { value: 3, random: true, anim: { enable: false } },
                    line_linked: { enable: true, distance: 150, color: "#00ffff", opacity: 0.4, width: 1 }, 
                    move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false, attract: { enable: false, rotateX: 600, rotateY: 1200 } }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
                    modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
                },
                retina_detect: true
            });
        }
    };
    
    // =======================================================
    // 4. LÓGICA DEL MENÚ DE NAVEGACIÓN (MÓVIL)
    // =======================================================

    menuToggle.addEventListener('click', () => {
        mainNavUl.classList.toggle('active');
    });

    // Ocultar menú al hacer clic en un enlace (para móvil)
    mainNavUl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNavUl.classList.contains('active')) {
                mainNavUl.classList.remove('active');
            }
        });
    });

    // =======================================================
    // 5. ROTACIÓN DE PALABRAS EN EL HERO (GSAP)
    // =======================================================

    /**
     * Muestra la siguiente palabra de rol con una animación de fade-in/slide-up.
     */
    const showNextRole = () => {
        const currentWord = roleWords[currentRoleIndex];
        
        currentRoleIndex = (currentRoleIndex + 1) % roleWords.length;
        const nextWord = roleWords[currentRoleIndex];
        
        // 1. Animación de Salida (Current Word)
        gsap.to(currentWord, {
            y: -10,
            opacity: 0,
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => {
                currentWord.style.opacity = 0;
                currentWord.style.y = 0;
                currentWord.style.position = 'absolute';
            }
        });

        // 2. Preparación y Animación de Entrada (Next Word)
        gsap.set(nextWord, {
            y: 10, 
            opacity: 0, 
            position: 'relative'
        });

        gsap.to(nextWord, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        });
    };

    /**
     * Inicia el ciclo de rotación de palabras.
     */
    const startRoleRotation = () => {
        if(roleWords.length === 0) return;
        
        gsap.set(roleWords, {
            opacity: 0,
            y: 0,
            position: 'absolute'
        });
        
        gsap.set(roleWords[0], {
            opacity: 1,
            position: 'relative'
        });

        setInterval(showNextRole, 2500); // Cambia cada 2.5 segundos
    };

    // =======================================================
    // 6. EFECTO DE VISTA (SEGUIMIENTO DE CURSOR)
    // =======================================================
    const eyesContainer = document.querySelector('.eyes-container');
    const heroTitle = document.querySelector('.hero-title');

    document.addEventListener('mousemove', (e) => {
        if (!eyesContainer || isMobile) return;

        const rect = eyesContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const diffX = e.clientX - centerX;
        const diffY = e.clientY - centerY;

        const moveX = (diffX / window.innerWidth) * 40;
        const moveY = (diffY / window.innerHeight) * 40;

        const tiltX = (e.clientX / window.innerWidth - 0.5) * 4;
        const tiltY = (e.clientY / window.innerHeight - 0.5) * 4;

        // --- 1. ANIMACIÓN DE OJOS (GSAP) ---
        gsap.to(eyesContainer, {
            x: moveX,
            y: moveY,
            duration: 2.5, // Más lento
            ease: "power3.out" // Más suave
        });

        // --- 2. ANIMACIÓN DE TÍTULO (GSAP) ---
        gsap.to(heroTitle, {
            rotateX: -tiltY,
            rotateY: tiltX,
            duration: 2.5, // Más lento
            ease: "power3.out", // Más suave
            transformPerspective: 1000
        });
        
        // --- 3. LÓGICA THREE.JS DISPLACEMENT SHADER (CORTIZ STYLE) ---
        if (!mesh) return; 

        // Coordenadas normalizadas del mouse (X: -1 a 1, Y: -1 a 1)
        const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
        const normalizedY = -(e.clientY / window.innerHeight) * 2 + 1; // Y invertida

        let newIndex = 0;
        
        // Mapeo de Cuadrantes (0, 1, 2, 3)
        if (normalizedX > 0) { // Lado Derecho
            if (normalizedY > 0) { // Superior Derecho
                newIndex = 1; 
            } else { // Inferior Derecho
                newIndex = 3; 
            }
        } else { // Lado Izquierdo
            if (normalizedY > 0) { // Superior Izquierdo
                newIndex = 0; 
            } else { // Inferior Izquierdo
                newIndex = 2; 
            }
        }
        
        // Nota: Si quieres que el mouse fuerce la transición (anulando el bucle), descomenta:
        // changeTexture(newIndex); 
        
        mesh.material.uniforms.uMouse.value.set(normalizedX, normalizedY);
    });

    // Ejecución al cargar el DOM
    initParticles(); 
    initThreeJs(); 
    
});
