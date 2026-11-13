/**
 * partyhatch.js
 *
 * Loads every deck JSON file from the decks/ folder and renders each one
 * as a section of trading cards. For each card entry in a deck's "cards"
 * array, loads cards/<name>.json and renders it as a trading card: the
 * card's PNG (resolved via the "image" field, falling back to "img_name")
 * is displayed behind the card's JSON data. If a card has "trouble": true,
 * the card gets a red glow outline.
 */

const DECK_FILES = ["example_deck", "alien_invasion"];
const DECKS_DIR = "decks";
const CARDS_DIR = "cards";
const IMG_DIR = "img";

function resolveImage(card) {
    return card.image || card.img_name || card.name;
}

function createCardElement(card, imageName, count) {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    if (card.trouble > 0) {
        cardEl.classList.add("trouble");
    } else if (card.trouble < 0) {
        cardEl.classList.add("trouble-blue");
    }
    cardEl.style.backgroundImage = `url("${IMG_DIR}/${imageName}.png")`;

    const countEl = document.createElement("span");
    countEl.className = "card-count";
    countEl.textContent = count < 0 ? "∞" : `×${count}`;

    const body = document.createElement("div");
    body.className = "card-body";

    const name = document.createElement("h2");
    name.className = "card-name";
    name.textContent = card.name || "Unnamed";

    const stats = document.createElement("div");
    stats.className = "card-stats";

    // Minerals and gas are shown as centered resource text (resources div below).
    const resourceParts = [];
    if ("minerals" in card && card.minerals != 0) {
        resourceParts.push({ value: card.minerals, image: "mineral_nobg.png" });
    }
    if ("gas" in card && card.gas != 0) {
        resourceParts.push({ value: card.gas, image: "gas_nobg.png" });
    }

    const resources = document.createElement("div");
    resources.className = "card-resources";
    resources.style.position = "absolute";
    resources.style.top = "75%";
    resources.style.left = "50%";
    resources.style.transform = "translate(-50%, -50%)";
    resources.style.display = "flex";
    resources.style.alignItems = "center";
    resources.style.gap = "10px";
    resources.style.fontSize = "1.15rem";
    resources.style.fontWeight = "800";
    resources.style.color = "var(--text)";
    resources.style.pointerEvents = "none";

    resourceParts.forEach(({ value, image }) => {
        const text = document.createElement("span");
        text.textContent = value > 0 ? `+${value}` : value;
        resources.appendChild(text);
        const icon = document.createElement("img");
        icon.src = `${IMG_DIR}/${image}`;
        icon.alt = "";
        icon.style.width = "22px";
        icon.style.height = "22px";
        icon.style.display = "block";
        resources.appendChild(icon);
    });

    // Render any remaining top-level fields not already shown (e.g. "trouble")
    const shown = new Set(["name", "image", "img_name", "minerals", "gas", "stars", "trouble", "cost"]);
    Object.keys(card).forEach((key) => {
        if (!shown.has(key)) {
            const stat = document.createElement("span");
            stat.className = "stat";
            stat.textContent = `${key}: ${card[key]}`;
            stats.appendChild(stat);
        }
    });

    body.appendChild(name);
    if (resources.children.length) {
        body.appendChild(resources);
    }
    body.appendChild(stats);
    cardEl.appendChild(body);
    cardEl.appendChild(countEl);

    const stars = card.stars || 0;
    if (stars > 0) {
        cardEl.classList.add("glow-gold");
        for (let i = 0; i < stars; i++) {
            const star = document.createElement("img");
            star.src = `${IMG_DIR}/star.png`;
            star.alt = "★";
            star.style.position = "absolute";
            star.style.bottom = "10px";
            star.style.left = `${10 + i * 24}px`;
            star.style.width = "22px";
            star.style.height = "22px";
            star.style.zIndex = "2";
            star.style.pointerEvents = "none";
            cardEl.appendChild(star);
        }
    }

    // Trouble icons: shown in the bottom-left where stars appear.
    // Positive trouble shows fungal.png icons equal to the value; negative
    // trouble shows heal.png icons equal to the absolute value.
    const trouble = card.trouble || 0;
    if (trouble !== 0) {
        const iconSrc = trouble > 0 ? `${IMG_DIR}/fungal.png` : `${IMG_DIR}/heal.png`;
        const count = Math.abs(trouble);
        for (let i = 0; i < count; i++) {
            const troubleIcon = document.createElement("img");
            troubleIcon.src = iconSrc;
            troubleIcon.alt = "";
            troubleIcon.style.position = "absolute";
            troubleIcon.style.bottom = "10px";
            troubleIcon.style.left = `${10 + i * 24}px`;
            troubleIcon.style.width = "22px";
            troubleIcon.style.height = "22px";
            troubleIcon.style.zIndex = "2";
            troubleIcon.style.pointerEvents = "none";
            cardEl.appendChild(troubleIcon);
        }
    }

    // Cost badge: shown in the top-right corner when the card JSON defines a
    // "cost", with a mineral icon to its left.
    if ("cost" in card) {
        const costBadge = document.createElement("div");
        costBadge.style.position = "absolute";
        costBadge.style.top = "10px";
        costBadge.style.right = "10px";
        costBadge.style.zIndex = "2";
        costBadge.style.pointerEvents = "none";
        costBadge.style.display = "inline-flex";
        costBadge.style.alignItems = "center";
        costBadge.style.gap = "6px";
        costBadge.style.fontSize = "1.2rem";
        costBadge.style.fontWeight = "800";
        costBadge.style.color = "#fff";
        costBadge.style.textShadow = "0 1px 3px rgba(0,0,0,0.7)";
        costBadge.style.background = "rgba(0,0,0,0.45)";
        costBadge.style.padding = "2px 8px";
        costBadge.style.borderRadius = "10px";
        costBadge.style.backdropFilter = "blur(3px)";

        const icon = document.createElement("img");
        icon.src = `${IMG_DIR}/mineral_nobg.png`;
        icon.alt = "";
        icon.style.width = "16px";
        icon.style.height = "16px";
        icon.style.display = "block";

        const value = document.createElement("span");
        value.textContent = card.cost;

        costBadge.appendChild(icon);
        costBadge.appendChild(value);
        cardEl.appendChild(costBadge);
    }

    return cardEl;
}

