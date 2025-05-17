// Cookie List Page

// Store all cookies
let allCookies = [];
let currentUrl = '';

// Location tracking keywords
const LOCATION_KEYWORDS = /geo|loc|gps|position|latitude|longitude/i;

// Load cookies from the current tab
async function loadCookies() {
  try {
    // Get the active tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = currentTab.url;
    
    // Get all cookies
    allCookies = await chrome.cookies.getAll({});
    
    // Populate domain filter
    populateDomainFilter(allCookies);
    
    // Display cookies
    displayCookies(allCookies, currentUrl);
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Error loading cookies:', error);
    document.getElementById('cookieList').innerHTML = `<li>Error: ${error.message}</li>`;
  }
}

// Populate domain filter dropdown
function populateDomainFilter(cookies) {
  const domainFilter = document.getElementById('domainFilter');
  const domains = new Set();
  
  cookies.forEach(cookie => {
    domains.add(cookie.domain);
  });
  
  // Sort domains alphabetically
  const sortedDomains = Array.from(domains).sort();
  
  // Add domains to dropdown
  sortedDomains.forEach(domain => {
    const option = document.createElement('option');
    option.value = domain;
    option.textContent = domain;
    domainFilter.appendChild(option);
  });
}

// Display cookies in list
function displayCookies(cookies, currentUrl) {
  const cookieList = document.getElementById('cookieList');
  const currentDomain = new URL(currentUrl).hostname;
  
  if (cookies.length === 0) {
    cookieList.innerHTML = '<li>No cookies found</li>';
    return;
  }
  
  let html = '';
  
  cookies.forEach(cookie => {
    const cookieDomain = cookie.domain.replace(/^\./, '');
    const isFirstParty = currentDomain.includes(cookieDomain);
    const isLocation = LOCATION_KEYWORDS.test(cookie.name) || 
                      LOCATION_KEYWORDS.test(cookie.value) || 
                      LOCATION_KEYWORDS.test(cookie.domain) || 
                      LOCATION_KEYWORDS.test(cookie.path);
    const isSession = !cookie.expirationDate;
    
    const expires = cookie.expirationDate 
      ? new Date(cookie.expirationDate * 1000).toLocaleString() 
      : 'Session';
    
    // Add data attributes for filtering
    const categories = `${isFirstParty ? 'firstParty' : 'thirdParty'} 
                      ${cookie.secure ? 'secure' : ''} 
                      ${cookie.httpOnly ? 'httpOnly' : ''} 
                      ${cookie.sameSite && cookie.sameSite !== 'no_restriction' ? 'sameSite' : ''} 
                      ${isSession ? 'session' : 'persistent'} 
                      ${isLocation ? 'location' : ''}`;
    
    html += `
      <li data-name="${cookie.name.toLowerCase()}" 
          data-domain="${cookie.domain.toLowerCase()}" 
          data-categories="${categories}">
        <div class="cookie-item">
          <div class="cookie-name">${cookie.domain}</div>
          <div class="cookie-meta">
            <span>Name: ${cookie.name}</span> | 
            <span>Path: ${cookie.path}</span>
            ${cookie.expirationDate ? ` | <span>Expires: ${expires}</span>` : ''}
          </div>
          <div class="cookie-value">${escapeHtml(cookie.value)}</div>
          <div class="cookie-tags">
            <span class="tag ${isFirstParty ? 'first-party' : 'third-party'}">${isFirstParty ? '1st Party' : '3rd Party'}</span>
            ${cookie.secure ? '<span class="tag secure">Secure</span>' : ''}
            ${cookie.httpOnly ? '<span class="tag http-only">HttpOnly</span>' : ''}
            ${isSession ? '<span class="tag session">Session</span>' : '<span class="tag persistent">Persistent</span>'}
            ${isLocation ? '<span class="tag location">Location</span>' : ''}
            ${cookie.sameSite && cookie.sameSite !== 'no_restriction' ? `<span class="tag same-site">SameSite</span>` : ''}
          </div>
        </div>
      </li>
    `;
  });
  
  cookieList.innerHTML = html;
}

// Set up event listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', filterCookies);
  
  // Category filter
  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.addEventListener('change', filterCookies);
  
  // Domain filter
  const domainFilter = document.getElementById('domainFilter');
  domainFilter.addEventListener('change', filterCookies);
}

// Filter cookies based on search and filters
function filterCookies() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const domainFilter = document.getElementById('domainFilter').value;
  
  const cookieItems = document.querySelectorAll('#cookieList li');
  let visibleCount = 0;
  
  cookieItems.forEach(item => {
    const name = item.getAttribute('data-name');
    const domain = item.getAttribute('data-domain');
    const categories = item.getAttribute('data-categories');
    
    // Check if matches search term
    const matchesSearch = searchTerm === '' || 
                         name.includes(searchTerm) || 
                         domain.includes(searchTerm);
    
    // Check if matches category filter
    const matchesCategory = categoryFilter === 'all' || categories.includes(categoryFilter);
    
    // Check if matches domain filter
    const matchesDomain = domainFilter === 'all' || domain === domainFilter.toLowerCase();
    
    // Show/hide based on all conditions
    if (matchesSearch && matchesCategory && matchesDomain) {
      item.style.display = '';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  // Show no results message if needed
  if (visibleCount === 0) {
    document.getElementById('cookieList').innerHTML += '<li class="no-results">No matching cookies found</li>';
  }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', loadCookies);
