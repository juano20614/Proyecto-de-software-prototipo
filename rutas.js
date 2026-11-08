// Variable global para el mapa y estados de selección
let map;
let rutaPolyline = null;
let busesMarkers = [];
let animacionIntervals = [];
let usuarioMarker = null;
let mostrandoFavoritos = false;
let rutaPendienteAEliminar = null;
let rutaSeleccionadaId = null;

// Rutas base y predefinidas del sistema SETI Armenia
const rutasArmenia = [
    {
        id: "ruta-1",
        nombre: "Ruta 1: Puerto Espejo - Centro - Regavit",
        descripcion: "Conecta el sur con el centro y el norte de la ciudad.",
        estado: "En servicio (4 buses activos)",
        color: "#00a8cc",
        puntos: [
            [4.5201, -75.7005],
            [4.5300, -75.6880],
            [4.5338, -75.6811],
            [4.5450, -75.6690],
            [4.5580, -75.6580]
        ],
        buses: [
            { id: "BUS-101", puntoInicioIdx: 0, velocidad: 0.8 },
            { id: "BUS-102", puntoInicioIdx: 2, velocidad: 0.5 },
            { id: "BUS-103", puntoInicioIdx: 3, velocidad: 0.6 }
        ]
    },
    {
        id: "ruta-2",
        nombre: "Ruta 2: Terminal - Universidad del Quindío",
        descripcion: "Recorrido directo hacia el campus universitario.",
        estado: "En servicio (3 buses activos)",
        color: "#e63946",
        puntos: [
            [4.5262, -75.6883],
            [4.5320, -75.6800],
            [4.5420, -75.6720],
            [4.5540, -75.6605]
        ],
        buses: [
            { id: "BUS-201", puntoInicioIdx: 0, velocidad: 0.7 },
            { id: "BUS-202", puntoInicioIdx: 2, velocidad: 0.4 }
        ]
    }
];

const rutasPredefinidas = [
    {
        id: "pref-trabajo",
        nombre: "🏠 Casa ➔ 🏢 Trabajo (EPA / Centro)",
        descripcion: "Recorrido desde Montenegro / Sur hacia el Centro de Armenia.",
        estado: "Frecuencia: Cada 8 min",
        color: "#27ae60",
        puntos: [
            [4.5200, -75.7020],
            [4.5280, -75.6900],
            [4.5338, -75.6811]
        ],
        buses: [{ id: "BUS-TRABAJO", puntoInicioIdx: 0, velocidad: 0.5 }]
    },
    {
        id: "pref-uquindio",
        nombre: "🏠 Casa ➔ 🎓 Universidad del Quindío",
        descripcion: "Ruta directa hacia la sede universitaria (Norte).",
        estado: "Frecuencia: Cada 10 min",
        color: "#8e44ad",
        puntos: [
            [4.5338, -75.6811],
            [4.5450, -75.6690],
            [4.5540, -75.6605]
        ],
        buses: [{ id: "BUS-UNI", puntoInicioIdx: 1, velocidad: 0.6 }]
    },
    {
        id: "pref-unicentro",
        nombre: "🏠 Casa ➔ 🛍️ Unicentro / Bolivar",
        descripcion: "Conexión con la zona comercial de la Av. Bolívar.",
        estado: "Frecuencia: Cada 5 min",
        color: "#f39c12",
        puntos: [
            [4.5300, -75.6880],
            [4.5380, -75.6760],
            [4.5430, -75.6680]
        ],
        buses: [{ id: "BUS-SHOP", puntoInicioIdx: 0, velocidad: 0.7 }]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    cargarListaRutas(obtenerTodasLasRutas());
    setupEventListeners();
    cargarOpcionesModal();
});

function initMap() {
    const armeniaCoords = [4.5338, -75.6811];
    map = L.map("mapa").setView(armeniaCoords, 14);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    simularUbicacionUsuario();
}

function obtenerFavoritos() {
    const favs = localStorage.getItem("seti_favoritos");
    return favs ? JSON.parse(favs) : [];
}

function obtenerTodasLasRutas() {
    return [...rutasArmenia, ...rutasPredefinidas];
}

function simularUbicacionUsuario() {
    const latSimulada = 4.5420;
    const lngSimulada = -75.6750;

    if (usuarioMarker) {
        map.removeLayer(usuarioMarker);
    }

    const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div style="background:#e63946; color:white; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:15px; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">🏠</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    usuarioMarker = L.marker([latSimulada, lngSimulada], { icon: userIcon })
        .bindPopup("<b>Mi Ubicación Simulada (Casa)</b>")
        .addTo(map);
}

