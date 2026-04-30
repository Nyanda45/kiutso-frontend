    const API_URL = 'https://kiutso-backend-production.up.railway.app/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Kama hajalogini — rudisha login
if (!token || user.role !== 'admin') {
    window.location.href = "/src/pages/login.html";
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
    window.location.href = "/src/pages/login.html";
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
                <td>${c.photo_url ? `<img src="${c.photo_url}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : `<div class="tbl-avatar-ph">${c.full_name.charAt(0)}</div>`}</td>
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
// ================================================================
// PATCH — ongeza code hii MWISHONI mwa adminPanel.js iliyopo
// Usibadilishe chochote kilichopo juu — ongeza hii chini tu
// ================================================================

// ── TOAST (badala ya alert) ──────────────────────────────────────
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const colors = { success: '#22c55e', error: '#dc2626', warn: '#f59e0b', info: '#1d4ed8' };
    const toast = document.createElement('div');
    toast.style.cssText = `background:#fff;color:#1e293b;border-left:4px solid ${colors[type] || colors.info};border-radius:8px;padding:12px 18px;box-shadow:0 4px 20px rgba(0,0,0,0.13);font-family:Poppins,sans-serif;font-size:13px;max-width:320px;pointer-events:auto;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.transition = 'opacity 0.3s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── TIME AGO helper ──────────────────────────────────────────────
function timeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// ── ELECTIONS — Pause / Close / Create ──────────────────────────
let currentElectionId = null;

// Override loadElections ili itunze currentElectionId na iwire buttons
const _origLoadElections = loadElections;
async function loadElections() {
    try {
        const res = await fetch(`${API_URL}/admin/elections`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const elections = await res.json();

        if (!Array.isArray(elections) || elections.length === 0) return;

        const el = elections[0];
        currentElectionId = el.id; // hifadhi ID

        document.querySelector('.ed-top h2').textContent = el.title || el.name || 'KIUTSO Elections';
        document.querySelector('.ed-top p').textContent = el.description || 'Academic Year 2025/26';

        const badge = document.querySelector('.ed-top .badge');
        if (badge) {
            const statusMap = {
                open:    { cls: 'badge-g',    label: 'Voting Open' },
                closed:  { cls: 'badge-gray', label: 'Closed' },
                paused:  { cls: 'badge-w',    label: 'Paused' },
                pending: { cls: 'badge-b',    label: 'Upcoming' },
            };
            const s = statusMap[el.status] || { cls: 'badge-gray', label: el.status || 'Unknown' };
            badge.innerHTML = `<span class="bdot"></span>${s.label}`;
            badge.className = `badge ${s.cls}`;
        }

        const rows = document.querySelectorAll('.ed-row .ed-value');
        if (rows[0]) rows[0].textContent = el.voting_opens ? new Date(el.voting_opens).toLocaleString() : (el.start_date ? new Date(el.start_date).toLocaleString() : '-');
        if (rows[1]) rows[1].textContent = el.voting_closes ? new Date(el.voting_closes).toLocaleString() : (el.end_date ? new Date(el.end_date).toLocaleString() : '-');
        if (rows[2]) rows[2].textContent = el.total_candidates ?? '-';
        if (rows[3]) {
            const cast = el.votes_cast ?? el.total_votes ?? '-';
            const total = el.total_voters ?? '-';
            const pct = el.voter_turnout ?? '-';
            rows[3].textContent = `${cast} / ${total} (${pct}%)`;
        }
    } catch(e) {
        console.error('Elections error:', e);
    }
}

async function pauseVoting() {
    if (!currentElectionId) { showToast('Hakuna election iliyochaguliwa!', 'warn'); return; }
    const btn = document.querySelector('#pauseModal .btn-w');
    if (btn) { btn.textContent = 'Inasimamisha...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/elections/${currentElectionId}/pause`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
            showToast('Upigaji kura umesimamishwa!', 'success');
            closeModal('pauseModal');
            loadElections();
        } else {
            const d = await res.json();
            showToast(d.message || 'Tatizo!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = 'Pause Voting'; btn.disabled = false; } }
}

async function closeVotingEarly() {
    const textarea = document.querySelector('#closeVotingModal textarea');
    const reason = textarea ? textarea.value.trim() : '';
    if (!reason) { showToast('Weka sababu ya kufunga!', 'warn'); return; }
    if (!currentElectionId) { showToast('Hakuna election!', 'warn'); return; }
    const btn = document.querySelector('#closeVotingModal .btn-d');
    if (btn) { btn.textContent = 'Inafunga...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/elections/${currentElectionId}/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (res.ok) {
            showToast('Upigaji kura umefungwa!', 'success');
            if (textarea) textarea.value = '';
            closeModal('closeVotingModal');
            loadElections();
        } else {
            const d = await res.json();
            showToast(d.message || 'Tatizo!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = 'Close Voting'; btn.disabled = false; } }
}

async function createElection() {
    const modal = document.getElementById('createElectionModal');
    const nameInput = modal.querySelector('input[type="text"]');
    const startInput = modal.querySelector('input[type="datetime-local"]:first-of-type');
    const endInput = modal.querySelector('input[type="datetime-local"]:last-of-type');
    const name = nameInput ? nameInput.value.trim() : '';
    const start = startInput ? startInput.value : '';
    const end = endInput ? endInput.value : '';
    if (!name || !start || !end) { showToast('Jaza sehemu zote!', 'warn'); return; }
    if (new Date(end) <= new Date(start)) { showToast('End date lazima iwe baada ya start!', 'warn'); return; }
    const btn = modal.querySelector('.btn-p');
    const orig = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Inaunda...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/elections`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title: name, name, voting_opens: start, voting_closes: end, start_date: start, end_date: end })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Election imeundwa!', 'success');
            closeModal('createElectionModal');
            if (nameInput) nameInput.value = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
            loadElections();
        } else {
            showToast(data.message || 'Tatizo!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = orig; btn.disabled = false; } }
}

// ── MANAGE POSITIONS ─────────────────────────────────────────────
async function loadPositions() {
    try {
        const tbody = document.querySelector('#sec-positions .tbl tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)">Inapakia...</td></tr>`;
        const res = await fetch(`${API_URL}/admin/positions`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const positions = await res.json();
        if (!tbody) return;
        if (!Array.isArray(positions) || positions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)">Hakuna positions. Ongeza moja!</td></tr>`;
            return;
        }
        tbody.innerHTML = positions.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td class="tbl-name">${p.title}</td>
                <td><span class="badge ${p.type === 'general' ? 'badge-g' : 'badge-b'}">${p.type === 'general' ? 'General' : 'Faculty'}</span></td>
                <td>${p.faculty || '<span style="color:var(--hint);font-size:12px">All students</span>'}</td>
                <td>${p.min_candidates ?? '-'}</td>
                <td>${p.max_candidates ?? '-'}</td>
                <td>
                    <div class="tbl-actions">
                        <button class="btn btn-icon btn-sm" title="Edit" onclick='openEditPosition(${JSON.stringify(p)})'>
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-icon btn-sm" style="color:var(--red)" title="Delete" onclick="deletePosition(${p.id})">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error('Positions error:', e); showToast('Tatizo kupakia positions!', 'error'); }
}

async function addPosition() {
    const modal = document.getElementById('addPositionModal');
    if (!modal) { showToast('Modal ya position haipatikani!', 'error'); return; }
    const title = modal.querySelector('#pos-title')?.value.trim();
    const type = modal.querySelector('#pos-type')?.value || 'general';
    const faculty = modal.querySelector('#pos-faculty')?.value.trim();
    const min_candidates = parseInt(modal.querySelector('#pos-min')?.value) || 1;
    const max_candidates = parseInt(modal.querySelector('#pos-max')?.value) || 6;
    if (!title) { showToast('Jaza jina la position!', 'warn'); return; }
    const btn = modal.querySelector('.btn-p');
    const orig = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Inaongeza...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title, type, faculty: faculty || null, min_candidates, max_candidates, election_id: currentElectionId || 1 })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Position imeongezwa!', 'success');
            closeModal('addPositionModal');
            _resetPositionModal();
            loadPositions();
            loadPositionsDropdown();
        } else {
            showToast(data.message || 'Tatizo la kuongeza!', 'error');
        }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = orig; btn.disabled = false; } }
}

async function deletePosition(id) {
    if (!confirm('Futa position hii?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) { showToast('Position imefutwa!', 'success'); loadPositions(); }
        else { const d = await res.json(); showToast(d.message || 'Tatizo!', 'error'); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

function openEditPosition(p) {
    openModal('addPositionModal');
    setTimeout(() => {
        const modal = document.getElementById('addPositionModal');
        if (!modal) return;
        const titleEl = modal.querySelector('#pos-title');
        const typeEl = modal.querySelector('#pos-type');
        const facEl = modal.querySelector('#pos-faculty');
        const minEl = modal.querySelector('#pos-min');
        const maxEl = modal.querySelector('#pos-max');
        const btn = modal.querySelector('.btn-p');
        const head = modal.querySelector('.modal-head h3');
        if (titleEl) titleEl.value = p.title || '';
        if (typeEl) { typeEl.value = p.type || 'general'; togglePositionFaculty(); }
        if (facEl && p.faculty) facEl.value = p.faculty;
        if (minEl) minEl.value = p.min_candidates || 1;
        if (maxEl) maxEl.value = p.max_candidates || 6;
        if (btn) { btn.textContent = 'Save Changes'; btn.onclick = () => updatePosition(p.id); }
        if (head) head.textContent = 'Edit Position';
    }, 50);
}

async function updatePosition(id) {
    const modal = document.getElementById('addPositionModal');
    const title = modal.querySelector('#pos-title')?.value.trim();
    const type = modal.querySelector('#pos-type')?.value || 'general';
    const faculty = modal.querySelector('#pos-faculty')?.value.trim();
    const min_candidates = parseInt(modal.querySelector('#pos-min')?.value) || 1;
    const max_candidates = parseInt(modal.querySelector('#pos-max')?.value) || 6;
    if (!title) { showToast('Jaza jina!', 'warn'); return; }
    const btn = modal.querySelector('.btn-p');
    if (btn) { btn.textContent = 'Inasave...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ title, type, faculty: faculty || null, min_candidates, max_candidates })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Position imesasishwa!', 'success');
            closeModal('addPositionModal');
            _resetPositionModal();
            loadPositions();
        } else { showToast(data.message || 'Tatizo!', 'error'); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = 'Add Position'; btn.disabled = false; } }
}

function togglePositionFaculty() {
    const typeEl = document.querySelector('#addPositionModal #pos-type');
    const facGroup = document.querySelector('#addPositionModal #pos-faculty-group');
    if (facGroup) facGroup.style.display = (typeEl && typeEl.value === 'faculty') ? '' : 'none';
}

function _resetPositionModal() {
    const modal = document.getElementById('addPositionModal');
    if (!modal) return;
    const titleEl = modal.querySelector('#pos-title');
    const typeEl = modal.querySelector('#pos-type');
    const facEl = modal.querySelector('#pos-faculty');
    const minEl = modal.querySelector('#pos-min');
    const maxEl = modal.querySelector('#pos-max');
    const btn = modal.querySelector('.btn-p');
    const head = modal.querySelector('.modal-head h3');
    if (titleEl) titleEl.value = '';
    if (typeEl) typeEl.value = 'general';
    if (facEl) facEl.value = '';
    if (minEl) minEl.value = 1;
    if (maxEl) maxEl.value = 6;
    if (btn) { btn.textContent = 'Add Position'; btn.onclick = addPosition; }
    if (head) head.textContent = 'Add Position';
    togglePositionFaculty();
}

// ── PAST ELECTIONS ───────────────────────────────────────────────
async function loadPastElections() {
    const grid = document.querySelector('.past-grid');
    if (grid) grid.innerHTML = `<p style="color:var(--muted);padding:20px">Inapakia...</p>`;
    try {
        const res = await fetch(`${API_URL}/admin/elections/past`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const elections = await res.json();
        if (!grid) return;
        if (!Array.isArray(elections) || elections.length === 0) {
            grid.innerHTML = `<p style="color:var(--muted);padding:20px">Hakuna elections zilizopita.</p>`;
            return;
        }
        grid.innerHTML = elections.map(el => `
            <div class="past-card">
                <div class="past-top">
                    <h3>${el.title || el.name || 'Election'}</h3>
                    <p>${el.voting_closes ? new Date(el.voting_closes).toLocaleDateString() : (el.end_date ? new Date(el.end_date).toLocaleDateString() : '-')}</p>
                </div>
                <div class="past-body">
                    <div class="past-row"><span>Registered</span><span>${el.total_voters ?? '-'}</span></div>
                    <div class="past-row"><span>Votes Cast</span><span>${el.votes_cast ?? el.total_votes ?? '-'}</span></div>
                    <div class="past-row"><span>Turnout</span><span>${el.voter_turnout != null ? el.voter_turnout + '%' : '-'}</span></div>
                </div>
                <div class="past-foot">
                    <button class="btn btn-gh btn-sm" style="flex:1" onclick="exportElection(${el.id},'pdf')">Export PDF</button>
                    <button class="btn btn-gh btn-sm" onclick="exportElection(${el.id},'excel')">Excel</button>
                </div>
            </div>
        `).join('');
    } catch(e) { console.error('Past elections error:', e); if (grid) grid.innerHTML = `<p style="color:var(--red);padding:20px">Tatizo kupakia elections.</p>`; }
}

async function exportElection(id, format = 'pdf') {
    showToast('Inaandaa export...', 'info');
    try {
        const res = await fetch(`${API_URL}/admin/elections/${id}/export?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `election-${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`; a.click();
            URL.revokeObjectURL(url);
            showToast('Export imefanikiwa!', 'success');
        } else { showToast('Export haikuwezekana!', 'error'); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

// ── ANNOUNCEMENTS ────────────────────────────────────────────────
let _selectedAudience = 'all';

async function loadAnnouncementHistory() {
    try {
        const res = await fetch(`${API_URL}/admin/announcements`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        const list = document.querySelector('.ann-list');
        if (!list) return;
        if (!res.ok || !Array.isArray(data) || data.length === 0) {
            list.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:10px 0">Bado hakuna announcements.</p>`;
            return;
        }
        list.innerHTML = data.map(a => `
            <div class="ann-item">
                <div class="ann-head">
                    <div class="ann-subj">${a.subject || a.title || 'Announcement'}</div>
                    <div class="ann-ts">${a.created_at ? new Date(a.created_at).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}</div>
                </div>
                <div class="ann-meta">${
                    a.audience === 'all' ? 'All Voters' : a.audience === 'voted' ? 'Voted' : 'Not Voted'
                } — ${a.recipients_count ?? a.recipients ?? '?'} recipients</div>
            </div>
        `).join('');
    } catch(e) { console.error('Announcements error:', e); }
}

async function sendAnnouncement() {
    const subjectEl = document.querySelector('#sec-announcements input[type="text"]');
    const messageEl = document.querySelector('#sec-announcements textarea');
    const subject = subjectEl ? subjectEl.value.trim() : '';
    const message = messageEl ? messageEl.value.trim() : '';
    if (!subject) { showToast('Weka subject!', 'warn'); return; }
    if (!message) { showToast('Weka message!', 'warn'); return; }
    const btn = document.querySelector('#sec-announcements .btn-p');
    const orig = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Inatuma...'; btn.disabled = true; }
    try {
        const res = await fetch(`${API_URL}/admin/announcements`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ subject, message, audience: _selectedAudience })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Imetumwa kwa ${data.recipients_count ?? '?'} watumiaji!`, 'success');
            if (subjectEl) subjectEl.value = '';
            if (messageEl) messageEl.value = '';
            loadAnnouncementHistory();
        } else { showToast(data.message || 'Tatizo la kutuma!', 'error'); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
    finally { if (btn) { btn.textContent = orig; btn.disabled = false; } }
}

// Override selAud ili itunze _selectedAudience
const _origSelAud = selAud;
function selAud(el) {
    document.querySelectorAll('.aud-pill').forEach(p => p.classList.remove('on'));
    el.classList.add('on');
    const map = { 'All Voters': 'all', 'Voted': 'voted', 'Not Voted': 'not' };
    _selectedAudience = map[el.textContent.trim()] || 'all';
    const hint = document.querySelector('#sec-announcements .form-hint');
    const labels = { all: 'All Voters', voted: 'Voted', not: 'Not Voted' };
    if (hint) hint.textContent = `Selected: ${labels[_selectedAudience]}`;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────
async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}/admin/notifications`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) return;
        const notifications = Array.isArray(data) ? data : (data.notifications || []);
        const unread = notifications.filter(n => !n.read_at).length;

        // Update unread count badge
        document.querySelectorAll('.notif-count').forEach(el => {
            el.textContent = unread > 0 ? unread : '';
            el.style.display = unread > 0 ? '' : 'none';
        });
        // Sidebar badge ya Notifications
        document.querySelectorAll('.sb-badge').forEach(el => {
            if (el.closest('[data-section="notifications"]')) {
                el.textContent = unread > 0 ? unread : '';
                el.style.display = unread > 0 ? '' : 'none';
            }
        });

        // Update heading
        const heading = document.querySelector('#sec-notifications .pg-head-left p');
        if (heading) heading.textContent = `${unread} unread.`;

        // Render list
        const list = document.querySelector('.notif-list');
        if (list) {
            if (notifications.length === 0) {
                list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">Hakuna notifications</div>`;
            } else {
                list.innerHTML = notifications.map(n => {
                    const dot = n.type === 'warning' ? 'w' : n.type === 'error' ? 'r' : 'g';
                    return `
                        <div class="notif-item ${!n.read_at ? 'unread' : ''}" onclick="markNotifRead(${n.id}, this)" style="cursor:pointer">
                            <span class="notif-dot ${dot}"></span>
                            <div class="notif-content">
                                <div class="notif-title">${n.title || n.message || ''}</div>
                                ${n.body ? `<div class="notif-desc">${n.body}</div>` : ''}
                                <div class="notif-ts">${n.created_at ? timeAgo(new Date(n.created_at)) : '-'}</div>
                            </div>
                        </div>`;
                }).join('');
            }
        }

        // Update dropdown (top 4)
        const ndInner = document.getElementById('notif-dd');
        if (ndInner) {
            const head = ndInner.querySelector('.nd-head');
            const foot = ndInner.querySelector('.nd-footer');
            const items = notifications.slice(0, 4).map(n => {
                const dot = n.type === 'warning' ? 'w' : n.type === 'error' ? 'r' : 'g';
                return `
                    <div class="nd-item ${!n.read_at ? 'unread' : ''}">
                        <span class="nd-dot ${dot}"></span>
                        <div>
                            <div class="nd-text">${n.title || n.message || ''}</div>
                            <div class="nd-time">${n.created_at ? timeAgo(new Date(n.created_at)) : '-'}</div>
                        </div>
                    </div>`;
            }).join('');
            if (head && foot) {
                ndInner.innerHTML = '';
                ndInner.appendChild(head);
                ndInner.insertAdjacentHTML('beforeend', items);
                ndInner.appendChild(foot);
            }
        }
    } catch(e) { console.error('Notifications error:', e); }
}

async function markNotifRead(id, el) {
    if (el) el.classList.remove('unread');
    try {
        await fetch(`${API_URL}/admin/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
    } catch(e) {}
}

async function markAllAsRead() {
    try {
        const res = await fetch(`${API_URL}/admin/notifications/read-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
            document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
            const heading = document.querySelector('#sec-notifications .pg-head-left p');
            if (heading) heading.textContent = '0 unread.';
            showToast('Zote zimesomwa!', 'success');
        }
    } catch(e) { showToast('Tatizo!', 'error'); }
}

// ── REPORTS ───────────────────────────────────────────────────────
async function downloadReport(type, format) {
    showToast(`Inaandaa ${format.toUpperCase()} report...`, 'info');
    try {
        const res = await fetch(`${API_URL}/admin/reports/${type}?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `kiutso-${type}-report.${format === 'excel' ? 'xlsx' : format}`; a.click();
            URL.revokeObjectURL(url);
            showToast('Report imepakuliwa!', 'success');
        } else { showToast('Report haikuwezekana!', 'error'); }
    } catch(e) { showToast('Tatizo la mtandao!', 'error'); }
}

// ── PATCH YA nav() — ongeza sections zilizokuwa hazipigwi simu ───
// Tunawrap nav() iliyopo ili iongeze calls zinazokosekana
const _origNav = nav;
function nav(btn) {
    if (!btn) return;
    _origNav(btn);
    const id = btn.dataset.section;
    // Sections ambazo hazikuwa zikipigiwa simu — zinaongezwa sasa
    if (id === 'positions')     loadPositions();
    if (id === 'past')          loadPastElections();
    if (id === 'announcements') loadAnnouncementHistory();
    if (id === 'notifications') loadNotifications();
}

// ── WIRE BUTTONS wakati DOM inapoload ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Elections modals
    const pauseBtn = document.querySelector('#pauseModal .btn-w');
    if (pauseBtn) pauseBtn.onclick = pauseVoting;

    const closeBtn = document.querySelector('#closeVotingModal .btn-d');
    if (closeBtn) closeBtn.onclick = closeVotingEarly;

    const createBtn = document.querySelector('#createElectionModal .btn-p');
    if (createBtn) createBtn.onclick = createElection;

    // Mark all as read
    const markAllBtn = document.querySelector('#sec-notifications .btn-gh');
    if (markAllBtn) markAllBtn.onclick = markAllAsRead;

    // Send announcement
    const sendBtn = document.querySelector('#sec-announcements .btn-p');
    if (sendBtn) sendBtn.onclick = sendAnnouncement;

    // Report buttons
    const reportCards = document.querySelectorAll('.report-card');
    const reportTypes = ['voter-turnout', 'candidate-summary', 'election-timeline'];
    reportCards.forEach((card, i) => {
        const btns = card.querySelectorAll('.btn');
        if (btns[0]) btns[0].onclick = () => downloadReport(reportTypes[i], 'pdf');
        if (btns[1]) btns[1].onclick = () => downloadReport(reportTypes[i], 'excel');
    });

    // Results export
    const resultsExports = document.querySelectorAll('#sec-results .pg-head .btn-gh');
    if (resultsExports[0]) resultsExports[0].onclick = () => downloadReport('results', 'pdf');
    if (resultsExports[1]) resultsExports[1].onclick = () => downloadReport('results', 'excel');

    // Load notifications mara moja
    loadNotifications();

    // Position modal — reset state
    const addPosModalOpen = document.querySelector('[onclick="openModal(\'addPositionModal\')"]');
    if (addPosModalOpen) addPosModalOpen.addEventListener('click', _resetPositionModal);

    // Notification filters — ongeza filter ya kweli
    document.querySelectorAll('.nf-btn').forEach(b => {
        b.addEventListener('click', function() {
            const filter = this.textContent.trim().toLowerCase();
            document.querySelectorAll('.notif-item').forEach(item => {
                if (filter === 'all') { item.style.display = ''; return; }
                const dot = item.querySelector('.notif-dot');
                if (!dot) return;
                const match = (filter === 'info' && dot.classList.contains('g')) ||
                              (filter === 'warning' && dot.classList.contains('w')) ||
                              (filter === 'error' && dot.classList.contains('r'));
                item.style.display = match ? '' : 'none';
            });
        });
    });
});
// ============================================================
// KIUTSO ADMIN PANEL — PATCH FILE
// Ongeza mwishoni mwa adminPanel.js yako (kabla ya closing brace)
// Hii inaongeza tu functions zinazokosekana — haishabihishi zilizopo
// ============================================================

// ─── TOAST (badala ya alert()) ───────────────────────────────
function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:9999;
            display:flex; flex-direction:column; gap:8px;
        `;
        document.body.appendChild(container);
    }
    const colors = {
        success: '#0a3018',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#1d4ed8'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `
        background:${colors[type] || colors.success}; color:#fff;
        padding:12px 18px; border-radius:10px; font-size:13.5px;
        font-family:'Poppins',sans-serif; font-weight:500;
        box-shadow:0 4px 20px rgba(0,0,0,0.18);
        animation:toastin 0.25s ease;
        max-width:300px; line-height:1.5;
    `;
    toast.textContent = msg;

    // Ongeza style ya animation kwenye head (mara moja tu)
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes toastin { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none; } }
            @keyframes toastout { from { opacity:1; } to { opacity:0; transform:translateY(10px); } }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastout 0.25s ease forwards';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

// ─── MANAGE ELECTIONS ────────────────────────────────────────

// Unda Election mpya
async function createElection() {
    const title = document.getElementById('election-title')?.value.trim();
    const voting_opens = document.getElementById('election-opens')?.value;
    const voting_closes = document.getElementById('election-closes')?.value;

    if (!title || !voting_opens || !voting_closes) {
        showToast('Jaza sehemu zote!', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('create-election-btn');
        if (btn) { btn.textContent = 'Inaunda...'; btn.disabled = true; }

        const res = await fetch(`${API_URL}/admin/elections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ title, voting_opens, voting_closes })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Election imeundwa!', 'success');
            closeModal('createElectionModal');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        const btn = document.getElementById('create-election-btn');
        if (btn) { btn.textContent = 'Create Election'; btn.disabled = false; }
    }
}

// Simamisha (Pause) upigaji kura
async function pauseVoting(electionId) {
    if (!confirm('Simamisha upigaji kura kwa muda?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/elections/${electionId}/pause`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Upigaji kura umesimamishwa!', 'warning');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// Funga (Close) upigaji kura mapema
async function closeVotingEarly(electionId) {
    if (!confirm('Funga upigaji kura sasa hivi? Hatua hii haiwezi kubatilishwa.')) return;
    try {
        const res = await fetch(`${API_URL}/admin/elections/${electionId}/close`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Upigaji kura umefungwa!', 'success');
            loadElections();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// ─── MANAGE POSITIONS ────────────────────────────────────────
let allPositions = [];

async function loadPositions() {
    try {
        const res = await fetch(`${API_URL}/admin/positions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        allPositions = await res.json();
        renderPositions(allPositions);
    } catch (e) {
        console.error('Positions error:', e);
        showToast('Tatizo kupakia positions!', 'error');
    }
}

function renderPositions(positions) {
    const tbody = document.querySelector('#sec-positions .tbl tbody');
    if (!tbody) return;

    if (!positions || positions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">Hakuna positions zilizopatikana</td></tr>`;
        return;
    }

    tbody.innerHTML = positions.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td class="tbl-name">${p.title}</td>
            <td>${p.type === 'f' ? 'Faculty' : 'University-wide'}</td>
            <td>${p.faculty || '-'}</td>
            <td>${p.candidates_count ?? '-'}</td>
            <td class="tbl-actions">
                <button class="btn btn-gh btn-sm" onclick="editPosition(${p.id}, '${p.title}', '${p.type || 'u'}', '${p.faculty || ''}')">Edit</button>
                <button class="btn btn-d btn-sm" onclick="deletePosition(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');

    const visibleEl = document.querySelector('#sec-positions .visible-entries');
    const totalEl = document.querySelector('#sec-positions .total-entries');
    if (visibleEl) visibleEl.textContent = positions.length;
    if (totalEl) totalEl.textContent = positions.length;
}

async function addPosition() {
    const title = document.getElementById('pos-title')?.value.trim();
    const type = document.getElementById('posType')?.value || 'u';
    const faculty = document.getElementById('pos-faculty')?.value.trim();

    if (!title) {
        showToast('Jaza jina la position!', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('pos-submit-btn');
        if (btn) { btn.textContent = 'Inaongeza...'; btn.disabled = true; }

        const res = await fetch(`${API_URL}/admin/positions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                title,
                type,
                faculty: type === 'f' ? faculty : null,
                election_id: 1
            })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Position imeongezwa!', 'success');
            closeModal('addPositionModal');
            document.getElementById('pos-title').value = '';
            loadPositions();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        const btn = document.getElementById('pos-submit-btn');
        if (btn) { btn.textContent = 'Add Position'; btn.disabled = false; }
    }
}

function editPosition(id, title, type, faculty) {
    document.getElementById('edit-pos-id').value = id;
    document.getElementById('edit-pos-title').value = title;
    if (document.getElementById('editPosType')) {
        document.getElementById('editPosType').value = type;
        toggleEditFacSel();
    }
    if (document.getElementById('edit-pos-faculty')) {
        document.getElementById('edit-pos-faculty').value = faculty;
    }
    openModal('editPositionModal');
}

function toggleEditFacSel() {
    const facGroup = document.getElementById('editFacSelGroup');
    if (facGroup) {
        facGroup.style.display = document.getElementById('editPosType')?.value === 'f' ? '' : 'none';
    }
}

async function updatePosition() {
    const id = document.getElementById('edit-pos-id')?.value;
    const title = document.getElementById('edit-pos-title')?.value.trim();
    const type = document.getElementById('editPosType')?.value || 'u';
    const faculty = document.getElementById('edit-pos-faculty')?.value.trim();

    if (!title) {
        showToast('Jaza jina la position!', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('edit-pos-submit-btn');
        if (btn) { btn.textContent = 'Inasasisha...'; btn.disabled = true; }

        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ title, type, faculty: type === 'f' ? faculty : null })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Position imesasishwa!', 'success');
            closeModal('editPositionModal');
            loadPositions();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        const btn = document.getElementById('edit-pos-submit-btn');
        if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    }
}

async function deletePosition(id) {
    if (!confirm('Futa position hii? Wagombea waliopo ndani watafutwa pia.')) return;
    try {
        const res = await fetch(`${API_URL}/admin/positions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        if (res.ok) {
            showToast('Position imefutwa!', 'success');
            loadPositions();
        } else {
            const data = await res.json();
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// ─── PAST ELECTIONS ──────────────────────────────────────────
async function loadPastElections() {
    const grid = document.querySelector('#sec-past .past-grid');
    if (!grid) return;

    grid.innerHTML = `<p style="color:var(--muted);font-size:13px">Inapakia...</p>`;

    try {
        const res = await fetch(`${API_URL}/admin/elections/past`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const elections = await res.json();

        if (!elections || elections.length === 0) {
            grid.innerHTML = `<p style="color:var(--muted);font-size:13px">Hakuna uchaguzi uliopita.</p>`;
            return;
        }

        grid.innerHTML = elections.map(el => `
            <div class="past-card">
                <div class="past-top">
                    <h3>${el.title}</h3>
                    <p>${el.academic_year || 'Academic Year'}</p>
                </div>
                <div class="past-body">
                    <div class="past-row">
                        <span>Ilianza</span>
                        <span>${el.voting_opens ? new Date(el.voting_opens).toLocaleDateString() : '-'}</span>
                    </div>
                    <div class="past-row">
                        <span>Ilimalizika</span>
                        <span>${el.voting_closes ? new Date(el.voting_closes).toLocaleDateString() : '-'}</span>
                    </div>
                    <div class="past-row">
                        <span>Jumla ya Kura</span>
                        <span>${el.total_votes ?? '-'}</span>
                    </div>
                    <div class="past-row">
                        <span>Ushiriki</span>
                        <span>${el.voter_turnout ? el.voter_turnout + '%' : '-'}</span>
                    </div>
                </div>
                <div class="past-foot">
                    <button class="btn btn-gh btn-sm" onclick="viewPastResults(${el.id})">View Results</button>
                    <button class="btn btn-gh btn-sm" onclick="exportPastElection(${el.id})">Export</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = `<p style="color:var(--red);font-size:13px">Tatizo kupakia uchaguzi uliopita.</p>`;
        console.error('Past elections error:', e);
    }
}

async function viewPastResults(electionId) {
    showToast('Inapakia matokeo...', 'info');
    try {
        const res = await fetch(`${API_URL}/admin/elections/${electionId}/results`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Matokeo yamepakiwa — angalia Results section', 'success');
            // Switch to results section
            const resultsBtn = document.querySelector('[data-section="results"]');
            if (resultsBtn) nav(resultsBtn);
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

async function exportPastElection(electionId) {
    showToast('Inaandaa export...', 'info');
    try {
        const res = await fetch(`${API_URL}/admin/elections/${electionId}/export`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `election_${electionId}_results.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Export imefanikiwa!', 'success');
        } else {
            showToast('Tatizo la export!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────
async function loadAnnouncementHistory() {
    try {
        const res = await fetch(`${API_URL}/admin/announcements`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const announcements = await res.json();

        const list = document.querySelector('.ann-list');
        if (!list) return;

        if (!announcements || announcements.length === 0) {
            list.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px 0">Hakuna matangazo yaliyotumwa bado.</p>`;
            return;
        }

        list.innerHTML = announcements.map(ann => `
            <div class="ann-item">
                <div class="ann-head">
                    <span class="ann-subj">${ann.subject || ann.title}</span>
                    <span class="ann-ts">${new Date(ann.created_at).toLocaleString()}</span>
                </div>
                <div class="ann-meta">
                    Kwa: <strong>${ann.audience || 'Wote'}</strong> · 
                    ${ann.sent_count ? `Watu ${ann.sent_count} walipokea` : ''}
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Announcements error:', e);
    }
}

async function sendAnnouncement() {
    const subject = document.getElementById('ann-subject')?.value.trim();
    const message = document.getElementById('ann-message')?.value.trim();
    const audience = document.querySelector('.aud-pill.on')?.dataset.aud || 'all';

    if (!subject || !message) {
        showToast('Jaza kichwa na ujumbe!', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('ann-send-btn');
        if (btn) { btn.textContent = 'Inatuma...'; btn.disabled = true; }

        const res = await fetch(`${API_URL}/admin/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ subject, message, audience })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Tangazo limetumwa!', 'success');
            document.getElementById('ann-subject').value = '';
            document.getElementById('ann-message').value = '';
            loadAnnouncementHistory();
        } else {
            showToast(data.message || 'Kuna tatizo!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    } finally {
        const btn = document.getElementById('ann-send-btn');
        if (btn) { btn.textContent = 'Send Announcement'; btn.disabled = false; }
    }
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
let allNotifications = [];

async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}/admin/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await res.json();
        allNotifications = data.notifications || data || [];
        renderNotifications(allNotifications);

        // Sasisha count kwenye topbar
        const unreadCount = allNotifications.filter(n => !n.read_at).length;
        const countEl = document.querySelector('.notif-count');
        if (countEl) countEl.textContent = unreadCount > 0 ? unreadCount : '';
    } catch (e) {
        console.error('Notifications error:', e);
    }
}

function renderNotifications(notifications) {
    const list = document.querySelector('#sec-notifications .notif-list');
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:30px 0">Hakuna arifa kwa sasa.</p>`;
        return;
    }

    const dotColor = (type) => {
        if (type === 'success' || type === 'vote') return 'g';
        if (type === 'warning') return 'w';
        if (type === 'error') return 'r';
        return 'g';
    };

    list.innerHTML = notifications.map(n => `
        <div class="notif-item ${!n.read_at ? 'unread' : ''}" onclick="markNotifRead(${n.id}, this)">
            <div class="notif-dot ${dotColor(n.type)}"></div>
            <div class="notif-content">
                <div class="notif-title">${n.title || n.data?.title || 'Arifa'}</div>
                <div class="notif-desc">${n.message || n.data?.message || ''}</div>
                <div class="notif-ts">${new Date(n.created_at).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

async function markNotifRead(id, el) {
    if (el && el.classList.contains('unread')) {
        el.classList.remove('unread');
        try {
            await fetch(`${API_URL}/admin/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
        } catch (e) {}
    }
}

async function markAllAsRead() {
    try {
        const res = await fetch(`${API_URL}/admin/notifications/read-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        if (res.ok) {
            document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
            showToast('Arifa zote zimesomwa!', 'success');
            const countEl = document.querySelector('.notif-count');
            if (countEl) countEl.textContent = '';
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// Filter notifications (All / Unread / System)
function filterNotifications(type) {
    let filtered = allNotifications;
    if (type === 'unread') {
        filtered = allNotifications.filter(n => !n.read_at);
    } else if (type === 'system') {
        filtered = allNotifications.filter(n => n.type === 'system');
    }
    renderNotifications(filtered);
}

// ─── REPORTS ─────────────────────────────────────────────────
async function downloadReport(type, format = 'pdf') {
    showToast(`Inaandaa ${type} report...`, 'info');
    try {
        const res = await fetch(`${API_URL}/admin/reports/${type}?format=${format}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'excel' ? 'xlsx' : 'pdf';
            a.download = `kiutso_${type}_report.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Report imepakiwa!', 'success');
        } else {
            const data = await res.json();
            showToast(data.message || 'Tatizo kupakua report!', 'error');
        }
    } catch (e) {
        showToast('Tatizo la mtandao!', 'error');
    }
}

// ─── SASISHA nav() ILI IPIGE SIMU FUNCTIONS MPYA ─────────────
// Override ya nav() iliyopo — inaongeza sections zilizokuwa hazifanyi kazi
const _originalNav = window.nav;
window.nav = function(btn) {
    if (!btn) return;
    const id = btn.dataset.section;

    // Piga simu nav ya awali
    if (typeof _originalNav === 'function') _originalNav(btn);

    // Piga simu functions mpya kulingana na section
    if (id === 'positions') loadPositions();
    if (id === 'past') loadPastElections();
    if (id === 'announcements') loadAnnouncementHistory();
    if (id === 'notifications') loadNotifications();
};

// ─── NOTIFICATION FILTER BUTTONS ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Weka data-aud kwenye aud-pills (announcements)
    const audPills = document.querySelectorAll('.aud-pill');
    const audValues = ['all', 'voters', 'candidates'];
    audPills.forEach((pill, i) => {
        if (!pill.dataset.aud) pill.dataset.aud = audValues[i] || 'all';
    });

    // Notification filter buttons
    const nfBtns = document.querySelectorAll('.nf-btn');
    const nfTypes = ['all', 'unread', 'system'];
    nfBtns.forEach((btn, i) => {
        btn.addEventListener('click', function () {
            nfBtns.forEach(b => b.classList.remove('on'));
            this.classList.add('on');
            filterNotifications(nfTypes[i] || 'all');
        });
    });
});
