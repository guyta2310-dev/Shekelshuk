const SHEKEL = "\u20AA";

const refs = {
  metricStrip: document.getElementById("metricStrip"),
  headerBalance: document.getElementById("headerBalance"),
  headerUser: document.getElementById("headerUser"),
  marketGrid: document.getElementById("marketGrid"),
  casinoGrid: document.getElementById("casinoGrid"),
  adminGrid: document.getElementById("adminGrid"),
  transactionLog: document.getElementById("transactionLog"),
  signupModal: document.getElementById("signupModal"),
  signupForm: document.getElementById("signupForm"),
  signupMessage: document.getElementById("signupMessage"),
};

const state = {
  currentUserId: null,
  users: [
    {
      id: "user-admin",
      name: "Ari Cohen",
      email: "admin@shekelshuk.school",
      grade: "Staff",
      balance: 8400,
      isAdmin: true,
    },
    {
      id: "user-maya",
      name: "Maya Klein",
      email: "maya.klein@shekelshuk.school",
      grade: "11",
      balance: 1685,
      isAdmin: false,
    },
    {
      id: "user-noa",
      name: "Noa Levi",
      email: "noa.levi@shekelshuk.school",
      grade: "10",
      balance: 1215,
      isAdmin: false,
    },
    {
      id: "user-eli",
      name: "Eli Brooks",
      email: "eli.brooks@shekelshuk.school",
      grade: "12",
      balance: 2130,
      isAdmin: false,
    },
  ],
  markets: [
    {
      id: "market-fire-drill",
      category: "School",
      question: "Will there be a fire drill before lunch on Friday?",
      closesLabel: "Closes Fri 11:15 AM",
      yesPool: 760,
      noPool: 420,
      volume: 2480,
      positions: {
        "user-maya": { yesShares: 56.5, noShares: 0, yesSpent: 34, noSpent: 0 },
        "user-noa": { yesShares: 0, noShares: 88.2, yesSpent: 0, noSpent: 39 },
      },
      resolved: null,
    },
    {
      id: "market-soccer",
      category: "Sports",
      question: "Will varsity soccer win the district semifinal on Tuesday?",
      closesLabel: "Closes Tue 6:30 PM",
      yesPool: 540,
      noPool: 460,
      volume: 1960,
      positions: {
        "user-eli": { yesShares: 72.8, noShares: 0, yesSpent: 40, noSpent: 0 },
      },
      resolved: null,
    },
    {
      id: "market-milk",
      category: "School",
      question: "Will the cafeteria sell out of chocolate milk by 1:00 PM tomorrow?",
      closesLabel: "Closes Tomorrow 12:45 PM",
      yesPool: 385,
      noPool: 615,
      volume: 1575,
      positions: {
        "user-maya": { yesShares: 0, noShares: 48.8, yesSpent: 0, noSpent: 30 },
      },
      resolved: null,
    },
    {
      id: "market-track",
      category: "Sports",
      question: "Will the track team break a school record at the invitational?",
      closesLabel: "Closes Sat 3:00 PM",
      yesPool: 675,
      noPool: 325,
      volume: 1840,
      positions: {},
      resolved: null,
    },
  ],
  tradeBudgets: {
    "market-fire-drill": 50,
    "market-soccer": 40,
    "market-milk": 35,
    "market-track": 60,
  },
  transactions: createSeedTransactions(),
  admin: {
    selectedUserId: "user-maya",
    adjustAmount: 100,
  },
  casino: {
    dice: {
      bet: 40,
      rolling: false,
      display: 4,
      message: "Roll 4, 5, or 6 to pay 1.9x.",
      recent: [5, 2, 6, 3, 4],
    },
    plinko: {
      bet: 25,
      dropping: false,
      currentStep: 0,
      path: [],
      slotIndex: null,
      message: "Neon drop lanes pay from 0.2x to 2.4x.",
      multipliers: [0.2, 0.5, 0.8, 1.2, 1.6, 2.4, 1.6, 1.2, 0.8],
    },
    blackjack: {
      bet: 60,
      inRound: false,
      message: "Blackjack pays 2.5x. Dealer stands on 17.",
      player: [],
      dealer: [],
      revealDealer: false,
      deck: [],
    },
  },
};

let diceTimer = null;
let plinkoTimers = [];

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("submit", handleSubmit);

render();

