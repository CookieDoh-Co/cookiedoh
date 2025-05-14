let allCookies = [];

function groupCookiesByDomain(cookies) {
  const grouped = {};
  for (const c of cookies) {
    if (!grouped[c.domain]) grouped[c.domain] = [];
    grouped[c.domain].push(c);
  }
  return grouped;
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
  allCookies = await chrome.cookies.getAll({});
  renderCookies(allCookies);
}

document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allCookies.filter(c => c.domain.toLowerCase().includes(query));
  renderCookies(filtered);
});

loadCookies();
