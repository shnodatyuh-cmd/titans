/* TITAN BRAND - main script */
const PRODUCTS = [
  { id: 1, name: "Classic Polo",      price: 1200, cat: "men",   img: "classic polo.webp" },
  { id: 2, name: "Crew Neck T-shirt", price: 700,  cat: "men",   img: "crew neck.jpg" },
  { id: 3, name: "Simple T-shirt",    price: 800,  cat: "men",   img: "2.jpg" },
  { id: 4, name: "Slim T-shirt",      price: 1000, cat: "men",   img: "OIP (8).webp" },
  { id: 5, name: "Dress",             price: 1400, cat: "women", img: "Dress.webp" },
  { id: 6, name: "Linen Dresses",     price: 1600, cat: "women", img: "Linen Dresses.webp" },
  { id: 7, name: "Palazzo Pants",     price: 1000, cat: "women", img: "shopping.webp" },
  { id: 8, name: "Wide Leg Pants",    price: 1000, cat: "women", img: "download.webp" },
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => `${n.toLocaleString()} L.E`;
const imgSrc = p => `./images/${encodeURI(p.img)}`;
const byId = id => PRODUCTS.find(p => p.id === id);

/* ---------- Safe storage ---------- */
const store = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let cart = store.get("titan-cart", {});      // { id: qty }
let wish = store.get("titan-wish", []);      // [id]

/* ---------- Inject shared UI (drawer, modal, toast, top btn) ---------- */
document.body.insertAdjacentHTML("beforeend", `
  <div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer" aria-label="Shopping cart">
    <header><h3>Your Cart</h3><button class="icon-btn" id="closeCart" aria-label="Close cart"><i class="fa-solid fa-xmark"></i></button></header>
    <div class="drawer-items" id="cartItems"></div>
    <div class="drawer-foot">
      <div class="total"><span>Total</span><span id="cartTotal">0 L.E</span></div>
      <button class="btn" id="checkout">Checkout</button>
    </div>
  </aside>
  <div class="modal" id="modal" role="dialog" aria-modal="true"></div>
  <div class="toast" id="toast" role="status"></div>
  <button class="icon-btn to-top" id="toTop" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>
`);

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Cart ---------- */
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartTotal = () => Object.entries(cart).reduce((s, [id, q]) => s + byId(+id).price * q, 0);

function saveCart() { store.set("titan-cart", cart); renderCart(); }

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  toast(`${byId(id).name} added to cart`);
}
function changeQty(id, d) {
  cart[id] += d;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
}

