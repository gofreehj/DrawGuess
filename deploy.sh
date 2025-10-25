#!/bin/bash

# Production deployment script with enhanced error handling and validation
set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function for graceful exit
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed! Check the logs above for details."
        exit 1
    fi
}

trap cleanup EXIT

log_info "Starting production deployment process..."

# Environment validation
log_info "Validating environment configuration..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    log_error "Node.js version $NODE_VERSION is not supported. Required: >= $REQUIRED_NODE_VERSION"
    exit 1
fi
log_success "Node.js version check passed: $NODE_VERSION"

# Check if required environment variables are set
REQUIRED_VARS=("AI_PROVIDER")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
    fi
done

# Check AI provider specific variables
if [ "${AI_PROVIDER:-}" = "openai" ] && [ -z "${OPENAI_API_KEY:-}" ]; then
    MISSING_VARS+=("OPENAI_API_KEY")
elif [ "${AI_PROVIDER:-}" = "gemini" ] && [ -z "${GEMINI_API_KEY:-}" ]; then
    MISSING_VARS+=("GEMINI_API_KEY")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Required environment variables are not set:"
    printf '%s\n' "${MISSING_VARS[@]}"
    log_error "Please configure these variables before deployment"
    exit 1
fi

log_success "Environment variables validation passed"

# Check disk space (require at least 1GB free)
AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
REQUIRED_SPACE=1048576 # 1GB in KB
if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    log_error "Insufficient disk space. Available: ${AVAILABLE_SPACE}KB, Required: ${REQUIRED_SPACE}KB"
    exit 1
fi
log_success "Disk space check passed"

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p ./data/backups
mkdir -p ./logs
log_success "Directories created"

# Backup existing database if it exists
if [ -f "./data/game.db" ]; then
    log_info "Backing up existing database..."
    npm run db:backup
    log_success "Database backup completed"
fi

# Clean previous builds
log_info "Cleaning previous builds..."
npm run clean

# Security check
log_info "Running security audit..."
npm run security-check || {
    log_warning "Security audit found issues. Review and fix before production deployment."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled due to security concerns"
        exit 1
    fi
}
log_success "Security audit completed"

# Install dependencies
log_info "Installing production dependencies..."
npm ci --only=production --no-audit --no-fund
log_success "Dependencies installed"

# Type checking
log_info "Running TypeScript type checks..."
npm run type-check
log_success "Type checking passed"

# Linting with strict rules
log_info "Running ESLint with production rules..."
npm run lint:check
log_success "Linting passed"

# Build the application
log_info "Building application for production..."
NODE_ENV=production npm run build
log_success "Application build completed"

# Verify build output
if [ ! -d ".next" ]; then
    log_error "Build output directory not found"
    exit 1
fi
log_success "Build output verified"

# Initialize database
log_info "Initializing database..."
npm run db:init
log_success "Database initialized"

# Run comprehensive health check
log_info "Running health checks..."
npm run health-check
log_success "Health checks passed"

# Generate deployment report
DEPLOYMENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "Unknown")
NODE_ENV_CHECK=$(node -e "console.log(process.env.NODE_ENV)")

cat > deployment-report.txt << EOF
Deployment Report
================
Deployment Time: $DEPLOYMENT_TIME
Node.js Version: $NODE_VERSION
Environment: $NODE_ENV_CHECK
AI Provider: $AI_PROVIDER
Build Size: $BUILD_SIZE
Status: SUCCESS

Next Steps:
1. Start the application: npm run start:prod
2. Verify health endpoint: curl http://localhost:3000/api/health
3. Monitor logs for any issues
4. Set up process manager (PM2) for production
EOF

log_success "Deployment report generated: deployment-report.txt"

# Final success message
log_success "🎉 Production deployment completed successfully!"
log_info "📊 Deployment report saved to: deployment-report.txt"
log_info "🚀 Start the application with: npm run start:prod"
log_info "🏥 Health check endpoint: http://localhost:3000/api/health"

# Optional: Start the application if requested
if [ "${AUTO_START:-false}" = "true" ]; then
    log_info "Auto-starting application..."
    npm run start:prod &
    sleep 5
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application started successfully and health check passed"
    else
        log_error "Application failed to start or health check failed"
        exit 1
    fi
fi