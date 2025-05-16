// Cookie Bubbles Visualization

// Store all cookies
let allCookies = [];

// Colors for different cookie types
const COLORS = {
  firstParty: '#4CAF50',
  thirdParty: '#F44336',
  secure: '#FF9800',
  httpOnly: '#9C27B0',
  session: '#607D8B',
  persistent: '#FFC107',
  location: '#2196F3',
  sameSite: '#00BCD4'
};

// Cookie categories
const CATEGORIES = [
  { key: 'firstParty', label: '1st Party', color: '#4CAF50' },
  { key: 'thirdParty', label: '3rd Party', color: '#F44336' },
  { key: 'location', label: 'Location', color: '#2196F3' },
  { key: 'secure', label: 'Secure', color: '#FF9800' },
  { key: 'httpOnly', label: 'HttpOnly', color: '#9C27B0' },
  { key: 'sameSite', label: 'SameSite', color: '#00BCD4' },
  { key: 'session', label: 'Session', color: '#607D8B' },
  { key: 'persistent', label: 'Persistent', color: '#FFC107' }
];

// Location tracking keywords
const LOCATION_KEYWORDS = /geo|loc|gps|position|latitude|longitude/i;

// Load cookies from the current tab
async function loadCookies() {
  try {
    // Get the active tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get all cookies
    allCookies = await chrome.cookies.getAll({});
    
    // Update stats
    updateStats(allCookies, currentTab.url);
    
    // Create bubble visualization
    createCategoryBubbles(allCookies, currentTab.url);
  } catch (error) {
    console.error('Error loading cookies:', error);
    document.getElementById('cookieDetails').innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// Update cookie statistics
function updateStats(cookies, currentUrl) {
  const counts = getCategoryCounts(cookies, currentUrl);
  
  // Update stats display
  document.getElementById('totalCookies').textContent = cookies.length;
  document.getElementById('firstPartyCookies').textContent = counts.firstParty;
  document.getElementById('thirdPartyCookies').textContent = counts.thirdParty;
}

// Get counts for each cookie category
function getCategoryCounts(cookies, currentUrl) {
  const currentDomain = new URL(currentUrl).hostname;
  let firstParty = 0, thirdParty = 0, location = 0, secure = 0, httpOnly = 0, sameSite = 0, session = 0, persistent = 0;
  
  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./, '');
    if (currentDomain.includes(cookieDomain)) {
      firstParty++;
    } else {
      thirdParty++;
    }
    
    if (LOCATION_KEYWORDS.test(cookie.name) || 
        LOCATION_KEYWORDS.test(cookie.value) || 
        LOCATION_KEYWORDS.test(cookie.domain) || 
        LOCATION_KEYWORDS.test(cookie.path)) {
      location++;
    }
    
    if (cookie.secure) secure++;
    if (cookie.httpOnly) httpOnly++;
    if (cookie.sameSite && cookie.sameSite !== 'no_restriction') sameSite++;
    if (!cookie.expirationDate) {
      session++;
    } else {
      persistent++;
    }
  }
  
  return { firstParty, thirdParty, location, secure, httpOnly, sameSite, session, persistent };
}

// Group cookies by category
function groupCookiesByCategory(cookies, currentUrl) {
  const currentDomain = new URL(currentUrl).hostname;
  const grouped = {};
  
  // Initialize all categories
  CATEGORIES.forEach(category => {
    grouped[category.key] = [];
  });
  
  // Group cookies into categories
  for (const cookie of cookies) {
    const cookieDomain = cookie.domain.replace(/^\./, '');
    const isFirstParty = currentDomain.includes(cookieDomain);
    
    if (isFirstParty) {
      grouped.firstParty.push(cookie);
    } else {
      grouped.thirdParty.push(cookie);
    }
    
    if (LOCATION_KEYWORDS.test(cookie.name) || 
        LOCATION_KEYWORDS.test(cookie.value) || 
        LOCATION_KEYWORDS.test(cookie.domain) || 
        LOCATION_KEYWORDS.test(cookie.path)) {
      grouped.location.push(cookie);
    }
    
    if (cookie.secure) grouped.secure.push(cookie);
    if (cookie.httpOnly) grouped.httpOnly.push(cookie);
    if (cookie.sameSite && cookie.sameSite !== 'no_restriction') grouped.sameSite.push(cookie);
    
    if (!cookie.expirationDate) {
      grouped.session.push(cookie);
    } else {
      grouped.persistent.push(cookie);
    }
  }
  
  return grouped;
}

// Create bubble visualization based on categories
function createCategoryBubbles(cookies, currentUrl) {
  const container = document.getElementById('bubbleContainer');
  container.innerHTML = '';
  
  if (cookies.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px;">No cookies found for this page.</p>';
    return;
  }
  
  // Group cookies by category
  const groupedCookies = groupCookiesByCategory(cookies, currentUrl);
  
  // Create bubbles for each category
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // Calculate bubble sizes based on number of cookies
  const maxCookies = Math.max(...Object.values(groupedCookies).map(arr => arr.length), 1);
  const minSize = 50;
  const maxSize = 150;
  
  // Create bubbles with physics simulation
  const bubbles = [];
  
  CATEGORIES.forEach(category => {
    const categoryCookies = groupedCookies[category.key];
    
    // Skip categories with no cookies
    if (categoryCookies.length === 0) return;
    
    const size = minSize + ((maxSize - minSize) * (categoryCookies.length / maxCookies));
    
    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.backgroundColor = category.color;
    
    // Position randomly initially
    const x = Math.random() * (containerWidth - size);
    const y = Math.random() * (containerHeight - size);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    
    // Add category name and cookie count
    const label = document.createElement('div');
    label.className = 'bubble-label';
    label.textContent = `${category.label}\n(${categoryCookies.length})`;
    bubble.appendChild(label);
    
    // Store bubble data for physics
    bubbles.push({
      element: bubble,
      x, y,
      vx: 0, vy: 0,
      radius: size / 2,
      category: category.key,
      cookies: categoryCookies
    });
    
    // Add click event to navigate to descriptions page
    bubble.addEventListener('click', () => {
      window.location.href = `descriptions.html?category=${category.key}`;
    });
    
    container.appendChild(bubble);
  });
  
  // Simple physics simulation for bubble positioning
  simulateBubblePhysics(bubbles);
}