function createSeedTransactions() {
  const now = Date.now();
  return [
    {
      id: uid("seed"),
      title: "Admin topped up Maya Klein",
      detail: "Manual reward for spirit week leaderboard.",
      amount: 150,
      tone: "good",
      kind: "admin",
      at: new Date(now - 1000 * 60 * 4).toISOString(),
    },
    {
      id: uid("seed"),
      title: "Eli Brooks bought YES on varsity soccer",
      detail: "40 Shekels for 72.8 shares at 0.55.",
      amount: -40,
      tone: "neutral",
      kind: "trade",
      at: new Date(now - 1000 * 60 * 9).toISOString(),
    },
    {
      id: uid("seed"),
      title: "Noa Levi rolled Dice",
      detail: "Lost 25 Shekels on a 2.",
      amount: -25,
      tone: "bad",
      kind: "casino",
      at: new Date(now - 1000 * 60 * 14).toISOString(),
    },
    {
      id: uid("seed"),
      title: "Maya Klein bought NO on cafeteria milk sellout",
      detail: "30 Shekels for 48.8 NO shares at 0.61.",
      amount: -30,
      tone: "neutral",
      kind: "trade",
      at: new Date(now - 1000 * 60 * 19).toISOString(),
    },
    {
      id: uid("seed"),
      title: "System seeded weekly Shekel stipend",
      detail: "All active students received 120 Shekels.",
      amount: 120,
      tone: "good",
      kind: "system",
      at: new Date(now - 1000 * 60 * 41).toISOString(),
    },
  ];
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action } = button.dataset;

  if (action === "preset-budget") {
    state.tradeBudgets[button.dataset.marketId] = Number(button.dataset.value);
    renderMarkets();
    return;
  }

  if (action === "buy-shares") {
    tradeShares(button.dataset.marketId, button.dataset.side);
    return;
  }

  if (action === "roll-dice") {
    playDice();
    return;
  }

  if (action === "drop-plinko") {
    playPlinko();
    return;
  }

  if (action === "blackjack-start") {
    startBlackjack();
    return;
  }

  if (action === "blackjack-hit") {
    hitBlackjack();
    return;
  }

  if (action === "blackjack-stand") {
    standBlackjack();
    return;
  }

  if (action === "admin-adjust") {
    const direction = button.dataset.direction === "subtract" ? -1 : 1;
    adjustBalance(direction);
    return;
  }

  if (action === "resolve-market") {
    resolveMarket(button.dataset.marketId, button.dataset.outcome);
  }
}

function handleInput(event) {
  const target = event.target;

  if (target.matches("[data-market-budget]")) {
    const value = clamp(Math.round(Number(target.value) || 0), 10, 500);
    state.tradeBudgets[target.dataset.marketBudget] = value;
    return;
  }

  if (target.id === "diceBet") {
    state.casino.dice.bet = clamp(Math.round(Number(target.value) || 0), 10, 300);
    return;
  }

  if (target.id === "plinkoBet") {
    state.casino.plinko.bet = clamp(Math.round(Number(target.value) || 0), 10, 250);
    return;
  }

  if (target.id === "blackjackBet") {
    state.casino.blackjack.bet = clamp(Math.round(Number(target.value) || 0), 10, 400);
    return;
  }

  if (target.id === "adminUserSelect") {
    state.admin.selectedUserId = target.value;
    return;
  }

  if (target.id === "adminAdjustAmount") {
    state.admin.adjustAmount = clamp(Math.round(Number(target.value) || 0), 10, 5000);
  }
}

function handleSubmit(event) {
  if (event.target.id !== "signupForm") return;

  event.preventDefault();
  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const grade = String(formData.get("grade") || "").trim();

  if (!name || !email || !grade) {
    refs.signupMessage.textContent = "Fill out every registration field.";
    return;
  }

  if (!email.includes("@")) {
    refs.signupMessage.textContent = "Use a school email address.";
    return;
  }

  const exists = state.users.some((user) => user.email === email);
  if (exists) {
    refs.signupMessage.textContent = "That email is already registered in the demo.";
    return;
  }

  const newUser = {
    id: uid("user"),
    name,
    email,
    grade,
    balance: 1200,
    isAdmin: false,
  };

  state.users.push(newUser);
  state.currentUserId = newUser.id;
  state.admin.selectedUserId = newUser.id;
  addTransaction({
    title: `${newUser.name} joined ShekelShuk`,
    detail: `Registration completed with a ${formatShekels(1200)} welcome balance.`,
    amount: 1200,
    tone: "good",
    kind: "signup",
  });
  refs.signupForm.reset();
  refs.signupMessage.textContent = "";
  render();
}

