"""Validate the committed-source submission ZIP without extracting it."""
import hashlib
import sys
import zipfile
from pathlib import Path, PurePosixPath

archive = Path(sys.argv[1])
forbidden = {"node_modules", ".git", ".expo", "dist", "web-build", "coverage", "submission", "android", "ios", "__pycache__"}
required = {"App.tsx", "package.json", "package-lock.json", "README.md", "tsconfig.json", "src/data/recipetypes.json", "src/data/sampleRecipes.json", "src/types/recipe.ts"}
with zipfile.ZipFile(archive) as source:
    assert source.testzip() is None, "ZIP checksum failure"
    files = set()
    for item in source.infolist():
        path = PurePosixPath(item.filename)
        assert path.parts[0] == "Savour", f"Unexpected archive root: {path}"
        assert ".." not in path.parts and not path.is_absolute(), f"Unsafe path: {path}"
        relative = PurePosixPath(*path.parts[1:])
        assert not forbidden.intersection(relative.parts), f"Excluded directory found: {path}"
        assert not relative.name.startswith(".env"), f"Environment file found: {path}"
        assert relative.suffix not in {".pem", ".key", ".p12", ".jks", ".mobileprovision"}, f"Credential file found: {path}"
        if not item.is_dir():
            files.add(str(relative))
    assert required.issubset(files), f"Missing required files: {required - files}"
    assert len([p for p in files if p.startswith("assets/images/") and p.endswith(".jpg")]) >= 6
print(f"Verified {len(files)} source files; archive size {archive.stat().st_size:,} bytes")
print(f"SHA-256: {hashlib.sha256(archive.read_bytes()).hexdigest()}")
