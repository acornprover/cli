#!/usr/bin/env node

import Conf from "conf";
import fetch from "node-fetch";
import BinWrapper from "@xhmikosr/bin-wrapper";
import { platform, arch } from "os";
import { join } from "path";
import envPaths from "env-paths";
import { mkdir } from "fs/promises";

// Initialize the config store with the project name
const config = new Conf({
  projectName: "acorn",
});

// Find the right binary for the current platform, given the
function findBinary(tag) {}

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
  const tag = config.get("tag");
  const needsUpdate =
    updateFlag ||
    !lastUpdateTime ||
    !tag ||
    new Date().getTime() - new Date(lastUpdateTime).getTime() >
      24 * 60 * 60 * 1000; // More than a day old

  if (needsUpdate) {
    // Check if there is a new tag.
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
    if (release.tag_name === tag) {
      console.log(`${tag} is up to date.`);
    } else {
      console.log(`Updating to ${release.tag_name} release...`);
    }

    // Save the version we're using
    tag = release.tag_name;
    config.set("tag", tag);

    // Store the current time as the update time
    config.set("lastUpdateTime", new Date().toISOString());
  }

  const version = tag.replace("v", "");
  const base = `https://github.com/acornprover/acorn/releases/download/${tag}/`;

  const bin = new BinWrapper()
    .src(`${base}acorn-${version}-darwin-arm64`, "darwin", "arm64")
    .src(`${base}acorn-${version}-linux-x64`, "linux", "x64")
    .src(`${base}acorn-${version}-win32-x64.exe`, "win32", "x64")
    .dest(envPaths("acorn").cache) // e.g. ~/Library/Caches/acorn
    .use(process.platform === "win32" ? "acorn.exe" : "acorn");

  if (updateFlag) {
    // Check the version to make sure it works
    await bin.run(["--version"]);
  } else {
    // Execute the binary with any remaining arguments
    await bin.run(args);
  }
}

// Run the main function
main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
