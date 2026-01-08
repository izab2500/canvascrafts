"use strict"

//dom references
const iconBarsParent = document.querySelector("#icon-smaller-screens");
const iconBars = document.querySelectorAll("#icon-smaller-screens > span");
const nav = document.querySelector("header nav");
const cartIcon = document.querySelector("#cart-icon");
const overlay = document.querySelector("#overlay");
const totalPaintings = document.querySelector("#total-paintings");
const totalSum = document.querySelector("#total-sum")
const emptyCart = document.querySelector("#empty-cart");
const cart = document.querySelector("#cart");
const parentForPaintings = document.querySelector("#paintings-in-cart");
const removeAll = document.querySelector("#remove-all");
const cartIconValue = document.querySelector("#cart-icon-value");

//initialize empty storage (solved issues - show empty cart)
if (!localStorage.getItem("paintings")) {
    localStorage.setItem("paintings", JSON.stringify([]));
}

/**sets total paintings in cart, above the cart icon **/
function setCartIconValue() {
    const paintings = JSON.parse(localStorage.getItem("paintings") || "[]")
    //returns 0 if array is empty (callback is not run)
    const tot = paintings.reduce((acc, p) => acc + p.quantity, 0);
    
    cartIconValue.textContent = tot;
}

setCartIconValue()


/** open and close cart start **/
function toggleCartOverlay() {
    //is cart empty
    const hasCartItems = hasCartPaintings();
    //toggle overlay
    const isOpen = overlay.classList.toggle("hidden");

    //toggle empty - or cart with items and overflow
    hasCartItems ? toggleCart() : toggleEmptyCart()
    !isOpen ? document.body.style.overflow = "hidden" : document.body.style.overflow = ""
}

//check if cart has paintings
function hasCartPaintings() {
    return (JSON.parse(localStorage.getItem("paintings")) || "[]").length > 0;
}

//toogle carts

//cart with products
function toggleCart() {
    cart.classList.toggle("hidden");
   calcTotalPaintings() //calculates total paintings
    calcTotalPrice() //calculates total price
    initCreateProductsInCart() //create products in cart
    setCartIconValue();
}

function toggleEmptyCart() {
    emptyCart.classList.toggle("hidden");
    setCartIconValue();
}

//increment or decrement product in cart
function initCartActions(evt) {
    //has clicked element data-attribute (spans to increment or decrement)
    const clickedEl = evt.target
    if (!clickedEl.hasAttribute("data-action")) return
    //span with value
    const parentWithId = clickedEl.closest(".cart-flex");
    const spanWithValue = parentWithId.querySelector("div:last-child > span:not([data-action])");
    //span decrement (-) or increment (+)
    const actionType = clickedEl.dataset.action
    actionType === "decrement" ? decrementProductInCart(parentWithId, spanWithValue) : incrementProductInCart(parentWithId, spanWithValue);

}

function decrementProductInCart(parentWithId, spanWithValue) {
    //paintings in localstorage (cart)
    let arr = JSON.parse(localStorage.getItem("paintings") || "[]")
    if (arr.length === 0) return

    //parent element of one product
    const domElId = Number(parentWithId.id)

    //update quantity in cart and localstorage
    const painting = arr.find(p => p.id === domElId);
    painting.quantity -= 1;
    spanWithValue.textContent = painting.quantity;
    //remove from cart and localstorage (value === 0)
    if (painting.quantity < 1) {
        //remove painting from arr
        arr = arr.filter(p => p.quantity > 0); //remember filter returns a new array!
        //remove from dom
        parentWithId.remove()
        //save back to localstorage
        localStorage.setItem("paintings", JSON.stringify(arr));
        // calculate total paintings and price in cart
        calcTotalPaintings()
        calcTotalPrice()
        updateSummaryCheckout(); //only on checkout page 
        //remove cart with items and show empty cart
        if (arr.length === 0) {
            toggleCart();
            toggleEmptyCart();
        }
    }
    //save back to localstorage
    localStorage.setItem("paintings", JSON.stringify(arr));
    // calculate total paintings and price in cart
    calcTotalPaintings()
    calcTotalPrice()
    updateSummaryCheckout(); //only on checkout page 
}

