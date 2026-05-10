const url = 'http://192.168.1.2:450/';
const itemsPerPage = 24; 
let currentPage = 0;
let datagrl = null; 
let filteredData = null;
let currentPlayingItem = null;

// Referencias del DOM
const els = {
    container: document.getElementById('videos-container'),
    stats: document.getElementById('stats'),
    
    // Paginación dual
    prevBtns: document.querySelectorAll('.prevPage'),
    nextBtns: document.querySelectorAll('.nextPage'),
    pageIndicators: document.querySelectorAll('.pageIndicator'),
    paginationControls: document.querySelectorAll('.pagination-controls'),
    
    searchInput: document.getElementById('searchInput'),
    searchInputMobile: document.getElementById('searchInputMobile'),
    btnReload: document.getElementById('btnReload'),
    btnRandom: document.getElementById('btnRandom'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    
    // Reproductor principal
    playerContainer: document.getElementById('player-container'),
    mainPlayer: document.getElementById('mainPlayer'),
    nowPlayingTitle: document.getElementById('nowPlayingTitle'),
    nowPlayingPath: document.getElementById('nowPlayingPath'),
    btnClosePlayer: document.getElementById('btnClosePlayer'),
    speedSelector: document.getElementById('speedSelector'),
    btnPip: document.getElementById('btnPip'),

    // Historial
    historySection: document.getElementById('history-section'),
    historyContainer: document.getElementById('history-container'),

    // Favoritos
    favoritesSection: document.getElementById('favorites-section'),
    favoritesContainer: document.getElementById('favorites-container'),
    favoritesCount: document.getElementById('favorites-count')
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    renderHistory();
    renderFavorites();
    
    const cachedData = sessionStorage.getItem('datagrl');
    if (cachedData) {
        try {
            datagrl = JSON.parse(cachedData);
            filteredData = [...datagrl];
            loadPage(0);
        } catch (e) {
            console.error("Error al parsear el caché", e);
            await fetchVideos();
        }
    } else {
        await fetchVideos();
    }
}

function setupEventListeners() {
    els.btnReload.addEventListener('click', async () => {
        const icon = els.btnReload.querySelector('i');
        icon.classList.add('fa-spin');
        await fetchVideos();
        icon.classList.remove('fa-spin');
    });

    els.btnRandom.addEventListener('click', playRandomVideo);

    els.prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentPage > 0) {
                loadPage(currentPage - 1);
                // Subir vista
                window.scrollTo({ top: document.getElementById('videos-container').offsetTop - 150, behavior: 'smooth' });
            }
        });
    });

    els.nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages - 1) {
                loadPage(currentPage + 1);
                // Subir vista
                window.scrollTo({ top: document.getElementById('videos-container').offsetTop - 150, behavior: 'smooth' });
            }
        });
    });

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase().trim();
        if(e.target === els.searchInput) els.searchInputMobile.value = query;
        else els.searchInput.value = query;
        filterVideos(query);
    };

    els.searchInput.addEventListener('input', handleSearch);
    els.searchInputMobile.addEventListener('input', handleSearch);

    els.btnClosePlayer.addEventListener('click', closePlayer);

    // Controles Extendidos
    els.speedSelector.addEventListener('change', (e) => {
        els.mainPlayer.playbackRate = parseFloat(e.target.value);
    });

    els.btnPip.addEventListener('click', async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled && !els.mainPlayer.disablePictureInPicture) {
            try {
                await els.mainPlayer.requestPictureInPicture();
            } catch (err) {
                console.error("PiP error:", err);
            }
        }
    });

    // Continuar Viendo: Guardar tiempo
    els.mainPlayer.addEventListener('timeupdate', () => {
        if (!currentPlayingItem) return;
        // Solo guarda si avanzó más de 5 segundos
        if (els.mainPlayer.currentTime > 5) { 
            const key = `vid_time_${currentPlayingItem.path}`;
            localStorage.setItem(key, els.mainPlayer.currentTime);
        }
    });
}

async function fetchVideos() {
    showLoading(true);
    try {
        const response = await fetch(`${url}api/Video/list`);
        if (!response.ok) throw new Error('Error al obtener API');
        datagrl = await response.json();
        
        datagrl.sort(() => Math.random() - 0.5);
        
        sessionStorage.setItem('datagrl', JSON.stringify(datagrl));
        filteredData = [...datagrl];
        els.searchInput.value = '';
        els.searchInputMobile.value = '';
        loadPage(0);
    } catch (error) {
        console.error('Error fetching videos:', error);
        els.stats.innerHTML = `<span class="text-red-500">Error al cargar datos</span>`;
        showEmpty(true);
    } finally {
        showLoading(false);
    }
}

