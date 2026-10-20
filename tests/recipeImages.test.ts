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
  copyGate: null as Promise<void> | null,
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
    async copy(destination: File) {
      await mockDisk.copyGate;
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
    mockDisk.copyGate = null;
    mockDisk.root = 'file:///documents';
  });
  it('copies a picker photo into documents and returns a relative reference', async () => {
    mockDisk.files.set('file:///cache/picker.jpg', 120);
    const uri = await persistRecipeImage('file:///cache/picker.jpg');
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
  it('does not recopy bundled or existing owned images', async () => {
    await expect(persistRecipeImage('sample:avocado-toast')).resolves.toBe('sample:avocado-toast');
    await expect(persistRecipeImage('local:existing.jpg')).resolves.toBe('local:existing.jpg');
    expect(mockDisk.files.size).toBe(0);
  });
  it('rejects unavailable picker images', async () => {
    await expect(persistRecipeImage('file:///missing.jpg')).rejects.toThrow('select it again');
  });
  it('surfaces file copy failures', async () => {
    mockDisk.files.set('file:///cache/photo.jpg', 100);
    mockDisk.failCopy = true;
    await expect(persistRecipeImage('file:///cache/photo.jpg')).rejects.toThrow('Copy failed');
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

describe('asynchronous photo copying', () => {
  it('waits for the native copy before checking the file or returning a saved reference', async () => {
    let finishCopy: () => void = () => undefined;
    mockDisk.files.clear();
    mockDisk.failCopy = false;
    mockDisk.copyGate = new Promise<void>((resolve) => {
      finishCopy = resolve;
    });
    mockDisk.files.set('file:///cache/delayed.jpg', 120);
    let settled = false;
    const pending = persistRecipeImage('file:///cache/delayed.jpg');
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(mockDisk.files.has(resolveImageUri('local:unique-photo-id.jpg'))).toBe(false);
    finishCopy();
    await expect(pending).resolves.toBe('local:unique-photo-id.jpg');
    expect(mockDisk.files.get(resolveImageUri('local:unique-photo-id.jpg'))).toBe(120);
    mockDisk.copyGate = null;
  });
});
