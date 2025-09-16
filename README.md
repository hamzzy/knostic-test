# Knostic CSV Data Management Web App

A Node.js + React application for managing CSV data with validation, editing, and export capabilities.

## Features

- CSV file upload and parsing
- Editable data tables
- Validation of strings against classifications
- CSV export functionality
- Docker containerization

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # React frontend application
├── Dockerfile        # Multi-stage Docker build
└── README.md         # This file
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Docker
```bash
docker build -t knostic-csv-manager .
docker run -p 4000:4000 knostic-csv-manager
```

## Development

This project follows a staged development approach with incremental commits. Each stage includes tests and follows Conventional Commit standards.