function solicitarQuitarFavorito(idRuta, nombreRuta, event) {
    if (event) event.stopPropagation();
    rutaPendienteAEliminar = idRuta;

    const textoConfirmacion = document.getElementById("texto-confirmacion");
    textoConfirmacion.textContent = `¿Estás seguro que quieres quitar la ruta "${nombreRuta}" de favoritas?`;

    document.getElementById("modal-confirmacion").classList.remove("hidden");
}

function confirmarQuitarFavorito() {
    if (!rutaPendienteAEliminar) return;

    let favs = obtenerFavoritos();
    favs = favs.filter(id => id !== rutaPendienteAEliminar);
    localStorage.setItem("seti_favoritos", JSON.stringify(favs));

    // Si la ruta que se quita de favoritas es la que está activa en el mapa, se limpia
    if (rutaSeleccionadaId === rutaPendienteAEliminar) {
        if (rutaPolyline) map.removeLayer(rutaPolyline);
        busesMarkers.forEach(marker => map.removeLayer(marker));
        busesMarkers = [];
        animacionIntervals.forEach(interval => clearInterval(interval));
        animacionIntervals = [];
        rutaSeleccionadaId = null;
    }

    document.getElementById("modal-confirmacion").classList.add("hidden");
    rutaPendienteAEliminar = null;

    if (mostrandoFavoritos) {
        filtrarFavoritos();
    } else {
        cargarListaRutas(obtenerTodasLasRutas());
    }
}

function toggleFavorito(idRuta, event) {
    if (event) event.stopPropagation();
    let favs = obtenerFavoritos();

    if (favs.includes(idRuta)) {
        favs = favs.filter(id => id !== idRuta);
    } else {
        favs.push(idRuta);
    }

    localStorage.setItem("seti_favoritos", JSON.stringify(favs));
    
    if (mostrandoFavoritos) {
        filtrarFavoritos();
    } else {
        cargarListaRutas(obtenerTodasLasRutas());
    }
}

