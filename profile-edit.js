// Profile Edit Functionality

// Show login prompt in profile modal when not logged in
function showLoginInProfile() {
    let modal = document.getElementById('profileModal');
    if (!modal) {
        return;
    }
    
    const modalContent = modal.querySelector('.modal-content');
    const modalForm = modal.querySelector('.modal-form');
    
    // Get or create view container
    let viewContainer = document.getElementById('profileViewContainer');
    if (!viewContainer && modalContent) {
        viewContainer = document.createElement('div');
        viewContainer.id = 'profileViewContainer';
        viewContainer.className = 'profile-view-container';
        viewContainer.style.cssText = 'padding: 3rem !important; text-align: center !important;';
        
        if (modalForm) {
            modalContent.insertBefore(viewContainer, modalForm);
        } else {
            modalContent.appendChild(viewContainer);
        }
    }
    
    if (viewContainer) {
        viewContainer.innerHTML = `
            <div style="text-align: center !important; margin-bottom: 2rem !important;">
                <div style="width: 120px !important; height: 120px !important; margin: 0 auto 2rem !important; border-radius: 50% !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%) !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 8px 24px rgba(47, 167, 110, 0.2) !important; border: 3px solid rgba(47, 167, 110, 0.2) !important;">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 60px !important; height: 60px !important; color: #2FA76E !important;">
                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3 style="margin: 0 0 1rem 0 !important; font-size: 2rem !important; font-weight: 800 !important; color: var(--text-primary) !important; background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important;">Please Log In</h3>
                <p style="margin: 0 0 2.5rem 0 !important; color: var(--text-secondary) !important; font-size: 1.125rem !important; line-height: 1.6 !important;">You need to be logged in to view your profile details</p>
                <a href="login.html" style="display: inline-flex !important; align-items: center !important; gap: 0.75rem !important; padding: 1rem 2.5rem !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; color: white !important; border: none !important; border-radius: 12px !important; font-weight: 700 !important; font-size: 1.125rem !important; cursor: pointer !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 6px 20px rgba(47, 167, 110, 0.35) !important; text-decoration: none !important;">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 22px !important; height: 22px !important; stroke: currentColor !important; stroke-width: 2 !important;">
                        <path d="M16 7L21 12L16 17M21 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Log In</span>
                </a>
            </div>
        `;
    }
    
    // Hide form, show view
    if (modalForm) {
        modalForm.style.display = 'none';
    }
    if (viewContainer) {
        viewContainer.style.display = 'block';
    }
    
    // Update header title
    const modalHeader = modal.querySelector('.modal-header');
    if (modalHeader) {
        const headerTitle = modalHeader.querySelector('h2');
        if (headerTitle) {
            headerTitle.textContent = 'Profile Details';
        }
    }
    
    // Show modal
    modal.style.cssText = 'display: flex !important; position: fixed !important; z-index: 2000 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.6) !important; overflow: auto !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;';
    modal.setAttribute('data-modal-open', 'true');
    
    if (modalContent) {
        modalContent.style.cssText = 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%) !important; margin: 2rem auto !important; padding: 0 !important; border-radius: 1.25rem !important; width: 90% !important; max-width: 600px !important; max-height: 90vh !important; overflow-y: auto !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(47, 167, 110, 0.1) !important; border: 1px solid rgba(47, 167, 110, 0.15) !important; position: relative !important;';
    }
}

