const world = document.querySelector('#world');
const caretaker = document.querySelector('#caretaker');
const fruitCount = document.querySelector('#fruit-count');
const woodCount = document.querySelector('#wood-count');
const moneyCount = document.querySelector('#money-count');
const equippedAxe = document.querySelector('#equipped-axe');
const speech = document.querySelector('#speech');
const bunny = document.querySelector('#bunny');
const hutch = document.querySelector('#hutch');
const hutchSign = document.querySelector('.hutch-sign');
const hutchLevelLabel = document.querySelector('#hutch-level');
const feedProgress = document.querySelector('#feed-progress');
const rebirthButton = document.querySelector('#rebirth-button');
const shop = document.querySelector('#shop');
const exchange = document.querySelector('#exchange');
const shopMenu = document.querySelector('#shop-menu');
const exchangeMenu = document.querySelector('#exchange-menu');
const upgradeCosts = [0, 3, 6, 9, 12];
const bunnyColors = ['bunny-brown', 'bunny-golden', 'bunny-white-spotted', 'bunny-brown-black'];
let fruit = 0, wood = 0, money = 0, bunnyClicks = 0, messageTimer, bunnyClickTimer;
let hutchLevel = 1, rebirths = 0, fruitFedSinceRebirth = 0;
let axeTier = 0;
let pickupInProgress = false;

function say(text) {
  speech.textContent = text;
  speech.classList.add('show');
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => speech.classList.remove('show'), 1400);
}

function isBlocked(x, y) {
  const area = world.getBoundingClientRect();
  const point = { x: area.left + (x / 100) * area.width, y: area.top + (y / 100) * area.height };
  return [...document.querySelectorAll('.tree, #hutch, .pond, #shop, #exchange')].some((item) => {
    const box = item.getBoundingClientRect();
    const padding = item.matches('.pond') ? 8 : 18;
    return point.x > box.left - padding && point.x < box.right + padding && point.y > box.top - padding && point.y < box.bottom + padding;
  });
}

function moveCaretaker(x, y) {
  const bounds = world.getBoundingClientRect();
  const person = caretaker.getBoundingClientRect();
  const targetX = Math.max(2, Math.min(94, ((x - bounds.left - person.width / 2) / bounds.width) * 100));
  const targetY = Math.max(2, Math.min(88, ((y - bounds.top - person.height / 2) / bounds.height) * 100));
  if (isBlocked(targetX, targetY)) return null;
  const destinationX = bounds.left + (targetX / 100) * bounds.width + person.width / 2;
  const destinationY = bounds.top + (targetY / 100) * bounds.height + person.height / 2;
  const distance = Math.hypot(destinationX - (person.left + person.width / 2), destinationY - (person.top + person.height / 2));
  const duration = Math.round(Math.max(180, Math.min(1600, (distance / 230) * 1000)));
  caretaker.style.setProperty('--walk-duration', `${duration}ms`);
  caretaker.style.left = `${targetX}%`;
  caretaker.style.top = `${targetY}%`;
  return duration;
}

function isNearCaretaker(item, distance = 115) {
  const person = caretaker.getBoundingClientRect();
  const target = item.getBoundingClientRect();
  const personX = person.left + person.width / 2;
  const personY = person.top + person.height / 2;
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  return Math.hypot(personX - targetX, personY - targetY) <= distance;
}

function collectFruit(item) {
  if (pickupInProgress) { say('Finishing the current pickup.'); return; }
  const rect = item.getBoundingClientRect();
  const travelTime = moveCaretaker(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (travelTime === null) { say('That fruit is out of reach.'); return; }
  pickupInProgress = true;
  item.disabled = true;
  setTimeout(() => {
    pickupInProgress = false;
    if (!item.isConnected) return;
    item.remove();
    const fruitReward = rebirths > 0 ? 2 : 1;
    fruit += fruitReward;
    fruitCount.textContent = fruit;
    say(fruitReward === 1 ? 'Fruit collected!' : 'Rebirth bonus: 2 fruit collected!');
  }, travelTime + 80);
}

function addFruit(x, y) {
  const item = document.createElement('button');
  const kinds = ['berry', 'apple', 'pear'];
  item.className = `fruit ${kinds[Math.floor(Math.random() * kinds.length)]}`;
  item.style.left = `${x}%`; item.style.top = `${y}%`;
  item.setAttribute('aria-label', 'Pick fruit');
  item.addEventListener('click', (event) => { event.stopPropagation(); collectFruit(item); });
  world.append(item);
}

function spawnFruit() {
  if (document.querySelectorAll('.fruit').length >= 6) return;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 8 + Math.random() * 82, y = 8 + Math.random() * 72;
    if (!isBlocked(x, y)) { addFruit(x, y); return; }
  }
}

