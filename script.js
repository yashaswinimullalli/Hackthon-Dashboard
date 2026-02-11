/**
 * OSCode Hackathon Manager - Main Logic
 * Features: Strict GMAIL Validation, Unique Email Constraint, Auto-Unassign
 */

// --- 1. GLOBAL STATE & DATA MANAGEMENT ---
const state = {
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    teams: JSON.parse(localStorage.getItem('teams')) || []
};

// Dashboard specific state (for UI controls)
let dashboardState = {
    searchText: '',
    filterTrack: '',
    sortOrder: 'asc' // 'asc' or 'desc'
};

// Helper to save current state
const saveData = () => {
    localStorage.setItem('participants', JSON.stringify(state.participants));
    localStorage.setItem('teams', JSON.stringify(state.teams));
    renderTables();
    updateTotalCount();
};

// Update Total Count
const updateTotalCount = () => {
    const el = document.getElementById('totalCount');
    if(el) el.innerText = state.participants.length;
};

// Helper to show popup messages (Toast)
const showToast = (msg, type='success') => {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    const colorClass = type === 'danger' ? 'bg-danger' : (type === 'warning' ? 'bg-warning' : 'bg-success');
    
    toastEl.className = `toast show align-items-center text-white ${colorClass} border-0 mb-2`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body fw-bold">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>`;
        
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
};

// --- 2. VIEW SWITCHING LOGIC ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active-section', 'd-block');
        el.classList.add('d-none');
    });

    const target = document.getElementById(viewId + '-view');
    if(target) {
        target.classList.remove('d-none');
        target.classList.add('active-section', 'd-block');
    }
    window.scrollTo(0,0);
}

// --- 3. REGISTRATION LOGIC (GMAIL ONLY & UNIQUE) ---
const regForm = document.getElementById('regForm');
if(regForm) {
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Get Values & Trim Whitespace
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const college = document.getElementById('regCollege').value.trim();
        const skill = document.getElementById('regSkill').value;
        const track = document.getElementById('regTrack').value;

        // 2. VALIDATION: Strict GMAIL Regex
        // This strictly forces the email to end with "@gmail.com"
        // It prevents typos like "@gmil.com" or other providers like "@yahoo.com"
        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        
        if (!gmailPattern.test(email)) {
            showToast('Registration restricted to @gmail.com addresses only.', 'danger');
            return;
        }

        // 3. VALIDATION: Check for Duplicates (Case Insensitive)
        // Checks if 'user@gmail.com' exists, rejects 'User@Gmail.com' too
        const isDuplicate = state.participants.some(p => p.email.toLowerCase() === email.toLowerCase());

        if (isDuplicate) {
            showToast('This Email ID is already registered!', 'danger');
            return;
        }

        // 4. Add new participant
        state.participants.push({
            id: Date.now(),
            name: name,
            email: email, // We save the exact input
            college: college,
            skill: skill,
            track: track,
            teamId: null,
            checkIn: false,
            registeredAt: new Date().toISOString()
        });

        saveData(); 
        e.target.reset(); 
        showToast('Registration Successful!');
        setTimeout(() => switchView('dashboard'), 1000);
    });
}

// --- 4. DASHBOARD LOGIC ---

const searchInput = document.getElementById('searchInput');
const filterTrack = document.getElementById('filterTrack');

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        dashboardState.searchText = e.target.value.toLowerCase();
        renderTables();
    });
}

if(filterTrack) {
    filterTrack.addEventListener('change', (e) => {
        dashboardState.filterTrack = e.target.value;
        renderTables();
    });
}

window.toggleSort = () => {
    dashboardState.sortOrder = dashboardState.sortOrder === 'asc' ? 'desc' : 'asc';
    renderTables();
    showToast(`Sorted by Name (${dashboardState.sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`, 'info');
};

