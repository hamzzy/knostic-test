# Knostic CSV Data Management App

A web application for managing CSV data with validation, editing, and export capabilities. Upload CSV files, validate data relationships, edit content, and export results.

## ✨ What This App Does

- **Upload CSV Files**: Drag and drop CSV files (any filename works - test.csv, data.csv, etc.)
- **Automatic Detection**: App automatically detects if files contain "strings" or "classifications" data based on headers
- **Edit Data**: Click on any cell to edit data inline, add new rows, or delete existing ones
- **Validate Data**: Check that all strings have corresponding classifications
- **Export Results**: Download validated data as CSV files
- **Pagination**: Navigate through large datasets with pagination controls

## 🚀 How to Start

### Quick Start with Docker (Recommended)

```bash
# Build and run the application
docker build -t knostic-csv-manager .
docker run -p 4000:4000 knostic-csv-manager
```

Then open http://localhost:4000 in your browser.

### Local Development

```bash
# Start backend
cd backend
npm install
npm start

# Start frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

### Using Make Commands (Alternative)

If you have `make` installed, you can use these convenient commands:

```bash
# Quick start - install dependencies and start development servers
make start

# Start development servers with Docker
make dev

# Install dependencies only
make install

# Run tests
make test

# Build the application
make build

# See all available commands
make help
```

## 📋 How to Use

1. **Upload Files**: Drag and drop your CSV files onto the upload area
2. **Review Data**: The app will automatically detect the file type and show your data in tables
3. **Edit Data**: Click on any cell to edit it, or use the "Add Row" button to add new data
4. **Validate**: Click "Validate Data" to check that all strings have matching classifications
5. **Export**: Once validated, use "Export" to download your data as CSV files


## 🛠️ Requirements

- Node.js 18+ (for local development)
- Docker (for containerized deployment)
- React js
