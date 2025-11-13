/**
 * Sidebar Navigation Module
 * Handles desktop and mobile sidebar toggling, state persistence, and accessibility
 */

document.addEventListener('DOMContentLoaded', function () {
    // Desktop sidebar elements
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.getElementById('main-content');
    const navBarWrapper = document.getElementById('navbar-wrapper');
    
    // Mobile sidebar elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
    const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
    
    const SIDEBAR_MINIMIZED_KEY = 'app_sidebar_minimized';
    const TRANSITION_DURATION = 300;
    
    /**
     * Toggle desktop sidebar minimization
     */
    function toggleSidebar() {
        if (!sidebar || !sidebarToggle) return;
        
        const isMinimized = sidebar.classList.toggle('minimized');
        const toggleIcon = sidebarToggle.querySelector('i');
        
        if (toggleIcon) {
            if (isMinimized) {
                toggleIcon.classList.replace('bi-chevron-left', 'bi-chevron-right');
                localStorage.setItem(SIDEBAR_MINIMIZED_KEY, 'true');
            } else {
                toggleIcon.classList.replace('bi-chevron-right', 'bi-chevron-left');
                localStorage.setItem(SIDEBAR_MINIMIZED_KEY, 'false');
            }
        }
        
        // Update main content and navbar
        if (mainContent) mainContent.classList.toggle('sidebar-minimized');
        if (navBarWrapper) navBarWrapper.classList.toggle('sidebar-minimized');
        
        // Update ARIA attribute
        sidebarToggle.setAttribute('aria-expanded', !isMinimized);
    }
    
    /**
     * Set sidebar state from localStorage
     */
    function initSidebarState() {
        if (!sidebar || !sidebarToggle) return;
        
        const wasMinimized = localStorage.getItem(SIDEBAR_MINIMIZED_KEY) === 'true';
        const toggleIcon = sidebarToggle.querySelector('i');
        
        if (wasMinimized) {
            sidebar.classList.add('minimized');
            if (mainContent) mainContent.classList.add('sidebar-minimized');
            if (navBarWrapper) navBarWrapper.classList.add('sidebar-minimized');
            
            if (toggleIcon) {
                toggleIcon.classList.replace('bi-chevron-left', 'bi-chevron-right');
            }
            sidebarToggle.setAttribute('aria-expanded', 'false');
        } else {
            if (toggleIcon) {
                toggleIcon.classList.replace('bi-chevron-right', 'bi-chevron-left');
            }
            sidebarToggle.setAttribute('aria-expanded', 'true');
        }
    }
    
    /**
     * Close mobile sidebar with animation
     */
    function closeMobileSidebar() {
        if (!mobileSidebar || !mobileSidebarOverlay) return;
        
        mobileSidebar.style.top = '-100%';
        mobileSidebarOverlay.style.opacity = '0';
        
        setTimeout(() => {
            mobileSidebar.classList.remove('show');
            mobileSidebarOverlay.classList.remove('show');
            mobileSidebar.style.display = '';
            mobileSidebarOverlay.style.display = '';
        }, TRANSITION_DURATION);
        
        mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    }
    
    /**
     * Open mobile sidebar with animation
     */
    function openMobileSidebar() {
        if (!mobileSidebar || !mobileSidebarOverlay) return;
        
        // Remove inline display styles to allow CSS to control visibility
        mobileSidebar.style.display = '';
        mobileSidebarOverlay.style.display = '';
        
        // Add show class which triggers CSS display: block
        mobileSidebar.classList.add('show');
        mobileSidebarOverlay.classList.add('show');
        
        // Trigger animation
        setTimeout(() => {
            mobileSidebar.style.top = '0';
            mobileSidebarOverlay.style.opacity = '1';
        }, 10);
        
        mobileMenuToggle?.setAttribute('aria-expanded', 'true');
    }
    
    /**
     * Set active navigation link based on current URL
     */
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Remove active class from all links
            link.classList.remove('active');
            
            // Add active class if path matches
            // Exact match or match with proper path segments
            if (href && (href === currentPath || (href !== '/' && currentPath.startsWith(href)))) {
                link.classList.add('active');
            }
        });
    }
    
    // Initialize desktop sidebar
    if (sidebarToggle) {
        initSidebarState();
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Initialize mobile sidebar
    if (mobileMenuToggle && mobileSidebar) {
        mobileMenuToggle.addEventListener('click', openMobileSidebar);
        
        if (mobileSidebarClose) {
            mobileSidebarClose.addEventListener('click', closeMobileSidebar);
        }
        
        if (mobileSidebarOverlay) {
            mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
        }
        
        // Close mobile sidebar when clicking on a link
        const mobileNavLinks = mobileSidebar.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!link.classList.contains('beta-link')) {
                    closeMobileSidebar();
                }
            });
        });
    }
    
    // Set active nav links on page load
    setActiveNavLink();
    
    // Listen for navigation changes
    window.addEventListener('popstate', setActiveNavLink);
});
