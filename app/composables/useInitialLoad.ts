interface InitialLoadTask {
  run: () => Promise<unknown>;
  optional?: boolean;
}

export async function useInitialLoad(tasks: InitialLoadTask[]) {
  await Promise.all(
    tasks.map(async ({ run, optional }) => {
      if (optional) {
        await run().catch(() => undefined);
        return;
      }

      await run();
    }),
  );
}
