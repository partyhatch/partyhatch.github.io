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
    if (card.trouble) {
        cardEl.classList.add("trouble");
    }
    cardEl.style.backgroundImage = `url("${IMG_DIR}/${imageName}.png")`;

    const countEl = document.createElement("span");
    countEl.className = "card-count";
    countEl.textContent = `×${count}`;

    const body = document.createElement("div");
    body.className = "card-body";

    const name = document.createElement("h2");
    name.className = "card-name";
    name.textContent = card.name || "Unnamed";

    const stats = document.createElement("div");
    stats.className = "card-stats";

    const fields = [
        { key: "minerals", label: "Minerals" },
        { key: "gas", label: "Gas" },
    ];

    fields.forEach(({ key, label }) => {
        if (key in card) {
            const stat = document.createElement("span");
            stat.className = "stat";
            stat.textContent = `${label}: ${card[key]}`;
            stats.appendChild(stat);
        }
    });

    // Render any remaining top-level fields not already shown (e.g. "trouble")
    const shown = new Set(["name", "image", "img_name", "minerals", "gas", "stars", "trouble"]);
    Object.keys(card).forEach((key) => {
        if (!shown.has(key)) {
            const stat = document.createElement("span");
            stat.className = "stat";
            stat.textContent = `${key}: ${card[key]}`;
            stats.appendChild(stat);
        }
    });

    body.appendChild(name);
    body.appendChild(stats);
    cardEl.appendChild(body);
    cardEl.appendChild(countEl);

    const stars = card.stars || 0;
    if (stars > 0) {
        cardEl.classList.add("glow-gold");
        for (let i = 0; i < stars; i++) {
            const star = document.createElement("img");
            star.src = `${IMG_DIR}/gold_star.png`;
            star.alt = "★";
            star.style.position = "absolute";
            star.style.bottom = "10px";
            star.style.left = `${10 + i * 24}px`;
            star.style.width = "20px";
            star.style.height = "20px";
            star.style.zIndex = "2";
            star.style.pointerEvents = "none";
            cardEl.appendChild(star);
        }
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
