const API_URL = 'https://kiutso-backend-production.up.railway.app/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Kama hajalogini — rudisha login
if (!token || user.role !== 'admin') {
    window.location.href = "/src/pages/login.html";
}

// =============================================
// TOAST (badala ya alert)
// =============================================
function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
        background:${type === 'success' ? '#0a3018' : type === 'error' ? '#7f1d1d' : '#1e3a5f'};
        color:#fff;padding:12px 20px;border-radius:8px;font-size:13.5px;
        box-shadow:0 4px 16px rgba(0,0,0,.18);min-width:220px;max-width:340px;
        animation:fadeInUp .25s ease;
    `;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 3200);
}

// =============================================
// OVERVIEW
// =============================================
async function loadOverview() {
    try {
        const res = await fetch(`${API_URL}/admin/overview`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok) {
            document.querySelectorAll('.stat-num')[0].textContent = data.total_voters;
            document.querySelectorAll('.stat-num')[1].textContent = data.votes_cast;
            document.querySelectorAll('.stat-num')[2].textContent = data.voter_turnout + '%';
            document.querySelectorAll('.stat-num')[4].textContent = data.total_candidates;
        }
    } catch(e) { console.error('Overview error:', e); }
}

// =============================================
// LIVE ACTIVITY
// =============================================
async function loadLiveActivity() {
    try {
        const res = await fetch(`${API_URL}/admin/live-activity`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok && data.length > 0) {
            const list = document.querySelector('.activity-list');
            list.innerHTML = data.map(log => `
                <div class="act-item">
                    <span class="act-dot ${log.action === 'failed_login' ? 'r' : 'g'}" style="margin-top:6px"></span>
                    <div>
                        <div class="act-text">${log.description}</div>
                        <div class="act-time">${new Date(log.created_at).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { console.error('Live activity error:', e); }
}

// =============================================
// SYSTEM LOGS
// =============================================
async function loadLogs() {
    try {
        const res = await fetch(`${API_URL}/admin/logs`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok && data.length > 0) {
            const tbody = document.querySelector('#sec-logs .tbl tbody');
            if (tbody) {
                tbody.innerHTML = data.map(log => `
                    <tr>
                        <td style="font-size:12px;white-space:nowrap">${new Date(log.created_at).toLocaleString()}</td>
                        <td><span class="badge ${log.action === 'failed_login' ? 'll-warn' : 'll-info'}">${log.action === 'failed_login' ? 'Warning' : 'Info'}</span></td>
                        <td style="font-size:12px">${log.action.toUpperCase()}</td>
                        <td>${log.user ? log.user.reg_number : 'system'}</td>
                        <td>${log.description}</td>
                    </tr>
                `).join('');
            }
        }
    } catch(e) { console.error('Logs error:', e); }
}

// =============================================
// LOGOUT
// =============================================
async function adminLogout() {
    if (!confirm('Logout?')) return;
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
    } catch(e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "/src/pages/login.html";
}