// Simple physics simulation for bubbles
function simulateBubblePhysics(bubbles) {
  const container = document.getElementById('bubbleContainer');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Run simulation steps
  let iterations = 0;
  const maxIterations = 100;
  
  function simulate() {
    // Apply forces
    for (let i = 0; i < bubbles.length; i++) {
      const b1 = bubbles[i];
      
      // Center gravity
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = centerX - b1.x;
      const dy = centerY - b1.y;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      
      // Weak attraction to center
      b1.vx += (dx / distToCenter) * 0.1;
      b1.vy += (dy / distToCenter) * 0.1;
      
      // Collision with other bubbles
      for (let j = i + 1; j < bubbles.length; j++) {
        const b2 = bubbles[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;
        
        // If bubbles overlap, push them apart
        if (distance < minDist) {
          const angle = Math.atan2(dy, dx);
          const force = (minDist - distance) * 0.05;
          
          // Apply forces in opposite directions
          b1.vx -= Math.cos(angle) * force;
          b1.vy -= Math.sin(angle) * force;
          b2.vx += Math.cos(angle) * force;
          b2.vy += Math.sin(angle) * force;
        }
      }
      
      // Apply velocity with damping
      b1.vx *= 0.9;
      b1.vy *= 0.9;
      b1.x += b1.vx;
      b1.y += b1.vy;
      
      // Contain within boundaries
      if (b1.x - b1.radius < 0) {
        b1.x = b1.radius;
        b1.vx *= -0.5;
      } else if (b1.x + b1.radius > width) {
        b1.x = width - b1.radius;
        b1.vx *= -0.5;
      }
      
      if (b1.y - b1.radius < 0) {
        b1.y = b1.radius;
        b1.vy *= -0.5;
      } else if (b1.y + b1.radius > height) {
        b1.y = height - b1.radius;
        b1.vy *= -0.5;
      }
      
      // Update element position
      b1.element.style.left = `${b1.x - b1.radius}px`;
      b1.element.style.top = `${b1.y - b1.radius}px`;
    }
    
    iterations++;
    if (iterations < maxIterations) {
      requestAnimationFrame(simulate);
    }
  }
  
  // Start simulation
  simulate();
}

// Show cookie details for a specific category when its bubble is clicked
function showCategoryDetails(categoryKey, cookies, currentUrl) {
  const detailsContainer = document.getElementById('cookieDetails');
  const currentDomain = new URL(currentUrl).hostname;
  
  // Find the category label
  const category = CATEGORIES.find(cat => cat.key === categoryKey);
  const categoryLabel = category ? category.label : categoryKey;
  
  let html = `<h3>${categoryLabel} Cookies (${cookies.length})</h3>`;
  
  if (cookies.length === 0) {
    html += '<p>No cookies in this category.</p>';
    detailsContainer.innerHTML = html;
    return;
  }
  
  // Group cookies by domain for better organization
  const cookiesByDomain = {};
  cookies.forEach(cookie => {
    const domain = cookie.domain;
    if (!cookiesByDomain[domain]) {
      cookiesByDomain[domain] = [];
    }
    cookiesByDomain[domain].push(cookie);
  });
  
  // Display cookies grouped by domain
  Object.entries(cookiesByDomain).forEach(([domain, domainCookies]) => {
    html += `<div class="domain-group"><h4>${domain} (${domainCookies.length})</h4>`;
    
    domainCookies.forEach(cookie => {
      const cookieDomain = cookie.domain.replace(/^\./, '');
      const isFirstParty = currentDomain.includes(cookieDomain);
      const isLocation = LOCATION_KEYWORDS.test(cookie.name) || 
                         LOCATION_KEYWORDS.test(cookie.value) || 
                         LOCATION_KEYWORDS.test(cookie.domain) || 
                         LOCATION_KEYWORDS.test(cookie.path);
      const isSession = !cookie.expirationDate;
      
      html += `
        <div class="cookie-item">
          <div class="cookie-name">${cookie.name}</div>
          <div class="cookie-value">${cookie.value}</div>
          <div class="cookie-meta">
            <span>Path: ${cookie.path}</span>
            ${cookie.expirationDate ? ` | <span>Expires: ${new Date(cookie.expirationDate * 1000).toLocaleString()}</span>` : ''}
          </div>
          <div class="cookie-tags">
            <span class="tag ${isFirstParty ? 'first-party' : 'third-party'}">${isFirstParty ? '1st Party' : '3rd Party'}</span>
            ${cookie.secure ? '<span class="tag secure">Secure</span>' : ''}
            ${cookie.httpOnly ? '<span class="tag http-only">HttpOnly</span>' : ''}
            ${isSession ? '<span class="tag session">Session</span>' : '<span class="tag persistent">Persistent</span>'}
            ${isLocation ? '<span class="tag location">Location</span>' : ''}
            ${cookie.sameSite && cookie.sameSite !== 'no_restriction' ? `<span class="tag same-site">SameSite: ${cookie.sameSite}</span>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  detailsContainer.innerHTML = html;
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', loadCookies);
