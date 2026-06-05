const cards = [...document.querySelectorAll(".promo-card")];

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

  revealButton.addEventListener("click", () => {
    const willOpen = details.hidden;

    cards.forEach((otherCard) => {
      otherCard.querySelector(".promo-card__details").hidden = true;
      otherCard.querySelector(".promo-card__reveal").hidden = false;
      otherCard.querySelector(".promo-card__reveal").setAttribute("aria-expanded", "false");
    });

    details.hidden = !willOpen;
    revealButton.hidden = willOpen;
    revealButton.setAttribute("aria-expanded", String(willOpen));
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
