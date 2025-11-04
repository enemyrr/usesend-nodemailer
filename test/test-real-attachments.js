/**
 * Real Attachment Test Suite
 *
 * This script tests the enhanced attachment support with real files.
 *
 * Setup:
 * 1. Set USESEND_API_KEY environment variable
 * 2. Update FROM_EMAIL and TO_EMAIL below
 * 3. Run: node test/test-real-attachments.js
 */

const nodemailer = require('nodemailer');
const { UsesendTransport } = require('../dist/main.js');
const fs = require('fs');
const path = require('path');

// Configuration - UPDATE THESE VALUES
const FROM_EMAIL = 'your-verified-email@yourdomain.com';
const TO_EMAIL = 'recipient@example.com';
const API_KEY = process.env.USESEND_API_KEY || 'your-api-key-here';

// Test fixture paths
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const FILES = {
    txt: path.join(FIXTURES_DIR, 'sample.txt'),
    html: path.join(FIXTURES_DIR, 'sample.html'),
    json: path.join(FIXTURES_DIR, 'sample.json'),
    csv: path.join(FIXTURES_DIR, 'sample.csv'),
    pdf: path.join(FIXTURES_DIR, 'sample.pdf'),
};

// Verify all files exist
function checkFiles() {
    console.log('📁 Checking test fixture files...\n');
    let allExist = true;

    for (const [type, filePath] of Object.entries(FILES)) {
        const exists = fs.existsSync(filePath);
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${type.toUpperCase()}: ${path.relative(process.cwd(), filePath)}`);
        if (!exists) allExist = false;
    }

    console.log();
    return allExist;
}

async function runTests() {
    console.log('🚀 Usesend Nodemailer - Real Attachment Tests\n');
    console.log('='.repeat(50));
    console.log();

    // Check files first
    if (!checkFiles()) {
        console.error('❌ Some fixture files are missing. Please ensure all files exist in test/fixtures/');
        process.exit(1);
    }

    // Create transport
    const transport = nodemailer.createTransport(
        UsesendTransport.makeTransport({
            apiKey: API_KEY,
        })
    );

    console.log('📧 Transport Configuration:');
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   To: ${TO_EMAIL}`);
    console.log(`   API Key: ${API_KEY.substring(0, 10)}...`);
    console.log();

    // Define test cases
    const tests = [
        {
            name: 'Test 1: Single Text File',
            description: 'Attach a single text file using file path',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: Text File Attachment',
                html: '<h2>Text File Attachment Test</h2><p>This email contains a single text file attachment loaded from the filesystem.</p>',
                attachments: [
                    {
                        filename: 'sample.txt',
                        path: FILES.txt,
                    }
                ],
            },
        },
        {
            name: 'Test 2: PDF File',
            description: 'Attach a PDF file using file path',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: PDF Attachment',
                html: '<h2>PDF Attachment Test</h2><p>This email contains a PDF file attachment.</p>',
                attachments: [
                    {
                        filename: 'document.pdf',
                        path: FILES.pdf,
                    }
                ],
            },
        },
        {
            name: 'Test 3: Multiple Files (Mixed Types)',
            description: 'Attach multiple files of different types',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: Multiple Attachments',
                html: '<h2>Multiple Attachments Test</h2><p>This email contains multiple file attachments:</p><ul><li>Text file</li><li>HTML file</li><li>JSON file</li><li>CSV file</li></ul>',
                attachments: [
                    {
                        filename: 'sample.txt',
                        path: FILES.txt,
                    },
                    {
                        filename: 'sample.html',
                        path: FILES.html,
                    },
                    {
                        filename: 'data.json',
                        path: FILES.json,
                    },
                    {
                        filename: 'users.csv',
                        path: FILES.csv,
                    }
                ],
            },
        },
        {
            name: 'Test 4: Buffer Content',
            description: 'Attach file using Buffer content',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: Buffer Attachment',
                html: '<h2>Buffer Attachment Test</h2><p>This attachment was loaded into a Buffer first, then attached.</p>',
                attachments: [
                    {
                        filename: 'from-buffer.txt',
                        content: fs.readFileSync(FILES.txt),
                    }
                ],
            },
        },
        {
            name: 'Test 5: Stream Content',
            description: 'Attach file using Stream',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: Stream Attachment',
                html: '<h2>Stream Attachment Test</h2><p>This PDF was attached using a file stream.</p>',
                attachments: [
                    {
                        filename: 'streamed.pdf',
                        content: fs.createReadStream(FILES.pdf),
                    }
                ],
            },
        },
        {
            name: 'Test 6: String Content',
            description: 'Attach dynamically generated string content',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: String Content Attachment',
                html: '<h2>String Content Test</h2><p>This attachment was created from a string in memory.</p>',
                attachments: [
                    {
                        filename: 'generated.txt',
                        content: `Generated at: ${new Date().toISOString()}\n\nThis content was created dynamically as a string.`,
                    }
                ],
            },
        },
        {
            name: 'Test 7: Data URI',
            description: 'Attach using data URI',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: Data URI Attachment',
                html: '<h2>Data URI Test</h2><p>This attachment uses a data URI.</p>',
                attachments: [
                    {
                        filename: 'data-uri.txt',
                        path: 'data:text/plain;base64,SGVsbG8gZnJvbSBEYXRhIFVSSSE=',
                    }
                ],
            },
        },
        {
            name: 'Test 8: All Files at Once',
            description: 'Send all test files in one email',
            mailOptions: {
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: 'Test: All Attachments',
                html: '<h2>Complete Attachment Test</h2><p>This email contains all test files:</p><ul><li>sample.txt</li><li>sample.html</li><li>data.json</li><li>users.csv</li><li>sample.pdf</li></ul>',
                attachments: [
                    { filename: 'sample.txt', path: FILES.txt },
                    { filename: 'sample.html', path: FILES.html },
                    { filename: 'data.json', path: FILES.json },
                    { filename: 'users.csv', path: FILES.csv },
                    { filename: 'sample.pdf', path: FILES.pdf },
                ],
            },
        },
    ];

    console.log('📋 Available Tests:\n');
    tests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`);
        console.log(`   ${test.description}`);
        console.log(`   Attachments: ${test.mailOptions.attachments.length}`);
        console.log();
    });

    // Check if we should run tests
    if (API_KEY === 'your-api-key-here' || FROM_EMAIL.includes('yourdomain')) {
        console.log('⚠️  Configuration Required:');
        console.log('   1. Set USESEND_API_KEY environment variable');
        console.log('   2. Update FROM_EMAIL and TO_EMAIL in this file');
        console.log('   3. Run the tests again\n');
        console.log('💡 To run a specific test, uncomment the relevant section below.');
        return;
    }

    // Uncomment ONE of these to run a specific test:

    // await runSingleTest(transport, tests[0]); // Test 1: Single text file
    // await runSingleTest(transport, tests[1]); // Test 2: PDF file
    // await runSingleTest(transport, tests[2]); // Test 3: Multiple files
    // await runSingleTest(transport, tests[3]); // Test 4: Buffer content
    // await runSingleTest(transport, tests[4]); // Test 5: Stream content
    // await runSingleTest(transport, tests[5]); // Test 6: String content
    // await runSingleTest(transport, tests[6]); // Test 7: Data URI
    // await runSingleTest(transport, tests[7]); // Test 8: All files

    // Or run all tests sequentially (uncomment this):
    // await runAllTests(transport, tests);

    console.log('💡 Uncomment a test above to run it!');
}

async function runSingleTest(transport, test) {
    console.log('='.repeat(50));
    console.log(`🧪 Running: ${test.name}`);
    console.log('='.repeat(50));
    console.log();

    try {
        console.log('📤 Sending email...');
        const startTime = Date.now();

        const info = await transport.sendMail(test.mailOptions);

        const duration = Date.now() - startTime;

        console.log();
        console.log('✅ Email sent successfully!');
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Message ID: ${info.id || info.messageId || 'N/A'}`);
        console.log(`   Attachments: ${test.mailOptions.attachments.length}`);
        console.log();
    } catch (error) {
        console.log();
        console.error('❌ Test failed!');
        console.error(`   Error: ${error.message}`);
        console.log();
    }
}

async function runAllTests(transport, tests) {
    console.log('='.repeat(50));
    console.log('🧪 Running All Tests');
    console.log('='.repeat(50));
    console.log();

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`[${i + 1}/${tests.length}] ${test.name}...`);

        try {
            const info = await transport.sendMail(test.mailOptions);
            console.log(`   ✅ Success (ID: ${info.id || info.messageId || 'N/A'})`);
            passed++;
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failed++;
        }

        console.log();

        // Add delay between tests to avoid rate limiting
        if (i < tests.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('='.repeat(50));
    console.log('📊 Test Results:');
    console.log(`   Passed: ${passed}/${tests.length}`);
    console.log(`   Failed: ${failed}/${tests.length}`);
    console.log('='.repeat(50));
}

// Run tests
runTests().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
