const API_URL = 'https://kiutso-backend-production.up.railway.app/api';

// Pata token kutoka localStorage
const getToken = () => localStorage.getItem('token');

// Headers za kawaida
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
});

// AUTH
const auth = {
    register: (data) => fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    }).then(res => res.json()),

    login: (data) => fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    }).then(res => res.json()),

    logout: () => fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: headers(),
    }).then(res => res.json()),
};

// ELECTIONS
const elections = {
    active: () => fetch(`${API_URL}/elections/active`, {
        headers: headers(),
    }).then(res => res.json()),

    all: () => fetch(`${API_URL}/elections`, {
        headers: headers(),
    }).then(res => res.json()),
};

// CANDIDATES
const candidates = {
    all: (election_id) => fetch(`${API_URL}/candidates?election_id=${election_id}`, {
        headers: headers(),
    }).then(res => res.json()),

    show: (id) => fetch(`${API_URL}/candidates/${id}`, {
        headers: headers(),
    }).then(res => res.json()),
};

// VOTES
const votes = {
    cast: (data) => fetch(`${API_URL}/votes/cast`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    }).then(res => res.json()),

    status: () => fetch(`${API_URL}/votes/status`, {
        headers: headers(),
    }).then(res => res.json()),
};

// ADMIN
const admin = {
    overview: () => fetch(`${API_URL}/admin/overview`, {
        headers: headers(),
    }).then(res => res.json()),

    results: () => fetch(`${API_URL}/admin/results`, {
        headers: headers(),
    }).then(res => res.json()),

    logs: () => fetch(`${API_URL}/admin/logs`, {
        headers: headers(),
    }).then(res => res.json()),

    liveActivity: () => fetch(`${API_URL}/admin/live-activity`, {
        headers: headers(),
    }).then(res => res.json()),
};