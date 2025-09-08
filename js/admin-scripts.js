// Admin Panel JavaScript

// Configuration
const ADMIN_ACCESS_CODE = "RachaelDestiny2025"; // Change this to your desired access code
const ITEMS_PER_PAGE = 10;

// Global variables
let allRSVPs = [];
let filteredRSVPs = [];
let currentPage = 1;
let isAuthenticated = false;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Show access modal first
    showAccessModal();
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Access code submission
    document.getElementById('submitAccess').addEventListener('click', handleAccessCode);
    document.getElementById('accessCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAccessCode();
        }
    });
    
    // Admin panel controls
    document.getElementById('refreshData').addEventListener('click', loadRSVPData);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('logoutAdmin').addEventListener('click', logoutAdmin);
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
}

function showAccessModal() {
    const modal = new bootstrap.Modal(document.getElementById('accessModal'));
    modal.show();
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('accessCode').focus();
    }, 500);
}

function handleAccessCode() {
    const accessCode = document.getElementById('accessCode').value.trim();
    const errorDiv = document.getElementById('accessError');
    const input = document.getElementById('accessCode');
    
    // Clear previous errors
    input.classList.remove('is-invalid');
    errorDiv.textContent = '';
    
    if (!accessCode) {
        showAccessError('Please enter an access code');
        return;
    }
    
    if (accessCode === ADMIN_ACCESS_CODE) {
        // Success - hide modal and show admin panel
        isAuthenticated = true;
        bootstrap.Modal.getInstance(document.getElementById('accessModal')).hide();
        showAdminPanel();
        loadRSVPData();
    } else {
        showAccessError('Invalid access code. Please try again.');
    }
}

function showAccessError(message) {
    const input = document.getElementById('accessCode');
    const errorDiv = document.getElementById('accessError');
    
    input.classList.add('is-invalid');
    errorDiv.textContent = message;
    
    // Clear input
    input.value = '';
    input.focus();
}

function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('d-none');
}

function logoutAdmin() {
    isAuthenticated = false;
    document.getElementById('adminPanel').classList.add('d-none');
    document.getElementById('accessCode').value = '';
    showAccessModal();
}

