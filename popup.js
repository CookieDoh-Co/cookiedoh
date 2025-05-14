let allCookies = [];

function groupCookiesByDomain(cookies) {
  const grouped = {};
  for (const c of cookies) {
    if (!grouped[c.domain]) grouped[c.domain] = [];
    grouped[c.domain].push(c);
  }
  return grouped;
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


function renderCookies(cookies) {
  const grouped = groupCookiesByDomain(cookies);

  const display = Object.entries(grouped).map(([domain, items]) => {
    const details = items.map(c => `  ${c.name} = ${c.value}`).join('\n');
    return `${domain}\n${details}`;
  }).join('\n\n');

  document.getElementById('cookieList').textContent = display || 'No cookies found.';
}

async function loadCookies() {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  allCookies = await chrome.cookies.getAll({});
  renderCookies(allCookies);
  countFirstAndThirdPartyCookies(allCookies, currentTab.url);
}

document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allCookies.filter(c => c.domain.toLowerCase().includes(query));
  renderCookies(filtered);
});

loadCookies();
