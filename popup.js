let allCookies = [];

function groupCookiesByDomain(cookies) {
  const grouped = {};
  for (const c of cookies) {
    if (!grouped[c.domain]) grouped[c.domain] = [];
    grouped[c.domain].push(c);
  }
  return grouped;
}

function countCookieAttributes(cookies, currentUrl) {
  const currentDomain = new URL(currentUrl).hostname;
  let firstPartyCookies = 0;
  let thirdPartyCookies = 0;
  let locationTrackingCookies = 0;
  let secureCookies = 0;
  let httpOnlyCookies = 0;
  let sameSiteCookies = 0;
  let sessionCookies = 0;
  let persistentCookies = 0;

  const locationKeywords = /geo|loc|gps|position|latitude|longitude/i;

  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./,'');
    if (currentDomain.includes(cookieDomain)) {
      firstPartyCookies++;
    } else {
      thirdPartyCookies++;
    }
    if (locationKeywords.test(cookie.name) || locationKeywords.test(cookie.value) || locationKeywords.test(cookie.domain) || locationKeywords.test(cookie.path)) {
      locationTrackingCookies++;
    }
    if (cookie.secure) secureCookies++;
    if (cookie.httpOnly) httpOnlyCookies++;
    if (cookie.sameSite && cookie.sameSite !== 'no_restriction') sameSiteCookies++;
    if (!cookie.expirationDate) {
      sessionCookies++;
    } else {
      persistentCookies++;
    }
  }

  document.getElementById('firstPartyCookieCount').textContent = firstPartyCookies;
  document.getElementById('thirdPartyCookieCount').textContent = thirdPartyCookies;
  document.getElementById('locationTrackingCookieCount').textContent = locationTrackingCookies;
  document.getElementById('secureCookieCount').textContent = secureCookies;
  document.getElementById('httpOnlyCookieCount').textContent = httpOnlyCookies;
  document.getElementById('sameSiteCookieCount').textContent = sameSiteCookies;
  document.getElementById('sessionCookieCount').textContent = sessionCookies;
  document.getElementById('persistentCookieCount').textContent = persistentCookies;
}

function countFirstAndThirdPartyCookies(cookies, currentUrl) {
  const currentDomain = new URL(currentUrl).hostname;
  let firstPartyCookies = 0;
  let thirdPartyCookies = 0;

  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./,'');
    if (currentDomain.includes(cookieDomain)) {
      firstPartyCookies++;
    } else {
      thirdPartyCookies++;
    }
  }

  document.getElementById('firstPartyCookieCount').textContent = firstPartyCookies;
  document.getElementById('thirdPartyCookieCount').textContent = thirdPartyCookies;
}

function renderCookies(cookies, currentUrl) {
  const grouped = groupCookiesByDomain(cookies);
  const currentDomain = new URL(currentUrl).hostname;
  const locationKeywords = /geo|loc|gps|position|latitude|longitude/i;

  const display = Object.entries(grouped).map(([domain, items]) => {
    const details = items.map(c => {
      const isFirstParty = currentDomain.includes(c.domain.replace(/^\./, ''));
      const isLocation = locationKeywords.test(c.name) || locationKeywords.test(c.value) || locationKeywords.test(c.domain) || locationKeywords.test(c.path);
      const isSession = !c.expirationDate;
      return `  ${c.name} = ${c.value}\n    - ${isFirstParty ? '1st' : '3rd'} party\n    - ${isLocation ? 'Location tracking' : ''}${c.secure ? '\n    - Secure' : ''}${c.httpOnly ? '\n    - HttpOnly' : ''}${c.sameSite && c.sameSite !== 'no_restriction' ? `\n    - SameSite: ${c.sameSite}` : ''}\n    - ${isSession ? 'Session' : 'Persistent'}\n  `;
    }).join('\n');
    return `${domain}\n${details}`;
  }).join('\n\n');

  document.getElementById('cookieList').textContent = display || 'No cookies found.';
}

async function loadCookies() {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  allCookies = await chrome.cookies.getAll({});
  renderCookies(allCookies, currentTab.url);
  countCookieAttributes(allCookies, currentTab.url);
  // Bubble map on initial load
  const counts = getCategoryCounts(allCookies, currentTab.url);
  renderBubbleMap(counts);
}

function getActiveFilters() {
  return {
    firstParty: document.getElementById('filter1stParty').checked,
    thirdParty: document.getElementById('filter3rdParty').checked,
    location: document.getElementById('filterLocation').checked,
    secure: document.getElementById('filterSecure').checked,
    httpOnly: document.getElementById('filterHttpOnly').checked,
    sameSite: document.getElementById('filterSameSite').checked,
    session: document.getElementById('filterSession').checked,
    persistent: document.getElementById('filterPersistent').checked,
  };
}

