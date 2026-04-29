    const API_URL = 'https://kiutso-backend-production.up.railway.app/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Kama hajalogini — rudisha login
if (!token || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// Load data ya Overview
async function loadOverview() {
    try {
        const res = await fetch(`${API_URL}/admin/overview`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        if (res.ok) {
            document.querySelectorAll('.stat-num')[0].textContent = data.total_voters;
            document.querySelectorAll('.stat-num')[1].textContent = data.votes_cast;
            document.querySelectorAll('.stat-num')[2].textContent = data.voter_turnout + '%';
            document.querySelectorAll('.stat-num')[4].textContent = data.total_candidates;
        }
    } catch(e) {
        console.error('Overview error:', e);
    }
}

// Load Live Activity
async function loadLiveActivity() {
    try {
        const res = await fetch(`${API_URL}/admin/live-activity`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        if (res.ok && data.length > 0) {
            const list = document.querySelector('.activity-list');
            list.innerHTML = data.map(log => `
                <div class="act-item">
                    <span class="act-dot ${log.action === 'failed_login' ? 'r' : 'g'}" style="margin-top: 6px"></span>
                    <div>
                        <div class="act-text">${log.description}</div>
                        <div class="act-time">${new Date(log.created_at).toLocaleTimeString()}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('Live activity error:', e);
    }
}

// Load System Logs
async function loadLogs() {
    try {
        const res = await fetch(`${API_URL}/admin/logs`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
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
    } catch(e) {
        console.error('Logs error:', e);
    }
}

// Logout
async function adminLogout() {
    if (!confirm('Logout?')) return;
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
    } catch(e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
// Load Elections
async function loadElections() {
    try {
        const res = await fetch(`${API_URL}/admin/elections`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const elections = await res.json();
        
        if (elections.length > 0) {
            const el = elections[0];
            document.querySelector('.ed-top h2').textContent = el.title;
            document.querySelector('.ed-top p').textContent = 'Academic Year 2025/26';
            
            // Status badge
            const badge = document.querySelector('.ed-top .badge');
            if (badge) {
                badge.innerHTML = `<span class="bdot"></span>${el.status.toUpperCase()}`;
                badge.className = `badge ${el.status === 'open' ? 'badge-g' : 'badge-gray'}`;
            }

            // Details
            const rows = document.querySelectorAll('.ed-row .ed-value');
            if (rows[0]) rows[0].textContent = el.voting_opens ? new Date(el.voting_opens).toLocaleString() : '-';
            if (rows[1]) rows[1].textContent = el.voting_closes ? new Date(el.voting_closes).toLocaleString() : '-';
        }
    } catch(e) {
        console.error('Elections error:', e);
    }
}

// Load Results
async function loadResults() {
    try {
        const res = await fetch(`${API_URL}/admin/results`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();

        if (!data || !data.positions) return;

        // Build results table
        const tbody = document.querySelector('#sec-results .tbl tbody');
        if (!tbody) return;

        let rows = [];
        let rank = 1;

        data.positions.forEach(position => {
            position.candidates.forEach(candidate => {
                rows.push({
                    rank: rank++,
                    name: candidate.full_name,
                    position: position.title,
                    votes: candidate.votes_count || 0,
                });
            });
        });

        // Sort by votes
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

        // Update chart
        if (rc) {
            rc.destroy();
            rc = null;
        }
        initResults(rows);

    } catch(e) {
        console.error('Results error:', e);
    }
}
// Load Candidates
async function loadCandidates() {
    try {
        const res = await fetch(`${API_URL}/candidates`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
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
                <td><div class="tbl-avatar-ph">${c.full_name.charAt(0)}</div></td>
                <td class="tbl-name">${c.full_name}</td>
                <td>${c.position ? c.position.title : '-'}</td>
                <td>${c.faculty || '-'}</td>
                <td>${c.reg_number || '-'}</td>
                <td>-</td>
                <td>
                    <button class="btn btn-d btn-sm" onclick="deleteCandidate(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        // Footer
        const visibleEl = document.querySelector('#sec-candidates .visible-entries');
        const totalEl = document.querySelector('#sec-candidates .total-entries');
        if (visibleEl) visibleEl.textContent = candidates.length;
        if (totalEl) totalEl.textContent = candidates.length;

    } catch(e) {
        console.error('Candidates error:', e);
    }
}

// Add Candidate
async function addCandidate() {
    const full_name = document.getElementById('cand-name').value.trim();
    const reg_number = document.getElementById('cand-reg').value.trim();
    const faculty = document.getElementById('cand-faculty').value.trim();
    const position_id = document.getElementById('cand-position').value;
    const bio = document.getElementById('cand-bio').value.trim();
    const manifesto = document.getElementById('cand-manifesto')?.value.trim();
    const photoFile = document.getElementById('cand-photo')?.files[0];

    if (!full_name || !position_id) {
        alert('Jaza jina na position!');
        return;
    }

    try {
        const btn = document.getElementById('cand-submit-btn');
        if (btn) { btn.textContent = 'Inaongeza...'; btn.disabled = true; }

        // Upload picha Cloudinary kwanza (kama ipo)
        let photo_url = null;
        if (photoFile) {
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('upload_preset', 'kiutso_candidates');
            formData.append('cloud_name', 'diiofqbcr');

            const uploadRes = await fetch('https://api.cloudinary.com/v1_1/diiofqbcr/image/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            photo_url = uploadData.secure_url;
        }

        // Tuma candidate kwa backend
        const res = await fetch(`${API_URL}/admin/candidates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                election_id: 1,
                position_id: parseInt(position_id),
                full_name,
                reg_number: reg_number || null,
                faculty: faculty || null,
                bio: bio || null,
                manifesto: manifesto || null,
                photo_url: photo_url || null,
                is_approved: true,
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Mgombea ameongezwa!');
            closeModal('addCandidateModal');
            loadCandidates();
            document.getElementById('cand-name').value = '';
            document.getElementById('cand-reg').value = '';
            document.getElementById('cand-faculty').value = '';
            document.getElementById('cand-bio').value = '';
            if (document.getElementById('cand-manifesto')) document.getElementById('cand-manifesto').value = '';
            if (document.getElementById('cand-photo')) document.getElementById('cand-photo').value = '';
        } else {
            alert(data.message || 'Kuna tatizo!');
        }
    } catch(e) {
        alert('Kuna tatizo la mtandao!');
    } finally {
        const btn = document.getElementById('cand-submit-btn');
        if (btn) { btn.textContent = 'Add Candidate'; btn.disabled = false; }
    }
}
// Delete Candidate
async function deleteCandidate(id) {
    if (!confirm('Futa mgombea huyu?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/candidates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        if (res.ok) {
            alert('Mgombea amefutwa!');
            loadCandidates();
        }
    } catch(e) {
        alert('Kuna tatizo la mtandao!');
    }
}
// Load data ukifungua dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadLiveActivity();
});
 // manage sections titles
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
      }
      // sidebar collapse (desktop)
      function toggleSidebar() {
        const sb = document.getElementById('sidebar')
        sb.classList.toggle('collapsed')
      }
      // Load Voters
// Hifadhi voters data globally
let allVoters = [];

async function loadVoters() {
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();

        if (data.voters) {
            allVoters = data.voters;
            const total = data.total;
            const voted = allVoters.filter(v => v.votes && v.votes.length > 0).length;
            const notVoted = total - voted;

            // Badilisha stats badges juu
            const badges = document.querySelectorAll('#sec-voters .pg-head .badge');
            if (badges[0]) badges[0].textContent = `${total} Total`;
            if (badges[1]) badges[1].textContent = `${voted} Voted`;
            if (badges[2]) badges[2].textContent = `${notVoted} Not Yet`;

            // Badilisha voter tabs
            const tabs = document.querySelectorAll('.vt');
            if (tabs[0]) tabs[0].textContent = `All (${total})`;
            if (tabs[1]) tabs[1].textContent = `Voted (${voted})`;
            if (tabs[2]) tabs[2].textContent = `Not Yet (${notVoted})`;

            // Render table — anza na All
            renderVoters(allVoters);
        }
    } catch(e) {
        console.error('Voters error:', e);
    }
}

