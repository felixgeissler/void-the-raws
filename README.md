# Void The RAWs

Tool to clean up RAW photos from directories where no exported/edited JPEG's exists

_Requirements_

- ffmpeg
- ffprobe

## Commands

### analyze

Analyzes subdirectories for disk usage, RAW files, exports, and cleanability.

```bash
void-the-raws analyze <root> [options]
```

**Arguments:**

- `root` - Root directory containing image/media album subdirectories

**Options:**

- `-e, --export-dir-name <name>` - Name of subdirectory with exported JPEGs (default: "Export")
- `-dp, --export-date-prefix` - Whether exports are prefixed with a date (e.g. YYYYMMDD-raw_filename.jpg)
- `-tr, --type-raw <ext>` - Extension of RAW files (default: "ARW")
- `-te, --type-edited <ext>` - Extension of edited files (default: "jpg")
- `-s, --sort <field>` - Sort by: name, size, or files (sorts by RAW file count) (default: "name")

**Example:**

```bash
void-the-raws analyze /path/to/photos -s size
void-the-raws analyze /path/to/photos -tr CR2 -te jpeg -e Exports
```

### clean

Clean up RAW files from a directory where no exported JPEGs exist.

```bash
void-the-raws clean <dir> [options]
```

**Arguments:**

- `dir` - Directory to clean up

**Options:**

- `-e, --export-dir-name <name>` - Name of subdirectory with exported JPEGs (default: "Export")
- `-dp, --export-date-prefix` - Whether exports are prefixed with a date (e.g. YYYYMMDD-raw_filename.jpg)
- `-tr, --type-raw <ext>` - Extension of RAW files (default: "ARW")
- `-te, --type-edited <ext>` - Extension of edited files (default: "jpg")

**Example:**

```bash
void-the-raws clean /path/to/album
void-the-raws clean /path/to/album -tr NEF -te jpg --export-date-prefix
```

### encode

Check MP4 files in a directory for H.264 codec and reencode them to H.265.

```bash
void-the-raws encode <dir> [options]
```

**Arguments:**

- `dir` - Directory to check for MP4 files

**Options:**

- `-c, --concurrency <number>` - Number of files to reencode concurrently (ffmpeg jobs) (default: "2")

**Example:**

```bash
void-the-raws encode /path/to/videos
void-the-raws encode /path/to/videos -c 4
```

### fix-gps-metadata

Restores missing GPS timestamps by converting the photo's original creation time to UTC and writing it as GPSDateStamp and GPSTimeStamp for accurate timezone handling.

This fixes the issue where Lightroom won't write GPSDateStamp and GPSTimeStamp on manually geotagged photos, which can lead to timezone shifts when importing JPEGs into Google Photos.

```bash
void-the-raws fix-gps-metadata <dir> [options]
```

**Arguments:**

- `dir` - Directory to check for GPS metadata in JPEG files

**Options:**

- `-e, --export-dir-name <name>` - Name of subdirectory with exported JPEGs (default: "Export")
- `-v, --verbose` - Enable verbose output / debug mode (default: false)
- `-te, --type-edited <ext>` - Extension of edited files (default: "jpg")

**Example:**

```bash
void-the-raws fix-gps-metadata /path/to/album
void-the-raws fix-gps-metadata /path/to/album -v -e Exports
```
