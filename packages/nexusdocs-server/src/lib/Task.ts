
import * as _ from 'lodash';

export type TaskFunc = (runner?: TaskRunner) => Promise<void>;

export interface Task {
  description: string;
  run: TaskFunc;
}

export interface TaskRunnerOptions {
  verbose?: boolean;
}

export class TaskRunner {
  public tasks: Task[] = [];
  public name: string;
  public options: TaskRunnerOptions;

  constructor(name: string = '', options?: TaskRunnerOptions) {
    this.name = name;
    this.options = _.defaults(options, {
      verbose: true,
    });
  }

  addTask(description: string, run: TaskFunc) {
    this.tasks.push({ description, run });
  }

  async exec() {
    const { tasks, options: { verbose } } = this;
    let finishCount = 0;

    verbose && process.stdout.write(`\nbegin: ${this.name}\n\n`);
    for (let i = 0; i < tasks.length; i++) {
      const { description, run } = tasks[i];
      verbose && process.stdout.write(`▶️   [${i + 1}/${tasks.length}] ${description}`);
      try {
        await run();
        finishCount++;
        verbose && process.stdout.write('\r✅ \n');
      } catch (err) {
        verbose && process.stdout.write('\r🚨 \n');
        console.error(err);
      }
    }
    verbose && process.stdout.write('\n');
    if (finishCount === tasks.length) {
      verbose && process.stdout.write('all tasks finished!\n');
    } else {
      verbose && process.stdout.write(`[${finishCount}/${tasks.length}] tasks finished!\n`);
    }
  }

}