// Open profile in view mode (read-only)
async function openProfileView() {
    // Close any existing modals first to prevent duplicates
    closeProfileModal();
    
    const user = getCurrentUser();
    if (!user) {
        // Show login prompt in profile modal when not logged in
        showLoginInProfile();
        return;
    }
    
    // Get full user data from database
    let userData = user;
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.USER_PROFILE);
        if (response.success && response.user) {
            userData = response.user;
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to localStorage user data
    }
    
    // Find or create modal - ensure only one exists
    let modal = document.getElementById('profileModal');
    if (!modal) {
        return;
    }
    
    // Remove any duplicate modals
    const allModals = document.querySelectorAll('#profileModal');
    if (allModals.length > 1) {
        for (let i = 1; i < allModals.length; i++) {
            allModals[i].remove();
        }
    }
    
    // Get or create view container
    let viewContainer = document.getElementById('profileViewContainer');
    const modalContent = modal.querySelector('.modal-content');
    const modalForm = modal.querySelector('.modal-form');
    
    if (!viewContainer && modalContent) {
        // Create view container
        viewContainer = document.createElement('div');
        viewContainer.id = 'profileViewContainer';
        viewContainer.className = 'profile-view-container';
        viewContainer.style.cssText = 'padding: 2rem !important;';
        
        // Insert before the form
        if (modalForm) {
            modalContent.insertBefore(viewContainer, modalForm);
        } else {
            modalContent.appendChild(viewContainer);
        }
    }
    
    // Load locations for when user switches to edit mode
    await loadLocationsForProfile();
    
    // Populate view container with user data
    if (viewContainer) {
        const name = userData.name || user.name || 'Not set';
        const email = userData.email || 'Not set';
        const phone = userData.phone || 'Not set';
        const location = userData.location || 'Not set';
        const idNumber = userData.idNumber || user.idNumber || 'Not assigned';
        const username = user.username || 'username';
        const role = user.role === 'admin' ? 'Administrator' : 'Factory Operator';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
        
        viewContainer.innerHTML = `
            <div style="text-align: center !important; margin-bottom: 3rem !important; padding: 2.5rem 2rem 2.5rem 2rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.03) 100%) !important; border-radius: 1.5rem !important; border: 2px solid rgba(47, 167, 110, 0.15) !important; box-shadow: 0 8px 32px rgba(47, 167, 110, 0.12) !important; position: relative !important; overflow: hidden !important;">
                <div style="position: absolute !important; top: -50px !important; right: -50px !important; width: 200px !important; height: 200px !important; background: radial-gradient(circle, rgba(47, 167, 110, 0.1) 0%, transparent 70%) !important; border-radius: 50% !important; pointer-events: none !important;"></div>
                <div style="position: absolute !important; bottom: -30px !important; left: -30px !important; width: 150px !important; height: 150px !important; background: radial-gradient(circle, rgba(78, 205, 196, 0.08) 0%, transparent 70%) !important; border-radius: 50% !important; pointer-events: none !important;"></div>
                <div style="width: 120px !important; height: 120px !important; margin: 0 auto 1.75rem !important; border-radius: 50% !important; background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%) !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 12px 32px rgba(47, 167, 110, 0.35), inset 0 2px 8px rgba(255, 255, 255, 0.2) !important; font-size: 3rem !important; font-weight: 700 !important; color: white !important; text-transform: uppercase !important; position: relative !important; z-index: 1 !important; border: 4px solid rgba(255, 255, 255, 0.3) !important;">
                    ${initials}
                </div>
                <h3 style="margin: 0 0 0.5rem 0 !important; font-size: 2rem !important; font-weight: 800 !important; color: var(--text-primary) !important; background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important; position: relative !important; z-index: 1 !important; letter-spacing: -0.02em !important;">${name}</h3>
                <p style="margin: 0 0 0.5rem 0 !important; color: var(--text-secondary) !important; font-size: 1.125rem !important; font-weight: 500 !important; position: relative !important; z-index: 1 !important;">@${username}</p>
                <span style="display: inline-block !important; margin-top: 0.75rem !important; padding: 0.5rem 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.15) 0%, rgba(78, 205, 196, 0.1) 100%) !important; color: #2FA76E !important; border-radius: 25px !important; font-size: 0.9375rem !important; font-weight: 700 !important; border: 2px solid rgba(47, 167, 110, 0.25) !important; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.15) !important; position: relative !important; z-index: 1 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;">${role}</span>
            </div>
            <div style="display: grid !important; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; gap: 1.5rem !important; margin-bottom: 2rem !important;">
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">Full Name</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">${name}</div>
                </div>
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">Username</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">@${username}</div>
                </div>
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">Email</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">${email}</div>
                </div>
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">Phone</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">${phone}</div>
                </div>
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">Setup Location</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">${location}</div>
                </div>
                <div class="profile-view-item" style="padding: 1.25rem !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important; border-radius: 12px !important; border: 1px solid rgba(47, 167, 110, 0.1) !important; transition: all 0.3s ease !important;">
                    <div style="display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 0.75rem !important;">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px !important; height: 20px !important; color: #2FA76E !important; flex-shrink: 0 !important;">
                            <path d="M10 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V14M14 3H21M21 3L18 6M21 3V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <label style="margin: 0 !important; color: var(--text-secondary) !important; font-weight: 600 !important; font-size: 0.875rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">ID Number</label>
                    </div>
                    <div style="color: var(--text-primary) !important; font-size: 1.125rem !important; font-weight: 600 !important; padding-left: 2rem !important;">${idNumber}</div>
                </div>
            </div>
        `;
    }
    
    // Hide form, show view
    if (modalForm) {
        modalForm.style.display = 'none';
    }
    if (viewContainer) {
        viewContainer.style.display = 'block';
    }
    
    // Update header title
    const modalHeader = modal.querySelector('.modal-header');
    if (modalHeader) {
        const headerTitle = modalHeader.querySelector('h2');
        if (headerTitle) {
            headerTitle.textContent = 'Profile Details';
        }
    }
    
    // Show modal with explicit styles
    modal.style.cssText = 'display: flex !important; position: fixed !important; z-index: 2000 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.6) !important; overflow: auto !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;';
    
    // Force modal to be visible
    modal.setAttribute('data-modal-open', 'true');
    
    // Ensure modal content is properly styled
    if (modalContent) {
        modalContent.style.cssText = 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%) !important; margin: 2rem auto !important; padding: 0 !important; border-radius: 1.25rem !important; width: 90% !important; max-width: 1000px !important; max-height: 90vh !important; overflow-y: auto !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(47, 167, 110, 0.1) !important; border: 1px solid rgba(47, 167, 110, 0.15) !important; position: relative !important;';
        
        // Add gradient top border using a pseudo-element workaround
        let gradientBorder = modalContent.querySelector('.modal-gradient-border');
        if (!gradientBorder) {
            gradientBorder = document.createElement('div');
            gradientBorder.className = 'modal-gradient-border';
            gradientBorder.style.cssText = 'content: "" !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 4px !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; border-radius: 1.25rem 1.25rem 0 0 !important; z-index: 1 !important;';
            modalContent.insertBefore(gradientBorder, modalContent.firstChild);
        }
    }
    
    // Ensure modal header is styled
    if (modalHeader) {
        modalHeader.style.cssText = 'padding: 2rem 2rem 1.5rem !important; border-bottom: 1px solid rgba(47, 167, 110, 0.1) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important;';
        
        // Style the h2 title
        const headerTitle = modalHeader.querySelector('h2');
        if (headerTitle) {
            headerTitle.style.cssText = 'font-size: 1.75rem !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important;';
        }
        
        // Style the close button
        const closeBtn = modalHeader.querySelector('.close');
        if (closeBtn) {
            closeBtn.style.cssText = 'color: var(--text-secondary) !important; font-size: 2rem !important; font-weight: 300 !important; line-height: 1 !important; cursor: pointer !important; transition: all 0.3s ease !important; width: 32px !important; height: 32px !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 50% !important; background: rgba(0, 0, 0, 0.05) !important; flex-shrink: 0 !important;';
        }
    }
    
    // Add Edit button in view mode
    let viewActions = document.getElementById('profileViewActions');
    if (!viewActions && viewContainer) {
        viewActions = document.createElement('div');
        viewActions.id = 'profileViewActions';
        viewActions.className = 'profile-view-actions';
        viewActions.style.cssText = 'display: flex !important; gap: 1rem !important; justify-content: flex-end !important; margin-top: 1.5rem !important; padding-top: 1.5rem !important; border-top: 1px solid rgba(47, 167, 110, 0.1) !important;';
        viewContainer.appendChild(viewActions);
    }
    
    if (viewActions) {
        // Create logout button with hover effects
        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'btn-logout-profile';
        logoutBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 18px !important; height: 18px !important;">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Logout</span>
        `;
        logoutBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; gap: 8px !important; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; color: white !important; padding: 12px 24px !important; border: none !important; border-radius: 12px !important; font-weight: 600 !important; font-size: 0.95rem !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;';
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProfileModal();
            // Use window.logout directly
            if (typeof window.logout === 'function') {
                window.logout();
            } else if (typeof logout === 'function') {
                logout();
            } else {
                // Fallback logout
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
            }
        };
        
        // Add hover effects
        logoutBtn.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
        });
        logoutBtn.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        });
        
        // Create Close button
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-secondary';
        closeBtn.innerHTML = 'Close';
        closeBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; gap: 8px !important; background: white !important; color: #2FA76E !important; padding: 12px 24px !important; border-radius: 12px !important; border: 2px solid #2FA76E !important; font-weight: 600 !important; font-size: 0.95rem !important; cursor: pointer !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;';
        closeBtn.onclick = function() {
            closeProfileModal();
        };
        
        // Create Edit button
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-primary';
        editBtn.innerHTML = `
            <span>Edit</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 18px !important; height: 18px !important;">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        editBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; gap: 8px !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; color: white !important; padding: 12px 24px !important; border: none !important; border-radius: 12px !important; font-weight: 600 !important; font-size: 0.95rem !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.3) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;';
        editBtn.onclick = function() {
            switchToEditMode();
        };
        
        // Clear and append all buttons
        viewActions.innerHTML = '';
        viewActions.appendChild(logoutBtn);
        viewActions.appendChild(closeBtn);
        viewActions.appendChild(editBtn);
    }
}

