# Knostic CSV Data Management Web App

A modern Node.js + React application for managing CSV data with validation, editing, and export capabilities. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## ✨ Features

- **CSV Upload & Parsing**: Drag-and-drop CSV file upload with automatic header normalization
- **Editable Tables**: Inline editing with add/delete row functionality
- **Data Validation**: Validate strings against classifications with detailed error reporting
- **CSV Export**: Export validated data with custom formatting options
- **Modern UI**: Built with shadcn/ui and Tailwind CSS for a beautiful, responsive interface
- **Docker Support**: Complete containerization with Docker Compose for easy deployment
- **Comprehensive Testing**: 77+ tests across backend and frontend
- **CI/CD Pipeline**: Automated testing, linting, and deployment with GitHub Actions

## 🏗️ Project Structure

```
├── backend/                    # Express.js API server
│   ├── src/                   # Source code
│   │   ├── __tests__/         # Unit tests
│   │   ├── csvParser.js       # CSV parsing logic
│   │   ├── validator.js       # Data validation
│   │   ├── csvExporter.js     # CSV export functionality
│   │   └── server.js          # Express server
│   └── Dockerfile.dev         # Development Docker image
├── frontend/                   # React frontend application
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── __tests__/     # Component tests
│   │   │   ├── CsvUploader.jsx
│   │   │   ├── EditableTable.jsx
│   │   │   ├── ValidationResults.jsx
│   │   │   └── ExportButtons.jsx
│   │   └── App.jsx            # Main app component
│   └── Dockerfile.dev         # Development Docker image
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.yml         # Main Docker Compose
├── docker-compose.dev.yml     # Development setup
├── docker-compose.prod.yml    # Production setup
└── DOCKER.md                  # Docker documentation
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Development mode with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Production mode
docker-compose -f docker-compose.prod.yml up --build
```

This will start:
- Backend API on http://localhost:4000
- Frontend React app on http://localhost:3000
- PostgreSQL database on localhost:5432 (optional)

### Option 2: Local Development

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Option 3: Docker (Single Container)

```bash
# Build and run the production image
docker build -t knostic-csv-manager .
docker run -p 4000:4000 knostic-csv-manager
```

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# With Docker
docker-compose -f docker-compose.dev.yml exec backend npm test
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

### Test Coverage
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage
```

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up --build

# Start specific service
docker-compose -f docker-compose.dev.yml up backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services
docker-compose -f docker-compose.prod.yml up --scale app=3
```

## 📋 API Endpoints

### Backend API (Port 4000)

- `POST /api/csv/upload` - Upload and parse CSV files
- `POST /api/csv/validate` - Validate strings against classifications
- `POST /api/csv/export` - Export data as CSV
- `GET /api/health` - Health check endpoint

### Example Usage

```bash
# Upload CSV files
curl -X POST -F "files=@strings.csv" -F "files=@classifications.csv" \
  http://localhost:4000/api/csv/upload

# Validate data
curl -X POST -H "Content-Type: application/json" \
  -d '{"stringsData":[...], "classificationsData":[...]}' \
  http://localhost:4000/api/csv/validate

# Export data
curl -X POST -H "Content-Type: application/json" \
  -d '{"rows":[...], "headers":[...], "filename":"export.csv"}' \
  http://localhost:4000/api/csv/export
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Setup
```bash
# Clone repository
git clone <repository-url>
cd knostic-csv-manager

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development servers
npm run dev  # In both backend and frontend directories
```

### Code Quality
- **Linting**: ESLint configuration for both backend and frontend
- **Formatting**: Prettier for consistent code formatting
- **Testing**: Jest (backend) and Vitest (frontend) with React Testing Library
- **Type Safety**: TypeScript support (optional)

## 📚 Documentation

- [Docker Setup Guide](DOCKER.md) - Comprehensive Docker documentation
- [API Documentation](backend/README.md) - Backend API reference
- [Frontend Components](frontend/README.md) - React component documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
This project follows [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [Docker documentation](DOCKER.md) for deployment issues
- Review the [API documentation](backend/README.md) for integration help
