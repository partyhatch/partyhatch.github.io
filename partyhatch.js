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
const LOC_DIR = "loc";

// Cache for tooltip text loaded from loc/*.json (keyed by icon basename).
const locCache = new Map();

async function getLoc(iconName) {
    if (locCache.has(iconName)) return locCache.get(iconName);
    const resp = await fetch(`${LOC_DIR}/${iconName}.json`);
    if (!resp.ok) return "";
    const data = await resp.json();
    const text = data.english || "";
    locCache.set(iconName, text);
    return text;
}

function resolveImage(card) {
    return card.image || card.img_name || card.name;
}

async function createCardElement(card, imageName, count) {
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
        const starLoc = await getLoc("star");
        for (let i = 0; i < stars; i++) {
            const star = document.createElement("img");
            star.src = `${IMG_DIR}/star.png`;
            star.alt = "★";
            star.title = starLoc;
            star.style.position = "absolute";
            star.style.bottom = "10px";
            star.style.left = `${10 + i * 24}px`;
            star.style.width = "22px";
            star.style.height = "22px";
            star.style.zIndex = "2";
            cardEl.appendChild(star);
        }
    }

    // Trouble icons: shown in the bottom-left where stars appear.
    // Positive trouble shows fungal.png icons equal to the value; negative
    // trouble shows heal.png icons equal to the absolute value.
    const trouble = card.trouble || 0;
    if (trouble !== 0) {
        const troubleLocName = trouble > 0 ? "fungal" : "heal";
        const troubleLoc = await getLoc(troubleLocName);
        const iconSrc = trouble > 0 ? `${IMG_DIR}/fungal.png` : `${IMG_DIR}/heal.png`;
        const count = Math.abs(trouble);
        for (let i = 0; i < count; i++) {
            const troubleIcon = document.createElement("img");
            troubleIcon.src = iconSrc;
            troubleIcon.alt = "";
            troubleIcon.title = troubleLoc;
            troubleIcon.style.position = "absolute";
            troubleIcon.style.bottom = "10px";
            troubleIcon.style.left = `${10 + i * 24}px`;
            troubleIcon.style.width = "22px";
            troubleIcon.style.height = "22px";
            troubleIcon.style.zIndex = "2";
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
                grid.appendChild(await createCardElement(card, imageName, count));
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
    const solo = document.getElementById("solo-decks-screen");
    const game = document.getElementById("game-screen");
    if (menu) menu.classList.add("visible");
    if (decks) decks.classList.remove("visible");
    if (solo) solo.classList.remove("visible");
    if (game) game.classList.remove("visible");
}

function showDecks() {
    const menu = document.getElementById("menu-screen");
    const decks = document.getElementById("decks-screen");
    const solo = document.getElementById("solo-decks-screen");
    const game = document.getElementById("game-screen");
    if (menu) menu.classList.remove("visible");
    if (decks) decks.classList.add("visible");
    if (solo) solo.classList.remove("visible");
    if (game) game.classList.remove("visible");
}

function showSoloDecks() {
    const menu = document.getElementById("menu-screen");
    const decks = document.getElementById("decks-screen");
    const solo = document.getElementById("solo-decks-screen");
    const game = document.getElementById("game-screen");
    if (menu) menu.classList.remove("visible");
    if (decks) decks.classList.remove("visible");
    if (solo) solo.classList.add("visible");
    if (game) game.classList.remove("visible");
}

function showGame() {
    const menu = document.getElementById("menu-screen");
    const decks = document.getElementById("decks-screen");
    const solo = document.getElementById("solo-decks-screen");
    const game = document.getElementById("game-screen");
    if (menu) menu.classList.remove("visible");
    if (decks) decks.classList.remove("visible");
    if (solo) solo.classList.remove("visible");
    if (game) game.classList.add("visible");
}

async function loadSoloDecks() {
    const container = document.getElementById("solo-decks-container");
    if (!container) return;
    container.innerHTML = "";

    const deckNames = await Promise.all(
        DECK_FILES.map(async (deckFile) => {
            try {
                const resp = await fetch(`${DECKS_DIR}/${deckFile}.json`);
                if (!resp.ok) return null;
                const deck = await resp.json();
                return deck.name || deckFile;
            } catch (err) {
                console.error(`Failed to load deck "${deckFile}":`, err);
                return null;
            }
        })
    );

    deckNames.forEach((name, i) => {
        if (!name) return;
        const deckFile = DECK_FILES[i];
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.className = "menu-options-button";
        btn.style.width = "100%";
        btn.style.padding = "14px 16px";
        btn.style.fontSize = "1rem";
        btn.style.fontWeight = "600";
        btn.style.cursor = "pointer";
        btn.style.border = "1px solid var(--border)";
        btn.style.borderRadius = "8px";
        btn.style.background = "var(--card-bg)";
        btn.style.color = "var(--text)";
        btn.style.marginBottom = "8px";
        btn.onclick = () => startGame(deckFile);
        container.appendChild(btn);
    });
}

// Game state
let currentDeckFile = null;
let playerDeck = [];
let hand = [];
let minerals = 0;
let gas = 0;
let supply = 0;
let turn = 0;
let parties = Infinity;
let roundNum = 1;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function startGame(deckFile) {
    currentDeckFile = deckFile;
    const resp = await fetch(`${DECKS_DIR}/${deckFile}.json`);
    if (!resp.ok) throw new Error(`Deck fetch failed: ${resp.status}`);
    const deck = await resp.json();

    playerDeck = [...(deck.deck || [])];
    shuffle(playerDeck);
    supply = deck.supply != null ? deck.supply : 0;
    parties = deck.parties != null ? deck.parties : Infinity;
    hand = [];
    minerals = 0;
    gas = 0;
    turn = 0;
    roundNum = 1;

    showGame();
    renderStats();
    renderRound();
    await renderHand();
    updateControls();

    const handContainer = document.getElementById("hand-container");
    if (handContainer) handContainer.style.display = "flex";
}

function renderStats() {
    const elMinerals = document.getElementById("stat-minerals");
    const elGas = document.getElementById("stat-gas");
    const elSupply = document.getElementById("stat-supply");
    if (elMinerals) elMinerals.textContent = `Minerals: ${minerals}`;
    if (elGas) elGas.textContent = `Gas: ${gas}`;
    if (elSupply) elSupply.textContent = `Supply: ${supply}`;
}

function renderRound() {
    const elRound = document.getElementById("stat-round");
    if (elRound) elRound.textContent = roundNum === 1 ? "Party Round" : "Shopping round";
}

async function renderHand() {
    const container = document.getElementById("hand-container");
    if (!container) return;
    container.innerHTML = "";

    // Render newest cards first (leftmost), pushing older cards to the right
    for (let i = hand.length - 1; i >= 0; i--) {
        const card = hand[i];
        const imageName = resolveImage(card);
        const cardEl = await createCardElement(card, imageName, 1);
        cardEl.style.width = "140px";
        cardEl.style.aspectRatio = "3 / 4.5";
        cardEl.style.flex = "0 0 auto";
        container.appendChild(cardEl);
    }
}

async function drawCard() {
    if (playerDeck.length === 0) return;
    if (hand.length >= supply) return;

    const cardName = playerDeck.shift();
    const cardResp = await fetch(`${CARDS_DIR}/${cardName}.json`);
    if (!cardResp.ok) {
        console.warn(`Skipping card "${cardName}": ${cardResp.status}`);
        return;
    }
    const card = await cardResp.json();
    hand.unshift(card);  // new card on the left

    await renderHand();
    updateControls();
}

function sumHandResources() {
    let totalMinerals = 0;
    let totalGas = 0;
    for (const card of hand) {
        if ("minerals" in card) totalMinerals += card.minerals;
        if ("gas" in card) totalGas += card.gas;
    }
    return { minerals: totalMinerals, gas: totalGas };
}

function endParty() {
    const resources = sumHandResources();
    minerals += resources.minerals;
    gas += resources.gas;

    renderStats();
    roundNum = 2;
    renderRound();

    // Return all cards in hand back to the deck (as card name strings,
    // so drawCard can fetch them by filename)
    playerDeck.push(...hand.map(card => card.image || card.img_name || card.name));
    hand = [];

    const handContainer = document.getElementById("hand-container");
    if (handContainer) handContainer.style.display = "none";

    updateControls();
}

async function startParty() {
    hand = [];
    shuffle(playerDeck);
    await renderHand();
    roundNum = 1;
    turn++;
    renderRound();
    updateControls();

    const handContainer = document.getElementById("hand-container");
    if (handContainer) handContainer.style.display = "flex";

    if (turn >= parties) {
        gameOver();
    }
}

function gameOver() {
    const el = document.getElementById("game-over");
    const elMsg = document.getElementById("game-over-message");
    if (el) el.style.display = "block";
    if (elMsg) elMsg.textContent = `You played ${turn} party${turn !== 1 ? "s" : ""}. Final: ${minerals} minerals, ${gas} gas.`;
    updateControls();
}

function updateControls() {
    const btnDraw = document.getElementById("btn-draw");
    const btnEndParty = document.getElementById("btn-end-party");
    const btnStartParty = document.getElementById("btn-start-party");
    const elGameOver = document.getElementById("game-over");

    if (roundNum === 1) {
        if (btnDraw) btnDraw.style.display = "inline-block";
        if (btnEndParty) btnEndParty.style.display = "inline-block";
        if (btnStartParty) btnStartParty.style.display = "none";
        if (btnDraw) btnDraw.disabled = hand.length >= supply || playerDeck.length === 0;
        if (btnEndParty) btnEndParty.disabled = false;
    } else {
        if (btnDraw) btnDraw.style.display = "none";
        if (btnEndParty) btnEndParty.style.display = "none";
        if (btnStartParty) btnStartParty.style.display = "inline-block";
    }

    if (elGameOver) elGameOver.style.display = turn >= parties ? "block" : "none";
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

    const btnSolo = document.getElementById("btn-solo");
    if (btnSolo) {
        btnSolo.addEventListener("click", () => {
            showSoloDecks();
            loadSoloDecks();
        });
    }

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

    const btnReturnSoloMenu = document.getElementById("btn-return-solo-menu");
    if (btnReturnSoloMenu) {
        btnReturnSoloMenu.addEventListener("click", showMenu);
    }

    const btnReturnGame = document.getElementById("btn-return-game");
    if (btnReturnGame) {
        btnReturnGame.addEventListener("click", showMenu);
    }

    const btnGameOverMenu = document.getElementById("btn-game-over-menu");
    if (btnGameOverMenu) {
        btnGameOverMenu.addEventListener("click", showMenu);
    }

    const btnDraw = document.getElementById("btn-draw");
    if (btnDraw) {
        btnDraw.addEventListener("click", drawCard);
    }

    const btnEndParty = document.getElementById("btn-end-party");
    if (btnEndParty) {
        btnEndParty.addEventListener("click", endParty);
    }

    const btnStartParty = document.getElementById("btn-start-party");
    if (btnStartParty) {
        btnStartParty.addEventListener("click", startParty);
    }
});
