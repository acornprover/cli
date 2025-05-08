#!/usr/bin/env node

import Conf from 'conf';
import fetch from 'node-fetch';

// Initialize the config store with the project name
const config = new Conf({
  projectName: "acorn",
});

async function main() {

  // Parse command line arguments
  const args = process.argv.slice(2);
  const updateFlagIndex = args.indexOf("--update");
  const updateFlag = updateFlagIndex !== -1;

  // Check if an update is needed
  const lastUpdateTime = config.get("lastUpdateTime");
  const needsUpdate =
    updateFlag ||
    !lastUpdateTime ||
    new Date().getTime() - new Date(lastUpdateTime).getTime() >
      24 * 60 * 60 * 1000; // More than a day old

  // Handle updates
  if (needsUpdate) {
    console.log("Checking for updates...");

    const response = await fetch(
      "https://api.github.com/repos/acornprover/acorn/releases/latest",
      {
        headers: { "User-Agent": "acorn-cli" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const release = await response.json();
    console.log(`Latest release: ${release.tag_name}`);

    // Store the current time as the update time
    config.set("lastUpdateTime", new Date().toISOString());
  }

  // Only exit early if the update flag was explicitly passed
  if (updateFlag) {
    process.exit(0);
  }

  // Main body of the script
  console.log("Hello world");
}

// Run the main function
main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
