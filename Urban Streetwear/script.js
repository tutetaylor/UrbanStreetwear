/* ============================================================
   URBAN STREETWEAR — funcionalidad del sitio
   Moneda (ARS/USD), carrito, búsqueda, slider de lookbook,
   cursor personalizado, newsletter y formulario de contacto.
   ============================================================ */

/* ---------- Almacenamiento con respaldo en memoria ---------- */
const memoryStore = {};
function storageGet(key){
  try{ return localStorage.getItem(key); }
  catch(e){ return Object.prototype.hasOwnProperty.call(memoryStore,key) ? memoryStore[key] : null; }
}
function storageSet(key, val){
  try{ localStorage.setItem(key, val); }
  catch(e){ memoryStore[key] = val; }
}

/* ---------- Catálogo (fuente única para carrito y búsqueda) ---------- */
const PRODUCTS = [
  { id:'hoodie-04', name:'Hoodie Oversize #04',  price:45000, status:'limited',  img:'https://picsum.photos/seed/hoodie-front/600/800' },
  { id:'cargo-07',  name:'Cargo Técnico #07',    price:52000, status:'available',img:'https://picsum.photos/seed/cargo-front/600/800'  },
  { id:'bomber-02', name:'Bomber Street #02',    price:68000, status:'soldout',  img:'https://picsum.photos/seed/bomber-front/600/800' },
  { id:'tee-11',    name:'Tee Gráfica #11',      price:28000, status:'available',img:'https://picsum.photos/seed/tee-front/600/800'    },
];
const STATUS_LABEL = { limited:'Edición limitada', soldout:'Agotado', available:'Disponible' };

/* ---------- Moneda ---------- */
const ARS_PER_USD = 1300; // cotización de referencia para la demo
let currentCurrency = storageGet('urbanCurrency') || 'ARS';

function formatPrice(ars){
  if(currentCurrency === 'USD'){
    const usd = ars / ARS_PER_USD;
    return 'US$ ' + usd.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }
  return '$' + Math.round(ars).toLocaleString('es-AR');
}

function applyCurrency(){
  document.querySelectorAll('[data-price-ars]').forEach(el=>{
    const ars = parseFloat(el.getAttribute('data-price-ars'));
    if(!isNaN(ars)) el.textContent = formatPrice(ars);
  });
  document.querySelectorAll('#currency-toggle').forEach(btn=>{
    btn.textContent = currentCurrency === 'ARS' ? 'ARS $' : 'US$';
    btn.classList.toggle('active', currentCurrency === 'USD');
  });
  renderCart();
  renderSearchResults(getSearchQuery());
}

function toggleCurrency(){
  currentCurrency = currentCurrency === 'ARS' ? 'USD' : 'ARS';
  storageSet('urbanCurrency', currentCurrency);
  applyCurrency();
  showToast(currentCurrency === 'USD' ? 'Precios en Dólares Estadounidenses' : 'Precios en Pesos Argentinos');
}

