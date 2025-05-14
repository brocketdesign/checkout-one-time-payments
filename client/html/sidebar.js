document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.getElementById('main-content');
    const navBarWrapper = document.getElementById('navbar-wrapper');
    
    // Mobile elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
    const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
    
    // Function to toggle sidebar minimization
    function toggleSidebar() {
        sidebar.classList.toggle('minimized');
        if (mainContent) { // Check if mainContent exists
            mainContent.classList.toggle('sidebar-minimized');
        }
        if(navBarWrapper) { // Check if navBarWrapper exists
            navBarWrapper.classList.toggle('sidebar-minimized');
        }
        // Change toggle button icon based on sidebar state
        const toggleIcon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('minimized')) {
            toggleIcon.classList.remove('bi-list');
            toggleIcon.classList.add('bi-chevron-right');
            localStorage.setItem('sidebarMinimized', 'true');
        } else {
            toggleIcon.classList.remove('bi-chevron-right');
            toggleIcon.classList.add('bi-list');
            localStorage.setItem('sidebarMinimized', 'false');
        }
    }

    // Event listener for the toggle button
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Optional: Check localStorage for saved preference on page load
    if (localStorage.getItem('sidebarMinimized') === 'true') {
        sidebar.classList.add('minimized');
        if (mainContent) { // Check if mainContent exists
            mainContent.classList.add('sidebar-minimized');
        }
        if(navBarWrapper) { // Check if navBarWrapper exists
            navBarWrapper.classList.add('sidebar-minimized');
        }
        
        // Update toggle button icon
        const toggleIcon = sidebarToggle.querySelector('i');
        if (toggleIcon) {
            toggleIcon.classList.remove('bi-list');
            toggleIcon.classList.add('bi-chevron-right');
        }
    }

    // Mobile sidebar toggle functionality
    if (mobileMenuToggle && mobileSidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileSidebar.style.display = 'block';
            if (mobileSidebarOverlay) {
                mobileSidebarOverlay.style.display = 'block';
                mobileSidebarOverlay.style.opacity = '1';
            }
            setTimeout(() => {
                mobileSidebar.style.top = '0';
            }, 10);
        });
        
        // Function to close mobile sidebar
        const closeMobileSidebar = function() {
            mobileSidebar.style.top = '-100%';
            if (mobileSidebarOverlay) {
                mobileSidebarOverlay.style.opacity = '0';
            }
            setTimeout(() => {
                mobileSidebar.style.display = 'none';
                if (mobileSidebarOverlay) {
                    mobileSidebarOverlay.style.display = 'none';
                }
            }, 300);
        };
        
        // Add close event listeners
        if (mobileSidebarClose) {
            mobileSidebarClose.addEventListener('click', closeMobileSidebar);
        }
        
        if (mobileSidebarOverlay) {
            mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
        }
    }

    // Optional: Add tooltips for icons when sidebar is minimized
    const navLinks = sidebar.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        const icon = link.querySelector('.icon');
        const text = link.querySelector('.text');
        if (icon && text) {
            link.addEventListener('mouseenter', () => {
                if (sidebar.classList.contains('minimized')) {
                    const tooltip = document.createElement('span');
                    tooltip.className = 'icon-tooltip'; // Style this class in CSS
                    tooltip.textContent = text.textContent;
                    link.appendChild(tooltip);
                    // Position tooltip (basic example)
                    const linkRect = link.getBoundingClientRect();
                    tooltip.style.position = 'fixed'; // Use fixed to position relative to viewport
                    tooltip.style.left = `${linkRect.right + 5}px`;
                    tooltip.style.top = `${linkRect.top + (linkRect.height / 2) - (tooltip.offsetHeight / 2)}px`;
                    tooltip.style.backgroundColor = '#333333'; // Dark tooltip
                    tooltip.style.color = '#ffffff';
                    tooltip.style.padding = '5px 10px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '0.9em';
                    tooltip.style.zIndex = '1001'; // Above sidebar
                    tooltip.style.whiteSpace = 'nowrap';
                    tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                }
            });
            link.addEventListener('mouseleave', () => {
                const tooltip = link.querySelector('.icon-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        }
    });
});
