// =============================================
// CARGAR MÁS PRODUCTOS
// Solo se activa si la página tiene productos Y el botón #load-more
// =============================================
const productBoxes = document.querySelectorAll('.box-container .box');
const loadMoreBtn = document.querySelector('#load-more');
const PRODUCTOS_INICIALES = 8;
const PRODUCTOS_POR_CARGA = 4;

if (productBoxes.length && loadMoreBtn) {
    let mostrados = PRODUCTOS_INICIALES;

    // Oculta los productos que exceden el número inicial
    productBoxes.forEach((box, index) => {
        if (index >= mostrados) box.style.display = 'none';
    });

    // Si ya caben todos desde el inicio, no hace falta el botón
    if (productBoxes.length <= mostrados) {
        loadMoreBtn.style.display = 'none';
    }

    loadMoreBtn.addEventListener('click', () => {
        const hasta = Math.min(mostrados + PRODUCTOS_POR_CARGA, productBoxes.length);
        for (let i = mostrados; i < hasta; i++) {
            productBoxes[i].style.display = '';
        }
        mostrados = hasta;
        if (mostrados >= productBoxes.length) {
            loadMoreBtn.style.display = 'none';
        }
    });
} else if (loadMoreBtn) {
    // Hay botón pero no hay productos que paginar (ej. página sin catálogo)
    loadMoreBtn.style.display = 'none';
}


// =============================================
// CARRITO DE COMPRAS (persistente entre páginas con localStorage)
// =============================================
const CLAVE_CARRITO = 'suma_uma_carrito';

const carrito = document.getElementById('carrito');
const listaProductos = document.getElementById('lista-1');
const cuerpoTablaCarrito = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
const totalCarritoEl = document.getElementById('total-carrito');
const comprarBtn = document.getElementById('comprar-carrito');

// =============================================
// ICONO DEL CARRITO: contador + apertura al hacer clic
// (el clic es necesario en móviles, donde no existe el hover)
// =============================================
const imgCarrito = document.getElementById('img-carrito');

if (imgCarrito) {
    // Envuelve el icono para poder colocar el contador encima
    const envoltorio = document.createElement('span');
    envoltorio.className = 'icono-carrito';
    imgCarrito.parentNode.insertBefore(envoltorio, imgCarrito);
    envoltorio.appendChild(imgCarrito);

    const contador = document.createElement('span');
    contador.id = 'contador-carrito';
    contador.className = 'contador-carrito';
    contador.style.display = 'none';
    envoltorio.appendChild(contador);

    // Abre/cierra el carrito al hacer clic en el icono
    if (carrito) {
        imgCarrito.addEventListener('click', (e) => {
            e.preventDefault();
            carrito.classList.toggle('abierto');
        });

        // Se cierra al hacer clic en cualquier otra parte de la página
        document.addEventListener('click', (e) => {
            if (!carrito.contains(e.target) && !envoltorio.contains(e.target)) {
                carrito.classList.remove('abierto');
            }
        });
    }
}

// Solo activamos el carrito si esta página tiene la tabla y el botón de vaciar.
// (No exigimos "lista-1" porque páginas como contacto.html no tienen catálogo
// pero sí deben poder MOSTRAR el carrito ya guardado).
if (cuerpoTablaCarrito && vaciarCarritoBtn) {
    cargarEventListeners();
    renderizarCarrito();
}

function cargarEventListeners() {
    if (listaProductos) {
        listaProductos.addEventListener('click', agregarAlCarrito);
    }
    if (carrito) {
        carrito.addEventListener('click', eliminarDelCarrito);
    }
    vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    if (comprarBtn) {
        comprarBtn.addEventListener('click', procesarCompra);
    }
}

function obtenerCarrito() {
    const datos = localStorage.getItem(CLAVE_CARRITO);
    return datos ? JSON.parse(datos) : [];
}

function guardarCarrito(items) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
}

function agregarAlCarrito(e) {
    e.preventDefault();
    if (!e.target.classList.contains('agregar-carrito')) return;

    const elemento = e.target.closest('.box');
    if (!elemento) return;

    const infoElemento = {
        imagen: elemento.querySelector('img').src,
        titulo: elemento.querySelector('h3').textContent,
        precio: elemento.querySelector('.precio').textContent,
        id: e.target.getAttribute('data-id')
    };

    const items = obtenerCarrito();
    items.push(infoElemento);
    guardarCarrito(items);
    renderizarCarrito();
}