// Render voters kwenye table
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
            <td>
                ${v.votes && v.votes.length > 0
                    ? '<span class="badge badge-g"><span class="bdot"></span>Voted</span>'
                    : '<span class="badge badge-w"><span class="bdot"></span>Not Voted</span>'
                }
            </td>
            <td>
                <button class="btn btn-gh btn-sm" onclick='openVoterDetail(${JSON.stringify(v)})'>View</button>
            </td>
        </tr>
    `).join('');

    // Update footer count
    const visibleEl = document.querySelector('#sec-voters .visible-entries');
    const totalEl = document.querySelector('#sec-voters .total-entries');
    if (visibleEl) visibleEl.textContent = voters.length;
    if (totalEl) totalEl.textContent = allVoters.length;
}
      // section navigation 
      function nav(btn) {

        if (!btn) return
        const id = btn.dataset.section
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'))
        document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'))
        const sec = document.getElementById('sec-' + id)

        if (sec) sec.classList.add('active')
        btn.classList.add('active')
        document.getElementById('topbar-title').textContent = TITLES[id] || id
        closeAllDrops()

        if (window.innerWidth < 900)
          document.getElementById('sidebar').classList.remove('mob-open')
        window.scrollTo(0, 0)

        if (id === 'overview') initTrend()
        if (id === 'results') initResults()
        if (id === 'logs') loadLogs()
        if (id === 'elections') loadElections()
        if (id === 'candidates') loadCandidates()
        if (id === 'voters') loadVoters()
        if (id === 'results') loadResults()
      }
      // dropdowns 
      function toggleDrop(id) {
        const el = document.getElementById(id)
        const was = el.classList.contains('open')
        closeAllDrops()
        if (!was) el.classList.add('open')
      }
      function closeAllDrops() {
        document.querySelectorAll('.notif-dropdown,.profile-dropdown').forEach(d => d.classList.remove('open'))
      }
      document.addEventListener('click', e => {
        if (
          !e.target.closest('[onclick*="toggleDrop"]') &&
          !e.target.closest('.notif-dropdown') &&
          !e.target.closest('.profile-dropdown')
        )
          closeAllDrops()
      })
      // form modals
     function openModal(id) {
    document.getElementById(id).classList.add('open');
    if (id === 'addCandidateModal') loadPositionsDropdown();
}
      function closeModal(id) {
        document.getElementById(id).classList.remove('open')
      }
      document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => {
          if (e.target === o) o.classList.remove('open')
        })
      )
      // voter panel 
      function openVoterPanel() {
        document.getElementById('voterPanel').classList.add('open')
      }
      function closeVoterPanel() {
        document.getElementById('voterPanel').classList.remove('open')
      }
      // mobile drawer 
      function openDrawer() {
        document.getElementById('mobDrawer').classList.add('open')
      }
      function closeDrawer() {
        document.getElementById('mobDrawer').classList.remove('open')
      }
      // mobile bottom navbar
      function setBn(el) {
        document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('on'))
        el.classList.add('on')
      }
      // audience /users announcement filter
      function selAud(el) {
        document.querySelectorAll('.aud-pill').forEach(p => p.classList.remove('on'))
        el.classList.add('on')
      }
      // settings panels
      function switchSettings(el) {
        document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('on'))
        document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('on'))
        const sp = el.dataset.sp
        document.getElementById('sp-' + sp).classList.add('on')
        el.classList.add('on')
      }
      // position type toggle
      function toggleFacSel() {
        document.getElementById('facSelGroup').style.display =
          document.getElementById('posType').value === 'f' ? '' : 'none'
      }
      // theme 
      // ========== THEME TOGGLE ==========
      (function() {
        const THEME_KEY = 'kiutso-admin-theme';
        const html = document.documentElement;

        function getStoredTheme() {
          return localStorage.getItem(THEME_KEY) || 'system';
        }

        function applyTheme(theme) {
          if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
          } else if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
          } else {
            html.removeAttribute('data-theme');
          }
        }

        function updateButtons(activeTheme) {
          document.querySelectorAll('.theme-opt').forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            btn.classList.toggle('on', btnTheme === activeTheme);
          });
        }

        window.setTheme = function(theme, clickedBtn) {
          localStorage.setItem(THEME_KEY, theme);
          applyTheme(theme);
          updateButtons(theme);
        };

        // Init
        const stored = getStoredTheme();
        applyTheme(stored);
        updateButtons(stored);
      })();
      // voter tabs filter
     // voter tabs filter — DYNAMIC
function filterV(t, el) {
    document.querySelectorAll('.vt').forEach(b => b.classList.remove('on'));
    el.classList.add('on');

    let filtered = allVoters;
    if (t === 'voted') {
        filtered = allVoters.filter(v => v.votes && v.votes.length > 0);
    } else if (t === 'not') {
        filtered = allVoters.filter(v => !v.votes || v.votes.length === 0);
    }

    // Zingatia faculty filter iliyochaguliwa
    const facultySelect = document.querySelector('#sec-voters select.form-ctrl');
    if (facultySelect && facultySelect.value !== 'All Faculties') {
        filtered = filtered.filter(v => v.faculty === facultySelect.value);
    }

    renderVoters(filtered);
}
// Faculty filter
document.addEventListener('DOMContentLoaded', () => {
    const facultySelect = document.querySelector('#sec-voters select.form-ctrl');
    if (facultySelect) {
        facultySelect.addEventListener('change', () => {
            const activeTab = document.querySelector('.vt.on');
            if (activeTab) filterV(
                activeTab.textContent.includes('Voted') && !activeTab.textContent.includes('Not')
                    ? 'voted'
                    : activeTab.textContent.includes('Not')
                    ? 'not'
                    : 'all',
                activeTab
            );
        });
    }

    // Search by reg number
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
                filtered = filtered.filter(v =>
                    v.reg_number.toLowerCase().includes(q) ||
                    (v.email && v.email.toLowerCase().includes(q))
                );
            }

            renderVoters(filtered);
        });
    }
});

// View button — fungua panel na data halisi
function openVoterDetail(v) {
    const panel = document.getElementById('voterPanel');

    // Profile rows
    const rows = panel.querySelectorAll('.vp-row .vp-v');
    if (rows[0]) rows[0].textContent = v.reg_number;
    if (rows[1]) rows[1].textContent = v.programme || '-';
    if (rows[2]) rows[2].textContent = '-';
    if (rows[3]) rows[3].textContent = v.faculty || '-';
    if (rows[4]) rows[4].textContent = v.email || v.phone || '-';
    if (rows[5]) rows[5].textContent = new Date(v.created_at).toLocaleDateString();

    // Vote status
    const hasVoted = v.votes && v.votes.length > 0;
    if (rows[6]) rows[6].innerHTML = hasVoted
        ? '<span class="badge badge-g"><span class="bdot"></span>Voted</span>'
        : '<span class="badge badge-w"><span class="bdot"></span>Not Voted</span>';

    if (rows[7]) rows[7].textContent = hasVoted && v.votes[0].voted_at
        ? new Date(v.votes[0].voted_at).toLocaleString()
        : '-';

    // Vote Receipt — dynamic
    const receiptSec = panel.querySelectorAll('.vp-sec')[2];
    if (receiptSec) {
        if (hasVoted) {
            const receiptRows = v.votes.map(vote => `
                <div class="vp-row">
                    <span class="vp-k">${vote.position ? vote.position.title : 'Position ' + vote.position_id}</span>
                    <span class="vp-v"><span class="badge badge-g">Voted</span></span>
                </div>
            `).join('');
            receiptSec.innerHTML = `
                <div class="vp-sec-title">Vote Receipt</div>
                <p style="font-size:11.5px;color:var(--muted);margin-bottom:10px">Candidate choice is never disclosed.</p>
                ${receiptRows}
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
      // notifications filter 
      document.querySelectorAll('.nf-btn').forEach(b =>
        b.addEventListener('click', function () {
          document.querySelectorAll('.nf-btn').forEach(x => x.classList.remove('on'))
          this.classList.add('on')
        })
      )
      // profile photo upload part
      function handlePhotoUpload(e) {
        const file = e.target.files[0]

        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
          const src = ev.target.result

          // update settings profile preview
          const img = document.getElementById('profilePhotoImg')
          img.src = src
          img.style.display = 'block'
          document.getElementById('photoPreview').childNodes[0].textContent = ''

          // update sidebar avatar
          const sbImg = document.getElementById('sbAvatarImg')
          sbImg.src = src
          sbImg.style.display = 'block'
          document.getElementById('sbAvatar').childNodes[0].textContent = ''

          // update topbar avatar
          const tbImg = document.getElementById('topbarAvatarImg')
          tbImg.src = src
          tbImg.style.display = 'block'
          document.getElementById('topbarAvatarLetter').style.display = 'none'
        }
        reader.readAsDataURL(file)
      }
      // charts 
      let tc = null,
        rc = null
      const chartFont = { family: 'Poppins', size: 11 }
      const gridColor = 'rgba(0,0,0,.05)'
      const tickColor = '#000'

      //Votes Chart
     // Hourly Voting Trend — Dynamic
