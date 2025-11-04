#!/bin/bash

# Run All Automated Tests
# This script runs all tests that don't require API keys or manual setup

echo "🧪 Running All Automated Tests for usesend-nodemailer"
echo "======================================================"
echo ""

# Track overall results
TOTAL_SUITES=0
PASSED_SUITES=0

# Function to run a test suite
run_test_suite() {
    local test_file=$1
    local test_name=$2

    TOTAL_SUITES=$((TOTAL_SUITES + 1))

    echo "📋 Running: $test_name"
    echo "------------------------------------------------------"

    if node "$test_file"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
        echo ""
        echo "✅ $test_name PASSED"
    else
        echo ""
        echo "❌ $test_name FAILED"
    fi

    echo ""
}

# Change to test directory
cd "$(dirname "$0")"

# Run test suites
run_test_suite "test-unit.js" "Unit Tests"
run_test_suite "test-error-cases.js" "Error Case Tests"

# Print summary
echo "======================================================"
echo "📊 Test Suite Summary"
echo "======================================================"
echo "Total Suites: $TOTAL_SUITES"
echo "✅ Passed: $PASSED_SUITES"
echo "❌ Failed: $((TOTAL_SUITES - PASSED_SUITES))"
echo ""

if [ $PASSED_SUITES -eq $TOTAL_SUITES ]; then
    echo "🎉 All test suites passed!"
    echo ""
    echo "💡 To run integration tests with real emails:"
    echo "   1. export USESEND_API_KEY=\"your_key\""
    echo "   2. Edit test-real-attachments.js (set FROM_EMAIL and TO_EMAIL)"
    echo "   3. node test-real-attachments.js"
    exit 0
else
    echo "⚠️  Some test suites failed. Please review the output above."
    exit 1
fi
