#!/usr/bin/env bash
set -ev # halt script on error

# JS Unit Tests
cd tests/client
sudo ../../client/node_modules/.bin/karma start ./karma.conf.js --single-run --browsers PhantomJS --reporters junit
cd ../..

# Run Python tests
nosetests ./tests/server --with-xunit --xunit-file $CIRCLE_TEST_REPORTS/unitresults.xml \
  --with-coverage --cover-erase --cover-package=./server
coverage xml -o $CIRCLE_TEST_REPORTS/coverage.xml
