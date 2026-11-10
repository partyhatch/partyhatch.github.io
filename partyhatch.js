/**
 * partyhatch.js
 *
 * Loads decks/example_deck.json, then for each entry in the "cards" array
 * loads cards/<name>.json and renders it as a trading card: the card's PNG
 * (resolved via the "image" field, falling back to "img_name") is displayed
 * behind the card's JSON data.
 */

const DECK_PATH = "decks/example_deck.json";
const CARDS_DIR = "cards";
const IMG_DIR = "img";

function resolveImage(card) {
    return card.image || card.img_name || card.name;
}

function createCardElement(card, imageName, count) {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
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
        { key: "stars", label: "Stars" },
    ];

    fields.forEach(({ key, label }) => {
        if (key in card) {
            const stat = document.createElement("span");
            stat.className = "stat";
            stat.textContent = `${label}: ${card[key]}`;
            stats.appendChild(stat);
        }
    });

    // Render any remaining top-level fields not already shown
    const shown = new Set(["name", "image", "img_name", "minerals", "gas", "stars"]);
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
    return cardEl;
}

async function loadDeck() {
    const grid = document.getElementById("card-grid");
    if (!grid) return;

    try {
        const deckResp = await fetch(DECK_PATH);
        if (!deckResp.ok) throw new Error(`Deck fetch failed: ${deckResp.status}`);
        const deck = await deckResp.json();

        const deckNameEl = document.getElementById("deck-name");
        if (deckNameEl && deck.name) {
            deckNameEl.textContent = deck.name;
        }

        const cardEntries = deck.cards || [];
        if (cardEntries.length === 0) {
            grid.innerHTML = '<div class="empty">No cards in deck.</div>';
            return;
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
    } catch (err) {
        console.error("Failed to load deck:", err);
        grid.innerHTML = '<div class="empty">Failed to load deck.</div>';
    }
}

document.addEventListener("DOMContentLoaded", loadDeck);