// Load locations from database for profile edit
async function loadLocationsForProfile() {
    try {
        const profileLocation = document.getElementById('profileLocation');
        if (!profileLocation) {
            console.warn('profileLocation element not found');
            return;
        }
        
        console.log('Loading locations for profile...');
        
        // Try admin endpoint first (if user is admin), fallback to public endpoint
        let response;
        try {
            response = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
            console.log('Loaded locations from admin endpoint:', response);
        } catch (adminError) {
            // If admin endpoint fails (user not admin), use public endpoint
            console.log('Admin endpoint not accessible, using public endpoint');
            try {
                response = await apiRequest(API_CONFIG.ENDPOINTS.PUBLIC_LOCATIONS);
                console.log('Loaded locations from public endpoint:', response);
            } catch (publicError) {
                console.error('Both endpoints failed:', publicError);
                throw publicError;
            }
        }
        
        if (response && response.success && response.locations && Array.isArray(response.locations)) {
            // Store current value before clearing
            const currentValue = profileLocation.value;
            
            // Clear existing options
            profileLocation.innerHTML = '<option value="">Select a location</option>';
            
            // Add locations from database
            response.locations.forEach(location => {
                const locationName = location.name || location;
                if (locationName) {
                    const option = document.createElement('option');
                    option.value = locationName;
                    option.textContent = locationName;
                    profileLocation.appendChild(option);
                }
            });
            
            console.log(`Loaded ${response.locations.length} locations into dropdown`);
            
            // Restore previous value if it exists
            if (currentValue) {
                profileLocation.value = currentValue;
            }
        } else {
            console.warn('Invalid response format:', response);
        }
    } catch (error) {
        console.error('Failed to load locations:', error);
        // Keep default option if all fails
        const profileLocation = document.getElementById('profileLocation');
        if (profileLocation) {
            if (profileLocation.options.length <= 1) {
                profileLocation.innerHTML = '<option value="">Select a location</option>';
            }
        }
    }
}

