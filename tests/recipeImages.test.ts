import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  persistRecipeImage,
  removeRecipeImage,
  resolveImageUri,
} from '../src/services/recipeImages';
const disk = vi.hoisted(() => ({
  files: new Map<string, number>(),
  failCopy: false,
  root: 'file:///documents',
}));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'unique-photo-id' }));
vi.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
    create() {}
  }
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
    get exists() {
      return disk.files.has(this.uri);
    }
    get size() {
      return disk.files.get(this.uri) ?? 0;
    }
    get extension() {
      return '.jpg';
    }
    copy(destination: File) {
      if (disk.failCopy) throw new Error('Copy failed');
      disk.files.set(destination.uri, this.size);
    }
    delete() {
      disk.files.delete(this.uri);
    }
  }
  return {
    Directory,
    File,
    Paths: {
      get document() {
        return { uri: disk.root };
      },
    },
  };
});
describe('permanent recipe photos', () => {
  beforeEach(() => {
    disk.files.clear();
    disk.failCopy = false;
    disk.root = 'file:///documents';
  });
  it('copies a picker photo into documents and returns a relative reference', () => {
    disk.files.set('file:///cache/picker.jpg', 120);
    const uri = persistRecipeImage('file:///cache/picker.jpg');
    expect(uri).toBe('local:unique-photo-id.jpg');
    expect(disk.files.get(resolveImageUri(uri))).toBe(120);
    disk.files.delete('file:///cache/picker.jpg');
    expect(disk.files.has(resolveImageUri(uri))).toBe(true);
  });
  it('resolves a relative reference after the sandbox root changes', () => {
    disk.root = 'file:///new-sandbox/documents';
    expect(resolveImageUri('local:unique-photo-id.jpg')).toBe(
      'file:///new-sandbox/documents/recipe-images/unique-photo-id.jpg',
    );
  });
  it('does not recopy bundled or existing owned images', () => {
    expect(persistRecipeImage('sample:avocado-toast')).toBe('sample:avocado-toast');
    expect(persistRecipeImage('local:existing.jpg')).toBe('local:existing.jpg');
    expect(disk.files.size).toBe(0);
  });
  it('rejects unavailable picker images', () =>
    expect(() => persistRecipeImage('file:///missing.jpg')).toThrow('select it again'));
  it('surfaces file copy failures', () => {
    disk.files.set('file:///cache/photo.jpg', 100);
    disk.failCopy = true;
    expect(() => persistRecipeImage('file:///cache/photo.jpg')).toThrow('Copy failed');
  });
  it('removes only application-owned images', () => {
    disk.files.set('file:///cache/other.jpg', 100);
    removeRecipeImage('file:///cache/other.jpg');
    expect(disk.files.has('file:///cache/other.jpg')).toBe(true);
    disk.files.set('file:///documents/recipe-images/owned.jpg', 100);
    removeRecipeImage('local:owned.jpg');
    expect(disk.files.has('file:///documents/recipe-images/owned.jpg')).toBe(false);
  });
  it('prevents path traversal in stored references', () =>
    expect(() => resolveImageUri('local:../../outside.jpg')).toThrow('Invalid'));
});