async function loadDeck(deckFile) {
    const deckResp = await fetch(`${DECKS_DIR}/${deckFile}.json`);
    if (!deckResp.ok) throw new Error(`Deck fetch failed: ${deckResp.status}`);
    const deck = await deckResp.json();

    const section = document.createElement("section");
    section.className = "deck-section";

    const heading = document.createElement("h2");
    heading.textContent = deck.name || deckFile;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "card-grid";
    section.appendChild(grid);

    const cardEntries = deck.cards || [];
    if (cardEntries.length === 0) {
        grid.innerHTML = '<div class="empty">No cards in deck.</div>';
        return section;
    }

    await Promise.all(
        cardEntries.map(async (entry) => {
            const name = entry.card || entry;
            const count = entry.count != null ? entry.count : 1;
            try {
                const cardResp = await fetch(`${CARDS_DIR}/${name}.json`);
                if (!cardResp.ok) {
                    console.warn(`Skipping card "${name}": ${cardResp.status}`);
                    return;
                }
                const card = await cardResp.json();
                const imageName = resolveImage(card);
                grid.appendChild(createCardElement(card, imageName, count));
            } catch (err) {
                console.warn(`Failed to load card "${name}":`, err);
            }
        })
    );

    return section;
}

function showMenu() {
    const menu = document.getElementById("menu-screen");
    const decks = document.getElementById("decks-screen");
    if (menu) menu.classList.add("visible");
    if (decks) decks.classList.remove("visible");
}

function showDecks() {
    const menu = document.getElementById("menu-screen");
    const decks = document.getElementById("decks-screen");
    if (menu) menu.classList.remove("visible");
    if (decks) decks.classList.add("visible");
}

async function loadAllDecks() {
    const container = document.getElementById("decks-container");
    if (!container) return;
    container.innerHTML = "";

    try {
        const sections = await Promise.all(
            DECK_FILES.map(async (deckFile) => {
                try {
                    return await loadDeck(deckFile);
                } catch (err) {
                    console.error(`Failed to load deck "${deckFile}":`, err);
                    return null;
                }
            })
        );

        sections.forEach((section) => {
            if (section) container.appendChild(section);
        });
    } catch (err) {
        console.error("Failed to load decks:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    showMenu();

    const btnViewDecks = document.getElementById("btn-view-decks");
    if (btnViewDecks) {
        btnViewDecks.addEventListener("click", () => {
            showDecks();
            loadAllDecks();
        });
    }

    const btnReturnMenu = document.getElementById("btn-return-menu");
    if (btnReturnMenu) {
        btnReturnMenu.addEventListener("click", showMenu);
    }
});
