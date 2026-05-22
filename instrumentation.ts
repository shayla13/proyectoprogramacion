export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { autoInitDatabase } = await import('./lib/dbInit');
    await autoInitDatabase();
  }
}
