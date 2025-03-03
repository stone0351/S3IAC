// Main application functionality
const API_BASE_URL = 'https://accounts.google.com/o/oauth2';

// Tab management
function openTab(tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show the selected tab content
    document.getElementById(tabName).classList.remove('hidden');
    
    // Mark the clicked button as active
    event.currentTarget.classList.add('active');
}

// AWS Keys Management Functions
async function loadAwsKeys() {
    if (!userProfile) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/keys`, {
            headers: {
                'Authorization': `Bearer ${userProfile.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load AWS keys');
        }
        
        const keys = await response.json();
        displayAwsKeys(keys);
        populateKeyDropdown(keys);
    } catch (error) {
        console.error('Error loading AWS keys:', error);
    }
}

function displayAwsKeys(keys) {
    const keysContainer = document.getElementById('keys-container');
    keysContainer.innerHTML = '';
    
    if (keys.length === 0) {
        keysContainer.innerHTML = '<p>No AWS keys added yet.</p>';
        return;
    }
    
    keys.forEach(key => {
        const keyCard = document.createElement('div');
        keyCard.className = 'key-card';
        keyCard.innerHTML = `
            <h4>${key.name}</h4>
            <p>Access Key: ${maskKey(key.accessKey)}</p>
            <div class="key-actions">
                <button onclick="deleteAwsKey('${key.id}')">Delete</button>
            </div>
        `;
        keysContainer.appendChild(keyCard);
    });
}

function maskKey(key) {
    if (!key) return '';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

function populateKeyDropdown(keys) {
    const keySelect = document.getElementById('key-select');
    keySelect.innerHTML = '<option value="">-- Select a key --</option>';
    
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key.id;
        option.textContent = key.name;
        keySelect.appendChild(option);
    });
}

async function deleteAwsKey(keyId) {
    if (!confirm('Are you sure you want to delete this AWS key?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/keys/${keyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userProfile.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete AWS key');
        }
        
        // Reload keys
        loadAwsKeys();
    } catch (error) {
        console.error('Error deleting AWS key:', error);
        alert('Failed to delete AWS key');
    }
}

// IAC Scripts Management Functions
async function loadIacScripts() {
    if (!userProfile) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/scripts`, {
            headers: {
                'Authorization': `Bearer ${userProfile.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load IAC scripts');
        }
        
        const scripts = await response.json();
        displayIacScripts(scripts);
        populateScriptDropdown(scripts);
    } catch (error) {
        console.error('Error loading IAC scripts:', error);
    }
}

function displayIacScripts(scripts) {
    const scriptsContainer = document.getElementById('scripts-container');
    scriptsContainer.innerHTML = '';
    
    if (scripts.length === 0) {
        scriptsContainer.innerHTML = '<p>No IAC scripts added yet.</p>';
        return;
    }
    
    scripts.forEach(script => {
        const scriptCard = document.createElement('div');
        scriptCard.className = 'script-card';
        scriptCard.innerHTML = `
            <h4>${script.name}</h4>
            <p>${script.description || 'No description'}</p>
            <div class="script-actions">
                <button onclick="viewScript('${script.id}')">View</button>
                <button onclick="deleteScript('${script.id}')">Delete</button>
            </div>
        `;
        scriptsContainer.appendChild(scriptCard);
    });
}

function populateScriptDropdown(scripts) {
    const scriptSelect = document.getElementById('script-select');
    scriptSelect.innerHTML = '<option value="">-- Select a script --</option>';
    
    scripts.forEach(script => {
        const option = document.createElement('option');
        option.value = script.id;
        option.textContent = script.name;
        scriptSelect.appendChild(option);
    });
}

async function viewScript(scriptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
            headers: {
                'Authorization': `Bearer ${userProfile.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load script');
        }
        
        const script = await response.json();
        
        // Switch to the code tab
        openTab('iac-code');
        
        // Fill the form with script data
        document.getElementById('code-name').value = script.name;
        document.getElementById('code-description').value = script.description || '';
        document.getElementById('code-content').value = script.content;
    } catch (error) {
        console.error('Error viewing script:', error);
        alert('Failed to load script');
    }
}

async function deleteScript(scriptId) {
    if (!confirm('Are you sure you want to delete this script?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userProfile.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete script');
        }
        
        // Reload scripts
        loadIacScripts();
    } catch (error) {
        console.error('Error deleting script:', error);
        alert('Failed to delete script');
    }
}

// Execution functions
async function executeIacCode(keyId, scriptId) {
    try {
        // Show loading state
        const outputElement = document.getElementById('execution-output');
        outputElement.textContent = 'Executing script...';
        
        const response = await fetch(`${API_BASE_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userProfile.token}`
            },
            body: JSON.stringify({
                keyId: keyId,
                scriptId: scriptId
            })
        });
        
        if (!response.ok) {
            throw new Error('Script execution failed');
        }
        
        const result = await response.json();
        outputElement.textContent = result.output || 'Execution complete. No output returned.';
    } catch (error) {
        console.error('Error executing script:', error);
        document.getElementById('execution-output').textContent = `Error: ${error.message}`;
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // AWS Key form submission
    const addKeyForm = document.getElementById('add-key-form');
    addKeyForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!userProfile) {
            alert('You must be logged in to add AWS keys');
            return;
        }
        
        const keyName = document.getElementById('key-name').value;
        const accessKey = document.getElementById('access-key').value;
        const secretKey = document.getElementById('secret-key').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userProfile.token}`
                },
                body: JSON.stringify({
                    name: keyName,
                    accessKey: accessKey,
                    secretKey: secretKey
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add AWS key');
            }
            
            // Reset form
            addKeyForm.reset();
            
            // Reload keys
            loadAwsKeys();
            
            alert('AWS key added successfully');
        } catch (error) {
            console.error('Error adding AWS key:', error);
            alert('Failed to add AWS key');
        }
    });
    
    // IAC Script form submission
    const addCodeForm = document.getElementById('add-code-form');
    addCodeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!userProfile) {
            alert('You must be logged in to add IAC scripts');
            return;
        }
        
        const codeName = document.getElementById('code-name').value;
        const codeDescription = document.getElementById('code-description').value;
        const codeContent = document.getElementById('code-content').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/scripts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userProfile.token}`
                },
                body: JSON.stringify({
                    name: codeName,
                    description: codeDescription,
                    content: codeContent
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add IAC script');
            }
            
            // Reset form
            addCodeForm.reset();
            
            // Reload scripts
            loadIacScripts();
            
            alert('IAC script added successfully');
        } catch (error) {
            console.error('Error adding IAC script:', error);
            alert('Failed to add IAC script');
        }
    });
    
    // Execute form submission
    const executeForm = document.getElementById('execute-form');
    executeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!userProfile) {
            alert('You must be logged in to execute IAC scripts');
            return;
        }
        
        const keyId = document.getElementById('key-select').value;
        const scriptId = document.getElementById('script-select').value;
        
        if (!keyId) {
            alert('Please select an AWS key');
            return;
        }
        
        if (!scriptId) {
            alert('Please select an IAC script');
            return;
        }
        
        await executeIacCode(keyId, scriptId);
    });
});
