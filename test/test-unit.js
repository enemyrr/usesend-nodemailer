/**
 * Unit Tests for Attachment Processing
 *
 * Tests the attachment processing utilities directly (not through transport).
 * These tests verify the core functionality of attachment handling.
 *
 * Run: node test/test-unit.js
 */

const { processAttachment } = require('../dist/main.js');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Test result tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, testFn) {
    testsRun++;
    process.stdout.write(`${testsRun}. ${name}... `);

    try {
        await testFn();
        console.log('✅ PASSED');
        testsPassed++;
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        testsFailed++;
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertBase64(str, message) {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    assert(base64Regex.test(str), message || 'String is not valid base64');
}

async function runAllTests() {
    console.log('🧪 Unit Tests for Attachment Processing\n');
    console.log('='.repeat(70));
    console.log();

    // ===== String Content Tests =====
    console.log('📝 String Content Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process plain text string',
        async () => {
            const result = await processAttachment({
                filename: 'test.txt',
                content: 'Hello, World!',
            });

            assert(result.filename === 'test.txt', 'Filename should match');
            assert(typeof result.content === 'string', 'Content should be string');
            assertBase64(result.content, 'Content should be base64 encoded');

            // Decode and verify
            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === 'Hello, World!', 'Decoded content should match');
        }
    );

    await runTest(
        'Process unicode string',
        async () => {
            const result = await processAttachment({
                filename: 'unicode.txt',
                content: 'Hello 世界 🌍',
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === 'Hello 世界 🌍', 'Unicode should be preserved');
        }
    );

    await runTest(
        'Process empty string',
        async () => {
            const result = await processAttachment({
                filename: 'empty.txt',
                content: '',
            });

            assert(result.content === '', 'Empty string should produce empty base64');
        }
    );

    console.log();

    // ===== Buffer Content Tests =====
    console.log('💾 Buffer Content Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process Buffer',
        async () => {
            const buffer = Buffer.from('Test buffer content');
            const result = await processAttachment({
                filename: 'buffer.bin',
                content: buffer,
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64');
            assert(buffer.equals(decoded), 'Buffer content should match after decode');
        }
    );

    await runTest(
        'Process empty Buffer',
        async () => {
            const buffer = Buffer.alloc(0);
            const result = await processAttachment({
                filename: 'empty.bin',
                content: buffer,
            });

            assert(result.content === '', 'Empty buffer should produce empty base64');
        }
    );

    await runTest(
        'Process binary Buffer',
        async () => {
            const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
            const result = await processAttachment({
                filename: 'binary.bin',
                content: buffer,
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64');
            assert(buffer.equals(decoded), 'Binary content should match');
        }
    );

    console.log();

    // ===== File Path Tests =====
    console.log('📁 File Path Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process file path',
        async () => {
            const result = await processAttachment({
                filename: 'sample.txt',
                path: path.join(FIXTURES_DIR, 'sample.txt'),
            });

            assert(result.filename === 'sample.txt', 'Filename should match');
            assertBase64(result.content);

            // Verify content matches file
            const fileContent = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.txt'));
            const decoded = Buffer.from(result.content, 'base64');
            assert(fileContent.equals(decoded), 'File content should match');
        }
    );

    await runTest(
        'Generate filename from file path',
        async () => {
            const result = await processAttachment({
                path: path.join(FIXTURES_DIR, 'sample.json'),
            });

            assert(result.filename === 'sample.json', 'Should extract filename from path');
        }
    );

    await runTest(
        'Process PDF file',
        async () => {
            const result = await processAttachment({
                filename: 'document.pdf',
                path: path.join(FIXTURES_DIR, 'sample.pdf'),
            });

            assertBase64(result.content);
            assert(result.content.length > 0, 'PDF should have content');
        }
    );

    console.log();

    // ===== Data URI Tests =====
    console.log('🔗 Data URI Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process base64 data URI',
        async () => {
            const result = await processAttachment({
                filename: 'data.txt',
                path: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
            });

            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === 'Hello World', 'Data URI content should decode correctly');
        }
    );

    await runTest(
        'Process plain data URI',
        async () => {
            const result = await processAttachment({
                filename: 'data.txt',
                path: 'data:text/plain,Hello%20World',
            });

            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === 'Hello World', 'Plain data URI should be decoded');
        }
    );

    await runTest(
        'Generate filename from data URI MIME type',
        async () => {
            const result = await processAttachment({
                path: 'data:application/json;base64,e30=', // {}
            });

            assert(result.filename === 'attachment.json', 'Should generate filename from MIME type');
        }
    );

    console.log();

    // ===== Stream Tests =====
    console.log('🌊 Stream Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process readable stream',
        async () => {
            const stream = fs.createReadStream(path.join(FIXTURES_DIR, 'sample.txt'));
            const result = await processAttachment({
                filename: 'stream.txt',
                content: stream,
            });

            assertBase64(result.content);

            // Verify content matches file
            const fileContent = fs.readFileSync(path.join(FIXTURES_DIR, 'sample.txt'));
            const decoded = Buffer.from(result.content, 'base64');
            assert(fileContent.equals(decoded), 'Stream content should match file');
        }
    );

    await runTest(
        'Process stream from string',
        async () => {
            const stream = Readable.from(['Hello ', 'from ', 'stream']);
            const result = await processAttachment({
                filename: 'stream.txt',
                content: stream,
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === 'Hello from stream', 'Stream chunks should be concatenated');
        }
    );

    console.log();

    // ===== Encoding Tests =====
    console.log('🔤 Encoding Processing');
    console.log('-'.repeat(70));

    await runTest(
        'Process base64 encoded string',
        async () => {
            const original = 'Hello World';
            const base64Input = Buffer.from(original).toString('base64');

            const result = await processAttachment({
                filename: 'encoded.txt',
                content: base64Input,
                encoding: 'base64',
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === original, 'Should decode input then re-encode');
        }
    );

    await runTest(
        'Process hex encoded string',
        async () => {
            const original = 'Hello';
            const hexInput = Buffer.from(original).toString('hex');

            const result = await processAttachment({
                filename: 'hex.txt',
                content: hexInput,
                encoding: 'hex',
            });

            assertBase64(result.content);
            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded === original, 'Should decode hex input then encode to base64');
        }
    );

    console.log();

    // ===== Filename Tests =====
    console.log('📄 Filename Generation');
    console.log('-'.repeat(70));

    await runTest(
        'Generate default filename for string content',
        async () => {
            const result = await processAttachment({
                content: 'Test',
            });

            assert(result.filename === 'attachment.bin', 'Should generate default filename');
        }
    );

    await runTest(
        'Use provided filename',
        async () => {
            const result = await processAttachment({
                filename: 'my-file.txt',
                content: 'Test',
            });

            assert(result.filename === 'my-file.txt', 'Should use provided filename');
        }
    );

    await runTest(
        'Handle filename with spaces',
        async () => {
            const result = await processAttachment({
                filename: 'my file name.txt',
                content: 'Test',
            });

            assert(result.filename === 'my file name.txt', 'Should preserve spaces in filename');
        }
    );

    await runTest(
        'Handle unicode filename',
        async () => {
            const result = await processAttachment({
                filename: '文档.txt',
                content: 'Test',
            });

            assert(result.filename === '文档.txt', 'Should preserve unicode in filename');
        }
    );

    console.log();

    // ===== Content Type Tests =====
    console.log('🎨 Content Type Handling');
    console.log('-'.repeat(70));

    await runTest(
        'Generate filename from content type',
        async () => {
            const result = await processAttachment({
                content: 'Test',
                contentType: 'application/pdf',
            });

            assert(result.filename === 'attachment.pdf', 'Should generate filename from content type');
        }
    );

    await runTest(
        'Prefer provided filename over content type',
        async () => {
            const result = await processAttachment({
                filename: 'my-doc.pdf',
                content: 'Test',
                contentType: 'application/json',
            });

            assert(result.filename === 'my-doc.pdf', 'Provided filename should take precedence');
        }
    );

    console.log();

    // ===== Size Tests =====
    console.log('📏 Content Size Tests');
    console.log('-'.repeat(70));

    await runTest(
        'Handle small content',
        async () => {
            const result = await processAttachment({
                filename: 'small.txt',
                content: 'a',
            });

            assert(result.content.length > 0, 'Should handle single character');
        }
    );

    await runTest(
        'Handle medium content',
        async () => {
            const content = 'a'.repeat(1000);
            const result = await processAttachment({
                filename: 'medium.txt',
                content,
            });

            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded.length === 1000, 'Should handle 1KB content');
        }
    );

    await runTest(
        'Handle large content',
        async () => {
            const content = 'a'.repeat(100000);
            const result = await processAttachment({
                filename: 'large.txt',
                content,
            });

            const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
            assert(decoded.length === 100000, 'Should handle 100KB content');
        }
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
    console.error(error.stack);
    process.exit(1);
});