function incrementProductInCart(parentWithId, spanWithValue) {
    //paintings in localstorage (cart)
    let arr = JSON.parse(localStorage.getItem("paintings") || "[]")
    if (arr.length === 0) return

    //parent element of one product
    const domElId = Number(parentWithId.id)

    //update quantity in cart and localstorage
    const painting = arr.find(p => p.id === domElId);
    painting.quantity += 1;
    spanWithValue.textContent = painting.quantity;

    //save back to localstorage
    localStorage.setItem("paintings", JSON.stringify(arr));
    // calculate total paintings and price in cart
    calcTotalPaintings();
    calcTotalPrice();
    updateSummaryCheckout(); //only on checkout page 
}

parentForPaintings.addEventListener("click", initCartActions);

//remove all from cart and localstorage
function clearCartAndLocalStorage() {
    parentForPaintings.innerHTML = "";
    localStorage.setItem("paintings", JSON.stringify([])); //must keep array as empty (if...)
    toggleCart();
    toggleEmptyCart();
    updateSummaryCheckout();
}

removeAll?.addEventListener("click", clearCartAndLocalStorage);

//calc total paintings
function calcTotalPaintings() {
    const arr = JSON.parse(localStorage.getItem("paintings") || "[]")
    if (arr.length === 0) return
    const tot = arr?.reduce((acc, currentVal) => {
        return acc + currentVal.quantity
    }, 0)
    totalPaintings.textContent = tot;
}

//calc total price
async function calcTotalPrice() {
    const arr = JSON.parse(localStorage.getItem("paintings")|| "[]");
    if (arr.length === 0) return

    try {
        const res = await fetch("../data/products.json")
        if (!res.ok) throw new Error("Network error or problems fetching paintings");
        const paintings = await res.json();
        let sum = 0;
        arr.forEach((p) => {
            const painting = paintings.find(item => item.id === p.id)
            if (painting) {
                const { price } = painting;
                sum += p.quantity * price;
            }
        })
        totalSum.textContent = sum;
        return sum // need it in checkout.html
    } catch (err) {
        console.log(err)
    }
}

//create products in cart
async function initCreateProductsInCart() {
    //products, if in cart
    const paintingsLS = JSON.parse(localStorage.getItem("paintings") || "[]");
    if (paintingsLS.length === 0) return;

    let products = [];
    try {
        const res = await fetch("../data/products.json");
        if (!res.ok) throw new Error("Failed to fetch products")
        products = await res.json();
    } catch (err) {
        console.error(err)
        return;
    }

    createProductsInCart(paintingsLS, products);

}
function createProductsInCart(paintingsLs, productsJson) {
    //empty parent
    parentForPaintings.innerHTML = ""
    paintingsLs.forEach(painting => {
        const product = productsJson.find(p => p.id === painting.id)

        if (product) {
            //product parent
            const parent = document.createElement("div");
            parent.id = painting.id; //from cart in localstorage
            parent.classList.add("cart-flex");

            // first child (div): img, abbreviation (titel) and price
            const firstDiv = document.createElement("div");
            firstDiv.classList.add("cart-flex-col");
            const fd1 = document.createElement("div");
            const fd1Img = document.createElement("img");
            fd1Img.src = product.tumbnail;
            fd1Img.alt = product.alt;
            fd1.appendChild(fd1Img);
            //
            const fd2 = document.createElement("div");
            const fd2H3 = document.createElement("h3");
            fd2H3.textContent = product.abbreviation;
            const fd2P = document.createElement("p");
            const fd2Span1 = document.createElement("span");
            fd2Span1.textContent = "$";
            const fd2Span2 = document.createElement("span");
            fd2Span2.textContent = product.price;
            fd2P.append(fd2Span1, fd2Span2);
            fd2.append(fd2H3, fd2P);
            firstDiv.append(fd1, fd2);

            // second child (div): span (-, quantity and +)
            const secondDiv = document.createElement("div");
            const span1 = document.createElement("span");
            span1.dataset.action = "decrement";
            span1.textContent = "-"
            const span2 = document.createElement("span");
            span2.textContent = painting.quantity; //from cart in localstorage
            const span3 = document.createElement("span");
            span3.dataset.action = "increment";
            span3.textContent = "+";
            secondDiv.append(span1, span2, span3);

            //
            parent.append(firstDiv, secondDiv);
            parentForPaintings.appendChild(parent);
        }
    })

}