function filterVideos(query) {
    if (!datagrl) return;
    
    if (!query) {
        filteredData = [...datagrl];
    } else {
        filteredData = datagrl.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.path.toLowerCase().includes(query)
        );
    }
    
    loadPage(0);
}

function loadPage(pageNumber) {
    if (!filteredData) return;
    
    currentPage = pageNumber;
    const startIndex = pageNumber * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    els.container.innerHTML = '';

    if (filteredData.length === 0) {
        showEmpty(true);
        togglePagination(false);
        els.stats.textContent = "0 resultados";
        return;
    }

    showEmpty(false);
    togglePagination(true);

    for (let i = startIndex; i < endIndex; i++) {
        const item = filteredData[i];
        els.container.appendChild(createVideoCard(item));
    }

    updatePagination();
}

function createVideoCard(item) {
    const cleanName = item.name.replace(/\.mp4$/i, '');
    const streamUrl = `${url}api/Video/stream/${encodeURIComponent(item.path)}#t=5`; 
    
    const div = document.createElement('div');
    div.className = 'card-glass rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col h-full relative';
    div.onclick = () => playVideo(item);
    
    let progressHtml = '';
    const savedTime = localStorage.getItem(`vid_time_${item.path}`);
    if (savedTime) {
        // Asume progreso base si hay tiempo guardado (difícil calcular % sin duracion total pre-cargada)
        progressHtml = `<div class="absolute bottom-0 left-0 h-1 bg-purple-500 z-20 w-1/2 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" title="Continuar viendo"></div>`;
    }

    const favIconClass = isFavorite(item.path) ? 'fa-solid text-red-500' : 'fa-regular text-white/70 hover:text-red-500';

    div.innerHTML = `
        <div class="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
            <video src="${streamUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" preload="metadata" muted playsinline></video>
            <i class="fa-solid fa-play absolute text-4xl text-white/50 group-hover:text-purple-500 group-hover:scale-110 transition-all duration-300 z-10 drop-shadow-lg pointer-events-none"></i>
            <button class="fav-btn absolute top-2 right-2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 focus:outline-none">
                <i class="fa-heart text-lg transition-colors ${favIconClass}" data-fav-path="${encodeURIComponent(item.path)}"></i>
            </button>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            ${progressHtml}
        </div>
        <div class="p-4 flex-grow">
            <h3 class="text-slate-200 font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors" title="${cleanName}">${cleanName}</h3>
        </div>
    `;
    
    const favBtn = div.querySelector('.fav-btn');
    favBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(item);
    };
    
    return div;
}

function createHistoryCard(item) {
    const cleanName = item.name.replace(/\.mp4$/i, '');
    const streamUrl = `${url}api/Video/stream/${encodeURIComponent(item.path)}#t=5`; 
    
    const div = document.createElement('div');
    div.className = 'flex-shrink-0 w-48 card-glass rounded-lg overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 relative';
    div.onclick = () => playVideo(item);
    
    div.innerHTML = `
        <div class="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
            <video src="${streamUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" preload="metadata" muted playsinline></video>
            <i class="fa-solid fa-play absolute text-2xl text-white/50 group-hover:text-purple-500 transition-all duration-300 z-10 pointer-events-none"></i>
        </div>
        <div class="p-2">
            <h3 class="text-slate-300 font-medium text-xs line-clamp-1 group-hover:text-purple-400" title="${cleanName}">${cleanName}</h3>
        </div>
    `;
    return div;
}

function addToHistory(item) {
    let history = JSON.parse(localStorage.getItem('watch_history')) || [];
    history = history.filter(h => h.path !== item.path);
    history.unshift({ name: item.name, path: item.path });
    if (history.length > 10) history.pop();
    
    localStorage.setItem('watch_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('watch_history')) || [];
    if (history.length === 0) {
        els.historySection.classList.add('hidden');
        return;
    }
    
    els.historySection.classList.remove('hidden');
    els.historyContainer.innerHTML = '';
    
    history.forEach(item => {
        els.historyContainer.appendChild(createHistoryCard(item));
    });
}

function isFavorite(path) {
    const favorites = JSON.parse(localStorage.getItem('favorites_list')) || [];
    return favorites.some(f => f.path === path);
}

function toggleFavorite(item) {
    let favorites = JSON.parse(localStorage.getItem('favorites_list')) || [];
    const index = favorites.findIndex(f => f.path === item.path);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
    } else {
        // Add to favorites
        favorites.unshift({ name: item.name, path: item.path });
    }
    
    localStorage.setItem('favorites_list', JSON.stringify(favorites));
    renderFavorites();
    
    // Update all matching favorite icons on the screen
    const favIcons = document.querySelectorAll(`i[data-fav-path="${encodeURIComponent(item.path)}"]`);
    favIcons.forEach(icon => {
        if (index > -1) {
            // Was removed
            icon.classList.remove('fa-solid', 'text-red-500');
            icon.classList.add('fa-regular', 'text-white/70');
        } else {
            // Was added
            icon.classList.remove('fa-regular', 'text-white/70', 'hover:text-red-500');
            icon.classList.add('fa-solid', 'text-red-500');
        }
    });
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites_list')) || [];
    if (favorites.length === 0) {
        els.favoritesSection.classList.add('hidden');
        return;
    }
    
    els.favoritesSection.classList.remove('hidden');
    els.favoritesContainer.innerHTML = '';
    els.favoritesCount.textContent = `${favorites.length} video${favorites.length !== 1 ? 's' : ''}`;
    
    favorites.forEach(item => {
        els.favoritesContainer.appendChild(createFavoriteCard(item));
    });
}

