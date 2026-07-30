#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
PB_DATA_DIR="${PB_DATA_DIR:-./pb_data}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting PocketBase backup..."
echo "Data directory: $PB_DATA_DIR"
echo "Backup directory: $BACKUP_DIR"

# Backup SQLite database
if [ -f "$PB_DATA_DIR/data.db" ]; then
    echo "Backing up SQLite database..."
    sqlite3 "$PB_DATA_DIR/data.db" ".backup '$BACKUP_DIR/db_${TIMESTAMP}.sqlite'"
    echo "Database backup completed: db_${TIMESTAMP}.sqlite"
else
    echo "Warning: SQLite database not found at $PB_DATA_DIR/data.db"
fi

# Tar storage directory
if [ -d "$PB_DATA_DIR/storage" ]; then
    echo "Backing up storage files..."
    tar -czf "$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz" -C "$PB_DATA_DIR" storage/
    echo "Storage backup completed: storage_${TIMESTAMP}.tar.gz"
else
    echo "Warning: Storage directory not found at $PB_DATA_DIR/storage"
fi

# Delete backups older than RETENTION_DAYS
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sqlite" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully at $(date)"