/* ---------- Carrito ---------- */
function getCart(){
  try{ return JSON.parse(storageGet('urbanCart') || '[]'); }
  catch(e){ return []; }
}
function saveCart(cart){
  storageSet('urbanCart', JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount(){
  const total = getCart().reduce((sum,item)=> sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el=> el.textContent = total);
}
function addToCart(id){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product || product.status === 'soldout') return;
  const cart = getCart();
  const existing = cart.find(item=>item.id===id);
  if(existing) existing.qty += 1;
  else cart.push({ id, qty:1 });
  saveCart(cart);
  renderCart();
  showToast(product.name + ' agregado al carrito');
}
function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  const next = cart.filter(i=> i.qty > 0);
  saveCart(next);
  renderCart();
}
function removeFromCart(id){
  const cart = getCart().filter(i=>i.id!==id);
  saveCart(cart);
  renderCart();
}
function renderCart(){
  const itemsEl = document.getElementById('cart-items');
  if(!itemsEl) return;
  const cart = getCart();

  if(cart.length === 0){
    itemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
  } else {
    itemsEl.innerHTML = cart.map(item=>{
      const p = PRODUCTS.find(pr=>pr.id===item.id);
      if(!p) return '';
      return `<div class="cart-item" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}">
        <div class="cart-item-info">
          <span class="cart-item-name">${p.name}</span>
          <span class="cart-item-price">${formatPrice(p.price * item.qty)}</span>
          <div class="cart-item-qty">
            <button class="qty-minus" data-id="${p.id}" type="button" aria-label="Restar">−</button>
            <span>${item.qty}</span>
            <button class="qty-plus" data-id="${p.id}" type="button" aria-label="Sumar">+</button>
          </div>
          <button class="cart-item-remove" data-id="${p.id}" type="button">Quitar</button>
        </div>
      </div>`;
    }).join('');
  }

  const subtotal = cart.reduce((sum,item)=>{
    const p = PRODUCTS.find(pr=>pr.id===item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
  const subtotalEl = document.getElementById('cart-subtotal');
  if(subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  const checkoutBtn = document.getElementById('cart-checkout');
  if(checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function openCart(){
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-drawer')?.setAttribute('aria-hidden','false');
  closeSearch();
}
function closeCart(){
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-drawer')?.setAttribute('aria-hidden','true');
}

/* ---------- Búsqueda ---------- */
function getSearchQuery(){
  const input = document.getElementById('search-input');
  return input ? input.value.trim() : '';
}
function renderSearchResults(query){
  const resultsEl = document.getElementById('search-results');
  if(!resultsEl) return;
  const q = query.toLowerCase();

  if(!q){
    resultsEl.innerHTML = '<p class="search-hint">Empezá a escribir para ver resultados del catálogo.</p>';
    return;
  }
  const matches = PRODUCTS.filter(p=> p.name.toLowerCase().includes(q));
  if(matches.length === 0){
    resultsEl.innerHTML = '<p class="search-hint">Sin resultados para “' + query + '”.</p>';
    return;
  }
  resultsEl.innerHTML = matches.map(p=>`
    <div class="search-result" data-id="${p.id}">
      <span class="sr-name">${p.name}<span class="sr-tag">${STATUS_LABEL[p.status]}</span></span>
      <span class="sr-price">${formatPrice(p.price)}</span>
    </div>
  `).join('');
}
function openSearch(){
  document.getElementById('search-overlay')?.classList.add('open');
  closeCart();
  const input = document.getElementById('search-input');
  if(input) setTimeout(()=> input.focus(), 50);
}
function closeSearch(){
  document.getElementById('search-overlay')?.classList.remove('open');
}
function goToProduct(id){
  const onCatalogPage = !!document.getElementById('catalogo') && document.querySelector('.card[data-id="'+id+'"]');
  if(onCatalogPage){
    closeSearch();
    highlightCard(id);
  } else {
    window.location.href = 'index.html?highlight=' + encodeURIComponent(id) + '#catalogo';
  }
}
function highlightCard(id){
  const card = document.querySelector('.card[data-id="'+id+'"]');
  if(!card) return;
  card.scrollIntoView({ behavior:'smooth', block:'center' });
  card.classList.add('highlight');
  setTimeout(()=> card.classList.remove('highlight'), 2200);
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(message){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 2400);
}

/* ---------- Slider del lookbook ---------- */
function initLookbookNav(){
  const scroller = document.getElementById('lookbook-scroll');
  const prevBtn = document.getElementById('look-prev');
  const nextBtn = document.getElementById('look-next');
  if(!scroller || !prevBtn || !nextBtn) return;

  const step = ()=>{
    const look = scroller.querySelector('.look');
    return look ? look.getBoundingClientRect().width + 2 : 320;
  };
  prevBtn.addEventListener('click', ()=> scroller.scrollBy({ left: -step(), behavior:'smooth' }));
  nextBtn.addEventListener('click', ()=> scroller.scrollBy({ left: step(), behavior:'smooth' }));
}

/* ---------- Cursor personalizado (con delegación para elementos dinámicos) ---------- */
function initCursor(){
  const cursor = document.getElementById('cursor');
  if(!cursor) return;
  window.addEventListener('mousemove', e=>{
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  const growSelector = 'a, button, .card, .look-dot, input, textarea, select';
  document.addEventListener('mouseover', e=>{
    if(e.target.closest(growSelector)) cursor.classList.add('grow');
  });
  document.addEventListener('mouseout', e=>{
    if(e.target.closest(growSelector)) cursor.classList.remove('grow');
  });
}

/* ---------- Eventos ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  initCursor();
  initLookbookNav();
  updateCartCount();
  renderCart();
  applyCurrency();

  // Moneda
  document.getElementById('currency-toggle')?.addEventListener('click', toggleCurrency);

  // Búsqueda: abrir / cerrar
  document.getElementById('search-toggle')?.addEventListener('click', openSearch);
  document.getElementById('search-close')?.addEventListener('click', closeSearch);
  document.getElementById('search-overlay')?.addEventListener('click', e=>{
    if(e.target.id === 'search-overlay') closeSearch();
  });
  document.getElementById('search-input')?.addEventListener('input', e=> renderSearchResults(e.target.value));
  document.getElementById('search-results')?.addEventListener('click', e=>{
    const result = e.target.closest('.search-result');
    if(result) goToProduct(result.getAttribute('data-id'));
  });

  // Carrito: abrir / cerrar
  document.getElementById('cart-toggle')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // Carrito: acciones dentro del panel (delegación)
  document.getElementById('cart-items')?.addEventListener('click', e=>{
    const id = e.target.getAttribute('data-id');
    if(!id) return;
    if(e.target.classList.contains('qty-plus')) changeQty(id, 1);
    else if(e.target.classList.contains('qty-minus')) changeQty(id, -1);
    else if(e.target.classList.contains('cart-item-remove')) removeFromCart(id);
  });

  // Checkout de prueba
  document.getElementById('cart-checkout')?.addEventListener('click', ()=>{
    saveCart([]);
    renderCart();
    const note = document.getElementById('cart-note');
    if(note){
      note.classList.add('show');
      setTimeout(()=> note.classList.remove('show'), 4000);
    }
  });

  // Botones "Agregar al carrito" en las cards del catálogo (delegación)
  document.body.addEventListener('click', e=>{
    const addBtn = e.target.closest('.add-to-cart');
    if(addBtn && !addBtn.disabled){
      addToCart(addBtn.getAttribute('data-id'));
      addBtn.classList.add('added');
      const original = addBtn.textContent;
      addBtn.textContent = '✓ Agregado';
      setTimeout(()=>{ addBtn.classList.remove('added'); addBtn.textContent = original; }, 1200);
    }
  });

  // Lookbook: mostrar / ocultar tarjeta de compra
  document.querySelectorAll('.look-dot').forEach(dot=>{
    dot.addEventListener('click', ()=>{
      const card = dot.nextElementSibling;
      document.querySelectorAll('.shop-card.active').forEach(c=>{
        if(c !== card) c.classList.remove('active');
      });
      card.classList.toggle('active');
    });
  });

  // Lookbook: botón "Comprar" agrega al carrito
  document.querySelectorAll('.shop-card .buy').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      if(btn.disabled) return;
      addToCart(btn.getAttribute('data-id'));
    });
  });

  // Tecla Escape cierra overlays
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){ closeSearch(); closeCart(); }
  });

  // Resaltar producto llegando desde una búsqueda en otra página
  const params = new URLSearchParams(window.location.search);
  const highlightId = params.get('highlight');
  if(highlightId){
    setTimeout(()=> highlightCard(highlightId), 300);
    params.delete('highlight');
    const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }

  // Newsletter (todas las páginas)
  document.querySelectorAll('.newsletter-form').forEach(form=>{
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const note = form.parentElement.querySelector('.newsletter-note');
      if(note){ note.classList.add('show'); }
      form.reset();
    });
  });

  // Formulario de contacto (solo contacto.html)
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      document.getElementById('contact-note')?.classList.add('show');
      contactForm.reset();
    });
  }
});