// =============================================
// ELECTIONS
// =============================================
async function loadElections() {
    try {
        const res = await fetch(`${API_URL}/admin/elections`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const elections = await res.json();

        if (elections.length > 0) {
            const el = elections[0];
            const titleEl = document.querySelector('.ed-top h2');
            if (titleEl) titleEl.textContent = el.title;
            const subEl = document.querySelector('.ed-top p');
            if (subEl) subEl.textContent = 'Academic Year 2025/26';

            const badge = document.querySelector('.ed-top .badge');
            if (badge) {
                badge.innerHTML = `<span class="bdot"></span>${el.status.toUpperCase()}`;
                badge.className = `badge ${el.status === 'open' ? 'badge-g' : 'badge-gray'}`;
            }

            const rows = document.querySelectorAll('.ed-row .ed-value');
            if (rows[0]) rows[0].textContent = el.voting_opens ? new Date(el.voting_opens).toLocaleString() : '-';
            if (rows[1]) rows[1].textContent = el.voting_closes ? new Date(el.voting_closes).toLocaleString() : '-';
        }
    } catch(e) { console.error('Elections error:', e); }
}

async function createElection() {
    const title = document.getElementById('election-title')?.value.trim();
    const opens = document.getElementById('election-opens')?.value;
    const closes = document.getElementById('election-closes')?.value;

    if (!title || !opens || !closes) {
        showToast('Jaza sehemu zote!', 'error');
        return;
    }

    const btn = document.getElementById('create-election-btn');
    if (btn) { btn.textContent = 'Inaunda...'; btn.disabled = true; }

    try {
        const res = await fetch(`${API_URL}/admin/elections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ title, voting_opens: opens, voting_closes: closes, status: 'upcoming' })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Uchaguzi umeundwa!');
            closeModal('createElectionModal');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        if (btn) { btn.textContent = 'Create Election'; btn.disabled = false; }
    }
}

async function pauseVoting() {
    if (!confirm('Simamisha upigaji kura kwa muda?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/elections/pause`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Upigaji kura umesimamishwa.');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

async function closeVotingEarly() {
    if (!confirm('Funga upigaji kura kabla ya wakati? Hii haiwezi kurudishwa.')) return;
    try {
        const res = await fetch(`${API_URL}/admin/elections/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Upigaji kura umefungwa.');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// =============================================
// RESULTS
// =============================================
async function loadResults() {
    try {
        const res = await fetch(`${API_URL}/admin/results`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!data || !data.positions) return;

        const tbody = document.querySelector('#sec-results .tbl tbody');
        if (!tbody) return;

        let rows = [];
        let rank = 1;
        data.positions.forEach(position => {
            position.candidates.forEach(candidate => {
                rows.push({ rank: rank++, name: candidate.full_name, position: position.title, votes: candidate.votes_count || 0 });
            });
        });
        rows.sort((a, b) => b.votes - a.votes);

        tbody.innerHTML = rows.map((r, i) => `
            <tr>
                <td><span class="badge ${i === 0 ? 'badge-w' : 'badge-gray'}">${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</span></td>
                <td class="tbl-name">${r.name}</td>
                <td>${r.position}</td>
                <td><strong>${r.votes}</strong></td>
                <td>${rows[0].votes > 0 ? Math.round((r.votes / rows[0].votes) * 100) : 0}%</td>
                <td>${i === 0 ? '<span class="badge badge-g">Leading</span>' : ''}</td>
            </tr>
        `).join('');

        if (rc) { rc.destroy(); rc = null; }
        initResults(rows);
    } catch(e) { console.error('Results error:', e); }
}

// =============================================
// CANDIDATES
// =============================================
async function loadCandidates() {
    try {
        const res = await fetch(`${API_URL}/candidates`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const candidates = await res.json();
        const tbody = document.querySelector('#sec-candidates .tbl tbody');
        if (!tbody) return;

        if (candidates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted)">No candidates found</td></tr>`;
            return;
        }

        tbody.innerHTML = candidates.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${c.photo_url ? `<img src="${c.photo_url}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : `<div class="tbl-avatar-ph">${c.full_name.charAt(0)}</div>`}</td>
                <td class="tbl-name">${c.full_name}</td>
                <td>${c.position ? c.position.title : '-'}</td>
                <td>${c.faculty || '-'}</td>
                <td>${c.reg_number || '-'}</td>
                <td>-</td>
                <td><button class="btn btn-d btn-sm" onclick="deleteCandidate(${c.id})">Delete</button></td>
            </tr>
        `).join('');

        const visibleEl = document.querySelector('#sec-candidates .visible-entries');
        const totalEl = document.querySelector('#sec-candidates .total-entries');
        if (visibleEl) visibleEl.textContent = candidates.length;
        if (totalEl) totalEl.textContent = candidates.length;
    } catch(e) { console.error('Candidates error:', e); }
}

async function addCandidate() {
    const full_name = document.getElementById('cand-name').value.trim();
    const reg_number = document.getElementById('cand-reg').value.trim();
    const faculty = document.getElementById('cand-faculty').value.trim();
    const position_id = document.getElementById('cand-position').value;
    const bio = document.getElementById('cand-bio').value.trim();
    const manifesto = document.getElementById('cand-manifesto')?.value.trim();
    const photoFile = document.getElementById('cand-photo')?.files[0];

    if (!full_name || !position_id) { showToast('Jaza jina na position!', 'error'); return; }

    try {
        const btn = document.getElementById('cand-submit-btn');
        if (btn) { btn.textContent = 'Inaongeza...'; btn.disabled = true; }

        let photo_url = null;
        if (photoFile) {
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('upload_preset', 'kiutso_candidates');
            formData.append('cloud_name', 'diiofqbcr');
            const uploadRes = await fetch('https://api.cloudinary.com/v1_1/diiofqbcr/image/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            photo_url = uploadData.secure_url;
        }

        const res = await fetch(`${API_URL}/admin/candidates`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ election_id: 1, position_id: parseInt(position_id), full_name, reg_number: reg_number || null, faculty: faculty || null, bio: bio || null, manifesto: manifesto || null, photo_url: photo_url || null, is_approved: true })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Mgombea ameongezwa!');
            closeModal('addCandidateModal');
            loadCandidates();
            ['cand-name','cand-reg','cand-faculty','cand-bio','cand-manifesto','cand-photo'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        const btn = document.getElementById('cand-submit-btn');
        if (btn) { btn.textContent = 'Add Candidate'; btn.disabled = false; }
    }
}

async function deleteCandidate(id) {
    if (!confirm('Futa mgombea huyu?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/candidates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) { showToast('Mgombea amefutwa!'); loadCandidates(); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

// =============================================
// POSITIONS
// =============================================
async function loadPositions() {
    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const positions = await res.json();
        const tbody = document.querySelector('#sec-positions .tbl tbody');
        if (!tbody) return;

        if (!positions.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted)">Hakuna positions zilizoundwa bado</td></tr>`;
            return;
        }

        tbody.innerHTML = positions.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td class="tbl-name">${p.title}</td>
                <td>${p.type === 'f' ? 'Faculty-specific' : 'University-wide'}</td>
                <td>${p.faculty || '-'}</td>
                <td>
                    <button class="btn btn-gh btn-sm" onclick='editPosition(${JSON.stringify(p)})'>Edit</button>
                    <button class="btn btn-d btn-sm" onclick="deletePosition(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error('Positions error:', e); }
}

async function addPosition() {
    const title = document.getElementById('pos-title')?.value.trim();
    const type = document.getElementById('posType')?.value;
    const faculty = document.getElementById('pos-faculty')?.value.trim();

    if (!title) { showToast('Jaza jina la position!', 'error'); return; }

    const btn = document.getElementById('pos-submit-btn');
    if (btn) { btn.textContent = 'Inaongeza...'; btn.disabled = true; }

    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title, type: type || 'u', faculty: type === 'f' ? faculty : null })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Position imeongezwa!');
            closeModal('addPositionModal');
            loadPositions();
            if (document.getElementById('pos-title')) document.getElementById('pos-title').value = '';
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        if (btn) { btn.textContent = 'Add Position'; btn.disabled = false; }
    }
}

function editPosition(p) {
    document.getElementById('edit-pos-id').value = p.id;
    document.getElementById('edit-pos-title').value = p.title;
    document.getElementById('editPosType').value = p.type || 'u';
    if (document.getElementById('edit-pos-faculty')) document.getElementById('edit-pos-faculty').value = p.faculty || '';
    toggleEditFacSel();
    openModal('editPositionModal');
}

function toggleEditFacSel() {
    const group = document.getElementById('editFacSelGroup');
    if (group) group.style.display = document.getElementById('editPosType')?.value === 'f' ? '' : 'none';
}

async function updatePosition() {
    const id = document.getElementById('edit-pos-id')?.value;
    const title = document.getElementById('edit-pos-title')?.value.trim();
    const type = document.getElementById('editPosType')?.value;
    const faculty = document.getElementById('edit-pos-faculty')?.value.trim();

    if (!title) { showToast('Jaza jina la position!', 'error'); return; }

    const btn = document.getElementById('edit-pos-submit-btn');
    if (btn) { btn.textContent = 'Inasave...'; btn.disabled = true; }

    try {
        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title, type: type || 'u', faculty: type === 'f' ? faculty : null })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Position imesasishwa!');
            closeModal('editPositionModal');
            loadPositions();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    }
}

async function deletePosition(id) {
    if (!confirm('Futa position hii?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) { showToast('Position imefutwa!'); loadPositions(); }
        else showToast('Kuna tatizo!', 'error');
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

// =============================================
// PAST ELECTIONS
// =============================================
async function loadPastElections() {
    try {
        const res = await fetch(`${API_URL}/admin/elections/past`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const elections = await res.json();
        const container = document.querySelector('#sec-past .past-list') || document.querySelector('#sec-past .tbl tbody');
        if (!container) return;

        if (!elections.length) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted)">Hakuna uchaguzi wa zamani</td></tr>`;
            return;
        }

        if (container.tagName === 'TBODY') {
            container.innerHTML = elections.map((e, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td class="tbl-name">${e.title}</td>
                    <td>${e.voting_opens ? new Date(e.voting_opens).toLocaleDateString() : '-'}</td>
                    <td>${e.voting_closes ? new Date(e.voting_closes).toLocaleDateString() : '-'}</td>
                    <td>
                        <button class="btn btn-gh btn-sm" onclick="viewPastResults(${e.id})">View Results</button>
                        <button class="btn btn-p btn-sm" onclick="exportPastElection(${e.id})">Export</button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = elections.map(e => `
                <div class="past-card" style="padding:16px;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;">
                    <div style="font-weight:600">${e.title}</div>
                    <div style="font-size:12px;color:var(--muted);margin:4px 0">${e.voting_opens ? new Date(e.voting_opens).toLocaleDateString() : '-'} → ${e.voting_closes ? new Date(e.voting_closes).toLocaleDateString() : '-'}</div>
                    <div style="margin-top:10px;display:flex;gap:8px">
                        <button class="btn btn-gh btn-sm" onclick="viewPastResults(${e.id})">View Results</button>
                        <button class="btn btn-p btn-sm" onclick="exportPastElection(${e.id})">Export</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { console.error('Past elections error:', e); }
}

async function viewPastResults(electionId) {
    showToast('Inapakia matokeo...', 'info');
    try {
        const res = await fetch(`${API_URL}/admin/results?election_id=${electionId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Matokeo yamepakiwa!');
            // Navigate to results section
            const btn = document.querySelector('[data-section="results"]');
            if (btn) nav(btn);
        } else {
            showToast('Kuna tatizo!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

async function exportPastElection(electionId) {
    showToast('Inaexport...', 'info');
    try {
        const res = await fetch(`${API_URL}/admin/reports/election/${electionId}?format=csv`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `election_${electionId}_results.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Imedownload!');
        } else {
            showToast('Kuna tatizo la export!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

// =============================================
// ANNOUNCEMENTS
// =============================================
async function sendAnnouncement() {
    const title = document.getElementById('ann-title')?.value.trim();
    const message = document.getElementById('ann-message')?.value.trim();
    const audience = document.querySelector('.aud-pill.on')?.dataset?.aud || 'all';

    if (!title || !message) { showToast('Jaza kichwa na ujumbe!', 'error'); return; }

    const btn = document.getElementById('ann-send-btn');
    if (btn) { btn.textContent = 'Inatuma...'; btn.disabled = true; }

    try {
        const res = await fetch(`${API_URL}/admin/announcements`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title, message, audience })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Tangazo limetumwa!');
            if (document.getElementById('ann-title')) document.getElementById('ann-title').value = '';
            if (document.getElementById('ann-message')) document.getElementById('ann-message').value = '';
            loadAnnouncementHistory();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        if (btn) { btn.textContent = 'Send Announcement'; btn.disabled = false; }
    }
}

async function loadAnnouncementHistory() {
    try {
        const res = await fetch(`${API_URL}/admin/announcements`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const announcements = await res.json();
        
        // ← Selector sahihi kutoka HTML yako
        const container = document.querySelector('#sec-announcements .ann-list');
        if (!container) return;

        if (!announcements.length) {
            container.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:12px">Hakuna matangazo yaliyotumwa bado.</p>`;
            return;
        }

        container.innerHTML = announcements.map(a => `
            <div class="ann-item">
                <div class="ann-head">
                    <div class="ann-subj">${a.title}</div>
                    <div class="ann-ts">${new Date(a.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}</div>
                </div>
                <div class="ann-meta">${a.audience === 'all' ? 'All Voters' : a.audience === 'voted' ? 'Voted' : 'Not Voted'} · ${a.recipient_count} recipients</div>
            </div>
        `).join('');

    } catch(e) { console.error('Announcements history error:', e); }
}
// =============================================
// NOTIFICATIONS
async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}/admin/notifications`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        const notifications = data.notifications || data;

        // Update badge count — topbar na sidebar
        const unread = notifications.filter(n => !n.read_at).length;
        document.querySelectorAll('.notif-count, .sb-badge').forEach(el => {
            if (el.closest('[data-section="notifications"]') || el.classList.contains('notif-count')) {
                el.textContent = unread > 0 ? unread : '';
            }
        });

        const container = document.querySelector('#sec-notifications .notif-list');
        if (!container) return;

        if (!notifications.length) {
            container.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:16px">Hakuna notifications.</p>`;
            return;
        }

        // Hifadhi notifications kwenye data attribute kwa filtering
        container.dataset.notifications = JSON.stringify(notifications);
        renderNotifications(notifications);

    } catch(e) { console.error('Notifications error:', e); }
}

function renderNotifications(notifications) {
    const container = document.querySelector('#sec-notifications .notif-list');
    if (!container) return;

    container.innerHTML = notifications.map(n => `
        <div class="notif-item ${!n.read_at ? 'unread' : ''}" data-type="${n.type}">
            <span class="notif-dot ${n.type === 'warning' ? 'w' : n.type === 'danger' ? 'r' : 'g'}"></span>
            <div class="notif-content">
                <div class="notif-title">${n.message}</div>
                <div class="notif-ts">${new Date(n.created_at).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

// Fix filter buttons
document.querySelectorAll('.nf-btn').forEach(b =>
    b.addEventListener('click', function() {
        document.querySelectorAll('.nf-btn').forEach(x => x.classList.remove('on'));
        this.classList.add('on');
        
        const filter = this.textContent.toLowerCase().trim();
        const container = document.querySelector('#sec-notifications .notif-list');
        if (!container || !container.dataset.notifications) return;
        
        const all = JSON.parse(container.dataset.notifications);
        const filtered = filter === 'all' ? all : all.filter(n => n.type === filter);
        renderNotifications(filtered);
    })
);

// REPORTS
async function downloadReport(type, format) {
    showToast(`Inaunda report...`, 'info');
    try {
        const res = await fetch(`${API_URL}/admin/reports/${type}?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // ← Extension inategemea format
            a.download = `kiutso_${type}_report.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Report imedownload!');
        } else {
            showToast('Kuna tatizo la kuunda report!', 'error');
        }
    } catch(e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}
// VOTERS
// =============================================
let allVoters = [];

async function loadVoters() {
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();

        if (data.voters) {
            allVoters = data.voters;
            const total = data.total;
            const voted = allVoters.filter(v => v.votes && v.votes.length > 0).length;
            const notVoted = total - voted;

            const badges = document.querySelectorAll('#sec-voters .pg-head .badge');
            if (badges[0]) badges[0].textContent = `${total} Total`;
            if (badges[1]) badges[1].textContent = `${voted} Voted`;
            if (badges[2]) badges[2].textContent = `${notVoted} Not Yet`;

            const tabs = document.querySelectorAll('.vt');
            if (tabs[0]) tabs[0].textContent = `All (${total})`;
            if (tabs[1]) tabs[1].textContent = `Voted (${voted})`;
            if (tabs[2]) tabs[2].textContent = `Not Yet (${notVoted})`;

            renderVoters(allVoters);
        }
    } catch(e) { console.error('Voters error:', e); }
}

function renderVoters(voters) {
    const tbody = document.querySelector('#sec-voters .tbl tbody');
    if (!tbody) return;

    if (voters.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No voters found</td></tr>`;
        return;
    }

    tbody.innerHTML = voters.map(v => `
        <tr>
            <td class="tbl-name">${v.reg_number}</td>
            <td>${v.programme || '-'}</td>
            <td>${v.faculty || '-'}</td>
            <td>${v.email || v.phone || '-'}</td>
            <td>${new Date(v.created_at).toLocaleDateString()}</td>
            <td>${v.votes && v.votes.length > 0
                ? '<span class="badge badge-g"><span class="bdot"></span>Voted</span>'
                : '<span class="badge badge-w"><span class="bdot"></span>Not Voted</span>'
            }</td>
            <td><button class="btn btn-gh btn-sm" onclick='openVoterDetail(${JSON.stringify(v)})'>View</button></td>
        </tr>
    `).join('');

    const visibleEl = document.querySelector('#sec-voters .visible-entries');
    const totalEl = document.querySelector('#sec-voters .total-entries');
    if (visibleEl) visibleEl.textContent = voters.length;
    if (totalEl) totalEl.textContent = allVoters.length;
}

// =============================================
// DOMContentLoaded — init events
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadLiveActivity();

    // Faculty filter
    const facultySelect = document.querySelector('#sec-voters select.form-ctrl');
    if (facultySelect) {
        facultySelect.addEventListener('change', () => {
            const activeTab = document.querySelector('.vt.on');
            if (activeTab) filterV(
                activeTab.textContent.includes('Not') ? 'not'
                : activeTab.textContent.includes('Voted') ? 'voted'
                : 'all',
                activeTab
            );
        });
    }

    // Voter search
    const searchInput = document.querySelector('#sec-voters .tbl-search input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();
            const activeTab = document.querySelector('.vt.on');
            let filtered = allVoters;
            if (activeTab && activeTab.textContent.includes('Not')) {
                filtered = allVoters.filter(v => !v.votes || v.votes.length === 0);
            } else if (activeTab && activeTab.textContent.includes('Voted') && !activeTab.textContent.includes('Not')) {
                filtered = allVoters.filter(v => v.votes && v.votes.length > 0);
            }
            if (q) {
                filtered = filtered.filter(v => v.reg_number.toLowerCase().includes(q) || (v.email && v.email.toLowerCase().includes(q)));
            }
            renderVoters(filtered);
        });
    }
});

// =============================================
// SECTION TITLES & NAV
// =============================================
const TITLES = {
    overview: 'Overview',
    elections: 'Manage Elections',
    positions: 'Manage Positions',
    candidates: 'Manage Candidates',
    results: 'Vote Results',
    voters: 'Registered Voters',
    announcements: 'Announcements',
    reports: 'Reports',
    notifications: 'Notifications',
    logs: 'System Logs',
    past: 'Past Elections',
    settings: 'Settings'
};

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
}

function nav(btn) {
    if (!btn) return;
    const id = btn.dataset.section;
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById('sec-' + id);
    if (sec) sec.classList.add('active');
    btn.classList.add('active');
    document.getElementById('topbar-title').textContent = TITLES[id] || id;
    closeAllDrops();

    if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('mob-open');
    window.scrollTo(0, 0);

    if (id === 'overview')       { initTrend(); }
    if (id === 'results')        { initResults(); loadResults(); }
    if (id === 'logs')           { loadLogs(); }
    if (id === 'elections')      { loadElections(); }
    if (id === 'candidates')     { loadCandidates(); }
    if (id === 'voters')         { loadVoters(); }
    if (id === 'positions')      { loadPositions(); }
    if (id === 'past')           { loadPastElections(); }
    if (id === 'announcements')  { loadAnnouncementHistory(); }
    if (id === 'notifications')  { loadNotifications(); }
}

// =============================================
// DROPDOWNS
// =============================================
function toggleDrop(id) {
    const el = document.getElementById(id);
    const was = el.classList.contains('open');
    closeAllDrops();
    if (!was) el.classList.add('open');
}

function closeAllDrops() {
    document.querySelectorAll('.notif-dropdown,.profile-dropdown').forEach(d => d.classList.remove('open'));
}

document.addEventListener('click', e => {
    if (!e.target.closest('[onclick*="toggleDrop"]') && !e.target.closest('.notif-dropdown') && !e.target.closest('.profile-dropdown'))
        closeAllDrops();
});

// =============================================
// MODALS
// =============================================
function openModal(id) {
    document.getElementById(id).classList.add('open');
    if (id === 'addCandidateModal') loadPositionsDropdown();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
);

// =============================================
// VOTER PANEL
// =============================================
function openVoterPanel() { document.getElementById('voterPanel').classList.add('open'); }
function closeVoterPanel() { document.getElementById('voterPanel').classList.remove('open'); }

function openVoterDetail(v) {
    const panel = document.getElementById('voterPanel');
    const rows = panel.querySelectorAll('.vp-row .vp-v');
    if (rows[0]) rows[0].textContent = v.reg_number;
    if (rows[1]) rows[1].textContent = v.programme || '-';
    if (rows[2]) rows[2].textContent = '-';
    if (rows[3]) rows[3].textContent = v.faculty || '-';
    if (rows[4]) rows[4].textContent = v.email || v.phone || '-';
    if (rows[5]) rows[5].textContent = new Date(v.created_at).toLocaleDateString();

    const hasVoted = v.votes && v.votes.length > 0;
    if (rows[6]) rows[6].innerHTML = hasVoted
        ? '<span class="badge badge-g"><span class="bdot"></span>Voted</span>'
        : '<span class="badge badge-w"><span class="bdot"></span>Not Voted</span>';
    if (rows[7]) rows[7].textContent = hasVoted && v.votes[0].voted_at ? new Date(v.votes[0].voted_at).toLocaleString() : '-';

    const receiptSec = panel.querySelectorAll('.vp-sec')[2];
    if (receiptSec) {
        if (hasVoted) {
            receiptSec.innerHTML = `
                <div class="vp-sec-title">Vote Receipt</div>
                <p style="font-size:11.5px;color:var(--muted);margin-bottom:10px">Candidate choice is never disclosed.</p>
                ${v.votes.map(vote => `
                    <div class="vp-row">
                        <span class="vp-k">${vote.position ? vote.position.title : 'Position ' + vote.position_id}</span>
                        <span class="vp-v"><span class="badge badge-g">Voted</span></span>
                    </div>
                `).join('')}
            `;
        } else {
            receiptSec.innerHTML = `
                <div class="vp-sec-title">Vote Receipt</div>
                <p style="font-size:11.5px;color:var(--muted)">This voter has not voted yet.</p>
            `;
        }
    }
    panel.classList.add('open');
}

// =============================================
// MOBILE
// =============================================
function openDrawer() { document.getElementById('mobDrawer').classList.add('open'); }
function closeDrawer() { document.getElementById('mobDrawer').classList.remove('open'); }
function setBn(el) {
    document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
}

// =============================================
// ANNOUNCEMENTS AUDIENCE FILTER
// =============================================
function selAud(el) {
    document.querySelectorAll('.aud-pill').forEach(p => p.classList.remove('on'));
    el.classList.add('on');
}

// =============================================
// SETTINGS
// =============================================
function switchSettings(el) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('on'));
    const sp = el.dataset.sp;
    document.getElementById('sp-' + sp).classList.add('on');
    el.classList.add('on');
}

// =============================================
// POSITION TYPE TOGGLES
// =============================================
function toggleFacSel() {
    const group = document.getElementById('facSelGroup');
    if (group) group.style.display = document.getElementById('posType')?.value === 'f' ? '' : 'none';
}

// =============================================
// THEME
// =============================================
(function() {
    const THEME_KEY = 'kiutso-admin-theme';
    const html = document.documentElement;

    function getStoredTheme() { return localStorage.getItem(THEME_KEY) || 'system'; }

    function applyTheme(theme) {
        if (theme === 'light') html.setAttribute('data-theme', 'light');
        else if (theme === 'dark') html.setAttribute('data-theme', 'dark');
        else html.removeAttribute('data-theme');
    }

    function updateButtons(activeTheme) {
        document.querySelectorAll('.theme-opt').forEach(btn => {
            btn.classList.toggle('on', btn.getAttribute('data-theme') === activeTheme);
        });
    }

    window.setTheme = function(theme) {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        updateButtons(theme);
    };

    const stored = getStoredTheme();
    applyTheme(stored);
    updateButtons(stored);
})();

// =============================================
// VOTER TABS FILTER
// =============================================
function filterV(t, el) {
    document.querySelectorAll('.vt').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    let filtered = allVoters;
    if (t === 'voted') filtered = allVoters.filter(v => v.votes && v.votes.length > 0);
    else if (t === 'not') filtered = allVoters.filter(v => !v.votes || v.votes.length === 0);

    const facultySelect = document.querySelector('#sec-voters select.form-ctrl');
    if (facultySelect && facultySelect.value !== 'All Faculties') {
        filtered = filtered.filter(v => v.faculty === facultySelect.value);
    }
    renderVoters(filtered);
}

// =============================================
// NOTIFICATIONS FILTER BUTTONS
// =============================================
document.querySelectorAll('.nf-btn').forEach(b =>
    b.addEventListener('click', function() {
        document.querySelectorAll('.nf-btn').forEach(x => x.classList.remove('on'));
        this.classList.add('on');
    })
);

// =============================================
// PROFILE PHOTO UPLOAD
// =============================================
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const src = ev.target.result;
        const img = document.getElementById('profilePhotoImg');
        img.src = src; img.style.display = 'block';
        document.getElementById('photoPreview').childNodes[0].textContent = '';

        const sbImg = document.getElementById('sbAvatarImg');
        sbImg.src = src; sbImg.style.display = 'block';
        document.getElementById('sbAvatar').childNodes[0].textContent = '';

        const tbImg = document.getElementById('topbarAvatarImg');
        tbImg.src = src; tbImg.style.display = 'block';
        document.getElementById('topbarAvatarLetter').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// =============================================
// CHARTS
// =============================================
let tc = null, rc = null;
const chartFont = { family: 'Poppins', size: 11 };
const gridColor = 'rgba(0,0,0,.05)';
const tickColor = '#000';

async function initTrend() {
    if (tc) { tc.destroy(); tc = null; }
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const allHours = [8,9,10,11,12,13,14,15,16,17];
    const labels = allHours.map(h => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);
    const values = new Array(allHours.length).fill(0);

    try {
        const res = await fetch(`${API_URL}/admin/hourly-trend`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        data.forEach(item => {
            const idx = allHours.indexOf(parseInt(item.hour));
            if (idx !== -1) values[idx] = item.total;
        });
    } catch(e) { console.error('Trend error:', e); }

    tc = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: 'Votes', data: values, backgroundColor: 'rgba(10,48,24,.75)', hoverBackgroundColor: 'rgba(5,28,14,.9)', borderRadius: 5, borderSkipped: false }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont, color: tickColor } },
                x: { grid: { display: false }, ticks: { font: chartFont, color: tickColor } }
            }
        }
    });
}

async function loadPositionsDropdown() {
    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const positions = await res.json();
        const select = document.getElementById('cand-position');
        if (!select) return;
        select.innerHTML = '<option value="">Select position...</option>' +
            positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
    } catch(e) { console.error('Positions dropdown error:', e); }
}

function initResults(data) {
    if (rc) return;
    const ctx = document.getElementById('resultsChart');
    if (!ctx) return;

    const labels = data ? data.map(r => r.name) : ['Candidate One', 'Candidate Two'];
    const values = data ? data.map(r => r.votes) : [55, 40];

    rc = new Chart(ctx, {
        type: 'bar',
        indexAxis: 'y',
        data: {
            labels,
            datasets: [{ label: 'Votes', data: values, backgroundColor: 'rgba(10,48,24,.8)', borderRadius: 5, borderSkipped: false }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont, color: tickColor } },
                y: { grid: { display: false }, ticks: { font: chartFont, color: tickColor } }
            }
        }
    });
}