// Populate profile form with user data
async function populateProfileForm(userData) {
    const user = getCurrentUser();
    if (!user) return;
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileLocation = document.getElementById('profileLocation');
    const profileIdNumber = document.getElementById('profileIdNumber');
    
    if (profileName) profileName.value = userData.name || user.name || '';
    if (profileEmail) profileEmail.value = userData.email || '';
    if (profilePhone) profilePhone.value = userData.phone || '';
    if (profileLocation) {
        // Set location value after locations are loaded
        profileLocation.value = userData.location || '';
    }
    if (profileIdNumber) {
        const idNumber = userData.idNumber || user.idNumber || '';
        profileIdNumber.value = idNumber || 'Not assigned';
    }
}

// Switch from view mode to edit mode
window.switchToEditMode = function() {
    openProfileEdit();
}

// Open profile in edit mode
async function openProfileEdit() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }
    
    // Get full user data from database
    let userData = user;
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.USER_PROFILE);
        if (response.success && response.user) {
            userData = response.user;
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to localStorage user data
    }
    
    // Ensure modal is visible and element is accessible
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.setAttribute('data-modal-open', 'true');
        modal.style.display = 'flex';
    }
    
    // Wait a bit to ensure modal is fully rendered
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Load locations from database first, then populate form
    await loadLocationsForProfile();
    
    // Populate form fields with user data (after locations are loaded)
    populateProfileForm(userData);
    
    // Find modal - it should already be open from view mode
    if (!modal) {
        // If modal doesn't exist, open it in edit mode directly
        return;
    }
    
    // Hide view container, show form
    const viewContainer = document.getElementById('profileViewContainer');
    const modalForm = modal.querySelector('.modal-form');
    
    if (viewContainer) {
        viewContainer.style.display = 'none';
    }
    if (modalForm) {
        modalForm.style.display = 'block';
    }
    
    // Show modal with explicit styles
    modal.style.cssText = 'display: flex !important; position: fixed !important; z-index: 2000 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.6) !important; overflow: auto !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important;';
    
    // Force modal to be visible
    modal.setAttribute('data-modal-open', 'true');
    
    // Ensure modal content is properly styled
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.cssText = 'background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%) !important; margin: 2rem auto !important; padding: 0 !important; border-radius: 1.25rem !important; width: 90% !important; max-width: 1000px !important; max-height: 90vh !important; overflow-y: auto !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(47, 167, 110, 0.1) !important; border: 1px solid rgba(47, 167, 110, 0.15) !important; position: relative !important;';
        
        // Add gradient top border using a pseudo-element workaround
        // Since we can't directly style ::before, we'll add a div
        let gradientBorder = modalContent.querySelector('.modal-gradient-border');
        if (!gradientBorder) {
            gradientBorder = document.createElement('div');
            gradientBorder.className = 'modal-gradient-border';
            gradientBorder.style.cssText = 'content: "" !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 4px !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; border-radius: 1.25rem 1.25rem 0 0 !important; z-index: 1 !important;';
            modalContent.insertBefore(gradientBorder, modalContent.firstChild);
        }
    }
    
    // Ensure modal header is styled and update title
    const modalHeader = modal.querySelector('.modal-header');
    if (modalHeader) {
        modalHeader.style.cssText = 'padding: 2rem 2rem 1.5rem !important; border-bottom: 1px solid rgba(47, 167, 110, 0.1) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%) !important;';
        
        // Style the h2 title and update text
        const headerTitle = modalHeader.querySelector('h2');
        if (headerTitle) {
            headerTitle.textContent = 'Edit Profile';
            headerTitle.style.cssText = 'font-size: 1.75rem !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important;';
        }
        
        // Style the close button
        const closeBtn = modalHeader.querySelector('.close');
        if (closeBtn) {
            closeBtn.style.cssText = 'color: var(--text-secondary) !important; font-size: 2rem !important; font-weight: 300 !important; line-height: 1 !important; cursor: pointer !important; transition: all 0.3s ease !important; width: 32px !important; height: 32px !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 50% !important; background: rgba(0, 0, 0, 0.05) !important; flex-shrink: 0 !important;';
        }
    }
    
    // Populate form fields with user data (will be called after locations load)
    await populateProfileForm(userData);
    
    // Ensure modal form is styled
    if (modalForm) {
        modalForm.style.cssText = 'padding: 2rem !important;';
        
        // Style form groups
        const formGroups = modalForm.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.cssText = 'margin-bottom: 1.5rem !important;';
            
            // Style labels
            const label = group.querySelector('label');
            if (label) {
                label.style.cssText = 'display: block !important; margin-bottom: 0.5rem !important; color: var(--text-primary) !important; font-weight: 500 !important;';
            }
            
            // Style inputs
            const input = group.querySelector('input');
            if (input) {
                if (input.readOnly) {
                    // Style readonly inputs (like ID Number)
                    input.style.cssText = 'width: 100% !important; padding: 0.875rem 1rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.5rem !important; font-size: 1rem !important; transition: all 0.3s ease !important; background-color: #f5f5f5 !important; color: var(--text-primary) !important; font-family: inherit !important; cursor: not-allowed !important;';
                } else {
                    input.style.cssText = 'width: 100% !important; padding: 0.875rem 1rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.5rem !important; font-size: 1rem !important; transition: all 0.3s ease !important; background: white !important; font-family: inherit !important;';
                }
            }
            
            // Style select
            const select = group.querySelector('select');
            if (select) {
                select.style.cssText = 'width: 100% !important; padding: 0.875rem 1rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.5rem !important; font-size: 1rem !important; transition: all 0.3s ease !important; background: white !important; font-family: inherit !important; cursor: pointer !important; display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: auto !important; top: auto !important; pointer-events: auto !important; height: auto !important; overflow: visible !important; z-index: auto !important; margin: 0 !important;';
            }
        });
    }
    
    // Ensure modal actions are styled
    const modalActions = modal.querySelector('.modal-actions');
    if (modalActions) {
        modalActions.style.cssText = 'display: flex !important; gap: 1rem !important; justify-content: flex-end !important; margin-top: 1.5rem !important; padding-top: 1.5rem !important; border-top: 1px solid rgba(47, 167, 110, 0.1) !important;';
        
        // Ensure buttons are properly styled with hover effects
        const primaryBtn = modalActions.querySelector('.btn-primary');
        const secondaryBtn = modalActions.querySelector('.btn-secondary');
        
        if (primaryBtn) {
            primaryBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; gap: 8px !important; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%) !important; color: white !important; padding: 12px 24px !important; border: none !important; border-radius: 12px !important; font-weight: 600 !important; font-size: 0.95rem !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.3) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; position: relative !important; overflow: hidden !important; letter-spacing: 0.025em !important;';
            
            // Ensure button content has proper z-index
            const primaryContent = primaryBtn.querySelector('span, svg');
            if (primaryContent) {
                primaryContent.style.cssText = 'position: relative !important; z-index: 2 !important;';
            }
            
            // Add shimmer effect element
            let shimmer = primaryBtn.querySelector('.btn-shimmer');
            if (!shimmer) {
                shimmer = document.createElement('div');
                shimmer.className = 'btn-shimmer';
                shimmer.style.cssText = 'position: absolute !important; top: 0 !important; left: -100% !important; width: 100% !important; height: 100% !important; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent) !important; transition: left 0.5s !important; pointer-events: none !important; z-index: 1 !important;';
                primaryBtn.appendChild(shimmer);
            }
            
            // Add hover effect via event listeners
            primaryBtn.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(135deg, #1F8A54 0%, #0088b3 100%)';
                this.style.transform = 'translateY(-3px) scale(1.02)';
                this.style.boxShadow = '0 12px 30px -5px rgba(47, 167, 110, 0.5), 0 4px 15px -3px rgba(47, 167, 110, 0.3)';
                if (shimmer) {
                    shimmer.style.left = '100%';
                }
            });
            
            primaryBtn.addEventListener('mouseleave', function() {
                this.style.background = 'linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%)';
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(47, 167, 110, 0.3)';
                if (shimmer) {
                    shimmer.style.left = '-100%';
                }
            });
            
            primaryBtn.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 2px 10px rgba(47, 167, 110, 0.3)';
            });
            
            primaryBtn.addEventListener('mouseup', function() {
                this.style.transform = 'translateY(-3px) scale(1.02)';
                this.style.boxShadow = '0 12px 30px -5px rgba(47, 167, 110, 0.5), 0 4px 15px -3px rgba(47, 167, 110, 0.3)';
            });
        }
        
        if (secondaryBtn) {
            secondaryBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; gap: 8px !important; background: white !important; color: #2FA76E !important; padding: 12px 24px !important; border-radius: 12px !important; border: 2px solid #2FA76E !important; font-weight: 600 !important; font-size: 0.95rem !important; cursor: pointer !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; position: relative !important; overflow: hidden !important; letter-spacing: 0.025em !important;';
            
            // Ensure ALL button content has proper z-index and color inheritance
            // Get all direct children and nested text/icon elements
            const btnSpans = secondaryBtn.querySelectorAll('span');
            const btnSvgs = secondaryBtn.querySelectorAll('svg');
            
            // Style all spans and SVGs
            [...btnSpans, ...btnSvgs].forEach(content => {
                content.style.cssText = 'position: relative !important; z-index: 2 !important; color: inherit !important; pointer-events: none !important;';
            });
            
            // Store references for hover effects
            const btnContents = [...btnSpans, ...btnSvgs];
            
            // Also set z-index on the button itself for its direct children
            secondaryBtn.style.zIndex = '1';
            
            // Add ripple effect element
            let ripple = secondaryBtn.querySelector('.btn-ripple');
            if (!ripple) {
                ripple = document.createElement('div');
                ripple.className = 'btn-ripple';
                ripple.style.cssText = 'position: absolute !important; top: 50% !important; left: 50% !important; width: 0 !important; height: 0 !important; border-radius: 50% !important; background: #2FA76E !important; transform: translate(-50%, -50%) !important; transition: width 0.6s, height 0.6s !important; z-index: 0 !important; pointer-events: none !important;';
                secondaryBtn.appendChild(ripple);
            }
            
            // Store original color for restoration
            const originalColor = '#2FA76E';
            
            // Add hover effect via event listeners
            secondaryBtn.addEventListener('mouseenter', function() {
                this.style.setProperty('color', 'white', 'important');
                this.style.borderColor = '#0088b3';
                this.style.transform = 'translateY(-3px) scale(1.02)';
                this.style.boxShadow = '0 8px 25px -5px rgba(47, 167, 110, 0.4), 0 4px 15px -3px rgba(47, 167, 110, 0.2)';
                
                // Ensure all text content is white
                btnContents.forEach(content => {
                    if (content.tagName === 'SPAN') {
                        content.style.setProperty('color', 'white', 'important');
                    } else if (content.tagName === 'svg') {
                        content.style.setProperty('stroke', 'white', 'important');
                        content.style.setProperty('fill', 'white', 'important');
                    }
                });
                
                if (ripple) {
                    ripple.style.width = '300px';
                    ripple.style.height = '300px';
                }
            });
            
            secondaryBtn.addEventListener('mouseleave', function() {
                this.style.setProperty('color', originalColor, 'important');
                this.style.borderColor = originalColor;
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                
                // Restore original colors
                btnContents.forEach(content => {
                    if (content.tagName === 'SPAN') {
                        content.style.setProperty('color', originalColor, 'important');
                    } else if (content.tagName === 'svg') {
                        content.style.setProperty('stroke', originalColor, 'important');
                        content.style.setProperty('fill', originalColor, 'important');
                    }
                });
                
                if (ripple) {
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                }
            });
            
            secondaryBtn.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            });
            
            secondaryBtn.addEventListener('mouseup', function() {
                this.style.transform = 'translateY(-3px) scale(1.02)';
                this.style.boxShadow = '0 8px 25px -5px rgba(47, 167, 110, 0.4), 0 4px 15px -3px rgba(47, 167, 110, 0.2)';
            });
        }
    }
    
    // Show profileLocation when modal opens - ensure it's visible and styled
    if (profileLocation) {
        // First, ensure it's not hidden by CSS - remove any conflicting inline styles
        profileLocation.removeAttribute('style');
        
        // Then apply all necessary styles with !important to override CSS
        profileLocation.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: auto !important; top: auto !important; pointer-events: auto !important; height: auto !important; width: 100% !important; overflow: visible !important; z-index: auto !important; padding: 0.875rem 1rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.5rem !important; font-size: 1rem !important; transition: all 0.3s ease !important; background: white !important; font-family: inherit !important; cursor: pointer !important; margin: 0 !important; max-height: none !important; max-width: none !important;';
        
        // Also ensure the parent form-group is visible
        const locationGroup = profileLocation.closest('.form-group');
        if (locationGroup) {
            locationGroup.style.cssText = 'margin-bottom: 1.5rem !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
            
            // Ensure the label is visible
            const locationLabel = locationGroup.querySelector('label');
            if (locationLabel) {
                locationLabel.style.cssText = 'display: block !important; margin-bottom: 0.5rem !important; color: var(--text-primary) !important; font-weight: 500 !important; visibility: visible !important; opacity: 1 !important;';
            }
        }
        
        // Force a reflow to ensure styles are applied
        void profileLocation.offsetHeight;
    }
    
    console.log('Modal should be visible now', modal.style.display, window.getComputedStyle(modal).display); // Debug log
}