async function loadRSVPData() {
    showLoading(true);
    
    try {
        if (!window.db || !window.getDocs || !window.collection) {
            throw new Error('Firebase not initialized');
        }
        
        // Get all RSVPs from Firestore
        const rsvpsRef = window.collection(window.db, 'rsvps');
        const q = window.query(rsvpsRef, window.orderBy('submittedAt', 'desc'));
        const querySnapshot = await window.getDocs(q);
        
        allRSVPs = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allRSVPs.push({
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                attendance: data.attendance || false,
                message: data.message || '',
                submittedAt: data.submittedAt ? data.submittedAt.toDate() : new Date(),
                status: data.status || 'pending', // pending, confirmed, rejected
                ipAddress: data.ipAddress || '',
                userAgent: data.userAgent || ''
            });
        });
        
        filteredRSVPs = [...allRSVPs];
        updateStats();
        renderTable();
        
    } catch (error) {
        console.error('Error loading RSVP data:', error);
        showNotification('Error loading RSVP data. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function updateStats() {
    const total = allRSVPs.length;
    const attending = allRSVPs.filter(rsvp => rsvp.attendance).length;
    const notAttending = allRSVPs.filter(rsvp => !rsvp.attendance).length;
    const pending = allRSVPs.filter(rsvp => rsvp.status === 'pending').length;
    
    // Animate counters
    animateCounter('totalRSVPs', total);
    animateCounter('attendingCount', attending);
    animateCounter('notAttendingCount', notAttending);
    animateCounter('pendingCount', pending);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredRSVPs = allRSVPs.filter(rsvp => {
        return rsvp.name.toLowerCase().includes(searchTerm) ||
               rsvp.email.toLowerCase().includes(searchTerm) ||
               rsvp.phone.toLowerCase().includes(searchTerm) ||
               rsvp.message.toLowerCase().includes(searchTerm);
    });
    
    currentPage = 1;
    renderTable();
}

function handleFilter() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    if (!statusFilter) {
        filteredRSVPs = [...allRSVPs];
    } else {
        filteredRSVPs = allRSVPs.filter(rsvp => {
            if (statusFilter === 'attending') return rsvp.attendance;
            if (statusFilter === 'not-attending') return !rsvp.attendance;
            if (statusFilter === 'pending') return rsvp.status === 'pending';
            return true;
        });
    }
    
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('rsvpTableBody');
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = filteredRSVPs.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No RSVPs found</p>
                </td>
            </tr>
        `;
    } else {
        pageData.forEach(rsvp => {
            const row = createTableRow(rsvp);
            tbody.appendChild(row);
        });
    }
    
    // Also render mobile cards
    renderMobileCards(pageData);
    
    updatePagination();
    updateTableFooter();
}

function createTableRow(rsvp) {
    const row = document.createElement('tr');
    
    const attendanceText = rsvp.attendance ? 'Yes' : 'No';
    const attendanceClass = rsvp.attendance ? 'attending' : 'not-attending';
    const statusClass = rsvp.status || 'pending';
    
    const submittedDate = rsvp.submittedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    row.innerHTML = `
        <td>
            <strong>${escapeHtml(rsvp.name)}</strong>
        </td>
        <td>
            <a href="mailto:${rsvp.email}" class="text-decoration-none">
                ${escapeHtml(rsvp.email)}
            </a>
        </td>
        <td>
            ${rsvp.phone ? `<a href="tel:${rsvp.phone}" class="text-decoration-none">${escapeHtml(rsvp.phone)}</a>` : '-'}
        </td>
        <td>
            <span class="status-badge ${attendanceClass}">
                <i class="fas fa-${rsvp.attendance ? 'check' : 'times'}"></i>
                ${attendanceText}
            </span>
        </td>
        <td>
            <span class="status-badge ${statusClass}">
                <i class="fas fa-${getStatusIcon(statusClass)}"></i>
                ${statusClass}
            </span>
        </td>
        <td>
            <small class="text-muted">${submittedDate}</small>
        </td>
        <td>
            <div class="message-cell">
                ${rsvp.message ? `<span title="${escapeHtml(rsvp.message)}">${truncateText(rsvp.message, 50)}</span>` : '-'}
            </div>
        </td>
        <td>
            <div class="action-buttons">
                ${rsvp.status === 'pending' ? `
                    <button class="btn-action btn-confirm" onclick="updateRSVPStatus('${rsvp.id}', 'confirmed')">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                    <button class="btn-action btn-reject" onclick="updateRSVPStatus('${rsvp.id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : `
                    <span class="status-completed">
                        <i class="fas fa-${rsvp.status === 'confirmed' ? 'check-circle' : 'times-circle'}"></i>
                        ${rsvp.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                    </span>
                `}
            </div>
        </td>
    `;
    
    return row;
}

function renderMobileCards(pageData) {
    const container = document.getElementById('mobileCardsContainer');
    
    if (pageData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No RSVPs found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    pageData.forEach(rsvp => {
        const card = createMobileCard(rsvp);
        container.appendChild(card);
    });
}

function createMobileCard(rsvp) {
    const card = document.createElement('div');
    card.className = 'mobile-rsvp-card';
    
    const attendanceText = rsvp.attendance ? 'Yes' : 'No';
    const attendanceClass = rsvp.attendance ? 'attending' : 'not-attending';
    const statusClass = rsvp.status || 'pending';
    
    const submittedDate = rsvp.submittedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <h5>${escapeHtml(rsvp.name)}</h5>
                <div class="card-badges">
                    <span class="status-badge ${attendanceClass}">
                        <i class="fas fa-${rsvp.attendance ? 'check' : 'times'}"></i>
                        ${attendanceText}
                    </span>
                    <span class="status-badge ${statusClass}">
                        <i class="fas fa-${getStatusIcon(statusClass)}"></i>
                        ${statusClass}
                    </span>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="card-info">
                <div class="info-item">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:${rsvp.email}" class="text-decoration-none">${escapeHtml(rsvp.email)}</a>
                </div>
                ${rsvp.phone ? `
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <a href="tel:${rsvp.phone}" class="text-decoration-none">${escapeHtml(rsvp.phone)}</a>
                    </div>
                ` : ''}
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${submittedDate}</span>
                </div>
                ${rsvp.message ? `
                    <div class="info-item message-item">
                        <i class="fas fa-comment"></i>
                        <span title="${escapeHtml(rsvp.message)}">${truncateText(rsvp.message, 100)}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="card-footer">
            <div class="action-buttons">
                ${rsvp.status === 'pending' ? `
                    <button class="btn-action btn-confirm" onclick="updateRSVPStatus('${rsvp.id}', 'confirmed')">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                    <button class="btn-action btn-reject" onclick="updateRSVPStatus('${rsvp.id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : `
                    <span class="status-completed">
                        <i class="fas fa-${rsvp.status === 'confirmed' ? 'check-circle' : 'times-circle'}"></i>
                        ${rsvp.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                    </span>
                `}
            </div>
        </div>
    `;
    
    return card;
}

function getStatusIcon(status) {
    switch (status) {
        case 'confirmed': return 'check-circle';
        case 'rejected': return 'times-circle';
        case 'pending': return 'clock';
        default: return 'question-circle';
    }
}

async function updateRSVPStatus(rsvpId, newStatus) {
    try {
        if (!window.db || !window.updateDoc || !window.doc) {
            throw new Error('Firebase not initialized');
        }
        
        const rsvpRef = window.doc(window.db, 'rsvps', rsvpId);
        await window.updateDoc(rsvpRef, {
            status: newStatus,
            updatedAt: new Date()
        });
        
        // Update local data
        const rsvp = allRSVPs.find(r => r.id === rsvpId);
        if (rsvp) {
            rsvp.status = newStatus;
        }
        
        // Re-render table and stats
        renderTable();
        updateStats();
        
        showNotification(`RSVP ${newStatus} successfully!`, 'success');
        
    } catch (error) {
        console.error('Error updating RSVP status:', error);
        showNotification('Error updating RSVP status. Please try again.', 'error');
    }
}

function updatePagination() {
    const totalPages = Math.ceil(filteredRSVPs.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextLi);
}

function changePage(page) {
    const totalPages = Math.ceil(filteredRSVPs.length / ITEMS_PER_PAGE);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
    }
}

function updateTableFooter() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredRSVPs.length);
    
    document.getElementById('showingCount').textContent = filteredRSVPs.length > 0 ? `${startIndex}-${endIndex}` : '0';
    document.getElementById('totalCount').textContent = filteredRSVPs.length;
}

function downloadExcel() {
    try {
        // Create Excel data
        const excelData = allRSVPs.map(rsvp => ({
            'Name': rsvp.name,
            'Email': rsvp.email,
            'Phone': rsvp.phone || '',
            'Attending': rsvp.attendance ? 'Yes' : 'No',
            'Status': rsvp.status || 'pending',
            'Message': rsvp.message || '',
            'Submitted Date': rsvp.submittedAt.toLocaleDateString(),
            'Submitted Time': rsvp.submittedAt.toLocaleTimeString(),
            'IP Address': rsvp.ipAddress || ''
        }));
        
        // Convert to CSV
        const csvContent = convertToCSV(excelData);
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `wedding-rsvps-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error downloading Excel:', error);
        showNotification('Error downloading Excel file. Please try again.', 'error');
    }
}

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('d-none');
    } else {
        overlay.classList.add('d-none');
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Prevent access to admin panel without authentication
window.addEventListener('beforeunload', function() {
    if (isAuthenticated) {
        isAuthenticated = false;
    }
});

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (isAuthenticated) {
        loadRSVPData();
    }
}, 30000);
