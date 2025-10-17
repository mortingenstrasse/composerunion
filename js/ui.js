// ComposerUnion.com - Custom UI Elements (Modal & Alerts)

// --- Custom Modal Logic ---
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeButton = document.querySelector('.modal .close-button');

function showModal(title, contentHtml) {
    modalTitle.innerHTML = title;
    modalBody.innerHTML = contentHtml;
    customModal.style.display = 'flex'; // Use flex to center content
}

function hideModal() {
    customModal.style.display = 'none';
    modalTitle.innerHTML = '';
    modalBody.innerHTML = '';
}

// Close modal when clicking the close button
if (closeButton) {
    closeButton.addEventListener('click', hideModal);
}

// Close modal when clicking outside the modal content
if (customModal) {
    window.addEventListener('click', (event) => {
        if (event.target === customModal) {
            hideModal();
        }
    });
}

// --- Custom Alert/Toast Notification Logic ---
function showCustomAlert(message, type = 'info') { // Removed duration parameter
    const customAlert = document.getElementById('custom-alert');
    if (!customAlert) {
        console.error('Custom alert element not found!');
        return;
    }

    // Clear any existing timeout (if any previous alert was set to auto-hide)
    // This is no longer strictly needed as alerts will be stable, but good for cleanup
    clearTimeout(window.alertTimeout); 

    customAlert.innerHTML = `
        <span>${message}</span>
        <button class="close-alert-button">&times;</button>
    `;
    customAlert.className = `custom-alert show ${type}`; // Reset classes and add new ones
    customAlert.style.display = 'flex'; // Use flex to align content and close button

    const closeAlertButton = customAlert.querySelector('.close-alert-button');
    if (closeAlertButton) {
        closeAlertButton.onclick = () => {
            customAlert.classList.remove('show');
            // Hide after transition
            setTimeout(() => {
                customAlert.style.display = 'none';
            }, 500); // Match CSS transition duration
        };
    }
}

// Make functions globally accessible
window.showModal = showModal;
window.hideModal = hideModal;
window.showCustomAlert = showCustomAlert;