// Check-In Logic with Auto-Unassign Constraint
window.toggleCheckIn = (email) => {
    const participant = state.participants.find(p => p.email === email);
    if (!participant) return;

    participant.checkIn = !participant.checkIn;

    // CRITICAL: If Checking OUT -> Remove from Team
    if (participant.checkIn === false && participant.teamId) {
        const team = state.teams.find(t => t.id === participant.teamId);
        if (team) {
            team.members = team.members.filter(m => m !== email);
            showToast(`${participant.name} checked out & removed from team.`, 'warning');
        }
        participant.teamId = null;
    } else {
        const statusMsg = participant.checkIn ? 'Checked In' : 'Checked Out';
        showToast(`${participant.name} is now ${statusMsg}`);
    }

    saveData();
};

window.deleteParticipant = (email) => {
    if(confirm('Are you sure you want to remove this participant?')) {
        const p = state.participants.find(p => p.email === email);
        // Remove from team if assigned
        if(p && p.teamId) {
             const team = state.teams.find(t => t.id === p.teamId);
             if(team) team.members = team.members.filter(m => m !== email);
        }
        
        state.participants = state.participants.filter(p => p.email !== email);
        saveData();
        showToast('Participant removed', 'info');
    }
};

// --- 5. TEAM MANAGEMENT LOGIC ---

window.createTeam = () => {
    const nameInput = document.getElementById('newTeamName');
    const teamName = nameInput.value.trim();

    if (!teamName) return showToast('Team name cannot be empty!', 'danger');

    // Unique Team Name Check
    if (state.teams.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
        return showToast('Team name already exists!', 'danger');
    }

    state.teams.push({
        id: Date.now(),
        name: teamName,
        members: [] 
    });

    saveData();
    nameInput.value = '';
    showToast(`Team "${teamName}" created!`);
};

window.addToTeam = (teamId) => {
    const select = document.getElementById(`select-${teamId}`);
    const email = select.value;

    if (!email) return showToast('Please select a participant.', 'warning');

    const participant = state.participants.find(p => p.email === email);
    const team = state.teams.find(t => t.id === teamId);

    if (!participant.checkIn) {
        return showToast('Participant must be checked-in first!', 'danger');
    }
    if (participant.teamId) {
        return showToast('Participant is already in a team!', 'danger');
    }

    participant.teamId = teamId;
    team.members.push(email);

    saveData();
    showToast(`${participant.name} added to ${team.name}`);
};

window.removeFromTeam = (teamId, email) => {
    const participant = state.participants.find(p => p.email === email);
    const team = state.teams.find(t => t.id === teamId);

    if (participant && team) {
        participant.teamId = null;
        team.members = team.members.filter(m => m !== email);
        saveData();
        showToast(`${participant.name} removed from team.`);
    }
};

window.deleteTeam = (teamId) => {
    if(!confirm('Delete this team? All members will be unassigned.')) return;

    const team = state.teams.find(t => t.id === teamId);
    if(team) {
        team.members.forEach(email => {
            const p = state.participants.find(part => part.email === email);
            if(p) p.teamId = null;
        });
    }

    state.teams = state.teams.filter(t => t.id !== teamId);
    saveData();
    showToast('Team deleted.');
};