function collectWood(log) {
  if (pickupInProgress) { say('Finishing the current pickup.'); return; }
  const rect = log.getBoundingClientRect();
  const travelTime = moveCaretaker(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (travelTime === null) { say('That wood is out of reach.'); return; }
  pickupInProgress = true;
  log.disabled = true;
  setTimeout(() => {
    pickupInProgress = false;
    if (!log.isConnected) return;
    log.remove(); wood += 1; woodCount.textContent = wood; say('Wood collected!');
  }, travelTime + 80);
}

function dropWood(tree) {
  const box = tree.getBoundingClientRect(), area = world.getBoundingClientRect();
  const log = document.createElement('button');
  log.className = 'wood'; log.setAttribute('aria-label', 'Pick up fallen wood');
  log.style.left = `${((box.left - area.left + box.width / 2) / area.width) * 100}%`;
  log.style.top = `${((box.bottom - area.top + 10) / area.height) * 100}%`;
  log.addEventListener('click', (event) => { event.stopPropagation(); collectWood(log); });
  world.append(log);
}

function respawnTree(tree) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 8 + Math.random() * 78, y = 8 + Math.random() * 62;
    if (!isBlocked(x, y)) {
      tree.style.left = `${x}%`;
      tree.style.top = `${y}%`;
      tree.style.right = 'auto';
      tree.style.bottom = 'auto';
      tree.classList.remove('tree-fallen', 'tree-fade', 'tree-shake');
      return;
    }
  }
  tree.classList.remove('tree-fallen', 'tree-fade', 'tree-shake');
}

world.addEventListener('click', (event) => {
  if (event.target.closest('.fruit, .tree, .wood, #bunny, #hutch, #shop, #exchange, .store-menu')) return;
  moveCaretaker(event.clientX, event.clientY);
});

function showMenu(menu) {
  shopMenu.hidden = true;
  exchangeMenu.hidden = true;
  menu.hidden = false;
}

function updateMoney() { moneyCount.textContent = `$${money}`; }

shop.addEventListener('click', (event) => { event.stopPropagation(); showMenu(shopMenu); });
exchange.addEventListener('click', (event) => { event.stopPropagation(); showMenu(exchangeMenu); });
document.querySelectorAll('.close-menu').forEach((button) => button.addEventListener('click', () => {
  shopMenu.hidden = true;
  exchangeMenu.hidden = true;
}));

document.querySelectorAll('.buy-button[data-axe]').forEach((button) => button.addEventListener('click', () => {
  const price = Number(button.dataset.price);
  const tier = button.dataset.axe === 'Bronze Axe' ? 2 : 1;
  if (axeTier >= tier) { say(`You already own the ${button.dataset.axe}.`); return; }
  if (tier === 2 && axeTier < 1) { say('Buy the Basic Axe first.'); return; }
  if (money < price) { say(`You need $${price - money} more.`); return; }
  money -= price;
  axeTier = tier;
  updateMoney();
  equippedAxe.textContent = `🪓 ${button.dataset.axe}`;
  say(tier === 2 ? 'Bronze Axe equipped: trees fall in one chop!' : 'Basic Axe equipped: trees take three chops.');
}));

document.querySelector('#sell-fruit').addEventListener('click', () => {
  if (fruit < 1) { say('No fruit to sell.'); return; }
  fruit -= 1; money += 1; fruitCount.textContent = fruit; updateMoney(); say('Sold fruit for $1.');
});
document.querySelector('#sell-wood').addEventListener('click', () => {
  if (wood < 1) { say('No wood to sell.'); return; }
  wood -= 1; money += 2; woodCount.textContent = wood; updateMoney(); say('Sold wood for $2.');
});

document.querySelectorAll('.fruit').forEach((item) => item.addEventListener('click', (event) => { event.stopPropagation(); collectFruit(item); }));

