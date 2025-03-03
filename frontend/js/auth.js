// Google Authentication Functions
let userProfile = null;
const API_BASE_URL = 'https://accounts.google.com/o/oauth2';

// This function is called when the Google Sign-In is complete
function handleCredentialResponse(response) {
    // Get JWT from Google response
    const credential = response.credential;
    
    // Decode the JWT to get user info
    const payload = JSON.parse(atob(credential.split('.')[1]));
    
    // Set user profile
    userProfile = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        token: credential
    };
    
    // Store the token in localStorage
    localStorage.setItem('googleToken', credential);
    
    // Check if the user exists in our database, if not create them
    checkUserExists(userProfile.googleId)
        .then(exists => {
            if (!exists) {
                return createUser(userProfile);
            }
            return Promise.resolve();
        })
        .then(() => {
            // Show the main content and hide login
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            
            // Load user data
            loadUserData();
        })
        .catch(error => {
            console.error('Authentication error:', error);
            alert('Authentication failed. Please try again.');
        });
}

// Check if user already exists in our database
async function checkUserExists(googleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${googleId}`);
        return response.ok;
    } catch (error) {
        console.error('Error checking user:', error);
        return false;
    }
}

// Create a new user in our database
async function createUser(profile) {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${profile.token}`
            },
            body: JSON.stringify({
                googleId: profile.googleId,
                email: profile.email,
                name: profile.name
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create user');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Load user data (AWS keys and IAC scripts)
function loadUserData() {
    if (!userProfile) return;
    
    // Load AWS keys
    loadAwsKeys();
    
    // Load IAC scripts
    loadIacScripts();
}

// Check if the user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('googleToken');
    
    if (token) {
        try {
            // Verify the token (in a real app, you'd verify with your backend)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            
            if (expiry > Date.now()) {
                // Token is still valid
                userProfile = {
                    googleId: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    token: token
                };
                
                // Show main content and hide login
                document.getElementById('login-section').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                
                // Load user data
                loadUserData();
                return;
            }
        } catch (error) {
            console.error('Error checking token:', error);
        }
        
        // If we got here, the token is invalid
        localStorage.removeItem('googleToken');
    }
    
    // Show login section
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
});
