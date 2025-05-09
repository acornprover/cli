#!/usr/bin/env node

import Conf from "conf";
import fetch from "node-fetch";
import BinWrapper from "@xhmikosr/bin-wrapper";
import { execa } from "execa";

import { join } from "path";
import envPaths from "env-paths";
import { readdir, unlink } from "fs/promises";
import { existsSync } from "fs";

// Initialize the config store with the project name
const config = new Conf({
  projectName: "acorn",
});

/**
 * Deletes all files in the cache directory
 * @returns {Promise<void>}
 */
async function clearCache() {
  const cachePath = envPaths("acorn").cache;

  if (!existsSync(cachePath)) {
    return;
  }

  try {
    const files = await readdir(cachePath);

    // Delete all files in the cache directory
    await Promise.all(files.map((file) => unlink(join(cachePath, file))));

    console.log(`Cache cleared successfully.`);
  } catch (error) {
    console.error(`Failed to clear cache: ${error.message}`);
  }
}

async function main() {
  // Parse command line arguments
  let args = process.argv.slice(2);
  const updateFlagIndex = args.indexOf("--update");
  const updateFlag = updateFlagIndex !== -1;
  const cleanFlagIndex = args.indexOf("--clean");
  const cleanFlag = cleanFlagIndex !== -1;

  // Remove flags from args if present
  if (updateFlagIndex !== -1) {
    args.splice(updateFlagIndex, 1);
  }

  if (cleanFlagIndex !== -1) {
    args.splice(cleanFlagIndex, 1);
  }

  // Handle clean request
  if (cleanFlag) {
    await clearCache();
    if (args.length === 0) {
      return;
    }
  }

  // Check if an update is needed
  const lastUpdateTime = config.get("lastUpdateTime");
  let tag = config.get("tag");
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
  const urlPath = `https://github.com/acornprover/acorn/releases/download/${tag}/`;

  let suffix = null;
  if (process.platform === "darwin" && process.arch === "arm64") {
    suffix = "darwin-arm64";
  } else if (process.platform === "linux" && process.arch === "x64") {
    suffix = "linux-x64";
  } else if (process.platform === "win32" && process.arch === "x64") {
    suffix = "win32-x64.exe";
  } else {
    throw new Error(
      `Unsupported platform: ${process.platform}-${process.arch}`
    );
  }
  const basename = `acorn-${version}-${suffix}`;
  const url = `${urlPath}${basename}`;

  const bin = new BinWrapper()
    .src(url, process.platform, process.arch)
    .dest(envPaths("acorn").cache) // e.g. ~/Library/Caches/acorn
    .use(basename);

  await bin.download();
  if (updateFlag) {
    // Just check the version to make sure it works
    args = ["--version"];
  }
  await execa(bin.path(), args, { stdio: "inherit" });
}

// Run the main function
main().catch((error) => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
