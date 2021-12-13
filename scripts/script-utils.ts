/* eslint-disable no-console */

import childProcess from "child_process";
import PromptSync from "prompt-sync";

const configuredPrompt = PromptSync({ sigint: true });

export const scriptUtils = {
  abort: (message: string) => {
    scriptUtils.log(`\u{26a0}\u{fe0f}  ${message} - aborting!\n`);

    process.exit(1);
  },

  datePrefix: () => {
    const time = new Date().toTimeString().replace(/\s.+/u, "");
    const prefix = `${time} | `;

    return prefix;
  },

  log: (message: string) => {
    const prefix = scriptUtils.datePrefix();

    console.log(
      `${/^\n/u.exec(message) ? "" : prefix}${message.replace(
        /\n(?=.)/gu,
        `\n${prefix}`
      )}`
    );
  },

  prompt: (message: string, forceYes?: boolean) => {
    if (!forceYes) {
      return configuredPrompt(`${scriptUtils.datePrefix()}\u{2753} ${message}`);
    }

    scriptUtils.log(`${scriptUtils.datePrefix()}\u{2753} ${message}y`);

    return "y";
  },

  run: (command: string, options?: { ignoreError: boolean }) => {
    const spawnedProcess = childProcess.spawnSync(command, { shell: true });

    const stderr = spawnedProcess.stderr.length
      ? spawnedProcess.stderr.toString().replace(/\n$/u, "")
      : "";

    const stdout = spawnedProcess.stdout.length
      ? spawnedProcess.stdout.toString().replace(/\n$/u, "")
      : "";

    if (spawnedProcess.status !== 0 && !options?.ignoreError) {
      console.error(stderr || stdout);

      process.exit(spawnedProcess.status ?? 1);
    }

    return stdout;
  },
};
