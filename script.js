const page = document.querySelector(".page");
const grid = document.querySelector(".promo-grid");
const cards = [...document.querySelectorAll(".promo-card")];


const desktopGrid = window.matchMedia("(min-width: 1270px)");
let activeViewportAnchor = null;

function createViewportAnchor(element, clientY) {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const anchorY = Number.isFinite(clientY) && clientY > 0
    ? clientY
    : rect.top + rect.height / 2;
  const offsetY = anchorY - rect.top;

  return () => {
    const nextRect = element.getBoundingClientRect();
    const nextAnchorY = nextRect.top + offsetY;
    const deltaY = nextAnchorY - anchorY;

    if (Math.abs(deltaY) > 0.5) {
      window.scrollBy(0, deltaY);
    }
  };
}

function restoreViewportAnchor() {
  if (activeViewportAnchor) {
    activeViewportAnchor();
  }
}

function layoutPromoGrid() {
  if (!grid) return;

  if (!desktopGrid.matches) {
    grid.classList.remove("is-masonry");
    grid.style.height = "";
    cards.forEach((card) => {
      card.style.transform = "";
    });
    restoreViewportAnchor();
    return;
  }

  const columns = 4;
  const gap = 10;
  const columnHeights = Array(columns).fill(0);

  grid.classList.add("is-masonry");

  cards.forEach((card, index) => {
    const column = index % columns;
    const x = column * (300 + gap);
    const y = columnHeights[column];

    card.style.transform = `translate(${x}px, ${y}px)`;
    columnHeights[column] += card.offsetHeight + gap;
  });

  grid.style.height = `${Math.max(...columnHeights) - gap}px`;
  restoreViewportAnchor();
}

function requestPromoLayout() {
  window.requestAnimationFrame(layoutPromoGrid);
}


function holdScrollSpace() {
  if (!page) return;

  const viewportBottom = Math.ceil(window.scrollY + window.innerHeight + 1);
  const currentMinHeight = Number.parseFloat(page.style.minHeight) || 0;

  if (viewportBottom > currentMinHeight) {
    page.style.minHeight = `${viewportBottom}px`;
  }
}

function releaseScrollSpaceWhenSafe() {
  if (!page || window.scrollY > 1) return;
  page.style.minHeight = "";
  requestPromoLayout();
}


const resizeAnimation = window.matchMedia("(prefers-reduced-motion: reduce)");

function animateCardResize(card, updateState, viewportAnchor = null) {
  const startHeight = card.offsetHeight;

  updateState();

  const endHeight = card.offsetHeight;

  if (viewportAnchor) {
    activeViewportAnchor = viewportAnchor;
  }

  if (resizeAnimation.matches || Math.abs(endHeight - startHeight) < 1) {
    layoutPromoGrid();
    if (activeViewportAnchor === viewportAnchor) {
      activeViewportAnchor = null;
    }
    return;
  }

  let frameId = 0;
  let finished = false;
  const duration = 180;

  function syncLayout() {
    layoutPromoGrid();
    if (!finished) {
      frameId = window.requestAnimationFrame(syncLayout);
    }
  }

  function cleanup() {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(frameId);
    card.style.height = "";
    card.style.overflow = "";
    card.style.transition = "";
    card.style.willChange = "";
    layoutPromoGrid();
    if (activeViewportAnchor === viewportAnchor) {
      activeViewportAnchor = null;
    }
  }

  card.style.height = `${startHeight}px`;
  card.style.overflow = "hidden";
  card.style.willChange = "height";
  card.offsetHeight;

  frameId = window.requestAnimationFrame(syncLayout);

  window.requestAnimationFrame(() => {
    card.style.transition = `height ${duration}ms ease`;
    card.style.height = `${endHeight}px`;
  });

  card.addEventListener("transitionend", (event) => {
    if (event.propertyName === "height") {
      cleanup();
    }
  }, { once: true });

  window.setTimeout(cleanup, duration + 80);
}

function setCopyButton(button, copied) {
  const label = button.querySelector("span");

  button.classList.toggle("is-copied", copied);
  label.textContent = copied ? "промокод скопирован" : "скопировать промокод";

  button.querySelector("svg").innerHTML = copied
    ? '<path d="M20 6 9 17l-5-5"></path>'
    : '<rect x="8" y="8" width="11" height="11" rx="1.5"></rect><path d="M5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1"></path>';
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

cards.forEach((card) => {
  const revealButton = card.querySelector(".promo-card__reveal");
  const details = card.querySelector(".promo-card__details");
  const copyButton = card.querySelector(".promo-card__copy");
  const code = card.dataset.code;
  revealButton.addEventListener("click", (event) => {
    holdScrollSpace();
    const willOpen = details.hidden;
    const viewportAnchor = createViewportAnchor(card, event.clientY);

    animateCardResize(card, () => {
      cards.forEach((otherCard) => {
        otherCard.querySelector(".promo-card__details").hidden = true;
        otherCard.querySelector(".promo-card__reveal").hidden = false;
        otherCard.querySelector(".promo-card__reveal").setAttribute("aria-expanded", "false");
      });

      details.hidden = !willOpen;
      revealButton.hidden = willOpen;
      revealButton.setAttribute("aria-expanded", String(willOpen));
    }, viewportAnchor);
  });
  copyButton.addEventListener("click", async () => {
    try {
      await copyText(code);
      setCopyButton(copyButton, true);
      window.setTimeout(() => setCopyButton(copyButton, false), 1600);
    } catch {
      setCopyButton(copyButton, false);
    }
  });
});
window.addEventListener("load", layoutPromoGrid);
window.addEventListener("resize", requestPromoLayout);
window.addEventListener("scroll", releaseScrollSpaceWhenSafe, { passive: true });
if (document.fonts?.ready) {
  document.fonts.ready.then(layoutPromoGrid);
}
layoutPromoGrid();