cartIcon?.addEventListener("click", toggleCartOverlay);
overlay?.addEventListener("click", toggleCartOverlay);
/** open and close cart end **/


/** toggle icon and nav smaller screens start **/

function toggleIconsAndNav() {
    iconBars[0].classList.toggle("hidden");
    iconBars[1].classList.toggle("rotate-45-ccw-style");
    iconBars[2].classList.toggle("rotate-45-cw-style");
    nav.classList.toggle("show-nav");
}

iconBarsParent.addEventListener("click", toggleIconsAndNav);
/** toggle icon and nav smaller screens end **/


/** display one painting, painting.html start  **/
if (location.pathname.includes("painting.html")) {
    async function initDisplayOnePainting() {
        // read the painting id from the query string to fetch the correct painting from JSON
        const params = new URLSearchParams(window.location.search);
        const id = Number(params.get("id"));
        //fetch painting from json-file
        const painting = await fetchPainting(id)
        //insert data to dom
        setElementsData(painting)
    }

    //get painting from json-file
    async function fetchPainting(id) {
        try {
            const res = await fetch("../data/products.json")

            if (!res.ok) throw new Error("Failed to fetch paintings from json-file")

            const paintings = await res.json();

            return paintings.find(painting => painting.id === id)
        }
        catch (err) {
            console.error(err)
        }
    }

    //set elements data for painting
    function setElementsData(painting) {
        const { id, title, description, img, alt, price } = painting;

        // picture element
        const pictureEl = document.querySelector("#main-painting > picture");
        const [avifSource, webpSource, imgEl] = pictureEl.children;

        avifSource.srcset = `${img}.avif`;
        webpSource.srcset = `${img}.webp`;
        imgEl.src = `${img}.jpg`;
        imgEl.alt = alt;

        // div content
        const divEl = document.querySelector("#main-painting > div");
        const h2El = divEl.querySelector("h2");
        const pEl = divEl.querySelector("p");
        const priceEl = divEl.querySelector(".price span:last-child");

        h2El.textContent = title;
        pEl.textContent = description;
        priceEl.textContent = price;

        //add id of painting to add to cart button
        const btn = document.querySelector("#main-painting button")
        btn.id = id
    }

    initDisplayOnePainting()

    //add to cart action: decrement, increment and button
    const parentActions = document.querySelector(".add-to-cart-actions")

    function initAddToCart(evt) {
        const clickedEl = evt.target
        if (clickedEl.classList.contains("add-to-cart-actions") || clickedEl.id === "before-cart-value") return

        //value before added to cart
        const valEl = parentActions.querySelector("#before-cart-value")

        //increment
        if (clickedEl.id === "increment") increment(valEl);

        //decrement
        if (clickedEl.id === "decrement") decrement(valEl);
    }

    parentActions.addEventListener("click", initAddToCart)

    //increment
    function increment(valEl) {
        if (!valEl) return
        valEl.textContent = Number(valEl.textContent) + 1;
    }

    //decrement
    function decrement(valEl) {
        if (Number(valEl.textContent) < 1) return
        valEl.textContent = Number(valEl.textContent) - 1;
    }

    //add to cart and save data in localStorage
    const btn = document.querySelector(".add-to-cart-actions button")
    function initSaveData(evt) {
        const valEl = Number(parentActions.querySelector("#before-cart-value").textContent)
        if (!valEl) return
        // id corresponding to product
        const id = Number(evt.target.id)
        //paintings or empty array (localstorage)
        const paintings = getPaintingsFromLocalStorage()
        //check if paintings exist
        const isPainting = isPaintingInLocalStorage(id, paintings)
        if (!isPainting) {
            paintings.push({ id: id, quantity: valEl })
            localStorage.setItem("paintings", JSON.stringify(paintings));
            setCartIconValue();
            return
        }
        //update quantity
        updateQuantityLocalStorage(valEl, id, paintings)
        setCartIconValue();

    }

    btn.addEventListener("click", initSaveData)

    //get paintings from localstorage
    function getPaintingsFromLocalStorage() {
        const paintingsLS = localStorage?.getItem("paintings");

        if (!paintingsLS) {
            localStorage.setItem("paintings", JSON.stringify([]))
            return []
        }

        return JSON.parse(paintingsLS)
    }

    //check if product exists in localstorage
    function isPaintingInLocalStorage(productId, paintingsArr) {
        return paintingsArr.some(painting => painting.id === productId)
    }

    //update added quantity 
    function updateQuantityLocalStorage(val, id, paintingsArr) {
        const p = paintingsArr.find(painting => painting.id === id);
        p.quantity += val;
        localStorage.setItem("paintings", JSON.stringify(paintingsArr));

    }
}