function renderCart() {
  $("#cartCount").textContent = cartCount();
  $("#cartTotal").textContent = money(cartTotal());
  const box = $("#cartItems");
  const ids = Object.keys(cart);
  if (!ids.length) {
    box.innerHTML = `<p class="empty" style="padding:40px 0">Your cart is empty. Add something you like.</p>`;
    return;
  }
  box.innerHTML = ids.map(id => {
    const p = byId(+id);
    return `<div class="ci">
      <img src="${imgSrc(p)}" alt="${p.name}">
      <div class="ci-info"><b>${p.name}</b>${money(p.price)}
        <div class="qty">
          <button data-dec="${id}" aria-label="Decrease">−</button><span>${cart[id]}</span>
          <button data-inc="${id}" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="rm" data-rm="${id}" aria-label="Remove ${p.name}"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join("");
}

function toggleDrawer(open) {
  $("#drawer").classList.toggle("open", open);
  $("#overlay").classList.toggle("open", open);
}

$("#cartItems").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.inc) changeQty(+b.dataset.inc, 1);
  if (b.dataset.dec) changeQty(+b.dataset.dec, -1);
  if (b.dataset.rm) { delete cart[b.dataset.rm]; saveCart(); }
});
$("#cartBtn").addEventListener("click", () => toggleDrawer(true));
$("#closeCart").addEventListener("click", () => toggleDrawer(false));
$("#checkout").addEventListener("click", () => {
  if (!cartCount()) return toast("Your cart is empty");
  cart = {}; saveCart(); toggleDrawer(false);
  toast("Order placed. Thank you!");
});

/* ---------- Quick view modal ---------- */
function openModal(id) {
  const p = byId(id);
  const m = $("#modal");
  m.innerHTML = `<div class="modal-box">
    <button class="icon-btn modal-close" aria-label="Close" id="closeModal"><i class="fa-solid fa-xmark"></i></button>
    <img src="${imgSrc(p)}" alt="${p.name}">
    <div class="modal-body">
      <h3>${p.name}</h3><p style="font-size:20px">${money(p.price)}</p>
      <p style="color:var(--muted);font-size:14px">Soft, breathable fabric with a clean fit. Pick your size.</p>
      <div class="sizes">${["S", "M", "L", "XL"].map((s, i) => `<button class="size ${i == 1 ? "on" : ""}">${s}</button>`).join("")}</div>
      <button class="btn" id="modalAdd">Add to cart</button>
    </div></div>`;
  m.classList.add("open");
  $("#overlay").classList.add("open");
  $("#closeModal").onclick = closeModal;
  $("#modalAdd").onclick = () => { addToCart(id); closeModal(); };
  $$(".size", m).forEach(b => b.onclick = () => { $$(".size", m).forEach(x => x.classList.remove("on")); b.classList.add("on"); });
}
function closeModal() {
  $("#modal").classList.remove("open");
  if (!$("#drawer").classList.contains("open")) $("#overlay").classList.remove("open");
}
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
$("#overlay").addEventListener("click", () => { toggleDrawer(false); closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { toggleDrawer(false); closeModal(); } });

/* ---------- Product grid (search / filter / sort) ---------- */
const grid = $("#products");
const state = { cat: document.body.dataset.cat || "all", q: "", sort: "default" };

function cardHTML(p) {
  const on = wish.includes(p.id) ? "on" : "";
  return `<article class="card reveal">
    <button class="wish ${on}" data-wish="${p.id}" aria-label="Add ${p.name} to wishlist"><i class="fa-solid fa-heart"></i></button>
    <img src="${imgSrc(p)}" alt="${p.name}" data-view="${p.id}" loading="lazy">
    <h3>${p.name}</h3><p class="price">${money(p.price)}</p>
    <button class="add" data-add="${p.id}">Add to cart</button>
  </article>`;
}

function renderProducts() {
  if (!grid) return;
  let list = PRODUCTS.filter(p =>
    (state.cat === "all" || p.cat === state.cat) &&
    p.name.toLowerCase().includes(state.q.toLowerCase()));
  if (grid.dataset.featured) list = PRODUCTS.filter((_, i) => i % 2 === 0).slice(0, 4);
  if (state.sort === "low") list.sort((a, b) => a.price - b.price);
  if (state.sort === "high") list.sort((a, b) => b.price - a.price);
  grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">No products match your search.</p>`;
  observeReveal();
}

if (grid) {
 
  grid.innerHTML = `<div class="skeleton"></div>`.repeat(4);
  setTimeout(renderProducts, 500);

  grid.addEventListener("click", e => {
    const t = e.target.closest("[data-add],[data-wish],[data-view]");
    if (!t) return;
    if (t.dataset.add) addToCart(+t.dataset.add);
    if (t.dataset.view) openModal(+t.dataset.view);
    if (t.dataset.wish) {
      const id = +t.dataset.wish;
      wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
      store.set("titan-wish", wish);
      t.classList.toggle("on");
      toast(wish.includes(id) ? "Saved to wishlist" : "Removed from wishlist");
    }
  });

  $$(".chip").forEach(c => c.addEventListener("click", () => {
    $$(".chip").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    state.cat = c.dataset.cat;
    renderProducts();
  }));
  $("#search")?.addEventListener("input", e => { state.q = e.target.value; renderProducts(); });
  $("#sort")?.addEventListener("change", e => { state.sort = e.target.value; renderProducts(); });
}
 
const nav = $(".navbar");
const toTop = $("#toTop");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", scrollY > 40);
  toTop.classList.toggle("show", scrollY > 500);
}, { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
$("#menuBtn").addEventListener("click", () => $(".navbar ul").classList.toggle("open"));

 
const here = location.pathname.split("/").pop() || "index.html";
$$(".navbar ul a").forEach(a => { if (a.getAttribute("href") === here) a.classList.add("active"); });

 
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
}, { threshold: .12 });
function observeReveal() { $$(".reveal:not(.in)").forEach(el => io.observe(el)); }
observeReveal();
 
$("#nlForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const input = $("#nlEmail"), msg = $("#nlMsg");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
  input.classList.toggle("error", !ok);
  msg.textContent = ok ? "You're subscribed. Welcome to TITAN." : "Enter a valid email, like name@example.com.";
  if (ok) input.value = "";
});

renderCart();
