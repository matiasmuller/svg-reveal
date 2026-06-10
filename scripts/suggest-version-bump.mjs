import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const latestTag = await getLatestSemverTag();
const range = latestTag ? `${latestTag}..HEAD` : "HEAD";
const commits = await getCommitMessages(range);
const suggestion = suggestVersionBump(commits);

console.log(`Analyzed commits: ${latestTag ? `since ${latestTag}` : "all history"}`);
console.log(`Suggested bump: ${suggestion.bump}`);

if (suggestion.reasons.length > 0) {
  console.log("Reasons:");

  for (const reason of suggestion.reasons) {
    console.log(`- ${reason}`);
  }
} else {
  console.log("Reasons:");
  console.log("- No conventional commit markers for a package version bump were found.");
}

console.log("");
console.log("Rules:");
console.log("- major: commit header with ! or body containing BREAKING CHANGE");
console.log("- minor: feat commits");
console.log("- patch: fix or perf commits");
console.log("- none: docs, test, chore, refactor, or no matching commits");

async function getLatestSemverTag() {
  try {
    const { stdout } = await execFileAsync("git", [
      "describe",
      "--tags",
      "--match",
      "v[0-9]*.[0-9]*.[0-9]*",
      "--match",
      "[0-9]*.[0-9]*.[0-9]*",
      "--abbrev=0"
    ]);

    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function getCommitMessages(commitRange) {
  try {
    const { stdout } = await execFileAsync("git", [
      "log",
      "--format=%B%n==END==",
      commitRange
    ]);

    return stdout
      .split("==END==")
      .map((message) => message.trim())
      .filter(Boolean);
  } catch (error) {
    throw new Error(`Unable to read git history for ${commitRange}: ${error.message}`);
  }
}

function suggestVersionBump(messages) {
  const reasons = [];
  let bump = "none";

  for (const message of messages) {
    const firstLine = message.split(/\r?\n/, 1)[0] ?? "";

    if (isBreakingChange(firstLine, message)) {
      bump = "major";
      reasons.push(firstLine || "BREAKING CHANGE marker found");
      continue;
    }

    if (bump !== "major" && /^feat(?:\([^)]+\))?:\s/i.test(firstLine)) {
      bump = "minor";
      reasons.push(firstLine);
      continue;
    }

    if (
      bump === "none" &&
      /^(fix|perf)(?:\([^)]+\))?:\s/i.test(firstLine)
    ) {
      bump = "patch";
      reasons.push(firstLine);
    }
  }

  return { bump, reasons };
}

function isBreakingChange(firstLine, message) {
  return (
    /^[a-z]+(?:\([^)]+\))?!:\s/i.test(firstLine) ||
    /^BREAKING CHANGE:\s/im.test(message)
  );
}
