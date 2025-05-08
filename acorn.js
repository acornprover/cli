#!/usr/bin/env node

const Conf = require('conf');

// Initialize the config store with the project name
const config = new Conf({
  projectName: 'acorn'
});

// Parse command line arguments
const args = process.argv.slice(2);
const updateFlagIndex = args.indexOf('--update');
const shouldUpdate = updateFlagIndex !== -1;

// Handle the --update flag
if (shouldUpdate) {
  // Get the last update time
  const lastUpdateTime = config.get('lastUpdateTime');
  
  if (lastUpdateTime) {
    console.log(`Last updated: ${new Date(lastUpdateTime).toLocaleString()}`);
  } else {
    console.log('Last updated: never');
  }
  
  // Store the current time as the update time
  config.set('lastUpdateTime', new Date().toISOString());
} else {
  // Original functionality
  console.log('Hello world');
}