window.closeProfileModal = function closeProfileModal() {
    // Close all profile modals (in case there are duplicates)
    const modals = document.querySelectorAll('#profileModal');
    modals.forEach(modal => {
        modal.style.cssText = 'display: none !important;';
        modal.removeAttribute('data-modal-open');
    });
    
    // CSS will handle hiding profileLocation when modal is closed
    const profileLocation = document.getElementById('profileLocation');
    if (profileLocation) {
        profileLocation.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: fixed !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important; z-index: -1 !important;';
    }
}

async function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const location = document.getElementById('profileLocation').value;
    
    try {
        // Update profile in database
        const response = await apiRequest(API_CONFIG.ENDPOINTS.USER_PROFILE_UPDATE, {
            method: 'PUT',
            body: JSON.stringify({ name, email, phone, location })
        });

        if (!response.success) {
            alert('Failed to update profile: ' + (response.error || 'Unknown error'));
            return;
        }

        // Update localStorage with new user data (for caching)
        const updatedUser = {
            username: response.user.username,
            role: response.user.role,
            name: response.user.name,
            email: response.user.email || '',
            phone: response.user.phone || '',
            location: response.user.location || '',
            idNumber: response.user.idNumber || ''
        };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        // Refresh sidebar account display
        if (typeof updateSidebarAccount === 'function') {
            updateSidebarAccount();
        } else {
        // Fallback to direct update
        const accountNameEl = document.getElementById('accountName');
        const accountAvatarEl = document.getElementById('accountAvatar');
        const accountUsernameEl = document.getElementById('accountUsername');
        const accountRoleEl = document.getElementById('accountRole');
        const accountEmailEl = document.getElementById('accountEmail');
        
        if (accountNameEl) accountNameEl.textContent = name;
        if (accountAvatarEl) accountAvatarEl.textContent = name.charAt(0).toUpperCase();
        if (accountUsernameEl) accountUsernameEl.textContent = '@' + (user.username || 'username');
        if (accountRoleEl) {
            accountRoleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Factory Operator';
        }
        if (accountEmailEl) accountEmailEl.textContent = email || 'No email';
        const accountIdNumberEl = document.getElementById('accountIdNumber');
        if (accountIdNumberEl) {
            const idNum = updatedUser.idNumber || '';
            accountIdNumberEl.textContent = idNum ? `ID Number: ${idNum}` : 'ID Number: —';
        }
    }
    
    // Update location display if on user dashboard
    const locationDisplay = document.getElementById('userLocationDisplay');
    if (locationDisplay) {
        locationDisplay.textContent = location || 'Location not set';
    }
    
        closeProfileModal();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Failed to update profile: ' + (error.message || 'Unknown error'));
    }
}

