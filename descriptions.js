// Handle tab switching
document.addEventListener('DOMContentLoaded', function() {
  // Get all tabs and descriptions
  const tabs = document.querySelectorAll('.tab');
  const descriptions = document.querySelectorAll('.description');
  
  // Check URL parameters for active tab
  const urlParams = new URLSearchParams(window.location.search);
  const activeCategory = urlParams.get('category');
  
  // Function to activate a tab
  function activateTab(tabTarget) {
    // Remove active class from all tabs and descriptions
    tabs.forEach(tab => tab.classList.remove('active'));
    descriptions.forEach(desc => desc.classList.remove('active'));
    
    // Add active class to selected tab and description
    const selectedTab = document.querySelector(`.tab[data-target="${tabTarget}"]`);
    const selectedDesc = document.getElementById(tabTarget);
    
    if (selectedTab && selectedDesc) {
      selectedTab.classList.add('active');
      selectedDesc.classList.add('active');
    }
  }
  
  // Set initial active tab based on URL parameter or default to first tab
  if (activeCategory) {
    activateTab(activeCategory);
  } else {
    activateTab(tabs[0].getAttribute('data-target'));
  }
  
  // Add click event listeners to tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      activateTab(target);
      
      // Update URL without reloading the page
      const url = new URL(window.location);
      url.searchParams.set('category', target);
      window.history.pushState({}, '', url);
    });
  });
});
