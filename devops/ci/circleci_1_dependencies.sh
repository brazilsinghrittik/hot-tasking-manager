#!/usr/bin/env bash
set -ev # halt script on error

# Install latest LTS node
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs libgeos-c1 libgeos-dev # Required for shapely
node --version

# Install NPM packages and build client from gulpfile
cd client
npm install
./node_modules/.bin/gulp build
cd ..