// Add click handler to sidebar account
function setupProfileEdit() {
    const sidebarAccount = document.querySelector('.sidebar-account');
    if (sidebarAccount) {
        // Remove ALL existing listeners by cloning the element
        const newSidebarAccount = sidebarAccount.cloneNode(true);
        sidebarAccount.parentNode.replaceChild(newSidebarAccount, sidebarAccount);
        
        // Get the child elements back
        const accountAvatar = document.getElementById('accountAvatar');
        const accountName = document.getElementById('accountName');
        const accountRole = document.getElementById('accountRole');
        
        // Create handler that works in all cases - only fire once
        let isOpening = false;
        const handler = function(e) {
            if (isOpening) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }
            isOpening = true;
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            if (typeof openProfileView === 'function') {
                openProfileView();
            }
            setTimeout(() => { isOpening = false; }, 500);
            return false;
        };
        
        // Add to the element itself - only once (capture phase only to avoid duplicates)
        newSidebarAccount.addEventListener('click', handler, true);
        
        // Prevent child elements from triggering multiple clicks
        if (accountAvatar) {
            accountAvatar.addEventListener('click', function(e) {
                e.stopPropagation();
                handler(e);
            }, true);
            accountAvatar.style.pointerEvents = 'auto';
        }
        if (accountName) {
            accountName.addEventListener('click', function(e) {
                e.stopPropagation();
                handler(e);
            }, true);
            accountName.style.pointerEvents = 'auto';
        }
        if (accountRole) {
            accountRole.addEventListener('click', function(e) {
                e.stopPropagation();
                handler(e);
            }, true);
            accountRole.style.pointerEvents = 'auto';
        }
        
        // Ensure it's clickable
        newSidebarAccount.style.cursor = 'pointer';
        newSidebarAccount.style.userSelect = 'none';
        newSidebarAccount.style.pointerEvents = 'auto';
        newSidebarAccount.style.position = 'relative';
        newSidebarAccount.style.zIndex = '1001';
        
        // Add inline onclick as well
        newSidebarAccount.setAttribute('onclick', 'event.stopPropagation(); event.preventDefault(); if(typeof openProfileView === "function") { openProfileView(); } return false;');
    }
}

