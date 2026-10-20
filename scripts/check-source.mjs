import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
const files = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(`${directory}/${entry.name}`)
      : [`${directory}/${entry.name}`],
  );
const violations = [];
for (const file of [
  ...files("src"),
  ...files("worker"),
  ...files("scripts"),
].filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name))) {
  const text = readFileSync(file, "utf8");
  const count = text.trimEnd().split("\n").length;
  if (count > 300) violations.push(`${file}: ${count} lines (max 300)`);
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (
      ts.isArrowFunction(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isMethodDeclaration(node)
    ) {
      const start =
        source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const end = source.getLineAndCharacterOfPosition(node.end).line + 1;
      if (end - start + 1 > 50)
        violations.push(
          `${file}:${start} ${node.parent?.name?.getText(source) ?? "callback"}: ${end - start + 1} lines (max 50)`,
        );
      if (ts.isFunctionDeclaration(node))
        violations.push(`${file}:${start} function declaration (use arrow)`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
process.stdout.write(
  violations.length
    ? `${violations.join("\n")}\n`
    : "Source limits passed: functions <=50 lines; files <=300 lines; no function declarations.\n",
);
process.exitCode = violations.length ? 1 : 0;
