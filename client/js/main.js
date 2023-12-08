// Inicia constante de mercado pago
const mercadopago = new MercadoPago("", {
  locale: "es-AR",
});

document.addEventListener("DOMContentLoaded", function () {
  const cart = [];
  let total = 0;

  // Función para agregar un producto al carrito con la cantidad seleccionada
  function addToCart(product, price, quantity) {
    // Verifica si la cantidad seleccionada es mayor que 0
    if (quantity > 0) {
      const existingProductIndex = cart.findIndex((item) => item.product === product);
      if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity = quantity;
      } else {
        cart.push({ product, price, quantity });
      }
      updateCartUI();
    } else {
      // Si la cantidad seleccionada es cero, elimina el producto del carrito
      const existingProductIndex = cart.findIndex((item) => item.product === product);
      if (existingProductIndex !== -1) {
        cart.splice(existingProductIndex, 1);
        updateCartUI();
      }
    }
  }

  // Agrega un campo de entrada para la dirección
  const addressInput = document.getElementById("address");
  const autocomplete = new google.maps.places.Autocomplete(addressInput);

  // Configura el campo de entrada para mostrar sugerencias de direcciones de Google Maps
  autocomplete.setFields(["formatted_address"]);

  // Event listener para capturar la dirección seleccionada
  google.maps.event.addListener(autocomplete, "place_changed", function () {
    const selectedPlace = autocomplete.getPlace();
    if (selectedPlace.formatted_address) {
      addressInput.value = selectedPlace.formatted_address;
    }
  });

  // Función para actualizar la interfaz del carrito y el total de productos
  function updateCartUI() {
    const cartItems = document.getElementById("cart-items");
    const totalPrice = document.getElementById("total-price");
    const totalQuantity = document.getElementById("total-quantity");

    cartItems.innerHTML = "";
    total = 0;
    totalQuantity.textContent = "0";

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.product} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`;
      cartItems.appendChild(li);

      total += item.price * item.quantity;
      totalQuantity.textContent = parseInt(totalQuantity.textContent) + item.quantity;
    });

    totalPrice.textContent = total.toFixed(2);
  }

  // Evento para agregar productos al carrito automáticamente al seleccionar la cantidad
  const quantitySelects = document.querySelectorAll(".menu__quantity");
  quantitySelects.forEach((select) => {
    select.addEventListener("change", function () {
      const product = this.parentElement.querySelector(".menu__name").textContent;
      const price = parseFloat(this.parentElement.querySelector(".menu__preci").textContent.slice(1));
      const quantity = parseInt(this.value);
      addToCart(product, price, quantity);
    });
  });

  // Evento para realizar el checkout
  const checkoutButton = document.getElementById("checkout");
  checkoutButton.addEventListener("click", function () {
    const customerName = document.getElementById("customer-name").value;
    const optional = document.getElementById("optional").value;
    const address = document.getElementById("address").value;

    // Realiza las validaciones
    let errorMessage = "";
    if (cart.length === 0) {
      errorMessage = "Debe seleccionar al menos un producto.";
    }
    if (customerName.trim() === "") {
      errorMessage = "Debe escribir su nombre.";
    } else if (address.trim() === "") {
      errorMessage = "Debe escribir una dirección de entrega";
    }

    if (errorMessage !== "") {
      alert(errorMessage);
    } else {
      // Construye el mensaje solo si las validaciones pasan
      let message = `orden de compra: \n`;

      cart.forEach((item) => {
        message += `${item.product} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n\n`;
      });

      message += `*Total: $${total.toFixed(2)}*\n\n`;
      message += `Este requisito: *${optional}*\n\n`;
      message += `Dirección de entrega: *${address}*\n\n`;
      message += `A nombre de: *${customerName}*`;

      //CONSTRUYE LA ORDEN PARA ENVIAR A MERCADO PAGO
      const orderData = {
        quantity: 1,
        description: message,
        price: total,
      };

      //hace peticion Post a servidor para crear la orden de compra
      fetch("http://localhost:3000/create_preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (preference) {
          createCheckoutButton(preference.id);
        })
        .catch(function () {
          alert("Unexpected error");
        });

      /*CONTRUCCIÓN DEL WHATZAP -- El mensaje se construye actualmente en el backend - el contenido del mensaje sera lo que contenga la variable message.

      // Reemplaza "1XXXXXXXXXX" con tu número de WhatsApp
      const whatsappNumber = "541128703125";

      // Codifica el mensaje para que sea parte de la URL
      const encodedMessage = encodeURIComponent(message);

      // Crea el enlace de WhatsApp con el mensaje
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // Abre una nueva ventana o pestaña de WhatsApp con el mensaje precargado
      window.open(whatsappLink, "_blank");*/

      // Muestra el modal de agradecimiento
      const checkoutModal = document.getElementById("checkout-modal");
      checkoutModal.style.display = "flex";

      // Limpia el carrito y actualiza la interfaz
      cart.length = 0;
      total = 0;
      updateCartUI();
    }
  });

  //CREACION DEL BOTON DE PAGO A MERCADO PAGO CON LA ORDEN DE COMPRA
  function createCheckoutButton(preferenceId) {
    // INICIALIZA EL CHECKOUT
    const bricksBuilder = mercadopago.bricks();

    const renderComponent = async (bricksBuilder) => {
      if (window.checkoutButton) window.checkoutButton.unmount();
      await bricksBuilder.create("wallet", "button-checkout", {
        initialization: {
          preferenceId: preferenceId,
        },
      });
    };
    window.checkoutButton = renderComponent(bricksBuilder);
  }

  // Evento para cerrar el modal de agradecimiento y reiniciar los desplegables
  const closeModalButton = document.getElementById("close-modal");
  closeModalButton.addEventListener("click", function () {
    const checkoutModal = document.getElementById("checkout-modal");
    checkoutModal.style.display = "none";

    // Reiniciar los desplegables a 0
    const quantitySelects = document.querySelectorAll(".menu__quantity");
    quantitySelects.forEach((select) => {
      select.value = 0;
    });

    // Limpiar el campo del nombre
    document.getElementById("customer-name").value = "";
    document.getElementById("optional").value = "";
    document.getElementById("address").value = "";
  });
});

// ...

/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navId) => {
  const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId);

  // Validate that variables exist
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      // We add the show-menu class to the div tag with the nav__menu class
      nav.classList.toggle("show-menu");
    });
  }
};
showMenu("nav-toggle", "nav-menu");

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll(".nav__link");

function linkAction() {
  const navMenu = document.getElementById("nav-menu");
  // When we click on each nav__link, we remove the show-menu class
  navMenu.classList.remove("show-menu");
}
navLink.forEach((n) => n.addEventListener("click", linkAction));

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll("section[id]");

function scrollActive() {
  const scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 50;
    sectionId = current.getAttribute("id");

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelector(".nav__menu a[href*=" + sectionId + "]").classList.add("active-link");
    } else {
      document.querySelector(".nav__menu a[href*=" + sectionId + "]").classList.remove("active-link");
    }
  });
}
window.addEventListener("scroll", scrollActive);

/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader() {
  const nav = document.getElementById("header");
  // When the scroll is greater than 200 viewport height, add the scroll-header class to the header tag
  if (this.scrollY >= 200) nav.classList.add("scroll-header");
  else nav.classList.remove("scroll-header");
}
window.addEventListener("scroll", scrollHeader);

/*==================== SHOW SCROLL TOP ====================*/
function scrollTop() {
  const scrollTop = document.getElementById("scroll-top");
  // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
  if (this.scrollY >= 560) scrollTop.classList.add("show-scroll");
  else scrollTop.classList.remove("show-scroll");
}
window.addEventListener("scroll", scrollTop);

/*==================== DARK LIGHT THEME ====================*/
const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "bx-sun";

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => (document.body.classList.contains(darkTheme) ? "dark" : "light");
const getCurrentIcon = () => (themeButton.classList.contains(iconTheme) ? "bx-moon" : "bx-sun");

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
  document.body.classList[selectedTheme === "dark" ? "add" : "remove"](darkTheme);
  themeButton.classList[selectedIcon === "bx-moon" ? "add" : "remove"](iconTheme);
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener("click", () => {
  // Add or remove the dark / icon theme
  document.body.classList.toggle(darkTheme);
  themeButton.classList.toggle(iconTheme);
  // We save the theme and the current icon that the user chose
  localStorage.setItem("selected-theme", getCurrentTheme());
  localStorage.setItem("selected-icon", getCurrentIcon());
});

/*==================== SCROLL REVEAL ANIMATION ====================*/
const sr = ScrollReveal({
  origin: "top",
  distance: "30px",
  duration: 2000,
  reset: true,
});

sr.reveal(
  `.home__data, .home__img,
            .about__data, .about__img,
            .services__content, .menu__content,
            .app__data, .app__img,
            .contact__data, .contact__button,
            .footer__content`,
  {
    interval: 200,
  }
);
