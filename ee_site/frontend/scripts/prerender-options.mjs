// Deliberately support only options that the complete prerender pipeline uses.
// Never silently accept Vite CLI options that the programmatic build ignores.
export function parseBuildOptions(args) {
  let outDir = 'dist';
  let provided = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument !== '--outDir' && !argument.startsWith('--outDir=')) {
      throw new Error(`Unsupported build argument: ${argument}. Supported: --outDir <directory>.`);
    }
    if (provided) throw new Error('Specify --outDir only once.');
    const value = argument === '--outDir' ? args[++index] : argument.slice('--outDir='.length);
    if (!value?.trim() || value.startsWith('-')) {
      throw new Error('--outDir requires a directory. Quote paths containing spaces.');
    }
    outDir = value;
    provided = true;
  }
  return { outDir };
}
