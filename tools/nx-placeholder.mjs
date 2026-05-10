const [project, target] = process.argv.slice(2);

if (!project || !target) {
  console.error("Usage: node tools/nx-placeholder.mjs <project> <target>");
  process.exit(1);
}

console.log(`${project}: ${target} target is configured`);