// Setup profile edit on page load
function initProfileEdit() {
    // Update sidebar account info on page load
    if (typeof updateSidebarAccount === 'function') {
        updateSidebarAccount();
    }
    setupProfileEdit();
    
    // Also try again after a short delay in case DOM isn't fully ready
    // Especially important for user-measurements page where loadMeasurements might interfere
    setTimeout(setupProfileEdit, 100);
    setTimeout(setupProfileEdit, 500);
    setTimeout(setupProfileEdit, 1000);
    setTimeout(setupProfileEdit, 2000); // Extra delay for user-measurements page
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileEdit);
} else {
    // DOM is already ready
    initProfileEdit();
}

// Also run when the page becomes visible (in case of navigation)
document.addEventListener('DOMContentLoaded', function() {
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('profileModal');
        if (event.target === modal) {
            closeProfileModal();
        }
    });
    
    // Ensure profileLocation select is hidden on page load and stays hidden when modal is closed
    function ensureProfileLocationHidden() {
        const profileLocation = document.getElementById('profileLocation');
        const modal = document.getElementById('profileModal');
        if (profileLocation) {
            const modalDisplay = modal ? window.getComputedStyle(modal).display : 'none';
            const isModalOpen = modalDisplay === 'flex' || modalDisplay === 'block' || (modal && modal.style.display && modal.style.display !== 'none');
            
            // Hide if modal is closed
            if (!isModalOpen) {
                profileLocation.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: fixed !important; left: -9999px !important; top: -9999px !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important; z-index: -1 !important;';
            }
        }
    }
    
    // Hide on page load immediately
    ensureProfileLocationHidden();
    setTimeout(ensureProfileLocationHidden, 0);
    setTimeout(ensureProfileLocationHidden, 100);
    setTimeout(ensureProfileLocationHidden, 500);
    
    // Also monitor modal state changes
    const modal = document.getElementById('profileModal');
    if (modal) {
        const observer = new MutationObserver(function() {
            ensureProfileLocationHidden();
        });
        observer.observe(modal, { 
            attributes: true, 
            attributeFilter: ['style'],
            childList: false,
            subtree: false
        });
        
        // Also check periodically to catch any edge cases
        setInterval(ensureProfileLocationHidden, 500);
    }
});