function filterCookies(cookies, query, currentUrl, filters) {
  const currentDomain = new URL(currentUrl).hostname;
  const locationKeywords = /geo|loc|gps|position|latitude|longitude/i;
  return cookies.filter(c => {
    const isFirstParty = currentDomain.includes(c.domain.replace(/^\./, ''));
    const isThirdParty = !isFirstParty;
    const isLocation = locationKeywords.test(c.name) || locationKeywords.test(c.value) || locationKeywords.test(c.domain) || locationKeywords.test(c.path);
    const isSession = !c.expirationDate;
    const isPersistent = !!c.expirationDate;
    const matchesQuery = c.domain.toLowerCase().includes(query) || c.name.toLowerCase().includes(query);
    return matchesQuery &&
      ((filters.firstParty && isFirstParty) || (filters.thirdParty && isThirdParty)) &&
      (!filters.location || isLocation || !filters.location) &&
      (!filters.secure || c.secure) &&
      (!filters.httpOnly || c.httpOnly) &&
      (!filters.sameSite || (c.sameSite && c.sameSite !== 'no_restriction')) &&
      (!filters.session || isSession) &&
      (!filters.persistent || isPersistent);
  });
}

function renderBubbleMap(counts) {
  const svg = document.getElementById('bubbleMap');
  svg.innerHTML = '';
  const categories = [
    { key: 'firstParty', label: '1st Party', color: '#4CAF50', count: counts.firstParty },
    { key: 'thirdParty', label: '3rd Party', color: '#F44336', count: counts.thirdParty },
    { key: 'location', label: 'Location', color: '#2196F3', count: counts.location },
    { key: 'secure', label: 'Secure', color: '#FF9800', count: counts.secure },
    { key: 'httpOnly', label: 'HttpOnly', color: '#9C27B0', count: counts.httpOnly },
    { key: 'sameSite', label: 'SameSite', color: '#00BCD4', count: counts.sameSite },
    { key: 'session', label: 'Session', color: '#607D8B', count: counts.session },
    { key: 'persistent', label: 'Persistent', color: '#FFC107', count: counts.persistent },
  ];
  // Only show bubbles with count > 0
  const bubbles = categories.filter(c => c.count > 0);
  // Calculate radii (min 20, max 60)
  const maxCount = Math.max(...bubbles.map(b=>b.count), 1);
  bubbles.forEach(b => {
    b.radius = 20 + 40 * (b.count / maxCount);
  });
  // Simple greedy circle packing: place first at center, then each next to previous
  let x = 30, y = 70, spacing = 10;
  bubbles.forEach((b, i) => {
    if (i > 0) x += bubbles[i-1].radius + b.radius + spacing;
    b.cx = x;
    b.cy = y;
  });
  // If too wide, scale down
  let totalWidth = bubbles.length > 0 ? (bubbles[bubbles.length-1].cx + bubbles[bubbles.length-1].radius) : 0;
  let scale = totalWidth > 400 ? 400 / totalWidth : 1;
  // Draw
  bubbles.forEach(b => {
    svg.innerHTML += `<circle cx="${b.cx*scale}" cy="${b.cy}" r="${b.radius*scale}" fill="${b.color}"/>
      <text x="${b.cx*scale}" y="${b.cy}" text-anchor="middle" dy=".3em" font-size="${Math.max(12, b.radius*scale/2.5)}" fill="#fff">${b.count}</text>
      <text x="${b.cx*scale}" y="${b.cy + b.radius*scale + 14}" text-anchor="middle" font-size="11" fill="#333">${b.label}</text>`;
  });
}



function getCategoryCounts(cookies, currentUrl) {
  const currentDomain = new URL(currentUrl).hostname;
  let firstParty = 0, thirdParty = 0, location = 0, secure = 0, httpOnly = 0, sameSite = 0, session = 0, persistent = 0;
  const locationKeywords = /geo|loc|gps|position|latitude|longitude/i;
  for (const c of cookies) {
    const isFirstParty = currentDomain.includes(c.domain.replace(/^\./, ''));
    if (isFirstParty) firstParty++; else thirdParty++;
    if (locationKeywords.test(c.name) || locationKeywords.test(c.value) || locationKeywords.test(c.domain) || locationKeywords.test(c.path)) location++;
    if (c.secure) secure++;
    if (c.httpOnly) httpOnly++;
    if (c.sameSite && c.sameSite !== 'no_restriction') sameSite++;
    if (!c.expirationDate) session++; else persistent++;
  }
  return { firstParty, thirdParty, location, secure, httpOnly, sameSite, session, persistent };
}

async function updateDisplay() {
  const query = document.getElementById('search').value.toLowerCase();
  const filters = getActiveFilters();
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const filtered = filterCookies(allCookies, query, currentTab.url, filters);
  renderCookies(filtered, currentTab.url);
  countCookieAttributes(filtered, currentTab.url);
  // Bubble map
  const counts = getCategoryCounts(filtered, currentTab.url);
  renderBubbleMap(counts);
}

document.getElementById('search').addEventListener('input', updateDisplay);

document.querySelectorAll('#cookieFilters input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', updateDisplay);
});

loadCookies();