function createFavoriteCard(item) {
    const cleanName = item.name.replace(/\.mp4$/i, '');
    const streamUrl = `${url}api/Video/stream/${encodeURIComponent(item.path)}#t=5`; 
    
    const div = document.createElement('div');
    div.className = 'w-full h-full card-glass rounded-lg overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 relative flex flex-col';
    div.onclick = () => playVideo(item);
    
    div.innerHTML = `
        <div class="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
            <video src="${streamUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" preload="metadata" muted playsinline></video>
            <i class="fa-solid fa-play absolute text-2xl text-white/50 group-hover:text-purple-500 transition-all duration-300 z-10 pointer-events-none"></i>
            <button class="fav-btn absolute top-1 right-1 z-20 p-1.5 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 focus:outline-none">
                <i class="fa-solid fa-heart text-sm text-red-500" data-fav-path="${encodeURIComponent(item.path)}"></i>
            </button>
        </div>
        <div class="p-2">
            <h3 class="text-slate-300 font-medium text-xs line-clamp-1 group-hover:text-purple-400" title="${cleanName}">${cleanName}</h3>
        </div>
    `;
    
    const favBtn = div.querySelector('.fav-btn');
    favBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(item);
    };
    
    return div;
}

function playVideo(item) {
    currentPlayingItem = item;
    addToHistory(item); 
    
    const cleanName = item.name.replace(/\.mp4$/i, '');
    const streamUrl = `${url}api/Video/stream/${encodeURIComponent(item.path)}`;
    
    els.playerContainer.classList.remove('hidden');
    els.nowPlayingTitle.textContent = cleanName;
    els.nowPlayingPath.textContent = item.path;
    
    els.mainPlayer.src = streamUrl;
    
    // Continuar viendo
    const savedTime = localStorage.getItem(`vid_time_${item.path}`);
    if (savedTime) {
        els.mainPlayer.currentTime = parseFloat(savedTime);
    }

    els.mainPlayer.playbackRate = parseFloat(els.speedSelector.value);
    
    els.mainPlayer.play().catch(e => console.log("Autoplay bloqueado", e));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
    els.mainPlayer.pause();
    els.mainPlayer.removeAttribute('src'); 
    els.mainPlayer.load();
    els.playerContainer.classList.add('hidden');
    currentPlayingItem = null;
}

function playRandomVideo() {
    if (!datagrl || datagrl.length === 0) return;
    const randomIndex = Math.floor(Math.random() * datagrl.length);
    playVideo(datagrl[randomIndex]);
}

function togglePagination(show) {
    els.paginationControls.forEach(el => {
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function updatePagination() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    els.stats.textContent = `${totalItems} video${totalItems !== 1 ? 's' : ''}`;
    
    if (totalPages <= 1) {
        togglePagination(false);
    } else {
        togglePagination(true);
        els.pageIndicators.forEach(indicator => {
            indicator.textContent = `Página ${currentPage + 1} de ${totalPages}`;
        });
        
        els.prevBtns.forEach(btn => { btn.disabled = currentPage === 0; });
        els.nextBtns.forEach(btn => { btn.disabled = currentPage >= totalPages - 1; });
    }
}

function showLoading(show) {
    if (show) {
        els.loadingState.classList.remove('hidden');
        els.container.classList.add('hidden');
        els.emptyState.classList.add('hidden');
        togglePagination(false);
    } else {
        els.loadingState.classList.add('hidden');
        els.container.classList.remove('hidden');
    }
}

function showEmpty(show) {
    if (show) {
        els.emptyState.classList.remove('hidden');
        els.container.classList.add('hidden');
    } else {
        els.emptyState.classList.add('hidden');
        els.container.classList.remove('hidden');
    }
}
