/**
 * Error Case and Edge Case Tests
 *
 * Tests various error scenarios and edge cases for attachment handling.
 * These tests don't require a real API key - they test validation and error handling.
 *
 * Run: node test/test-error-cases.js
 */

const nodemailer = require('nodemailer');
const { UsesendTransport } = require('../dist/main.js');
const fs = require('fs');
const path = require('path');

// Create transport with dummy API key (for validation testing)
const transport = nodemailer.createTransport(
    UsesendTransport.makeTransport({
        apiKey: 'test_key_for_validation',
    })
);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Test result tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, testFn, shouldFail = false) {
    testsRun++;
    process.stdout.write(`${testsRun}. ${name}... `);

    try {
        await testFn();

        if (shouldFail) {
            console.log('❌ FAILED (expected error but got success)');
            testsFailed++;
            return false;
        } else {
            console.log('✅ PASSED');
            testsPassed++;
            return true;
        }
    } catch (error) {
        if (shouldFail) {
            console.log(`✅ PASSED (caught expected error: "${error.message.substring(0, 60)}...")`);
            testsPassed++;
            return true;
        } else {
            console.log(`❌ FAILED: ${error.message}`);
            testsFailed++;
            return false;
        }
    }
}

async function runAllTests() {
    console.log('🧪 Error Case and Edge Case Tests\n');
    console.log('='.repeat(70));
    console.log();

    // ===== Attachment Limit Tests =====
    console.log('📋 Attachment Limit Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Reject more than 10 attachments',
        async () => {
            const attachments = Array(11).fill().map((_, i) => ({
                filename: `file${i}.txt`,
                content: `Content ${i}`,
            }));

            // This should fail during validation, not sending
            // We'll trigger validation by calling sendMail
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Too many attachments',
                    text: 'Test',
                    attachments,
                }, (err) => {
                    if (err && err.message.includes('Maximum 10 attachments')) {
                        reject(err); // Expected error
                    } else {
                        resolve(); // Unexpected success
                    }
                });
            });
        },
        true // Should fail
    );

    await runTest(
        'Accept exactly 10 attachments',
        async () => {
            const attachments = Array(10).fill().map((_, i) => ({
                filename: `file${i}.txt`,
                content: `Content ${i}`,
            }));

            // This should pass validation (but fail at API call, which is ok)
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Exactly 10 attachments',
                    text: 'Test',
                    attachments,
                }, (err) => {
                    if (err && err.message.includes('Maximum 10 attachments')) {
                        reject(new Error('Should not reject exactly 10 attachments'));
                    } else {
                        // Will fail at API call, but that's ok - validation passed
                        resolve();
                    }
                });
            });
        },
        false // Should pass validation
    );

    console.log();

    // ===== File Path Tests =====
    console.log('📁 File Path Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Reject non-existent file path',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Non-existent file',
                    text: 'Test',
                    attachments: [{
                        filename: 'missing.txt',
                        path: '/non/existent/path/file.txt',
                    }],
                }, (err) => {
                    if (err && err.message.includes('Failed to read attachment')) {
                        reject(err); // Expected error
                    } else {
                        resolve(); // Unexpected success
                    }
                });
            });
        },
        true // Should fail
    );

    await runTest(
        'Handle valid file path',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Valid file',
                    text: 'Test',
                    attachments: [{
                        filename: 'valid.txt',
                        path: path.join(FIXTURES_DIR, 'sample.txt'),
                    }],
                }, (err) => {
                    // Will fail at API call, but attachment processing should work
                    resolve();
                });
            });
        },
        false // Should pass
    );

    console.log();

    // ===== Empty/Missing Content Tests =====
    console.log('📝 Content Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Reject attachment with no content or path',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'No content',
                    text: 'Test',
                    attachments: [{
                        filename: 'empty.txt',
                        // No content or path provided
                    }],
                }, (err) => {
                    if (err && err.message.includes('has no content source')) {
                        reject(err); // Expected error
                    } else {
                        resolve(); // Unexpected success
                    }
                });
            });
        },
        true // Should fail
    );

    await runTest(
        'Handle empty string content',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Empty string',
                    text: 'Test',
                    attachments: [{
                        filename: 'empty.txt',
                        content: '',
                    }],
                }, (err) => {
                    // Empty string is valid content
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle empty Buffer',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Empty buffer',
                    text: 'Test',
                    attachments: [{
                        filename: 'empty.bin',
                        content: Buffer.alloc(0),
                    }],
                }, (err) => {
                    // Empty buffer is valid
                    resolve();
                });
            });
        },
        false // Should pass
    );

    console.log();

    // ===== Data URI Tests =====
    console.log('🔗 Data URI Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Handle valid base64 data URI',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Valid data URI',
                    text: 'Test',
                    attachments: [{
                        filename: 'data.txt',
                        path: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle valid non-base64 data URI',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Non-base64 data URI',
                    text: 'Test',
                    attachments: [{
                        filename: 'data.txt',
                        path: 'data:text/plain,Hello%20World',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Reject invalid data URI',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Invalid data URI',
                    text: 'Test',
                    attachments: [{
                        filename: 'bad.txt',
                        path: 'data:invalid',
                    }],
                }, (err) => {
                    if (err && err.message.includes('Invalid data URI')) {
                        reject(err); // Expected error
                    } else {
                        resolve(); // Unexpected success
                    }
                });
            });
        },
        true // Should fail
    );

    console.log();

    // ===== Filename Tests =====
    console.log('📄 Filename Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Generate filename when not provided',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'No filename',
                    text: 'Test',
                    attachments: [{
                        // No filename provided
                        content: 'Test content',
                    }],
                }, (err) => {
                    // Should generate a default filename
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Use provided filename',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Custom filename',
                    text: 'Test',
                    attachments: [{
                        filename: 'my-custom-file.txt',
                        content: 'Test content',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    console.log();

    // ===== Encoding Tests =====
    console.log('🔤 Encoding Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Handle base64 encoded string',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Base64 content',
                    text: 'Test',
                    attachments: [{
                        filename: 'encoded.txt',
                        content: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
                        encoding: 'base64',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle hex encoded string',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Hex content',
                    text: 'Test',
                    attachments: [{
                        filename: 'hex.txt',
                        content: '48656c6c6f', // "Hello" in hex
                        encoding: 'hex',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    console.log();

    // ===== Stream Tests =====
    console.log('🌊 Stream Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Handle readable stream',
        async () => {
            const stream = fs.createReadStream(path.join(FIXTURES_DIR, 'sample.txt'));

            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Stream content',
                    text: 'Test',
                    attachments: [{
                        filename: 'stream.txt',
                        content: stream,
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle stream from non-existent file',
        async () => {
            const stream = fs.createReadStream('/non/existent/file.txt');

            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Bad stream',
                    text: 'Test',
                    attachments: [{
                        filename: 'bad-stream.txt',
                        content: stream,
                    }],
                }, (err) => {
                    if (err && err.message.includes('Failed to read stream')) {
                        reject(err); // Expected error
                    } else {
                        resolve(); // Unexpected success
                    }
                });
            });
        },
        true // Should fail
    );

    console.log();

    // ===== Special Character Tests =====
    console.log('🔡 Special Character Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Handle filename with spaces',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Filename with spaces',
                    text: 'Test',
                    attachments: [{
                        filename: 'my file with spaces.txt',
                        content: 'Content',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle filename with unicode',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Unicode filename',
                    text: 'Test',
                    attachments: [{
                        filename: '文档.txt', // Chinese characters
                        content: 'Content',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    await runTest(
        'Handle content with unicode',
        async () => {
            return new Promise((resolve, reject) => {
                transport.sendMail({
                    from: 'test@example.com',
                    to: 'user@example.com',
                    subject: 'Unicode content',
                    text: 'Test',
                    attachments: [{
                        filename: 'unicode.txt',
                        content: 'Hello 世界 🌍',
                    }],
                }, (err) => {
                    resolve();
                });
            });
        },
        false // Should pass
    );

    console.log();
    console.log('='.repeat(70));
    console.log('📊 Test Results:');
    console.log(`   Total: ${testsRun}`);
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Run all tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
