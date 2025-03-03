const AWS = require('aws-sdk');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');

// Create DynamoDB and Lambda clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

// Promisify exec
const execPromise = util.promisify(exec);

// Environment variables
const KEYS_TABLE = process.env.KEYS_TABLE;
const SCRIPTS_TABLE = process.env.SCRIPTS_TABLE;

// Main handler
exports.handler = async (event) => {
    try {
        // Parse request body
        const requestBody = JSON.parse(event.body);
        const { keyId, scriptId } = requestBody;
        
        // Get user ID from the JWT token
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        // Get the AWS key
        const key = await getAwsKey(keyId, userId);
        
        if (!key) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'AWS key not found' })
            };
        }
        
        // Get the IAC script
        const script = await getIacScript(scriptId, userId);
        
        if (!script) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'IAC script not found' })
            };
        }
        
        // Execute the IAC code
        const result = await executeIacCode(key, script);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ 
                message: 'Script executed successfully',
                output: result
            })
        };
    } catch (error) {
        console.error('Error executing IAC code:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ 
                message: 'Error executing IAC code',
                error: error.message
            })
        };
    }
};

// Extract user ID from the JWT token
function getUserIdFromToken(event) {
    try {
        // Get the Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;
        
        if (!authHeader) {
            return null;
        }
        
        // Extract the token
        const token = authHeader.split(' ')[1];
        
        // Decode JWT (simple decoding, in a real app you'd verify the signature)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        // Return the Google ID as the user ID
        return payload.sub;
    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        return null;
    }
}

// Get AWS key from DynamoDB
async function getAwsKey(keyId, userId) {
    try {
        const params = {
            TableName: KEYS_TABLE,
            Key: { id: keyId }
        };
        
        const result = await dynamodb.get(params).promise();
        
        // Check if the key exists and belongs to the user
        if (!result.Item || result.Item.userId !== userId) {
            return null;
        }
        
        return result.Item;
    } catch (error) {
        console.error('Error getting AWS key:', error);
        throw error;
    }
}

// Get IAC script from DynamoDB
async function getIacScript(scriptId, userId) {
    try {
        const params = {
            TableName: SCRIPTS_TABLE,
            Key: { id: scriptId }
        };
        
        const result = await dynamodb.get(params).promise();
        
        // Check if the script exists and belongs to the user
        if (!result.Item || result.Item.userId !== userId) {
            return null;
        }
        
        return result.Item;
    } catch (error) {
        console.error('Error getting IAC script:', error);
        throw error;
    }
}

// Execute IAC code using AWS credentials
async function executeIacCode(key, script) {
    try {
        // Create a temporary directory
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iac-'));
        
        // Write the IAC code to a file
        const scriptPath = path.join(tempDir, 'script.tf');
        fs.writeFileSync(scriptPath, script.content);
        
        // Set environment variables for AWS credentials
        const env = {
            ...process.env,
            AWS_ACCESS_KEY_ID: key.accessKey,
            AWS_SECRET_ACCESS_KEY: key.secretKey
        };
        
        // Initialize Terraform
        await execPromise('terraform init', { cwd: tempDir, env });
        
        // Create execution plan
        const planResult = await execPromise('terraform plan -no-color', { cwd: tempDir, env });
        
        // Apply the changes (in a real app, you might want to make this optional)
        const applyResult = await execPromise('terraform apply -auto-approve -no-color', { cwd: tempDir, env });
        
        // Clean up temporary directory
        try {
            fs.rmdirSync(tempDir, { recursive: true });
        } catch (cleanupError) {
            console.error('Error cleaning up temporary directory:', cleanupError);
        }
        
        // Return the combined output
        return `Plan:\n${planResult.stdout}\n\nApply:\n${applyResult.stdout}`;
    } catch (error) {
        console.error('Error executing IAC code:', error);
        return `Error: ${error.message}\n${error.stderr || ''}`;
    }
}