function eliminarDelCarrito(e) {
    e.preventDefault();
    if (!e.target.classList.contains('borrar')) return;

    const fila = e.target.closest('tr');
    const indice = Number(fila.getAttribute('data-indice'));

    const items = obtenerCarrito();
    items.splice(indice, 1);
    guardarCarrito(items);
    renderizarCarrito();
}

function vaciarCarrito(e) {
    if (e) e.preventDefault();
    guardarCarrito([]);
    renderizarCarrito();
    return false;
}

function calcularTotal(items) {
    return items.reduce((suma, item) => {
        // Convierte "S/12.50" -> 12.50 (quita todo lo que no sea número o punto)
        const numero = parseFloat(String(item.precio).replace(/[^0-9.]/g, '')) || 0;
        return suma + numero;
    }, 0);
}

function renderizarCarrito() {
    if (!cuerpoTablaCarrito) return;

    const items = obtenerCarrito();
    cuerpoTablaCarrito.innerHTML = '';

    items.forEach((item, indice) => {
        const fila = document.createElement('tr');
        fila.setAttribute('data-indice', indice);
        fila.innerHTML = `
            <td><img src="${item.imagen}" width="60" height="60"></td>
            <td>${item.titulo}</td>
            <td>${item.precio}</td>
            <td><a href="#" class="borrar" data-id="${item.id}">X</a></td>
        `;
        cuerpoTablaCarrito.appendChild(fila);
    });

    if (totalCarritoEl) {
        const total = calcularTotal(items);
        totalCarritoEl.textContent = `S/${total.toFixed(2)}`;
    }

    // Contador que aparece sobre el icono del carrito
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        contador.textContent = items.length;
        contador.style.display = items.length ? 'inline-flex' : 'none';
    }
}


// =============================================
// GOTA QUE CAE CON EL SCROLL (no se mueve sola)
// Empieza en el centro de la imagen y baja según cuánto se desplaza
// la página, hasta tocar la imagen de agua. Si el usuario no scrollea,
// la gota no se mueve. Al tocar el agua, aparece la salpicadura.
// =============================================
const gotaCaida = document.querySelector('.gota-caida');
const seccionOfertas = document.querySelector('.ofertas');
const aguaImpacto = document.querySelector('.agua-impacto');
const salpicadura = document.querySelector('.salpicadura');

if (gotaCaida && seccionOfertas && aguaImpacto) {
    const FACTOR_CAIDA = 0.4; // qué tan rápido cae en relación al scroll

    function actualizarCaidaGota() {
        const rect = seccionOfertas.getBoundingClientRect();
        // Cuánto ha entrado la sección por la parte superior de la pantalla
        const scrolleadoEnSeccion = Math.max(0, -rect.top);

        // Distancia real desde el centro de la imagen (posición base de la gota)
        // hasta el borde superior de la imagen de agua.
        const maxCaida = Math.max(0, aguaImpacto.offsetTop - gotaCaida.offsetTop);
        const desplazamiento = Math.min(scrolleadoEnSeccion * FACTOR_CAIDA, maxCaida);

        gotaCaida.style.transform = `translate(-50%, calc(-50% + ${desplazamiento}px))`;

        const tocoElAgua = desplazamiento >= maxCaida - 2;

        // La gota "desaparece" al impactar, y aparece la salpicadura en su lugar
        gotaCaida.style.opacity = tocoElAgua ? '0' : '1';
        if (salpicadura) {
            salpicadura.classList.toggle('activa', tocoElAgua);
        }
    }

    window.addEventListener('scroll', actualizarCaidaGota);
    window.addEventListener('resize', actualizarCaidaGota);
    actualizarCaidaGota();
}

function procesarCompra(e) {
    e.preventDefault();

    const items = obtenerCarrito();
    if (items.length === 0) {
        alert('Tu carrito está vacío. Agrega algún producto antes de comprar.');
        return;
    }

    // Lleva al usuario a la página de contacto para coordinar el pago y la entrega.
    // El carrito se mantiene guardado (no se vacía) para que en contacto.html
    // se pueda seguir viendo qué pidió.
    window.location.href = 'contacto.html';
}