// --- 6. RENDER UI FUNCTION ---
function renderTables() {
    // Render Dashboard
    const tbody = document.getElementById('participantTableBody');
    const noResults = document.getElementById('noResultsMsg');
    
    if (tbody) {
        // Filter Data
        let filteredData = state.participants.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(dashboardState.searchText) || 
                                  p.email.toLowerCase().includes(dashboardState.searchText);
            const matchesTrack = dashboardState.filterTrack === '' || p.track === dashboardState.filterTrack;
            return matchesSearch && matchesTrack;
        });

        // Sort Data
        filteredData.sort((a, b) => {
            return dashboardState.sortOrder === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        });

        tbody.innerHTML = '';
        
        if (filteredData.length === 0) {
            if(noResults) noResults.classList.remove('d-none');
        } else {
            if(noResults) noResults.classList.add('d-none');
            
            filteredData.forEach(p => {
                const teamStatus = p.teamId 
                    ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">Assigned</span>` 
                    : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill">Not Assigned</span>`;

                const checkInBtn = p.checkIn
                    ? `<button onclick="toggleCheckIn('${p.email}')" class="btn btn-sm btn-outline-success active fw-bold"><i class="bi bi-check-circle-fill"></i> In</button>`
                    : `<button onclick="toggleCheckIn('${p.email}')" class="btn btn-sm btn-outline-secondary fw-bold"><i class="bi bi-circle me-1"></i> Out</button>`;

                tbody.innerHTML += `
                    <tr>
                        <td class="ps-4">
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle me-3 bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" style="width: 40px; height: 40px; font-weight: bold;">
                                    ${p.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="fw-bold text-dark">${p.name}</div>
                                    <div class="small text-muted">${p.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="fw-bold text-dark" style="font-size: 0.9rem;">${p.track}</div>
                            <div class="badge bg-light text-secondary border mt-1">${p.skill}</div>
                        </td>
                        <td>${checkInBtn}</td>
                        <td>${teamStatus}</td>
                        <td>
                            <button class="btn btn-sm btn-light text-danger" onclick="deleteParticipant('${p.email}')"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>`;
            });
        }
    }

    // Render Teams
    const teamContainer = document.getElementById('teamContainer');
    const noTeams = document.getElementById('noTeamsMsg');
    
    if (teamContainer) {
        teamContainer.innerHTML = '';

        if (state.teams.length === 0) {
            if(noTeams) noTeams.classList.remove('d-none');
        } else {
            if(noTeams) noTeams.classList.add('d-none');

            state.teams.forEach(team => {
                const eligible = state.participants.filter(p => p.checkIn && !p.teamId);

                // Members List HTML
                let membersHtml = '';
                if (team.members.length > 0) {
                    team.members.forEach(email => {
                        const mem = state.participants.find(p => p.email === email);
                        if (mem) {
                            membersHtml += `
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0 border-0">
                                    <span class="small fw-bold"><i class="bi bi-person-fill text-primary me-2"></i>${mem.name}</span>
                                    <button class="btn btn-link text-danger p-0" onclick="removeFromTeam(${team.id}, '${mem.email}')">
                                        <i class="bi bi-x-circle-fill"></i>
                                    </button>
                                </li>`;
                        }
                    });
                } else {
                    membersHtml = `<li class="text-muted small fst-italic py-2">No members assigned yet.</li>`;
                }

                // Dropdown Options
                const optionsHtml = eligible.length > 0 
                    ? eligible.map(p => `<option value="${p.email}">${p.name} (${p.skill})</option>`).join('')
                    : '<option value="" disabled>No eligible hackers</option>';

                teamContainer.innerHTML += `
                    <div class="col-md-4">
                        <div class="card h-100 border-0 shadow-sm rounded-4">
                            <div class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <h5 class="fw-bold mb-0 text-primary">${team.name}</h5>
                                <button class="btn btn-sm btn-light text-muted" onclick="deleteTeam(${team.id})"><i class="bi bi-trash"></i></button>
                            </div>
                            <div class="card-body px-4">
                                <label class="small text-muted fw-bold mb-2">MEMBERS (${team.members.length})</label>
                                <ul class="list-group mb-3">${membersHtml}</ul>
                                
                                <div class="mt-4 pt-3 border-top">
                                    <label class="small text-muted fw-bold mb-2">ADD MEMBER</label>
                                    <div class="d-flex gap-2">
                                        <select id="select-${team.id}" class="form-select form-select-sm bg-light border-0">
                                            <option value="">Select Hacker...</option>
                                            ${optionsHtml}
                                        </select>
                                        <button class="btn btn-sm btn-dark" onclick="addToTeam(${team.id})">Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    switchView('landing');
});