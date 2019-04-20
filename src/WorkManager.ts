import { noop } from './misc';

interface IWorkingTask {
  date: number;
  title: string;
}

export default class WorkManager {
  public onWork: (working: boolean) => void = noop;
  public onError: (error: Error) => void = noop;
  protected workingTasks: IWorkingTask[] = [];

  public async run<T> (
    title: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    const done = this.start(title);
    try {
      const result = await fn();
      return result;
    } catch (error) {
      this.onError(error);
      return null;
    } finally {
      done();
    }
  }

  public start (title: string) {
    const newTasks = [...this.workingTasks];
    const task: IWorkingTask = {
      date: Date.now(),
      title,
    };
    newTasks.push(task);
    this.workingTasks = newTasks;
    this.onWork(true);

    return () => {
      const { workingTasks } = this;
      const index = workingTasks.indexOf(task);

      // do nothing if closed
      if (index < 0) {
        return;
      }

      const finalTasks = [...workingTasks];
      finalTasks.splice(index, 1);

      this.workingTasks = finalTasks;
      const working = finalTasks.length > 0;
      this.onWork(working);
    };
  }
}