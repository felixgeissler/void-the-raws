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
```

### clean

Clean up RAW files from a directory where no exported JPEGs exist.

### encode

Check MP4 files in a directory for H.264 codec and reencode them to H.265.

### fix-gps-metadata

Restores missing GPS timestamps by converting the photo's original creation time to UTC.
