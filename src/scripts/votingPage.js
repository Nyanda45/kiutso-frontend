
    // Load candidates kutoka API
async function loadCandidatesFromAPI() {
    try {
        const res = await fetch(`${API_URL}/candidates?election_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const candidates = await res.json();

        // Gawanya candidates kwa position
        const presidents = candidates.filter(c => c.position_id === 1);
        const mps = candidates.filter(c => c.position_id === 2);

        // Load President candidates
        const presGrid = document.getElementById('grid-president');
        presGrid.innerHTML = presidents.map(c => `
            <div class="cand-card" id="card-${c.id}" onclick="selectCandAPI('president', ${c.id}, this)">
                <div class="cand-check">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="cand-photo">
                    <div class="cand-photo-ph">${c.full_name.charAt(0)}</div>
                </div>
                <div class="cand-body">
                    <div class="cand-name">${c.full_name}</div>
                    <div class="cand-role">PRESIDENT</div>
                    <div class="cand-bio">${c.bio || ''}</div>
                </div>
                <div class="cand-footer">
                    <button class="cand-select-btn" onclick="selectCandAPI('president', ${c.id}, document.getElementById('card-${c.id}')); event.stopPropagation();">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>Vote
                    </button>
                </div>
            </div>
        `).join('');

        // Load MP candidates
        const mpGrid = document.getElementById('grid-mp');
        mpGrid.innerHTML = mps.map(c => `
            <div class="cand-card" id="card-${c.id}" onclick="selectCandAPI('mp', ${c.id}, this)">
                <div class="cand-check">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="cand-photo">
                    <div class="cand-photo-ph">${c.full_name.charAt(0)}</div>
                </div>
                <div class="cand-body">
                    <div class="cand-name">${c.full_name}</div>
                    <div class="cand-role">MP</div>
                    <div class="cand-bio">${c.bio || ''}</div>
                </div>
                <div class="cand-footer">
                    <button class="cand-select-btn" onclick="selectCandAPI('mp', ${c.id}, document.getElementById('card-${c.id}')); event.stopPropagation();">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>Vote
                    </button>
                </div>
            </div>
        `).join('');

    } catch(e) {
        console.error('Error loading candidates:', e);
    }
}
const API_URL = 'https://kiutso-backend-production.up.railway.app/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Kama hajalogini — rudisha login
if (!token) {
    window.location.href = 'login.html';
}
// Select candidate kutoka API
function selectCandAPI(position, id, card) {
    const grid = card.closest('.cand-grid');
    grid.querySelectorAll('.cand-card').forEach(c => {
        c.classList.remove('sel');
        c.querySelector('.cand-select-btn').innerHTML = `
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
            </svg> Vote`;
    });
    card.classList.add('sel');
    card.querySelector('.cand-select-btn').innerHTML = `
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
        </svg> Voted`;
    
    votes[position] = id;
    
    if (position === 'president') {
        document.getElementById('pres-cnt').textContent = '1';
        document.getElementById('val1').classList.remove('show');
    }
    if (position === 'mp') {
        document.getElementById('mp-cnt').textContent = '1';
        document.getElementById('val2').classList.remove('show');
    }
}
// Kama hajalogini — rudisha login
if (!token) {
    window.location.href = 'login.html';
}

// Onyesha reg number na faculty kwenye nav
document.addEventListener('DOMContentLoaded', () => {
    const regEl = document.querySelector('.nav-voter-info .reg');
    const facEl = document.querySelector('.nav-voter-info .faculty');
    if (regEl) regEl.textContent = user.reg_number || '';
    if (facEl) facEl.textContent = 'Faculty: ' + (user.faculty || '');
});
      // candidates data
      const CANDIDATES = {
        c1: {
          id: "c1",
          position: "president",
          name: "Candidate One",
          fullName: "Candidate One",
          role: "President",
          type: "gen",
          typeLabel: "President Position",
          faculty: "All Faculties",
          course: "Bachelor of Computer Science",
          year: "3rd Year",
          bio: "Committed to academic excellence and student welfare across all KIUT faculties. Advocates for improved campus facilities and stronger student representation.",
          manifesto: "My campaign is built on three pillars academic quality, student welfare, and transparent governance. I believe every student deserves access to quality learning resources, responsive administration, and a voice in university decisions. If elected, I will meet with the Dean of Students quarterly, publish monthly reports on student government activities, and advocate for improved hostel conditions and cafeteria quality.",
          slogans: "1. Monthly open forum meetings with students and administration.\n 2. Establish a student emergency fund for financial hardship cases.\n 3. Negotiate extended library and lab hours.\n 4. Create a formal student feedback system for course quality.",
        },
        c2: {
          id: "c2",
          position: "president",
          name: "Candidate Two",
          fullName: "Candidate Two",
          role: "President",
          type: "gen",
          typeLabel: "President Position",
          faculty: "All Faculties",
          course: "Bachelor of Laws",
          year: "2nd Year",
          bio: "Focused on transparent communication and student-administration relations. Plans to establish a formal student grievance resolution committee.",
          manifesto: "Good governance starts with listening. As a Law student I understand the importance of proper channels, accountability, and documented processes. I will formalize the relationship between the student government and university administration through written agreements and measurable commitments. No more verbal promises that go unfulfilled.",
          slogans: "1. Establish a written Student Rights Charter with the university.\n 2. Create a digital grievance system with 72 hour response guarantee.\n 3. Introduce student representation on key university committees.\n 4. Publish a monthly accountability report on all SG activities.",
        },
        m1: {
          id: "m1",
          position: "mp",
          name: "Candidate One",
          fullName: "MP One",
          role: "Member of Parliament",
          type: "fac",
          typeLabel: "Faculty Position",
          faculty: "Computing and IT",
          course: "Bachelor of Computer Science",
          year: "3rd Year",
          bio: "3rd year Computer Science student committed to improving lab resources, internet access, and industry attachment opportunities for computing students.",
          manifesto: "The Computing and IT faculty is the backbone of the digital future, yet our students face outdated equipment, unreliable internet, and limited industry exposure. I have spent two years documenting these challenges and building relationships with local tech companies who are ready to partner with us. My election means real change backed by real plans.",
          slogans: "1. Negotiate 100Mbps dedicated internet for the computing labs.\n 2. Partner with 5 local tech firms for annual internship placements.\n 3. Introduce weekly coding workshops led by industry professionals.\n 4. Upgrade at least 30 lab computers within the first semester.",
        },
        m2: {
          id: "m2",
          position: "mp",
          name: "Candidate Two",
          fullName: "MP Two",
          role: "Member of Parliament",
          type: "fac",
          typeLabel: "Faculty Position",
          faculty: "Computing and IT",
          course: "Bachelor of IT",
          year: "2nd Year",
          bio: "2nd year IT student with student organizing experience. Focused on connecting computing students with tech companies and internship programs.",
          manifesto: "The gap between what we study and what industry needs is too wide. I have personally organized three industry visits this year and seen how much our students benefit from real world exposure. As MP, I will make industry connection a permanent, structured part of the Computing and IT experience not just occasional trips, but sustained partnerships.",
          slogans: "1. Establish a Computing and IT alumni mentorship program.\n 2. Organize a biannual Tech Career Fair exclusive to our faculty.\n 3. Create a shared project repository for student portfolios.\n 4. Introduce a peer tutoring program with student facilitators.",
        },
        m3: {
          id: "m3",
          position: "mp",
          name: "Candidate Three",
          fullName: "MP Three",
          role: "Member of Parliament",
          type: "fac",
          typeLabel: "Faculty Position",
          faculty: "Computing and IT",
          course: "Diploma in Computer Science",
          year: "2nd Year",
          bio: "Diploma CS student advocating for extended computer lab hours, affordable printing services, and a stronger alumni network for computing graduates.",
          manifesto: "As a Diploma student I represent the students who are often overlooked in faculty decisions that tend to favour degree programmes. My campaign is about equity within our faculty equal access to resources, equal representation in decisions, and equal opportunities for all computing students regardless of their programme level.",
          slogans: "1. Extend computing lab hours to 10pm on weekdays and open on Saturdays.\n 2. Negotiate subsidized printing rates for computing assignments.\n 3. Create a Diploma to Degree transition support programme.\n 4. Form a Computing and IT WhatsApp community managed by elected reps.",
        },
        m4: {
          id: "m4",
          position: "mp",
          name: "Candidate Four",
          fullName: "MP Four",
          role: "Member of Parliament",
          type: "fac",
          typeLabel: "Faculty Position",
          faculty: "Computing and IT",
          course: "Bachelor of Computer Science",
          year: "3rd Year",
          bio: "Passionate about bridging theory and practical skills. Plans to organize monthly hackathons, coding competitions, and industry mentorship sessions.",
          manifesto: "We learn the theory. We write the code. But when we leave, do we have a portfolio? Do we have real projects? My campaign focuses on making our time at KIUT count by ensuring every student leaves with practical experience, a professional network, and projects they are proud of. Hackathons, open source contributions, and industry partnerships will be the pillars of my tenure.",
          slogans: "1. Monthly faculty hackathon with prizes from industry sponsors. \n 2. Launch a KIUT Computing open source project on GitHub.\n 3. Partner with international exposure opportunities.\n 4. Create a student run tech help desk for the university community.",
        },
      };

      // vote state 
      const votes = { president: null, mp: null };
      let currentModalId = null;

      // initialize page state 
     window.onload = function () {
    if (PAGE_STATE === "already-voted") {
        document.getElementById("state-voted").style.display = "";
    } else if (PAGE_STATE === "results-out") {
        document.getElementById("state-voted").style.display = "";
        document.getElementById("viewResultsBtn").classList.add("show");
    } else {
        document.getElementById("state-voting").style.display = "";
        loadCandidatesFromAPI(); // ← Ongeza hii!
    }
};

      // select candidate 
      function selectCand(position, id, card) {
        const grid = card.closest(".cand-grid");
        grid.querySelectorAll(".cand-card").forEach((c) => {
          c.classList.remove("sel");
          c.querySelector(".cand-select-btn").innerHTML =
            `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg> Vote`;
        });
        card.classList.add("sel");
        card.querySelector(".cand-select-btn").innerHTML =
          `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Voted`;
        votes[position] = id;
        if (position === "president") {
          document.getElementById("pres-cnt").textContent = "1";
          document.getElementById("val1").classList.remove("show");
        }
        if (position === "mp") {
          document.getElementById("mp-cnt").textContent = "1";
          document.getElementById("val2").classList.remove("show");
        }
        // update modal select button if open
        if (currentModalId) updateModalBtn();
      }

      // step navigation 
      function goStep(n) {
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
        document.getElementById("panel-" + n).classList.add("on");
        updateProgress(n);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function toStep2() {
        if (!votes.president) {
          document.getElementById("val1").classList.add("show");
          return;
        }
        goStep(2);
      }
      function toStep3() {
        if (!votes.mp) {
          document.getElementById("val2").classList.add("show");
          return;
        }
        buildReview();
        goStep(3);
      }

      // build review 
      function buildReview() {
    const items = [
        {
            key: "president",
            posLabel: "President",
            type: "gen",
            typeLabel: "President Position",
        },
        {
            key: "mp",
            posLabel: "MP Computing and IT",
            type: "fac",
            typeLabel: "MP Position",
        },
    ];
    document.getElementById("reviewList").innerHTML = items
        .map((item) => {
            const candidateId = votes[item.key];
            const card = document.getElementById("card-" + candidateId);
            const name = card ? card.querySelector('.cand-name').textContent : 'Selected';
            return `
              <div class="review-item">
                <div class="ri-avatar"></div>
                <div class="ri-body">
                  <div class="ri-pos">${item.posLabel}</div>
                  <div class="ri-name">${name}</div>
                </div>
                <span class="ri-type ${item.type}">${item.typeLabel}</span>
                <button class="ri-change" onclick="goStep(${item.type === "gen" ? 1 : 2})">Change</button>
              </div>`;
        })
        .join("");
}

     async function submitVote() {
    const btn = document.getElementById('submitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    // Pata candidate IDs za database kulingana na jina
    const candidateMap = {
        'c1': 1,  // Candidate One - President
        'c2': 2,  // Candidate Two - President
        'm1': 3,  // Candidate One - MP
        'm2': 4,  // Candidate Two - MP
        'm3': 5,  // Candidate Three - MP
        'm4': 6,  // Candidate Four - MP
    };

    const presidentDbId = candidateMap[votes.president];
    const mpDbId = candidateMap[votes.mp];

    try {
        // Piga kura ya President
        const presVote = await fetch(`${API_URL}/votes/cast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                election_id: 1,
                position_id: 1,
                candidate_id: votes.president,
            }),
        });

        const presData = await presVote.json();

        if (!presVote.ok) {
            alert(presData.message || 'Kuna tatizo la kupiga kura ya President!');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        // Piga kura ya MP
        const mpVote = await fetch(`${API_URL}/votes/cast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                election_id: 1,
                position_id: 2,
                candidate_id: votes.mp,
            }),
        });

        const mpData = await mpVote.json();

        if (!mpVote.ok) {
            alert(mpData.message || 'Kuna tatizo la kupiga kura ya MP!');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }
        // Jaza Vote Receipt
        const presCard = document.getElementById('card-' + votes.president);
        const mpCard = document.getElementById('card-' + votes.mp);
        const presName = presCard ? presCard.querySelector('.cand-name').textContent : 'Voted';
        const mpName = mpCard ? mpCard.querySelector('.cand-name').textContent : 'Voted';

        const now = new Date().toLocaleString();

        document.getElementById('successReceiptContent').innerHTML = `
            <div class="r-row">
                <span class="r-k">Voter ID</span>
                <span class="r-v">${user.reg_number || '-'}</span>
            </div>
            <div class="r-row">
                <span class="r-k">Submitted</span>
                <span class="r-v">${now}</span>
            </div>
            <div class="r-row">
                <span class="r-k">Election</span>
                <span class="r-v">KIUTSO Elections 2025/26</span>
            </div>
            <div class="r-row">
                <span class="r-k">President</span>
                <span class="r-v">Voted ✓</span>
            </div>
            <div class="r-row">
                <span class="r-k">MP Position</span>
                <span class="r-v">Voted ✓</span>
            </div>
        `;

        // Nenda step 4
        goStep(4);

    } catch (error) {
        alert('Kuna tatizo la mtandao! Jaribu tena.');
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

      // progress bar 
      function updateProgress(step) {
        for (let i = 1; i <= 4; i++) {
          const c = document.getElementById("pc" + i),
            l = document.getElementById("pl" + i);
          c.classList.remove("active", "done");
          l.classList.remove("active", "done");
          if (i < step) {
            c.classList.add("done");
            l.classList.add("done");
            if (i < 4)
              c.innerHTML =
                '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
          } else if (i === step) {
            c.classList.add("active");
            l.classList.add("active");
            if (i < 4) c.textContent = i;
          } else {
            if (i < 4) c.textContent = i;
          }
        }
        for (let i = 1; i <= 3; i++) {
          document
            .getElementById("pline" + i)
            .classList.toggle("done", i < step);
        }
      }

      // candidate profile modal 
      function openProfile(id) {
        currentModalId = id;
        const cd = CANDIDATES[id];
        document.getElementById("modalName").textContent = cd.fullName;
        document.getElementById("modalRole").textContent = cd.role;
        document.getElementById("modalAbout").textContent = cd.bio;
        document.getElementById("modalFullName").textContent = cd.fullName;
        document.getElementById("modalPosition").textContent = cd.role;
        document.getElementById("modalFaculty").textContent = cd.faculty;
        document.getElementById("modalCourse").textContent = cd.course;
        document.getElementById("modalYear").textContent = cd.year;
        document.getElementById("modalManifesto").textContent = cd.manifesto;
        document.getElementById("modalPledges").textContent = cd.slogans;
        updateModalBtn();
        document.getElementById("profileModal").classList.add("open");
      }

      function updateModalBtn() {
        const cd = CANDIDATES[currentModalId];
        const isSelected = votes[cd.position] === currentModalId;
        const btn = document.getElementById("modalSelectBtn");
        btn.className = "modal-select-btn" + (isSelected ? " sel" : "");
        btn.innerHTML = isSelected
          ? '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Voted'
          : '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Vote For This Candidate';
      }

      function selectFromModal() {
        const cd = CANDIDATES[currentModalId];
        const card = document.getElementById("card-" + currentModalId);
        selectCand(cd.position, currentModalId, card);
        updateModalBtn();
      }

      function closeProfile() {
        document.getElementById("profileModal").classList.remove("open");
        currentModalId = null;
      }

      document.getElementById("profileModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("profileModal"))
          closeProfile();
      });

      // vote receipt toggle (already-voted state) 
      function toggleReceipt() {
        const receipt = document.getElementById("votedReceipt");
        const label = document.getElementById("receiptToggleLabel");
        const isOpen = receipt.classList.toggle("open");
        label.textContent = isOpen
          ? "Hide Vote Receipt"
          : "View Vote Receipt";
      }
      async function handleLogout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
    } catch(e) {}
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../main/index.html';
}