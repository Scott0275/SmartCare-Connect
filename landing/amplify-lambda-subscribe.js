/**
 * SmartCare Landing Page - Email Subscription Lambda Function
 * Triggered by: POST /api/subscribe
 * Action: Receives email signup and sends notification to techwithbuchi@gmail.com
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const sesClient = new SESClient({ region: "us-east-1" });
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });

const RECIPIENT_EMAIL = process.env.NOTIFICATION_EMAIL || "techwithbuchi@gmail.com";
const TABLE_NAME = process.env.DYNAMODB_TABLE || "smartcare-early-access";

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Enable CORS
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };

    try {
        // Parse request body
        const body = JSON.parse(event.body || "{}");
        const { email } = body;

        // Validate email
        if (!email || !isValidEmail(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid email address",
                }),
            };
        }

        // Store in DynamoDB
        await storEmailInDynamoDB(email);

        // Send notification email to admin
        await sendNotificationEmail(email);

        // Send confirmation email to subscriber (optional)
        await sendConfirmationEmail(email);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Thank you for signing up for early access!",
                email,
            }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: "Failed to process subscription",
                error: error.message,
            }),
        };
    }
};

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Store email in DynamoDB
 */
async function storEmailInDynamoDB(email) {
    const timestamp = new Date().toISOString();
    const params = {
        TableName: TABLE_NAME,
        Item: {
            email: { S: email },
            timestamp: { S: timestamp },
            status: { S: "pending" },
            source: { S: "landing-page" },
        },
    };

    try {
        await dynamoDbClient.send(new PutItemCommand(params));
        console.log(`Email ${email} stored in DynamoDB`);
    } catch (error) {
        console.error("DynamoDB error:", error);
        // Don't fail if DynamoDB fails, but log it
    }
}

/**
 * Send notification email to admin
 */
async function sendNotificationEmail(email) {
    const params = {
        Source: "noreply@smartcare.example", // Update with your verified sender email
        Destination: {
            ToAddresses: [RECIPIENT_EMAIL],
        },
        Message: {
            Subject: {
                Data: "🎉 New SmartCare Early Access Signup",
                Charset: "UTF-8",
            },
            Body: {
                Html: {
                    Data: `
                        <h2>New SmartCare Early Access Signup</h2>
                        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                        <p><strong>Source:</strong> Landing Page</p>
                        <hr>
                        <p>
                            <a href="https://console.aws.amazon.com/dynamodbv2">
                                View in DynamoDB
                            </a>
                        </p>
                    `,
                    Charset: "UTF-8",
                },
            },
        },
    };

    try {
        await sesClient.send(new SendEmailCommand(params));
        console.log(`Notification email sent to ${RECIPIENT_EMAIL}`);
    } catch (error) {
        console.error("SES notification error:", error);
        throw error;
    }
}

/**
 * Send confirmation email to subscriber
 */
async function sendConfirmationEmail(email) {
    const params = {
        Source: "noreply@smartcare.example", // Update with your verified sender email
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Subject: {
                Data: "Welcome to SmartCare - Early Access Confirmed",
                Charset: "UTF-8",
            },
            Body: {
                Html: {
                    Data: `
                        <h2>Welcome to SmartCare! 🎉</h2>
                        <p>Thank you for signing up for early access to SmartCare - the offline-first EHR system for small clinics.</p>
                        
                        <h3>What to Expect</h3>
                        <ul>
                            <li>Early access to the SmartCare platform</li>
                            <li>Exclusive beta features</li>
                            <li>Priority support from our team</li>
                            <li>Special launch pricing</li>
                        </ul>
                        
                        <p>We'll be in touch soon with more details!</p>
                        
                        <p>Best regards,<br><strong>The SmartCare Team</strong></p>
                    `,
                    Charset: "UTF-8",
                },
            },
        },
    };

    try {
        await sesClient.send(new SendEmailCommand(params));
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error("SES confirmation error:", error);
        // Don't fail the whole request if confirmation email fails
    }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
