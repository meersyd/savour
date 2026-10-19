import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  persistRecipeImage,
  removeRecipeImage,
  resolveImageUri,
} from '../src/services/recipeImages';
const mockDisk = {
  files: new Map<string, number>(),
  failCopy: false,
  root: 'file:///documents',
};
jest.mock('expo-crypto', () => ({ randomUUID: () => 'unique-photo-id' }));
jest.mock('expo-file-system', () => {
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
      return mockDisk.files.has(this.uri);
    }
    get size() {
      return mockDisk.files.get(this.uri) ?? 0;
    }
    get extension() {
      return '.jpg';
    }
    copy(destination: File) {
      if (mockDisk.failCopy) throw new Error('Copy failed');
      mockDisk.files.set(destination.uri, this.size);
    }
    delete() {
      mockDisk.files.delete(this.uri);
    }
  }
  return {
    Directory,
    File,
    Paths: {
      get document() {
        return { uri: mockDisk.root };
      },
    },
  };
});
describe('permanent recipe photos', () => {
  beforeEach(() => {
    mockDisk.files.clear();
    mockDisk.failCopy = false;
    mockDisk.root = 'file:///documents';
  });
  it('copies a picker photo into documents and returns a relative reference', () => {
    mockDisk.files.set('file:///cache/picker.jpg', 120);
    const uri = persistRecipeImage('file:///cache/picker.jpg');
    expect(uri).toBe('local:unique-photo-id.jpg');
    expect(mockDisk.files.get(resolveImageUri(uri))).toBe(120);
    mockDisk.files.delete('file:///cache/picker.jpg');
    expect(mockDisk.files.has(resolveImageUri(uri))).toBe(true);
  });
  it('resolves a relative reference after the sandbox root changes', () => {
    mockDisk.root = 'file:///new-sandbox/documents';
    expect(resolveImageUri('local:unique-photo-id.jpg')).toBe(
      'file:///new-sandbox/documents/recipe-images/unique-photo-id.jpg',
    );
  });
  it('does not recopy bundled or existing owned images', () => {
    expect(persistRecipeImage('sample:avocado-toast')).toBe('sample:avocado-toast');
    expect(persistRecipeImage('local:existing.jpg')).toBe('local:existing.jpg');
    expect(mockDisk.files.size).toBe(0);
  });
  it('rejects unavailable picker images', () =>
    expect(() => persistRecipeImage('file:///missing.jpg')).toThrow('select it again'));
  it('surfaces file copy failures', () => {
    mockDisk.files.set('file:///cache/photo.jpg', 100);
    mockDisk.failCopy = true;
    expect(() => persistRecipeImage('file:///cache/photo.jpg')).toThrow('Copy failed');
  });
  it('removes only application-owned images', () => {
    mockDisk.files.set('file:///cache/other.jpg', 100);
    removeRecipeImage('file:///cache/other.jpg');
    expect(mockDisk.files.has('file:///cache/other.jpg')).toBe(true);
    mockDisk.files.set('file:///documents/recipe-images/owned.jpg', 100);
    removeRecipeImage('local:owned.jpg');
    expect(mockDisk.files.has('file:///documents/recipe-images/owned.jpg')).toBe(false);
  });
  it('prevents path traversal in stored references', () =>
    expect(() => resolveImageUri('local:../../outside.jpg')).toThrow('Invalid'));
});
