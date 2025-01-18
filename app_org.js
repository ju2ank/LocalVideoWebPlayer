const url = 'https://192.168.1.7:446/'
const itemsPerPage = 12;
let lastPageLoaded = 0;
let datagrl = null;
let filtro = false;
let newdata = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarData();
    });

    function cargarData(){
        fetch(`${url}VideoInfo/GetVideoList`)
        .then(response => response.json())
        .then(data =>{
            datagrl=data;
            loadPage(0, data);
        }
        )
        .catch(error => console.error(error));
    }

 /*    function loadPage(pageNumber, data) {
        // Calcula el índice del primer elemento a cargar en esta página
        const startIndex = pageNumber * itemsPerPage;

        // Calcula el índice del último elemento a cargar en esta página
        const endIndex = Math.min(startIndex + itemsPerPage, data.length);

        // Crea y añade los elementos a la página
        for (let i = startIndex; i < endIndex; i++) {
            const item = data[i];

            const div1Element = document.createElement('div');
            div1Element.className = "w-full md:w-1/3 lg:w-1/3 px-2 mb-3";
            const div2Element = document.createElement('div');
            div2Element.className = "border rounded-lg overflow-hidden shadow-md";
            const div3Element = document.createElement('div');
            div3Element.className = "relative";
            const div4Element = document.createElement('div');
            div4Element.className = "py-4 px-6";
            const div5Element = document.createElement('div');
            // div5Element.className = "font-bold whitespace-pre-wrap text-center mb-2";
            // div5Element.className = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded shadow-lg text-white font-bold whitespace-pre-wrap text-center text-xs tracking-wide leading-relaxed";
            div5Element.className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300";
            
            const videoElement = document.createElement('video');
            videoElement.autoplay = false;
            videoElement.muted = true;
            videoElement.src = `${url}VideoStream/GetStream/${item.path}`;
            videoElement.className= "w-full h-auto";
            videoElement.id =  item.path.slice(item.path.lastIndexOf('|')+1,(item.path.length));
            videoElement.addEventListener('click', function() { videoElement.requestFullscreen();});


            div5Element.innerHTML = item.path.slice(item.path.lastIndexOf('|')+1,(item.path.length));
            div5Element.addEventListener('mouseup', function(event) {
                if (event.which === 2 || event.button === 1) {
                    reproducirVideo(videoElement.src)}
                
                });


                div4Element.appendChild(videoElement);
                div4Element.appendChild(div5Element);
                div3Element.appendChild(div4Element);
                div2Element.appendChild(div3Element);
                div1Element.appendChild(div2Element);
                

            
        //     const labelElement = document.createElement('label');
        //     labelElement.textContent = item.path.slice(item.path.lastIndexOf('|')+1,(item.path.length));
        //     labelElement.setAttribute("for", "mi-input");
        //     labelElement.className = "text-center block font-bold text-red-700";
        //     labelElement.addEventListener('mouseup', function(event) {
        //         if (event.which === 2 || event.button === 1) {
        //             reproducirVideo(videoElement.src)}
                
        //         });
            
        //    const divElement = document.createElement('div');
        //     divElement.appendChild(videoElement);
        //     divElement.appendChild(labelElement);
            
            // Añade el elemento al contenedor de la página
            const pageContainer = document.querySelector('#videos-container');
            pageContainer.appendChild(div1Element);
            
}

// Actualiza el índice de la última página cargada
lastPageLoaded = pageNumber;
} */

function loadPage(pageNumber, data) {
    const startIndex = pageNumber * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);

    for (let i = startIndex; i < endIndex; i++) {
        const item = data[i];

        const div1Element = document.createElement('div');
        div1Element.className = "w-full md:w-1/3 lg:w-1/3 px-2 mb-3";

        const div2Element = document.createElement('div');
        div2Element.className = "border rounded-lg overflow-hidden shadow-md";

        const colorBackground = document.createElement('div');
        colorBackground.className = "bg-yellow-300 p-2";

        const div3Element = document.createElement('div');
        div3Element.className = "relative";

        const div4Element = document.createElement('div');
        div4Element.className = "py-4 px-6";

        const div5Element = document.createElement('div');
        div5Element.className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300";

        const videoElement = document.createElement('video');
        videoElement.autoplay = false;
        videoElement.muted = true;
        videoElement.src = `${url}VideoStream/GetStream/${item.path}`;
        videoElement.className= "w-full h-auto";
        videoElement.id =  item.path.slice(item.path.lastIndexOf('|') + 1, (item.path.length));
        videoElement.addEventListener('click', function() { videoElement.requestFullscreen(); });

        div5Element.innerHTML = item.path.slice(item.path.lastIndexOf('|') + 1, (item.path.length));
        div5Element.addEventListener('mouseup', function(event) {
            if (event.which === 2 || event.button === 1) {
                reproducirVideo(videoElement.src);
            }
        });

        div4Element.appendChild(videoElement);
        div4Element.appendChild(div5Element);
        div3Element.appendChild(div4Element);
        colorBackground.appendChild(div3Element); // Añadimos div3Element dentro del color de fondo
        div2Element.appendChild(colorBackground); // Añadimos el fondo de color dentro del div2Element
        div1Element.appendChild(div2Element);

        const pageContainer = document.querySelector('#videos-container');
        pageContainer.appendChild(div1Element);
    }

    lastPageLoaded = pageNumber;
}


function reproducirVideo(src)
{
   window.open (`ReproducirVideo.html?src=${src}`);
}


window.addEventListener('scroll', function() {
    const pageContainer = document.querySelector('#videos-container');
    // Verifica si el usuario ha llegado al final de la página actual
    if (window.innerHeight + window.scrollY >= pageContainer.offsetHeight) {
      // Si es así, carga la siguiente página
      if (!filtro) {
          loadPage(lastPageLoaded + 1,datagrl);    
      }else{
  
          loadPage(lastPageLoaded + 1,newdata);
      }
      
    }
  });

  function BuscarDatos(){

    if(datagrl == null) 
    cargarData();

    const pageContainer = document.querySelector('#videos-container');
    pageContainer.innerHTML ="";
    
    const filenameInput = document.getElementById('filename-input');
    const filename = filenameInput.value.toLowerCase();
    newdata = datagrl.filter(item => item.path.toLowerCase().includes(filename));
    filtro=true;
    loadPage(0,newdata);
 
    }

    async function GetVideo(){

        await fetch(`${url}VideoInfo/GetRandomVideo`)
                    .then(response => response.text())
                    .then((response) => {
                        showVideo(response)
                    })
                    .catch(err => console.log(err));
  datagrl=null;
        };
        

        function showVideo(video){
            const pageContainer = document.querySelector('#videos-container');
            pageContainer.innerHTML ="";
    
            /*Path*/
            const h1Element = document.createElement('h1');
            h1Element.className="container w-full max-w-6xl mx-auto bg-brand font-bold text-purple-600  md:text-center text-2xl";
            h1Element.id="videoPath"
            h1Element.innerHTML = video.slice(video.lastIndexOf('|')+1,(video.length))
        
            /*Video*/
            const videoElement = document.createElement('video');
            videoElement.className="container w-full max-w-6xl mx-auto bg-white bg-cover mt-8 rounded border-gray-500 md:text-center text-2xl";
            videoElement.id="video";
            videoElement.controls= true;
            videoElement.muted= true;
            videoElement.autoplay= true;
            videoElement.src = `${url}VideoStream/GetStream/${video}`;
           
            pageContainer.appendChild(h1Element);
            pageContainer.appendChild(videoElement);


            }