function render() {
  renderHeader();
  renderMetrics();
  renderMarkets();
  renderCasino();
  renderAdmin();
  renderTransactions();
  renderSignup();
}

function renderHeader() {
  const user = getCurrentUser();
  refs.headerBalance.textContent = user ? formatShekels(user.balance) : `${formatShekels(0)} Locked`;
  refs.headerUser.textContent = user ? `${user.name} | Grade ${user.grade}` : "Signup Required";
}

function renderMetrics() {
  const user = getCurrentUser();
  const openMarkets = state.markets.filter((market) => !market.resolved).length;
  const totalVolume = state.markets.reduce((sum, market) => sum + market.volume, 0);
  const userExposure = state.markets.reduce((sum, market) => {
    if (market.resolved) return sum;
    const position = market.positions[user?.id] || emptyPosition();
    return sum + position.yesSpent + position.noSpent;
  }, 0);
  const activeBets = user
    ? state.transactions.filter((entry) => `${entry.title} ${entry.detail}`.includes(user.name)).length
    : 0;

  refs.metricStrip.innerHTML = [
    {
      label: "Wallet",
      value: user ? formatShekels(user.balance) : "Register to unlock",
      note: user ? "Shared across trades and casino play" : "Name, email, and grade required",
    },
    {
      label: "Open Markets",
      value: `${openMarkets}`,
      note: "Every market is a YES or NO question",
    },
    {
      label: "User Exposure",
      value: user ? formatShekels(userExposure) : formatShekels(0),
      note: "Current Shekels tied up in open positions",
    },
    {
      label: "Site Volume",
      value: formatShekels(totalVolume),
      note: `${activeBets} recent actions attached to your profile`,
    },
  ]
    .map(
      (item) => `
        <article class="metric-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <em>${escapeHtml(item.note)}</em>
        </article>
      `,
    )
    .join("");
}

