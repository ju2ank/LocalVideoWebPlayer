const url = 'https://192.168.1.7:446/';
const itemsPerPage = 30; // Cambiado a 30 elementos por página
let currentPage = 0;
let datagrl = null;
let filtro = false;
let newdata = null;

// Inicializa el evento DOMContentLoaded para cargar los datos
document.addEventListener('DOMContentLoaded', cargarData);

// Función para cargar datos desde la API
async function cargarData() {
    try {
        const response = await fetch(`${url}VideoInfo/GetVideoList`);
        datagrl = await response.json();
        loadPage(0, datagrl);
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Función para cargar la página especificada
function loadPage(pageNumber, data) {
    currentPage = pageNumber;
    const startIndex = pageNumber * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const pageContainer = document.querySelector('#videos-container');
    pageContainer.innerHTML = '';

    // Crear las tarjetas de video para la página actual
    for (let i = startIndex; i < endIndex; i++) {
        const item = data[i];
        let videoPath = item.path.slice(item.path.lastIndexOf('|') + 1);
        videoPath = videoPath.replace('.mp4', ''); // Quitar la extensión .mp4

        const card = createVideoCard(item, videoPath);
        pageContainer.appendChild(card);
    }

    // Actualizar la información de paginación
    updatePaginationInfo(pageNumber, data.length);
}

// Función para crear una tarjeta de video
function createVideoCard(item, videoPath) {
    const div1Element = document.createElement('div');
    div1Element.className = 'w-full md:w-1/3 lg:w-1/3 px-2 mb-3';

    const div2Element = document.createElement('div');
    div2Element.className = 'border rounded-lg overflow-hidden shadow-md';

    const colorBackground = document.createElement('div');
    colorBackground.className = 'rounded-border p-2 bg-white';

    const div3Element = document.createElement('div');
    div3Element.className = 'relative';

    const div4Element = document.createElement('div');
    div4Element.className = 'py-4 px-6';

    const div5Element = document.createElement('div');
    div5Element.className = 'video-title bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-300';

    const videoElement = document.createElement('video');
    videoElement.autoplay = false;
    videoElement.muted = true;
    videoElement.src = `${url}VideoStream/GetStream/${item.path}`;
    videoElement.className = 'w-full h-auto';
    videoElement.id = videoPath;

    // Añadir evento para maximizar el video al hacer clic
    videoElement.addEventListener('click', () => videoElement.requestFullscreen());

    const videoControls = document.createElement('div');
    videoControls.className = 'video-controls';
    videoControls.style.display = 'block'; // Mostrar controles por defecto
    videoControls.innerHTML = `
        <button onclick="togglePlayPause('${videoPath}')">Play/Pause</button>
        <input type="range" min="0" max="100" value="0" onchange="seekVideo(event, '${videoPath}')">
    `;

    // Mostrar u ocultar controles al hacer clic en el nombre (si deseas mantener esta funcionalidad)
    div5Element.innerHTML = videoPath;
  /*   div5Element.addEventListener('click', () => {
        toggleVideoControls(videoControls, videoElement);
    }); */

    div4Element.appendChild(videoElement);
    div4Element.appendChild(div5Element);
    div4Element.appendChild(videoControls);
    div3Element.appendChild(div4Element);
    colorBackground.appendChild(div3Element);
    div2Element.appendChild(colorBackground);
    div1Element.appendChild(div2Element);

    return div1Element;
}

// Función para mostrar u ocultar los controles de video
/* function toggleVideoControls(videoControls, videoElement) {
    if (videoControls.style.display === 'none' || !videoControls.style.display) {
        videoControls.style.display = 'block';
    } else {
        videoControls.style.display = 'none';
        videoElement.pause();
    }
} */

// Función para reproducir o pausar el video
function togglePlayPause(videoId) {
    const videoElement = document.getElementById(videoId);
    if (videoElement.paused) {
        videoElement.play();
    } else {
        videoElement.pause();
    }
}

// Función para cambiar la posición de reproducción del video
function seekVideo(event, videoId) {
    const videoElement = document.getElementById(videoId);
    const percent = event.target.value;
    const newTime = (percent / 100) * videoElement.duration;
    videoElement.currentTime = newTime;
}


// Función para buscar un video específico en la lista de datos cargados
function buscarDatos() {
    if (!datagrl) {
        console.error('Datos no cargados.');
        return;
    }

    const filename = document.getElementById('filename-input').value.toLowerCase();
    newdata = datagrl.filter(item => item.path.toLowerCase().includes(filename));
    filtro = true;
    loadPage(0, newdata);
}

// Función para obtener un video aleatorio de la API
async function getVideo() {
    try {
        const response = await fetch(`${url}VideoInfo/GetRandomVideo`);
        const video = await response.text();
        showVideo(video);
    } catch (error) {
        console.error('Error al obtener video:', error);
    }
    datagrl = null;
}

// Función para mostrar el video aleatorio obtenido
function showVideo(video) {
    const pageContainer = document.querySelector('#videos-container');
    pageContainer.innerHTML = '';

    let videoPath = video.slice(video.lastIndexOf('|') + 1);
    videoPath = videoPath.replace('.mp4', ''); // Quitar la extensión .mp4

    const h1Element = document.createElement('h1');
    h1Element.className = 'container w-full max-w-6xl mx-auto bg-brand font-bold text-yellow-600 md:text-center text-2xl';
    h1Element.id = 'videoPath';
    h1Element.innerHTML = videoPath;

    const videoElement = document.createElement('video');
    videoElement.className = 'container w-full max-w-6xl mx-auto bg-white bg-cover mt-8 rounded border-gray-500 md:text-center text-2xl';
    videoElement.id = 'video';
    videoElement.controls = true;
    videoElement.muted = true;
    videoElement.autoplay = true;
    videoElement.src = `${url}VideoStream/GetStream/${video}`;

    pageContainer.appendChild(h1Element);
    pageContainer.appendChild(videoElement);
}

// Función para actualizar la información de paginación
function updatePaginationInfo(pageNumber, totalItems) {
    const stats = document.getElementById('stats');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    stats.innerHTML = `Resultados: ${totalItems} | Página: ${pageNumber + 1} de ${totalPages}`;

    togglePaginationButtons(pageNumber, totalItems);
}

// Función para habilitar o deshabilitar botones de paginación
function togglePaginationButtons(pageNumber, totalItems) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    prevButton.disabled = pageNumber === 0;
    nextButton.disabled = (pageNumber + 1) * itemsPerPage >= totalItems;
}

// Función para ir a la página anterior
function previousPage() {
    if (currentPage > 0) {
        const data = filtro ? newdata : datagrl;
        loadPage(currentPage - 1, data);
        window.scrollTo(0, 0); // Volver al principio de la página
    }
}

// Función para ir a la siguiente página
function nextPage() {
    const data = filtro ? newdata : datagrl;
    if ((currentPage + 1) * itemsPerPage < data.length) {
        loadPage(currentPage + 1, data);
        window.scrollTo(0, 0); // Volver al principio de la página
    }
}

// Función para ir a una página específica
function gotoPage() {
    const pageInput = document.getElementById('gotoPage').value;
    const pageNumber = parseInt(pageInput) - 1;

    const data = filtro ? newdata : datagrl;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    
    if (pageNumber >= 0 && pageNumber < totalPages) {
        loadPage(pageNumber, data);
        window.scrollTo(0, 0); // Volver al principio de la página
    } else {
        console.error('Número de página inválido.');
    }
}

