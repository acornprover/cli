#!/usr/bin/env node

import Conf from "conf";
import fetch from "node-fetch";
import BinWrapper from "@xhmikosr/bin-wrapper";
import { platform, arch } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the config store with the project name
const config = new Conf({
  projectName: "acorn",
});

// Find the right binary for the current platform
const findBinary = (assets, version) => {
  const osType = platform();
  const architecture = arch();

  // Create a pattern to match platform+arch in filename
  const pattern = `acorn-${version}-${osType}-${architecture}`;
  const exePattern = osType === "win32" ? `${pattern}.exe` : pattern;

  // Filter assets that match our pattern
  const matchingAssets = assets.filter(
    (asset) => asset.name === pattern || asset.name === exePattern
  );

  if (matchingAssets.length === 0) {
    throw new Error(`No matching binary found for ${osType}-${architecture}`);
  }

  if (matchingAssets.length > 1) {
    throw new Error(
      `Multiple matching binaries found: ${matchingAssets
        .map((a) => a.name)
        .join(", ")}`
    );
  }

  return matchingAssets[0];
};

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const updateFlagIndex = args.indexOf("--update");
  const updateFlag = updateFlagIndex !== -1;

  // Remove update flag from args if present
  if (updateFlagIndex !== -1) {
    args.splice(updateFlagIndex, 1);
  }

  // Check if an update is needed
  const lastUpdateTime = config.get("lastUpdateTime");
  const installedVersion = config.get("installedVersion");
  const needsUpdate =
    updateFlag ||
    !lastUpdateTime ||
    !installedVersion ||
    new Date().getTime() - new Date(lastUpdateTime).getTime() >
      24 * 60 * 60 * 1000; // More than a day old

  let bin = null;

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
    const version = release.tag_name.replace("v", "");
    // console.log(`Latest release: ${release.tag_name}`);

    // Check if we already have this version installed
    if (installedVersion === version) {
      console.log(`Version ${version} is up to date.`);
      // Use existing binary
      bin = new BinWrapper()
        .dest(join(__dirname, "vendor"))
        .use(platform() === "win32" ? "acorn.exe" : "acorn");
    } else {
      // Need to download new version
      // Find the correct binary for this platform
      const binary = findBinary(release.assets, version);

      console.log(`Downloading ${binary.name}...`);

      // Setup binary wrapper
      bin = new BinWrapper()
        .src(binary.browser_download_url)
        .dest(join(__dirname, "vendor"))
        .use(platform() === "win32" ? "acorn.exe" : "acorn");

      // Save the version we're installing
      config.set("installedVersion", version);

      // Store the current time as the update time
      config.set("lastUpdateTime", new Date().toISOString());
    }
  } else {
    // Use existing binary
    bin = new BinWrapper()
      .dest(join(__dirname, "vendor"))
      .use(platform() === "win32" ? "acorn.exe" : "acorn");
  }

  // Only exit early if the update flag was explicitly passed
  if (updateFlag && args.length === 0) {
    process.exit(0);
  }

  // Execute the binary with any remaining arguments
  await bin.run(args);
}

// Run the main function
main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