function renderMarkets() {
  const user = getCurrentUser();
  refs.marketGrid.innerHTML = state.markets
    .map((market) => {
      const yesPrice = getYesPrice(market);
      const noPrice = 1 - yesPrice;
      const budget = state.tradeBudgets[market.id] || 50;
      const position = user ? market.positions[user.id] || emptyPosition() : emptyPosition();
      const yesPotential = position.yesShares;
      const noPotential = position.noShares;
      const statusMarkup = market.resolved
        ? `<span class="status-pill ${market.resolved === "yes" ? "status-yes" : "status-no"}">Resolved ${market.resolved.toUpperCase()}</span>`
        : `<span class="status-pill status-open">Open Market</span>`;
      const disabled = !user || market.resolved ? "disabled" : "";

      return `
        <article class="market-card">
          <div class="market-head">
            <div>
              <p class="market-topline">${escapeHtml(market.category)} Market</p>
              <h3>${escapeHtml(market.question)}</h3>
            </div>
            ${statusMarkup}
          </div>

          <div class="price-rail" aria-hidden="true">
            <div class="price-fill" style="width: ${Math.round(yesPrice * 100)}%"></div>
          </div>

          <div class="price-caption">
            <span>YES probability ${formatPercent(yesPrice)}</span>
            <span>NO probability ${formatPercent(noPrice)}</span>
          </div>

          <div class="market-prices">
            <div class="price-box yes">
              <span>YES price</span>
              <strong>${formatQuote(yesPrice)}</strong>
            </div>
            <div class="price-box no">
              <span>NO price</span>
              <strong>${formatQuote(noPrice)}</strong>
            </div>
          </div>

          <div class="position-row">
            <span class="tag">Your YES shares ${formatNumber(yesPotential, 1)}</span>
            <span class="tag">Your NO shares ${formatNumber(noPotential, 1)}</span>
          </div>

          <div class="budget-row">
            <button class="budget-chip ${budget === 25 ? "active" : ""}" data-action="preset-budget" data-market-id="${market.id}" data-value="25">25</button>
            <button class="budget-chip ${budget === 50 ? "active" : ""}" data-action="preset-budget" data-market-id="${market.id}" data-value="50">50</button>
            <button class="budget-chip ${budget === 100 ? "active" : ""}" data-action="preset-budget" data-market-id="${market.id}" data-value="100">100</button>
            <input
              type="number"
              min="10"
              step="5"
              value="${budget}"
              data-market-budget="${market.id}"
              aria-label="Trade budget for ${escapeHtml(market.question)}"
            />
          </div>

          <div class="trade-actions">
            <button class="trade-button yes" data-action="buy-shares" data-market-id="${market.id}" data-side="yes" ${disabled}>
              Buy YES for ${formatShekels(budget)}
            </button>
            <button class="trade-button no" data-action="buy-shares" data-market-id="${market.id}" data-side="no" ${disabled}>
              Buy NO for ${formatShekels(budget)}
            </button>
          </div>

          <div class="market-footer">
            <span>${escapeHtml(market.closesLabel)}</span>
            <span>${formatShekels(market.volume)} traded</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCasino() {
  const user = getCurrentUser();
  const wallet = user ? formatShekels(user.balance) : "Register first";
  refs.casinoGrid.innerHTML = `
    <article class="casino-card">
      <div class="card-head">
        <div>
          <p class="market-topline">Dice</p>
          <h3>Fast roll</h3>
        </div>
        <span class="status-pill status-open">1.9x on 4-6</span>
      </div>
      <p class="market-meta">High-volatility roll tied to your live Shekel balance.</p>
      <div class="bet-row">
        <label class="field">
          <span>Bet amount</span>
          <input id="diceBet" type="number" min="10" step="5" value="${state.casino.dice.bet}" />
        </label>
      </div>
      <div class="dice-display">
        <div>
          <div class="dice-number">${state.casino.dice.display}</div>
          <p class="help-text">${escapeHtml(state.casino.dice.message)}</p>
        </div>
      </div>
      <button class="primary-button" data-action="roll-dice" ${!user || state.casino.dice.rolling ? "disabled" : ""}>Roll Dice</button>
      <div class="recent-rolls">
        ${state.casino.dice.recent.map((roll) => `<span class="roll-chip">${roll}</span>`).join("")}
      </div>
      <div class="bank-pill">
        <span>Shared wallet</span>
        <strong>${escapeHtml(wallet)}</strong>
      </div>
    </article>

    <article class="casino-card">
      <div class="card-head">
        <div>
          <p class="market-topline">Plinko</p>
          <h3>Neon drop board</h3>
        </div>
        <span class="status-pill status-open">Max 2.4x</span>
      </div>
      <p class="market-meta">Animated neon drop path with the same wallet used for prediction trades.</p>
      <label class="field">
        <span>Bet amount</span>
        <input id="plinkoBet" type="number" min="10" step="5" value="${state.casino.plinko.bet}" />
      </label>
      ${renderPlinkoBoard()}
      <button class="primary-button" data-action="drop-plinko" ${!user || state.casino.plinko.dropping ? "disabled" : ""}>Drop Ball</button>
      <div class="bank-pill">
        <span>Latest note</span>
        <strong>${escapeHtml(state.casino.plinko.message)}</strong>
      </div>
    </article>

    <article class="casino-card">
      <div class="card-head">
        <div>
          <p class="market-topline">Blackjack</p>
          <h3>Head-to-head table</h3>
        </div>
        <span class="status-pill status-open">2.5x on blackjack</span>
      </div>
      <p class="market-meta">Slide cards into view, hit or stand, and settle immediately into the shared Shekel balance.</p>
      <label class="field">
        <span>Bet amount</span>
        <input id="blackjackBet" type="number" min="10" step="5" value="${state.casino.blackjack.bet}" />
      </label>
      <div class="hands">
        <div class="card-lane">
          <span>Dealer</span>
          <div class="cards">${renderCards(state.casino.blackjack.dealer, !state.casino.blackjack.revealDealer)}</div>
        </div>
        <div class="card-lane">
          <span>Player</span>
          <div class="cards">${renderCards(state.casino.blackjack.player, false)}</div>
        </div>
      </div>
      <p class="help-text">${escapeHtml(state.casino.blackjack.message)}</p>
      <div class="blackjack-actions">
        <button class="primary-button" data-action="blackjack-start" ${!user || state.casino.blackjack.inRound ? "disabled" : ""}>Deal</button>
        <button class="secondary-button" data-action="blackjack-hit" ${state.casino.blackjack.inRound ? "" : "disabled"}>Hit</button>
        <button class="ghost-button" data-action="blackjack-stand" ${state.casino.blackjack.inRound ? "" : "disabled"}>Stand</button>
      </div>
      <div class="bank-pill">
        <span>Wallet after hand</span>
        <strong>${escapeHtml(wallet)}</strong>
      </div>
    </article>
  `;
}

function renderPlinkoBoard() {
  const board = state.casino.plinko;
  const currentX = getPlinkoBallX(board);
  const currentY = getPlinkoBallY(board);

  return `
    <div class="plinko-board">
      <div class="peg-field">
        ${Array.from({ length: 8 }, (_, row) => {
          const pegCount = row + 5;
          return `
            <div class="peg-row ${row % 2 ? "offset" : ""}">
              ${Array.from({ length: pegCount }, () => `<span class="peg"></span>`).join("")}
            </div>
          `;
        }).join("")}
      </div>
      <div class="plinko-ball" style="left: ${currentX}%; top: ${currentY}%"></div>
      <div class="plinko-slots">
        ${board.multipliers
          .map(
            (multiplier, index) => `
              <div class="slot ${index === board.slotIndex ? "active" : ""}">
                ${formatMultiplier(multiplier)}
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCards(cards, hideFirstCard) {
  if (!cards.length) {
    return `<div class="empty-state"><p class="empty-copy">No cards dealt yet.</p></div>`;
  }

  return cards
    .map((card, index) => {
      const hidden = hideFirstCard && index === 0;
      return `<div class="play-card ${hidden ? "hidden" : ""}">${hidden ? "?" : escapeHtml(card.label)}</div>`;
    })
    .join("");
}

function renderAdmin() {
  const studentRows = state.users
    .filter((user) => !user.isAdmin)
    .map(
      (user) => `
        <div class="student-row">
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <small>${escapeHtml(user.email)}</small>
          </div>
          <div>${escapeHtml(user.email)}</div>
          <div>Grade ${escapeHtml(user.grade)}</div>
          <div><strong>${formatShekels(user.balance)}</strong></div>
        </div>
      `,
    )
    .join("");

  refs.adminGrid.innerHTML = `
    <article class="admin-card">
      <div class="admin-head">
        <div>
          <p class="market-topline">Student Ledger</p>
          <h3>Every account</h3>
        </div>
        <span class="status-pill status-open">${state.users.filter((user) => !user.isAdmin).length} students</span>
      </div>
      <div class="student-table">
        <div class="table-head">Name | Email | Grade | Balance</div>
        ${studentRows}
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-head">
        <div>
          <p class="market-topline">Manual Override</p>
          <h3>Adjust Shekels</h3>
        </div>
      </div>
      <div class="admin-form">
        <label class="field">
          <span>Student</span>
          <select id="adminUserSelect">
            ${state.users
              .filter((user) => !user.isAdmin)
              .map(
                (user) => `
                  <option value="${user.id}" ${user.id === state.admin.selectedUserId ? "selected" : ""}>
                    ${escapeHtml(user.name)} | Grade ${escapeHtml(user.grade)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Amount</span>
          <input id="adminAdjustAmount" type="number" min="10" step="10" value="${state.admin.adjustAmount}" />
        </label>
        <div class="admin-actions">
          <button class="primary-button" data-action="admin-adjust" data-direction="add">Add Shekels</button>
          <button class="ghost-button" data-action="admin-adjust" data-direction="subtract">Subtract Shekels</button>
        </div>
        <p class="help-text">Use rewards or penalties without leaving the dashboard.</p>
      </div>
    </article>

    <article class="admin-card">
      <div class="admin-head">
        <div>
          <p class="market-topline">Resolution Panel</p>
          <h3>Settle markets</h3>
        </div>
      </div>
      <div class="resolution-list">
        ${state.markets
          .map((market) => {
            const resolution = market.resolved
              ? `<span class="status-pill ${market.resolved === "yes" ? "status-yes" : "status-no"}">Resolved ${market.resolved.toUpperCase()}</span>`
              : `<span class="status-pill status-open">Pending</span>`;

            return `
              <div class="resolution-card">
                <div class="card-head">
                  <div>
                    <p class="market-topline">${escapeHtml(market.category)}</p>
                    <h3>${escapeHtml(market.question)}</h3>
                  </div>
                  ${resolution}
                </div>
                <p class="resolution-copy">${escapeHtml(market.closesLabel)}</p>
                <div class="resolution-actions">
                  <button class="primary-button" data-action="resolve-market" data-market-id="${market.id}" data-outcome="yes" ${market.resolved ? "disabled" : ""}>Resolve YES</button>
                  <button class="ghost-button" data-action="resolve-market" data-market-id="${market.id}" data-outcome="no" ${market.resolved ? "disabled" : ""}>Resolve NO</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderTransactions() {
  refs.transactionLog.innerHTML = state.transactions
    .slice(0, 12)
    .map(
      (entry) => `
        <article class="log-row">
          <div class="log-head">
            <div>
              <strong>${escapeHtml(entry.title)}</strong>
              <p class="help-text">${escapeHtml(entry.detail)}</p>
            </div>
            <span class="tone-pill tone-${entry.tone}">
              ${entry.amount >= 0 ? "+" : "-"}${formatShekels(Math.abs(entry.amount))}
            </span>
          </div>
          <div class="log-meta">
            <span>${escapeHtml(entry.kind.toUpperCase())}</span>
            <span>${formatRelativeTime(entry.at)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSignup() {
  const open = !getCurrentUser();
  refs.signupModal.classList.toggle("open", open);
  refs.signupModal.setAttribute("aria-hidden", String(!open));
}

function tradeShares(marketId, side) {
  const user = getCurrentUser();
  if (!user) return;

  const market = state.markets.find((entry) => entry.id === marketId);
  if (!market || market.resolved) return;

  const spend = clamp(Math.round(Number(state.tradeBudgets[marketId]) || 0), 10, 500);
  if (user.balance < spend) {
    addTransaction({
      title: `${user.name} trade blocked`,
      detail: `Tried to spend ${formatShekels(spend)} with only ${formatShekels(user.balance)} available.`,
      amount: 0,
      tone: "bad",
      kind: "trade",
    });
    render();
    return;
  }

  const price = side === "yes" ? getYesPrice(market) : 1 - getYesPrice(market);
  const shares = spend / price;
  const userPosition = market.positions[user.id] || emptyPosition();
  const sharesKey = side === "yes" ? "yesShares" : "noShares";
  const spentKey = side === "yes" ? "yesSpent" : "noSpent";

  user.balance -= spend;
  userPosition[sharesKey] += shares;
  userPosition[spentKey] += spend;
  market.positions[user.id] = userPosition;
  if (side === "yes") {
    market.yesPool += spend;
  } else {
    market.noPool += spend;
  }
  market.volume += spend;

  addTransaction({
    title: `${user.name} bought ${side.toUpperCase()} on ${market.question}`,
    detail: `${formatShekels(spend)} for ${formatNumber(shares, 1)} shares at ${formatQuote(price)}.`,
    amount: -spend,
    tone: "neutral",
    kind: "trade",
  });
  render();
}

function playDice() {
  const user = getCurrentUser();
  if (!user || state.casino.dice.rolling) return;

  const bet = clamp(state.casino.dice.bet, 10, 300);
  if (user.balance < bet) {
    state.casino.dice.message = "Not enough Shekels to roll that size.";
    renderCasino();
    return;
  }

  user.balance -= bet;
  state.casino.dice.rolling = true;
  state.casino.dice.message = `Rolling ${formatShekels(bet)}...`;
  renderHeader();
  renderMetrics();
  renderCasino();

  let steps = 0;
  clearInterval(diceTimer);
  diceTimer = setInterval(() => {
    state.casino.dice.display = randomInt(1, 6);
    renderCasino();
    steps += 1;

    if (steps < 10) return;

    clearInterval(diceTimer);
    state.casino.dice.rolling = false;

    const finalRoll = randomInt(1, 6);
    const won = finalRoll >= 4;
    const payout = won ? roundMoney(bet * 1.9) : 0;

    state.casino.dice.display = finalRoll;
    state.casino.dice.recent = [finalRoll, ...state.casino.dice.recent].slice(0, 5);

    if (won) {
      user.balance += payout;
      state.casino.dice.message = `Hit ${finalRoll}. Paid ${formatShekels(payout)}.`;
      addTransaction({
        title: `${user.name} hit Dice`,
        detail: `Rolled ${finalRoll} and collected ${formatShekels(payout)}.`,
        amount: payout - bet,
        tone: "good",
        kind: "casino",
      });
    } else {
      state.casino.dice.message = `Rolled ${finalRoll}. ${formatShekels(bet)} lost.`;
      addTransaction({
        title: `${user.name} missed Dice`,
        detail: `Rolled ${finalRoll} and lost ${formatShekels(bet)}.`,
        amount: -bet,
        tone: "bad",
        kind: "casino",
      });
    }

    render();
  }, 85);
}

function playPlinko() {
  const user = getCurrentUser();
  const game = state.casino.plinko;
  if (!user || game.dropping) return;

  const bet = clamp(game.bet, 10, 250);
  if (user.balance < bet) {
    game.message = "Your wallet cannot support that drop.";
    renderCasino();
    return;
  }

  user.balance -= bet;
  game.dropping = true;
  game.currentStep = 0;
  game.slotIndex = null;
  game.message = `Dropping ${formatShekels(bet)} through the neon board...`;

  const path = [4];
  for (let step = 1; step <= 8; step += 1) {
    const drift = Math.random() > 0.5 ? 1 : -1;
    const next = clamp(path[path.length - 1] + drift, 0, 8);
    path.push(next);
  }
  game.path = path;
  renderHeader();
  renderMetrics();
  renderCasino();

  plinkoTimers.forEach((timer) => clearTimeout(timer));
  plinkoTimers = path.map((slot, index) =>
    setTimeout(() => {
      game.currentStep = index;
      game.slotIndex = index === path.length - 1 ? slot : null;
      renderCasino();

      if (index !== path.length - 1) return;

      const multiplier = game.multipliers[slot];
      const payout = roundMoney(bet * multiplier);
      game.dropping = false;
      game.message = `Slot ${slot + 1} landed at ${formatMultiplier(multiplier)} for ${formatShekels(payout)}.`;

      if (payout > 0) {
        user.balance += payout;
      }

      addTransaction({
        title: `${user.name} dropped Plinko`,
        detail: `Bet ${formatShekels(bet)} and hit ${formatMultiplier(multiplier)} for ${formatShekels(payout)}.`,
        amount: payout - bet,
        tone: payout >= bet ? "good" : "bad",
        kind: "casino",
      });
      render();
    }, index * 150),
  );
}

function startBlackjack() {
  const user = getCurrentUser();
  const game = state.casino.blackjack;
  if (!user || game.inRound) return;

  const bet = clamp(game.bet, 10, 400);
  if (user.balance < bet) {
    game.message = "Not enough Shekels to open this hand.";
    renderCasino();
    return;
  }

  user.balance -= bet;
  game.inRound = true;
  game.revealDealer = false;
  game.deck = buildDeck();
  shuffle(game.deck);
  game.player = [drawCard(game.deck), drawCard(game.deck)];
  game.dealer = [drawCard(game.deck), drawCard(game.deck)];
  game.message = "Cards are live. Hit or stand.";

  if (getHandValue(game.player) === 21) {
    settleBlackjack("blackjack");
    return;
  }

  render();
}

function hitBlackjack() {
  const game = state.casino.blackjack;
  if (!game.inRound) return;

  game.player.push(drawCard(game.deck));
  const total = getHandValue(game.player);

  if (total > 21) {
    settleBlackjack("lose");
    return;
  }

  game.message = `Player on ${total}.`;
  renderCasino();
}

function standBlackjack() {
  const game = state.casino.blackjack;
  if (!game.inRound) return;

  while (getHandValue(game.dealer) < 17) {
    game.dealer.push(drawCard(game.deck));
  }

  const playerTotal = getHandValue(game.player);
  const dealerTotal = getHandValue(game.dealer);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    settleBlackjack("win");
    return;
  }

  if (playerTotal === dealerTotal) {
    settleBlackjack("push");
    return;
  }

  settleBlackjack("lose");
}

function settleBlackjack(result) {
  const user = getCurrentUser();
  const game = state.casino.blackjack;
  if (!user) return;

  const bet = clamp(game.bet, 10, 400);
  game.revealDealer = true;
  game.inRound = false;

  let payout = 0;
  let tone = "bad";

  if (result === "blackjack") {
    payout = roundMoney(bet * 2.5);
    tone = "good";
    game.message = `Blackjack. Paid ${formatShekels(payout)}.`;
  } else if (result === "win") {
    payout = roundMoney(bet * 2);
    tone = "good";
    game.message = `Player wins ${formatShekels(payout)}.`;
  } else if (result === "push") {
    payout = bet;
    tone = "neutral";
    game.message = `Push. ${formatShekels(bet)} returned.`;
  } else {
    game.message = `Dealer wins the hand. ${formatShekels(bet)} lost.`;
  }

  if (payout > 0) {
    user.balance += payout;
  }

  addTransaction({
    title: `${user.name} finished Blackjack`,
    detail: `${capitalize(result)} result with player ${getHandValue(game.player)} and dealer ${getHandValue(game.dealer)}.`,
    amount: payout - bet,
    tone,
    kind: "casino",
  });
  render();
}

function adjustBalance(direction) {
  const user = state.users.find((entry) => entry.id === state.admin.selectedUserId);
  if (!user) return;

  const amount = clamp(state.admin.adjustAmount, 10, 5000);
  const previousBalance = user.balance;
  user.balance = Math.max(0, roundMoney(user.balance + amount * direction));
  const delta = roundMoney(user.balance - previousBalance);

  addTransaction({
    title: `Admin ${direction > 0 ? "added" : "removed"} funds for ${user.name}`,
    detail: `${direction > 0 ? "Rewarded" : "Penalized"} ${formatShekels(Math.abs(delta))} from the control panel.`,
    amount: delta,
    tone: direction > 0 ? "good" : "bad",
    kind: "admin",
  });
  render();
}

function resolveMarket(marketId, outcome) {
  const market = state.markets.find((entry) => entry.id === marketId);
  if (!market || market.resolved) return;

  market.resolved = outcome;

  Object.entries(market.positions).forEach(([userId, position]) => {
    const user = state.users.find((entry) => entry.id === userId);
    if (!user) return;

    const payout = roundMoney(outcome === "yes" ? position.yesShares : position.noShares);
    if (payout > 0) {
      user.balance += payout;
      addTransaction({
        title: `${user.name} won ${market.question}`,
        detail: `Market resolved ${outcome.toUpperCase()} and paid ${formatShekels(payout)}.`,
        amount: payout,
        tone: "good",
        kind: "resolution",
      });
    }
  });

  addTransaction({
    title: `Admin resolved ${market.question}`,
    detail: `Final outcome set to ${outcome.toUpperCase()}.`,
    amount: 0,
    tone: "neutral",
    kind: "admin",
  });
  render();
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function getYesPrice(market) {
  if (market.resolved === "yes") return 1;
  if (market.resolved === "no") return 0;
  const total = market.yesPool + market.noPool;
  const raw = total === 0 ? 0.5 : market.yesPool / total;
  return clamp(raw, 0.1, 0.99);
}

function emptyPosition() {
  return { yesShares: 0, noShares: 0, yesSpent: 0, noSpent: 0 };
}

function addTransaction(entry) {
  state.transactions.unshift({
    id: uid("txn"),
    at: new Date().toISOString(),
    ...entry,
  });
  state.transactions = state.transactions.slice(0, 30);
}

function formatQuote(value) {
  return `${SHEKEL}${formatNumber(value, 2)}`;
}

function formatShekels(value) {
  const rounded = roundMoney(Number(value) || 0);
  const digits = Number.isInteger(rounded) ? 0 : 2;
  return `${SHEKEL}${formatNumber(rounded, digits)}`;
}

function formatNumber(value, digits = 0) {
  return Number(value).toFixed(digits);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatMultiplier(value) {
  return `${formatNumber(value, 1)}x`;
}

function formatRelativeTime(isoTime) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function buildDeck() {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["S", "H", "D", "C"];
  const deck = [];

  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      deck.push({
        rank,
        suit,
        label: `${rank}-${suit}`,
      });
    });
  });

  return deck;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function drawCard(deck) {
  return deck.pop();
}

function getHandValue(cards) {
  let total = 0;
  let aces = 0;

  cards.forEach((card) => {
    if (card.rank === "A") {
      total += 11;
      aces += 1;
      return;
    }

    if (["K", "Q", "J"].includes(card.rank)) {
      total += 10;
      return;
    }

    total += Number(card.rank);
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPlinkoBallX(game) {
  const slot = game.path[game.currentStep] ?? 4;
  return 13 + slot * 9.25;
}

function getPlinkoBallY(game) {
  if (!game.dropping && game.slotIndex == null) return 8;
  return 10 + game.currentStep * 9.5;
}
