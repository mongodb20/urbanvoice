document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggler ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.innerText = '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDarkMode = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            themeToggle.innerText = isDarkMode ? '☀️' : '🌙';
        });
    }

    // --- Auth Form Toggler ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');

    const showLoginLink = document.querySelectorAll('.show-login');
    const showRegisterLink = document.querySelectorAll('.show-register');
    const showForgotLink = document.querySelectorAll('.show-forgot');

    const showForm = (formToShow) => {
        [loginForm, registerForm, forgotForm].forEach(form => {
            if (form) form.classList.remove('active');
        });
        if (formToShow) formToShow.classList.add('active');
    };

    showRegisterLink.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showForm(registerForm); }));
    showLoginLink.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showForm(loginForm); }));
    showForgotLink.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showForm(forgotForm); }));
    
    // --- Forgot Password OTP Flow ---
    const forgotPasswordFormEl = document.getElementById('forgot-password-form-el');
    const resetPasswordFormEl = document.getElementById('reset-password-form-el');
    if(forgotPasswordFormEl) {
        forgotPasswordFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('forgot-phone').value;
            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await response.json();
            alert(data.message);
            if (data.success) {
                // Show the reset password part of the form
                document.getElementById('reset-phone-hidden').value = phone;
                forgotPasswordFormEl.style.display = 'none';
                resetPasswordFormEl.style.display = 'block';
            }
        });
    }

    if (resetPasswordFormEl) {
        resetPasswordFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(resetPasswordFormEl);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert(result.message);
            if(result.success) {
                window.location.href = '/';
            }
        });
    }

    // --- Citizen: Delete Complaint ---
    document.querySelectorAll('.delete-complaint-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const complaintId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this complaint?')) {
                try {
                    const response = await fetch(`/citizen/complaint/${complaintId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                        e.target.closest('.complaint-item').remove();
                    } else {
                        alert('Error: ' + data.message);
                    }
                } catch (error) {
                    alert('An error occurred. Please try again.');
                }
            }
        });
    });

    // --- Admin: View Resolved Complaints ---
    const viewResolvedBtn = document.getElementById('view-resolved-btn');
    const resolvedContainer = document.getElementById('resolved-complaints-container');
    if (viewResolvedBtn) {
        viewResolvedBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/admin/resolved-complaints');
                const complaints = await response.json();
                
                let html = '<h3>Resolved Complaints</h3><div class="complaint-table"><table><thead><tr><th>Complaint #</th><th>Citizen</th><th>Type</th><th>Resolved On</th></tr></thead><tbody>';
                complaints.forEach(c => {
                    html += `<tr>
                        <td>${c.complaintNumber}</td>
                        <td>${c.citizenName} (${c.citizenPhone})</td>
                        <td>${c.complaintType}</td>
                        <td>${new Date(c.updatedAt).toLocaleDateString()}</td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
                
                resolvedContainer.innerHTML = html;
                resolvedContainer.classList.remove('hidden');
                viewResolvedBtn.classList.add('hidden');

            } catch (error) {
                resolvedContainer.innerHTML = '<p>Could not load resolved complaints.</p>';
            }
        });
    }
    
    // --- Relative Time Formatter ---
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    }

    document.querySelectorAll('.time-ago').forEach(el => {
        el.textContent = formatTimeAgo(el.dataset.date);
    });

});