document.querySelectorAll('.tree').forEach((tree) => {
  let chops = 0, felling = false;
  tree.addEventListener('click', (event) => {
    event.stopPropagation();
    if (felling) return;
    if (!axeTier) { say('Visit the Meadow Shop to buy an axe first.'); return; }
    if (!isNearCaretaker(tree)) { say('Walk next to the tree before chopping.'); return; }
    const chopsNeeded = axeTier === 2 ? 1 : 3;
    chops += 1;
    tree.classList.remove('tree-shake');
    void tree.offsetWidth;
    tree.classList.add('tree-shake');
    if (chops < chopsNeeded) say(`Chop ${chopsNeeded - chops} more time${chopsNeeded - chops === 1 ? '' : 's'}!`);
    else {
      felling = true;
      setTimeout(() => {
        tree.classList.add('tree-fallen');
        dropWood(tree);
        say('The tree fell down!');
        setTimeout(() => tree.classList.add('tree-fade'), 550);
        setTimeout(() => { respawnTree(tree); felling = false; chops = 0; }, 2600);
      }, 350);
    }
  });
});

function updateHutchDetails() {
  hutchLevelLabel.textContent = hutchLevel;
  hutchSign.textContent = `Bunny Hutch Level ${hutchLevel}`;
  hutch.setAttribute('aria-label', hutchLevel === 5 ? 'Bunny hutch at maximum level' : `Upgrade bunny hutch to level ${hutchLevel + 1} with ${upgradeCosts[hutchLevel]} wood`);
}

function upgradeHutch() {
  if (hutchLevel === 5) { say('Your hutch is level 5. Rebirth is ready!'); return; }
  const cost = upgradeCosts[hutchLevel];
  if (wood < cost) { say(`You need ${cost - wood} more wood for level ${hutchLevel + 1}.`); return; }
  wood -= cost;
  woodCount.textContent = wood;
  hutchLevel += 1;
  updateHutchDetails();
  hutch.classList.add('hutch-upgraded');
  if (hutchLevel === 5) {
    rebirthButton.hidden = false;
    say('Level 5 reached! Rebirth is ready.');
  } else say(`Hutch upgraded to level ${hutchLevel}!`);
}

hutch.addEventListener('click', (event) => {
  event.stopPropagation();
  upgradeHutch();
});

hutch.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  upgradeHutch();
});

bunny.addEventListener('click', (event) => {
  event.stopPropagation();
  if (fruit < 1) { bunnyClicks = 0; clearTimeout(bunnyClickTimer); say('Collect fruit first!'); return; }
  bunnyClicks += 1;
  if (bunnyClicks === 1) {
    say('Click the bunny once more to feed it.');
    clearTimeout(bunnyClickTimer);
    bunnyClickTimer = setTimeout(() => { bunnyClicks = 0; }, 900);
    return;
  }
  clearTimeout(bunnyClickTimer);
  fruit -= 1; fruitCount.textContent = fruit; bunnyClicks = 0;
  bunny.classList.add('bunny-happy'); say('The bunny is happy!');
  setTimeout(() => bunny.classList.remove('bunny-happy'), 450);
  fruitFedSinceRebirth += 1;
  feedProgress.textContent = fruitFedSinceRebirth;
  if (fruitFedSinceRebirth % 10 === 0 && fruitFedSinceRebirth <= 40) {
    const color = bunnyColors[(fruitFedSinceRebirth / 10) - 1];
    bunny.classList.remove(...bunnyColors);
    bunny.classList.add(color);
    say(`Your bunny evolved after ${fruitFedSinceRebirth} fruit!`);
  }
});

rebirthButton.addEventListener('click', () => {
  rebirths += 1;
  hutchLevel = 1;
  wood = 0;
  fruit = 0;
  fruitFedSinceRebirth = 0;
  bunnyClicks = 0;
  clearTimeout(bunnyClickTimer);
  woodCount.textContent = wood;
  fruitCount.textContent = fruit;
  feedProgress.textContent = 0;
  updateHutchDetails();
  hutch.classList.remove('hutch-upgraded');
  bunny.classList.remove(...bunnyColors);
  caretaker.style.left = '23%';
  caretaker.style.top = '53%';
  rebirthButton.hidden = true;
  say('Rebirth complete! Fruit now gives 2 each.');
});

setInterval(spawnFruit, 3000);
setInterval(() => {
  bunny.style.left = `${42 + Math.random() * 68}px`;
  bunny.style.top = `${55 + Math.random() * 34}px`;
}, 1800);
