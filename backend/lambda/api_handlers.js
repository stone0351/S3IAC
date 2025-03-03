const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Create DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE;
const KEYS_TABLE = process.env.KEYS_TABLE;
const SCRIPTS_TABLE = process.env.SCRIPTS_TABLE;

// Encryption key (in a real app, use AWS KMS)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-for-development';

// Helper function to encrypt sensitive data
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

// Helper function to decrypt sensitive data
function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

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

// User handlers
exports.createUser = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { googleId, email, name } = requestBody;
        
        const userId = getUserIdFromToken(event);
        
        if (!userId || userId !== googleId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const user = {
            googleId,
            email,
            name,
            createdAt: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: user
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(user)
        };
    } catch (error) {
        console.error('Error creating user:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error creating user' })
        };
    }
};

exports.getUser = async (event) => {
    try {
        const googleId = event.pathParameters.id;
        
        const userId = getUserIdFromToken(event);
        
        if (!userId || userId !== googleId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const result = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { googleId }
        }).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                body: JSON.stringify({ message: 'User not found' })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error getting user:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error getting user' })
        };
    }
};

// AWS Key handlers
exports.createKey = async (event) => {
    try {
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const requestBody = JSON.parse(event.body);
        const { name, accessKey, secretKey } = requestBody;
        
        // Encrypt the secret key
        const encryptedSecretKey = encrypt(secretKey);
        
        const key = {
            id: uuidv4(),
            userId,
            name,
            accessKey,
            secretKey: encryptedSecretKey,
            createdAt: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: KEYS_TABLE,
            Item: key
        }).promise();
        
        // Don't return the actual secret key
        const responseKey = {
            ...key,
            secretKey: undefined
        };
        
        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(responseKey)
        };
    } catch (error) {
        console.error('Error creating AWS key:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error creating AWS key' })
        };
    }
};

exports.listKeys = async (event) => {
    try {
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const result = await dynamodb.query({
            TableName: KEYS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        
        // Don't return the actual secret keys
        const keys = result.Items.map(key => ({
            ...key,
            secretKey: undefined
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(keys)
        };
    } catch (error) {
        console.error('Error listing AWS keys:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error listing AWS keys' })
        };
    }
};

exports.deleteKey = async (event) => {
    try {
        const keyId = event.pathParameters.id;
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        // First, check if the key exists and belongs to the user
        const keyResult = await dynamodb.get({
            TableName: KEYS_TABLE,
            Key: { id: keyId }
        }).promise();
        
        if (!keyResult.Item || keyResult.Item.userId !== userId) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                body: JSON.stringify({ message: 'AWS key not found' })
            };
        }
        
        // Delete the key
        await dynamodb.delete({
            TableName: KEYS_TABLE,
            Key: { id: keyId }
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'AWS key deleted successfully' })
        };
    } catch (error) {
        console.error('Error deleting AWS key:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error deleting AWS key' })
        };
    }
};

// IAC Script handlers
exports.createScript = async (event) => {
    try {
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const requestBody = JSON.parse(event.body);
        const { name, description, content } = requestBody;
        
        const script = {
            id: uuidv4(),
            userId,
            name,
            description,
            content,
            createdAt: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: SCRIPTS_TABLE,
            Item: script
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(script)
        };
    } catch (error) {
        console.error('Error creating IAC script:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error creating IAC script' })
        };
    }
};

exports.listScripts = async (event) => {
    try {
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const result = await dynamodb.query({
            TableName: SCRIPTS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        
        // For the list, don't include the full content to reduce payload size
        const scripts = result.Items.map(script => ({
            id: script.id,
            name: script.name,
            description: script.description,
            createdAt: script.createdAt
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(scripts)
        };
    } catch (error) {
        console.error('Error listing IAC scripts:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error listing IAC scripts' })
        };
    }
};

exports.getScript = async (event) => {
    try {
        const scriptId = event.pathParameters.id;
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        const result = await dynamodb.get({
            TableName: SCRIPTS_TABLE,
            Key: { id: scriptId }
        }).promise();
        
        if (!result.Item || result.Item.userId !== userId) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                body: JSON.stringify({ message: 'IAC script not found' })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error getting IAC script:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error getting IAC script' })
        };
    }
};

exports.deleteScript = async (event) => {
    try {
        const scriptId = event.pathParameters.id;
        const userId = getUserIdFromToken(event);
        
        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        // First, check if the script exists and belongs to the user
        const scriptResult = await dynamodb.get({
            TableName: SCRIPTS_TABLE,
            Key: { id: scriptId }
        }).promise();
        
        if (!scriptResult.Item || scriptResult.Item.userId !== userId) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                body: JSON.stringify({ message: 'IAC script not found' })
            };
        }
        
        // Delete the script
        await dynamodb.delete({
            TableName: SCRIPTS_TABLE,
            Key: { id: scriptId }
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'IAC script deleted successfully' })
        };
    } catch (error) {
        console.error('Error deleting IAC script:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({ message: 'Error deleting IAC script' })
        };
    }
};
