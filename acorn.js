#!/usr/bin/env node

const Conf = require("conf");

// Initialize the config store with the project name
const config = new Conf({
  projectName: "acorn",
});

// Parse command line arguments
const args = process.argv.slice(2);
const updateFlagIndex = args.indexOf("--update");
const updateFlag = updateFlagIndex !== -1;

// Check if update is needed
const lastUpdateTime = config.get("lastUpdateTime");
const needsUpdate =
  updateFlag ||
  !lastUpdateTime ||
  new Date().getTime() - new Date(lastUpdateTime).getTime() >
    24 * 60 * 60 * 1000; // More than a day old

// Handle updates
if (needsUpdate) {
  console.log("Checking for updates...");

  // TODO: actually check for updates

  // Store the current time as the update time
  config.set("lastUpdateTime", new Date().toISOString());
}

// Only exit early if the update flag was explicitly passed
if (updateFlag) {
  process.exit(0);
}

// Main body of the script
console.log("Hello world");