function cargarListaRutas(rutasAMostrar) {
    const contenedor = document.getElementById("lista-rutas");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const favs = obtenerFavoritos();
    let filtradas = rutasAMostrar;

    if (mostrandoFavoritos) {
        filtradas = rutasAMostrar.filter(r => favs.includes(r.id));
    }

    if (filtradas.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:#777; font-size:0.78rem; padding:15px;">No hay rutas guardadas en favoritos.</p>`;
        return;
    }

    filtradas.forEach((ruta) => {
        const esFav = favs.includes(ruta.id);
        
        if (!mostrandoFavoritos && ruta.id.startsWith("pref-") && !esFav) return;

        const card = document.createElement("div");
        card.className = "ruta-card";
        if (rutaSeleccionadaId === ruta.id) {
            card.classList.add("seleccionada");
        }
        card.dataset.id = ruta.id;

        let botonAccionHTML = '';
        if (mostrandoFavoritos) {
            botonAccionHTML = `<button onclick="solicitarQuitarFavorito('${ruta.id}', '${ruta.nombre}', event)" style="background:#ff7675; color:white; border:none; width:26px; height:26px; border-radius:50%; font-size:0.85rem; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Quitar de favoritas">✕</button>`;
        } else {
            botonAccionHTML = `<button onclick="toggleFavorito('${ruta.id}', event)" style="background:none; border:none; font-size:1.2rem; cursor:pointer;" title="Marcar favorita">${esFav ? '⭐' : '☆'}</button>`;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4>${ruta.nombre}</h4>
                ${botonAccionHTML}
            </div>
            <p>${ruta.descripcion}</p>
            <span class="ruta-estado">● ${ruta.estado}</span>
        `;

        card.addEventListener("click", () => seleccionarRuta(ruta, card));
        contenedor.appendChild(card);
    });
}

// Seleccionar o deseleccionar ruta (con toggle) y animación realista de tráfico
function seleccionarRuta(ruta, elementoCard) {
    if (rutaSeleccionadaId === ruta.id) {
        if (rutaPolyline) map.removeLayer(rutaPolyline);
        busesMarkers.forEach(marker => map.removeLayer(marker));
        busesMarkers = [];
        
        animacionIntervals.forEach(interval => clearInterval(interval));
        animacionIntervals = [];

        if (elementoCard) elementoCard.classList.remove("seleccionada");
        rutaSeleccionadaId = null;
        return;
    }

    rutaSeleccionadaId = ruta.id;
    document.querySelectorAll(".ruta-card").forEach(c => c.classList.remove("seleccionada"));
    if (elementoCard) elementoCard.classList.add("seleccionada");

    if (rutaPolyline) map.removeLayer(rutaPolyline);
    busesMarkers.forEach(marker => map.removeLayer(marker));
    busesMarkers = [];
    
    animacionIntervals.forEach(interval => clearInterval(interval));
    animacionIntervals = [];

    rutaPolyline = L.polyline(ruta.puntos, {
        color: ruta.color || "#00a8cc",
        weight: 5,
        opacity: 0.85
    }).addTo(map);

    map.fitBounds(rutaPolyline.getBounds(), { padding: [30, 30] });

    const busIcon = L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="background:${ruta.color || '#00a8cc'}; color:white; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:15px; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">🚌</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    ruta.buses.forEach(bus => {
        let puntoIdx = bus.puntoInicioIdx || 0;
        let coordsInicio = ruta.puntos[puntoIdx];

        const marker = L.marker(coordsInicio, { icon: busIcon })
            .bindPopup(`<b>${bus.id}</b><br>${ruta.nombre}`)
            .addTo(map);
        
        busesMarkers.push(marker);

        let paso = 0;
        let direccion = 1;
        const pasoTotal = 120;

        const interval = setInterval(() => {
            const siguienteIdx = puntoIdx + direccion;

            if (siguienteIdx >= ruta.puntos.length || siguienteIdx < 0) {
                direccion *= -1;
                return;
            }

            const origen = ruta.puntos[puntoIdx];
            const destino = ruta.puntos[siguienteIdx];

            paso++;
            const lat = origen[0] + (destino[0] - origen[0]) * (paso / pasoTotal);
            const lng = origen[1] + (destino[1] - origen[1]) * (paso / pasoTotal);

            marker.setLatLng([lat, lng]);

            if (paso >= pasoTotal) {
                paso = 0;
                puntoIdx = siguienteIdx;
            }
        }, 120);

        animacionIntervals.push(interval);
    });
}

function cargarOpcionesModal() {
    const contenedorModal = document.getElementById("opciones-rutas-modal");
    if (!contenedorModal) return;

    contenedorModal.innerHTML = "";
    const favs = obtenerFavoritos();

    rutasPredefinidas.forEach(ruta => {
        const esFav = favs.includes(ruta.id);
        const item = document.createElement("div");
        item.className = "opcion-ruta-card";

        item.innerHTML = `
            <div class="opcion-ruta-info">
                <h5>${ruta.nombre}</h5>
                <p>${ruta.descripcion}</p>
            </div>
            <button class="btn-add-fav" style="${esFav ? 'background:#718093;' : ''}">
                ${esFav ? 'Añadida ✓' : 'Guardar ⭐'}
            </button>
        `;

        item.addEventListener("click", () => {
            if (!esFav) {
                toggleFavorito(ruta.id);
                cargarOpcionesModal();
            }
        });

        contenedorModal.appendChild(item);
    });
}

function setupEventListeners() {
    const btnFavoritos = document.getElementById("btn-favoritos");
    const btnAgregar = document.getElementById("btn-agregar-ruta");
    
    const modalRutas = document.getElementById("modal-rutas");
    const btnCerrarModal = document.getElementById("btn-cerrar-modal");

    const modalConfirmacion = document.getElementById("modal-confirmacion");
    const btnCancelarQuitar = document.getElementById("btn-cancelar-quitar");
    const btnConfirmarQuitar = document.getElementById("btn-confirmar-quitar");

    if (btnFavoritos) {
        btnFavoritos.addEventListener("click", () => {
            mostrandoFavoritos = !mostrandoFavoritos;
            if (mostrandoFavoritos) {
                btnFavoritos.textContent = "📋 Ver Todas";
                btnFavoritos.style.background = "#2980b9";
                filtrarFavoritos();
            } else {
                btnFavoritos.textContent = "⭐ Favoritas";
                btnFavoritos.style.background = "#f39c12";
                cargarListaRutas(obtenerTodasLasRutas());
            }
        });
    }

    if (btnAgregar) {
        btnAgregar.addEventListener("click", () => {
            cargarOpcionesModal();
            modalRutas.classList.remove("hidden");
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", () => {
            modalRutas.classList.add("hidden");
        });
    }

    if (btnCancelarQuitar) {
        btnCancelarQuitar.addEventListener("click", () => {
            modalConfirmacion.classList.add("hidden");
            rutaPendienteAEliminar = null;
        });
    }

    if (btnConfirmarQuitar) {
        btnConfirmarQuitar.addEventListener("click", confirmarQuitarFavorito);
    }
}

function filtrarFavoritos() {
    const favs = obtenerFavoritos();
    const todas = obtenerTodasLasRutas();
    const rutasFavs = todas.filter(r => favs.includes(r.id));
    cargarListaRutas(rutasFavs);
}