/** display one painting, painting.html end **/


/** checkout.html start**/
async function updateSummaryCheckout() {
    //run only on (checkout.html) --function is invoked when products are updated from cart--
    if (!location.pathname.includes("checkout.html")) return;

    //get data from localstorage
    const arrLs = JSON.parse(localStorage.getItem("paintings") || "[]");

    //if (arrLs.length === 0) return; interupts logic if remove all

    // fetch product data from json file
    let data;
    try {
        const res = await fetch("../data/products.json");
        if (!res.ok) throw new Error("Failed to fetch products");
        data = await res.json();
        //invoke to build products summary
        summaryProducts(arrLs, data);
    } catch (err) {
        console.error(err)
    }

}

updateSummaryCheckout()

//build summary
async function summaryProducts(arrLs, dataJson) {
    //total price (
    const tot = await calcTotalPrice();
    const productsParent = document.querySelector("#checkout-products");
    productsParent.innerHTML = "";
    arrLs.forEach(pLs => {
        const product = dataJson.find(p => p.id === pLs.id);
        if (!product) return;

        const parent = document.createElement("div");
        parent.classList.add("checkout-product");

        const div1 = document.createElement("div");

        const img = document.createElement("img");
        img.src = product.tumbnail;
        img.alt = product.alt;

        const div2 = document.createElement("div");

        const h3 = document.createElement("h3");
        h3.textContent = product.abbreviation;

        const priceP = document.createElement("p");
        const priceSpan1 = document.createElement("span");
        priceSpan1.textContent = "$";
        const priceSpan2 = document.createElement("span");
        priceSpan2.textContent = product.price;

        priceP.append(priceSpan1, priceSpan2);
        div2.append(h3, priceP);
        div1.append(img, div2);

        const qtyP = document.createElement("p");
        const qtySpan1 = document.createElement("span");
        qtySpan1.textContent = "x";
        const qtySpan2 = document.createElement("span");
        qtySpan2.textContent = pLs.quantity;

        qtyP.append(qtySpan1, qtySpan2);

        parent.append(div1, qtyP);

        productsParent.appendChild(parent);
    })
    //nullish coalescing to get 0, if remove all from cart (calcTotalPrice returns undefined))
    document.querySelector("#checkout-total").textContent = `${tot ?? 0}`
    //grand total = tot + 50 (shipping)
    document.querySelector("#checkout-grand-total").textContent = `${tot ? tot + 50 : 0}`;
}

/** checkout.html end**/