import fs from "fs";
import pjson from "../package.json";
import { scriptUtils } from "./script-utils";

if (scriptUtils.run("git diff").length) {
  scriptUtils.abort("Unstaged changes");
}

if (scriptUtils.run("git diff --cached").length) {
  scriptUtils.abort("Uncommited staged changes");
}

const GIT_BRANCH = scriptUtils.run("git rev-parse --abbrev-ref HEAD");

if (!/^(?:main)$/u.test(GIT_BRANCH)) {
  scriptUtils.abort(`Not on the "main" branch ("${GIT_BRANCH}")`);
}

const GIT_TAG = scriptUtils.run("git describe --tags", { ignoreError: true });

if (/^v\d+\.\d+\.\d+$/u.test(GIT_TAG)) {
  scriptUtils.abort(
    `Branch "${GIT_BRANCH}" should not be on a semver version tag ("${GIT_TAG}")`
  );
}

scriptUtils.log(
  "\u{26a0}\u{fe0f}  This script will build a new tagged version of the lib," +
    " push it to GitHub, and also give you the choice to publish it to npm."
);

scriptUtils.log(
  '\u{26a0}\u{fe0f}  The "publish" branch will be force-deleted if it exists' +
    " and then re-created\n"
);

let answer = scriptUtils.prompt("Is this really your intention? (y/N) ");

if ((answer || "").toLowerCase() !== "y") {
  scriptUtils.abort('You did not reply "y"');
}

scriptUtils.log("\nOK - building the lib, please wait ...\n");

scriptUtils.run("git branch -D publish", { ignoreError: true });

scriptUtils.run(`
  git checkout -b publish &&
  npm run build &&
  \\rm -rf coverage nohup.out &&
  git rm -rf --ignore-unmatch .eslintrc.js .gitignore .husky \
    package-lock.json scripts src test tsconfig.json &&
  mv lib/* ./ && rmdir lib
`);

// @ts-expect-error not needed in the published lib
delete pjson.devDependencies;
// @ts-expect-error not needed in the published lib
delete pjson.jest;
// @ts-expect-error not needed in the published lib
delete pjson["lint-staged"];
// @ts-expect-error not needed in the published lib
delete pjson.scripts;

fs.writeFileSync("./package.json", `${JSON.stringify(pjson, undefined, 2)}\n`);

scriptUtils.run(
  `git add -f index.d.ts index.js package.json  types.d.ts types.js &&
   git rm -rf --ignore-unmatch --cached node_modules scripts src \
     test >/dev/null 2>&1 &&
   git commit -m 'Build lib'`
);

const typesOfRelease = ["major", "minor", "patch"] as const;
let typeOfRelease: typeof typesOfRelease[number] = "patch";

answer = scriptUtils.prompt(
  `What type of release is this?\n\n${typesOfRelease
    .map((type, index) => `[${index + 1}] ${type}`)
    .join("\n")}\n\nPlease enter a number (default: 3) `
);

const choiceNumber = parseInt(answer || "3", 10);

if (choiceNumber < 1 || choiceNumber > typesOfRelease.length) {
  scriptUtils.run(`git checkout -f ${GIT_BRANCH}`);
  scriptUtils.abort("Invalid answer");
}

typeOfRelease = typesOfRelease[choiceNumber - 1];

scriptUtils.log(
  `\nOK - creating the ${typeOfRelease} release, please wait ...\n`
);

scriptUtils.run(`
  npm version ${typeOfRelease} -m "Update version to v%s" &&
  git tag -f latest
`);

answer = scriptUtils.prompt(
  "Do you wish to push the release tag to GitHub? (y/N) "
);

if ((answer || "").toLowerCase() === "y") {
  scriptUtils.run("git push --tags --force origin publish");
}

answer = scriptUtils.prompt(
  "\u{1f4e6}  Do you wish to publish the release to npm? (y/N) "
);

if ((answer || "").toLowerCase() === "y") {
  scriptUtils.run("npm publish");
}

scriptUtils.run(`
  git checkout -f ${GIT_BRANCH}
`);

scriptUtils.run(
  `npm version ${typeOfRelease} -m "Bump version to v%s following release"`,
  { ignoreError: true }
);

answer = scriptUtils.prompt(
  "Do you wish to push the main branch with the updated version" +
    " to GitHub ? (y/N) "
);

if ((answer || "").toLowerCase() === "y") {
  scriptUtils.run(`git push --force origin ${GIT_BRANCH}`, {
    ignoreError: true,
  });
}

scriptUtils.log(`\n\u{2714}\u{fe0f}  New ${typeOfRelease} release ready!\n`);
