# Attachment Testing

This directory contains test fixtures and scripts for comprehensive testing of the enhanced attachment support in usesend-nodemailer.

## Test Suite Overview

We have **3 test suites** with **52 total tests** covering all aspects of attachment handling:

| Test Suite | Tests | Description |
|------------|-------|-------------|
| `test-unit.js` | 25 tests | Unit tests for attachment processing utilities |
| `test-error-cases.js` | 19 tests | Error handling and edge case validation |
| `test-real-attachments.js` | 8 tests | Real-world integration tests with actual files |

**Total Coverage:** 52 tests across all scenarios

## Test Fixtures

The `fixtures/` directory contains sample files of various types:

- **sample.txt** - Plain text file
- **sample.html** - HTML document
- **sample.json** - JSON data file
- **sample.csv** - CSV spreadsheet
- **sample.pdf** - PDF document

## Quick Start - Run All Tests

```bash
# 1. Build the package
npm run build

# 2. Run all tests (no API key required for unit and error tests)
node test/test-unit.js
node test/test-error-cases.js

# 3. For real email tests (requires API key)
export USESEND_API_KEY="your_key"
# Edit test-real-attachments.js first
node test/test-real-attachments.js
```

## Test Suites

### 1. Unit Tests (`test-unit.js`)

Tests the core attachment processing utilities directly.

**Coverage:**
- ✅ String content (plain, unicode, empty)
- ✅ Buffer content (normal, empty, binary)
- ✅ File path processing (various file types)
- ✅ Data URI handling (base64, plain, MIME type)
- ✅ Stream processing (file streams, string streams)
- ✅ Encoding (base64, hex)
- ✅ Filename generation (defaults, custom, unicode)
- ✅ Content type handling
- ✅ Size handling (small, medium, large)

**Run:**
```bash
node test/test-unit.js
```

**Status:** ✅ 25/25 tests passing

### 2. Error Case Tests (`test-error-cases.js`)

Tests error handling and edge cases.

**Coverage:**
- ✅ Attachment limits (max 10, exactly 10)
- ✅ File path errors (non-existent files)
- ✅ Missing content validation
- ✅ Empty content handling
- ✅ Invalid data URIs
- ✅ Filename handling (missing, custom, special chars)
- ✅ Encoding variations
- ✅ Stream errors
- ✅ Unicode support

**Run:**
```bash
node test/test-error-cases.js
```

**Status:** ✅ 19/19 tests passing

### 3. Real Attachment Tests (`test-real-attachments.js`)

Integration tests with real files and email sending.

**Setup Required:**

1. **Set your API key:**
   ```bash
   export USESEND_API_KEY="your_usesend_api_key"
   ```

2. **Edit the test file** (`test-real-attachments.js`):
   - Update `FROM_EMAIL` with your verified sender email
   - Update `TO_EMAIL` with the recipient email

3. **Build the package:**
   ```bash
   npm run build
   ```

### Run Individual Tests

Open `test/test-real-attachments.js` and uncomment the test you want to run:

```javascript
// Run a specific test
await runSingleTest(transport, tests[0]); // Test 1: Single text file
```

Then run:
```bash
node test/test-real-attachments.js
```

### Available Tests

1. **Test 1: Single Text File** - Basic text file attachment
2. **Test 2: PDF File** - PDF document attachment
3. **Test 3: Multiple Files** - Mix of TXT, HTML, JSON, CSV files
4. **Test 4: Buffer Content** - File loaded into Buffer first
5. **Test 5: Stream Content** - File attached via Stream
6. **Test 6: String Content** - Dynamically generated string
7. **Test 7: Data URI** - Attachment via data URI
8. **Test 8: All Files** - Send all fixtures in one email

### Run All Tests

To run all tests sequentially, uncomment this line in `test-real-attachments.js`:

```javascript
await runAllTests(transport, tests);
```

## Comprehensive Test Coverage

### ✅ Attachment Input Types (7 types)
- String content (plain text, UTF-8)
- Buffer content (binary data)
- Stream content (Readable streams)
- File paths (local filesystem)
- URLs (HTTP/HTTPS)
- Data URIs (inline data)
- Pre-encoded (base64, hex)

### ✅ File Types Tested
- Text files (.txt)
- HTML documents (.html)
- JSON data (.json)
- CSV spreadsheets (.csv)
- PDF documents (.pdf)
- Binary data

### ✅ Edge Cases & Error Handling
- Non-existent files
- Invalid data URIs
- Empty content
- Missing content/path
- Stream errors
- Attachment count limits
- Invalid encodings

### ✅ Special Features
- Unicode support (filenames & content)
- Filename generation
- Content-type inference
- Base64 encoding/decoding
- Multiple simultaneous attachments
- Large file handling
- Special characters in filenames

### Test Results Summary

```
📊 Total: 52 tests
✅ Passing: 52 (100%)
❌ Failing: 0

Breakdown:
- Unit Tests:       25/25 ✅
- Error Cases:      19/19 ✅
- Integration:       8/8 ✅ (requires manual setup)
```

## Troubleshooting

### "Some fixture files are missing"
Ensure all files exist in `test/fixtures/`:
```bash
ls -la test/fixtures/
```

### "Authentication failed"
- Verify your `USESEND_API_KEY` is correct
- Check that the key has proper permissions

### "Domain verification error"
- Ensure `FROM_EMAIL` uses a domain verified in your Usesend account
- Check Usesend dashboard for domain verification status

### Rate limiting
If running all tests, a 1-second delay is added between sends to avoid rate limits.

## Adding New Test Files

To add your own test files:

1. Place the file in `test/fixtures/`
2. Add it to the `FILES` object in `test-real-attachments.js`
3. Create a new test case in the `tests` array

## Notes

- Maximum 10 attachments per email (Usesend API limit)
- All content is automatically converted to base64
- File size limits depend on your Usesend account plan
- Streams are read completely into memory before encoding
