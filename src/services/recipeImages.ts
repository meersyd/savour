import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
const PREFIX = 'local:';
function imageDirectory() {
  return new Directory(Paths.document, 'recipe-images');
}
export function resolveImageUri(uri: string): string {
  if (!uri.startsWith(PREFIX)) return uri;
  const filename = uri.slice(PREFIX.length);
  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename))
    throw new Error('Invalid saved photo filename.');
  return new File(imageDirectory(), filename).uri;
}
/** Store a relative reference so an iOS sandbox path change does not break photos. */
export function persistRecipeImage(uri: string): string {
  if (uri.startsWith('sample:') || uri.startsWith(PREFIX)) return uri;
  const directory = imageDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const source = new File(uri);
  if (!source.exists) throw new Error('This photo is no longer available. Please select it again.');
  const extension = /^\.[a-zA-Z0-9]+$/.test(source.extension) ? source.extension : '.jpg';
  const filename = `${randomUUID()}${extension}`;
  const destination = new File(directory, filename);
  source.copy(destination);
  if (!destination.exists || destination.size === 0)
    throw new Error('The photo could not be saved. Please try again.');
  return `${PREFIX}${filename}`;
}
export function removeRecipeImage(uri: string): void {
  if (!uri.startsWith(PREFIX)) return;
  const file = new File(resolveImageUri(uri));
  if (file.exists) file.delete();
}