async function initTrend() {
    if (tc) {
        tc.destroy();
        tc = null;
    }
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // Maandishi ya default (8am - 5pm)
    const allHours = [8,9,10,11,12,13,14,15,16,17];
    const labels = allHours.map(h => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);
    const values = new Array(allHours.length).fill(0);

    try {
        const res = await fetch(`${API_URL}/admin/hourly-trend`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();

        // Weka votes kwenye saa sahihi
        data.forEach(item => {
            const idx = allHours.indexOf(parseInt(item.hour));
            if (idx !== -1) values[idx] = item.total;
        });
    } catch(e) {
        console.error('Trend error:', e);
    }

    tc = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: values,
                backgroundColor: 'rgba(10,48,24,.75)',
                hoverBackgroundColor: 'rgba(5,28,14,.9)',
                borderRadius: 5,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { font: chartFont, color: tickColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: chartFont, color: tickColor }
                }
            }
        }
    });
}
// Load Positions kwenye dropdown ya addCandidateModal
async function loadPositionsDropdown() {
    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const positions = await res.json();

        const select = document.getElementById('cand-position');
        if (!select) return;

        select.innerHTML = '<option value="">Select position...</option>' +
            positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

    } catch(e) {
        console.error('Positions error:', e);
    }
}
      //Results Chart
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
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: values,
                backgroundColor: 'rgba(10,48,24,.8)',
                borderRadius: 5,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: chartFont, color: tickColor } },
                y: { grid: { display: false }, ticks: { font: chartFont, color: tickColor } }
            }
        }
    });
}