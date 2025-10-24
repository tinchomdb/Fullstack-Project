# Fullstack Marketplace Application

A modern, scalable e-commerce marketplace built with Angular 20 and ASP.NET Core 9, featuring authentication, product management, shopping carts, orders, and Stripe payment integration.

**Live Demo:** https://agreeable-pond-0d8f08903.1.azurestaticapps.net/products

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Project Overview

This is a full-stack marketplace application designed for scalability, maintainability, and performance. The application provides:

- **User Management**: Guest and authenticated user support with Azure AD B2C integration
- **Product Catalog**: Dynamic product listings with categorization and search
- **Shopping Experience**: Add to cart, manage orders, and track order history
- **Payment Processing**: Stripe integration for secure checkout
- **Admin Panel**: Manage products, categories, and carousel slides
- **Caching Strategy**: Redis caching for optimal performance
- **Security**: JWT authentication and role-based access control

---

## 🛠 Tech Stack

### Backend

- **Framework**: ASP.NET Core 9.0
- **Language**: C# 13
- **Database**: Azure Cosmos DB (NoSQL)
- **Cache**: In-Memory Cache & Distributed Cache
- **Authentication**: Azure AD B2C with JWT
- **Payment**: Stripe API
- **Email**: Azure Communication Services / SMTP
- **Cloud**: Microsoft Azure (App Service, Key Vault, Static Web Apps)

### Frontend

- **Framework**: Angular 20
- **Language**: TypeScript 5
- **State Management**: Angular Signals
- **Data Fetching**: Angular Resource API
- **Authentication**: Azure MSAL Angular
- **Payment**: Stripe.js
- **Testing**: Cypress (E2E), Jasmine/Karma (Unit)
- **Styling**: SCSS with Design Tokens
- **Image Optimization**: NgOptimizedImage

### DevOps

- **Version Control**: Git
- **CI/CD**: Github Actions
- **Hosting**: Azure Static Web Apps (Frontend), Azure App Service (Backend)
- **Infrastructure**: Azure Resource Manager (IaC)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend - Angular 20 (http://localhost:4200)                   │
│ ├── Core Module (Singleton Services)                            │
│ ├── Features Module (Lazy-loaded Routes)                        │
│ │   ├── Products                                                │
│ │   ├── Cart                                                    │
│ │   ├── Orders                                                  │
│ │   ├── Admin Panel                                             │
│ │   └── Checkout                                                │
│ └── Shared Module (Reusable Components)                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend API - ASP.NET Core 9 (https://localhost:5099)           │
│ ├── Controllers (REST Endpoints)                                │
│ │   ├── Products                                                │
│ │   ├── Carts                                                   │
│ │   ├── Orders                                                  │
│ │   ├── Payments (Stripe)                                       │
│ │   ├── Auth                                                    │
│ │   └── Admin Operations                                        │
│ ├── Services (Business Logic)                                   │
│ ├── Repositories (Data Access)                                  │
│ │   └── Cached Repositories (Distributed Cache)                │
│ ├── Authentication (JWT + Azure AD B2C)                         │
│ └── Middleware (CORS, Exception Handling, etc.)                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌────────────┐  ┌──────────────┐
        │ Cosmos   │  │ Key Vault  │  │ Stripe API   │
        │ DB       │  │ (Secrets)  │  │ (Payments)   │
        └──────────┘  └────────────┘  └──────────────┘
```

---

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher (for frontend development)
- **.NET SDK**: 9.0 or higher (for backend development)
- **npm**: 9.x or higher
- **Git**: Latest version

### Azure Requirements (for production)

- Azure subscription
- Azure AD B2C tenant
- Azure Cosmos DB account
- Azure Key Vault
- Stripe account for payment processing

---

## 📁 Project Structure

```
Fullstack Project/
├── README.md                           (This file)
│
├── backend/                            (ASP.NET Core 9 API)
│   ├── Backend.sln
│   ├── Api/
│   │   ├── Api.csproj
│   │   ├── Program.cs                  (Main entry point)
│   │   ├── appsettings.json            (Configuration)
│   │   ├── appsettings.Development.json
│   │   ├── appsettings.Production.json
│   │   │
│   │   ├── Controllers/                (REST endpoints)
│   │   │   ├── ProductsController.cs
│   │   │   ├── CartsController.cs
│   │   │   ├── OrdersController.cs
│   │   │   ├── PaymentsController.cs
│   │   │   ├── GuestAuthController.cs
│   │   │   ├── AdminProductsController.cs
│   │   │   └── ...
│   │   │
│   │   ├── Services/                   (Business logic)
│   │   │   ├── ProductService.cs
│   │   │   ├── CartService.cs
│   │   │   ├── OrderService.cs
│   │   │   ├── PaymentService.cs
│   │   │   └── ...
│   │   │
│   │   ├── Repositories/               (Data access)
│   │   │   ├── ProductRepository.cs
│   │   │   ├── CachedProductRepository.cs
│   │   │   └── ...
│   │   │
│   │   ├── Models/                     (Domain models & DTOs)
│   │   │   ├── Product.cs
│   │   │   ├── Cart.cs
│   │   │   ├── Order.cs
│   │   │   ├── DTOs/
│   │   │   └── ...
│   │   │
│   │   ├── Extensions/                 (DI & middleware setup)
│   │   │   ├── ConfigurationExtensions.cs
│   │   │   ├── CosmosDbExtensions.cs
│   │   │   ├── CachingExtensions.cs
│   │   │   ├── AuthenticationExtensions.cs
│   │   │   └── ...
│   │   │
│   │   ├── Configuration/              (Settings classes)
│   │   │   ├── CosmosDbSettings.cs
│   │   │   ├── JwtSettings.cs
│   │   │   ├── StripeSettings.cs
│   │   │   └── ...
│   │   │
│   │   └── Authentication/
│   │       └── GuestOnlyAuthorizationHandler.cs
│   │
│   ├── Api.Tests/                      (Unit & integration tests)
│   │   ├── Api.Tests.csproj
│   │   ├── Unit/
│   │   └── Integration/
│   │
│   └── README.md                       (Backend documentation)
│
└── frontend/                           (Angular 20 SPA)
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    ├── cypress.config.ts
    │
    ├── src/
    │   ├── main.ts                     (Bootstrap)
    │   ├── index.html
    │   ├── styles.scss
    │   ├── app/
    │   │   ├── app.ts                  (Root component)
    │   │   ├── app.routes.ts           (Route configuration)
    │   │   ├── app.config.ts           (App providers)
    │   │   │
    │   │   ├── core/                   (Singleton services)
    │   │   │   ├── services/
    │   │   │   ├── guards/
    │   │   │   └── interceptors/
    │   │   │
    │   │   ├── features/               (Lazy-loaded modules)
    │   │   │   ├── products/
    │   │   │   ├── cart/
    │   │   │   ├── orders/
    │   │   │   ├── checkout/
    │   │   │   └── admin/
    │   │   │
    │   │   └── shared/                 (Reusable components)
    │   │       ├── components/
    │   │       ├── pipes/
    │   │       └── directives/
    │   │
    │   ├── styles/                     (Global styles)
    │   │   └── _tokens.scss            (Design tokens)
    │   │
    │   └── environments/               (Environment configs)
    │       ├── environment.ts
    │       └── environment.prod.ts
    │
    ├── cypress/                        (E2E tests)
    │   ├── e2e/
    │   ├── fixtures/
    │   └── support/
    │
    └── README.md                       (Frontend documentation)
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/tinchomdb/Fullstack-Project.git
cd "Fullstack Project"
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

**Restore dependencies:**

```bash
dotnet restore
```

**Configure local secrets** (see [Backend README](./backend/README.md) for detailed setup):

```bash
dotnet user-secrets init
dotnet user-secrets set "CosmosDb:ConnectionString" "your-connection-string"
dotnet user-secrets set "Jwt:SecretKey" "your-secret-key"
# ... set other required secrets
```

**Run the API:**

```bash
dotnet run --project Api/Api.csproj
```

The API will be available at `https://localhost:5099`

### 3. Frontend Setup

Navigate to the frontend directory (in a new terminal):

```bash
cd frontend
npm install
```

**Start the development server:**

```bash
npm start
```

The application will be available at `http://localhost:4200`

---

## 💻 Development

### Backend Development

**Available commands:**

```bash
# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Run the API
dotnet run --project Api/Api.csproj

# Run tests
dotnet test

# Watch mode (rebuild on file changes)
dotnet watch run --project Api/Api.csproj
```

**API Documentation:**

- Swagger UI: https://localhost:5099/swagger
- REST Client file: `backend/Api/Api.http`

### Frontend Development

**Available npm scripts:**

```bash
# Start dev server
npm start

# Build the project
npm run build

# Run unit tests
npm test

# Open Cypress E2E tests (interactive)
npm run e2e

# Run E2E tests headless
npm run e2e:headless

# Watch mode
npm run watch
```

**Code Generation:**

```bash
# Generate a new component
ng generate component path/to/component

# Generate a new service
ng generate service path/to/service

# Generate a new pipe
ng generate pipe path/to/pipe
```

### Development Best Practices

#### Backend (C# / .NET)

- Follow SOLID principles
- Use dependency injection for services
- Implement proper exception handling
- Write unit tests for services and repositories
- Use async/await for I/O operations
- Follow PascalCase naming conventions

#### Frontend (TypeScript / Angular)

- Use standalone components (default in Angular 20)
- Implement OnPush change detection strategy
- Use Angular Signals for local state
- Use Resource API for data fetching
- Keep components focused and small
- Use camelCase naming conventions
- Write E2E tests for critical user flows

---

## 🏗️ Building for Production

### Backend Build

```bash
cd backend
dotnet publish -c Release -o ./publish
```

### Frontend Build

```bash
cd frontend
npm run build
```

The production build artifacts will be in `dist/app`

---

## ✨ Key Features

### 1. **Product Management**

- Dynamic product listings with pagination
- Search and filtering capabilities
- Category-based organization
- Featured products carousel

### 2. **Shopping Cart**

- Add/remove products
- Update quantities
- Persistent cart state
- Real-time calculations

### 3. **User Authentication**

- Guest checkout support
- Azure AD B2C integration
- JWT token-based authentication
- Role-based access control (Admin, User, Guest)

### 4. **Order Management**

- Create and track orders
- Order history
- Order status tracking
- Invoice generation

### 5. **Payment Processing**

- Stripe integration
- Secure checkout flow
- Payment webhooks
- Transaction history

### 6. **Admin Panel**

- Product management (CRUD)
- Category management
- Carousel slide management
- Order monitoring

### 7. **Performance Optimizations**

- Distributed caching strategy
- Response compression
- Image optimization with NgOptimizedImage
- Lazy loading for routes
- Cached repositories

### 8. **Responsive Design**

- Mobile-first approach
- Design tokens for consistency
- Accessibility support
- Cross-browser compatibility

---

## 📚 API Documentation

### Core Endpoints

**Products:**

```
GET    /api/products              # Get all products (paginated)
GET    /api/products/{id}         # Get product details
POST   /api/admin/products        # Create product (admin)
PUT    /api/admin/products/{id}   # Update product (admin)
DELETE /api/admin/products/{id}   # Delete product (admin)
```

**Cart:**

```
GET    /api/carts/{userId}        # Get user's cart
POST   /api/carts/{userId}/items  # Add item to cart
PUT    /api/carts/{userId}/items  # Update cart item
DELETE /api/carts/{userId}/items  # Remove item from cart
```

**Orders:**

```
POST   /api/orders                # Create order
GET    /api/orders/{userId}       # Get user's orders
GET    /api/orders/{id}           # Get order details
```

**Payments:**

```
POST   /api/payments/checkout     # Create checkout session
POST   /api/stripe/webhook        # Stripe webhook handler
```

**Categories:**

```
GET    /api/categories            # Get all categories
GET    /api/categories/{id}       # Get category details
POST   /api/admin/categories      # Create category (admin)
PUT    /api/admin/categories/{id} # Update category (admin)
```

**Authentication:**

```
POST   /api/auth/guest            # Create guest session
GET    /api/auth/profile          # Get current user profile
```

For complete API documentation, visit `/swagger` when running the backend locally.

---

## 🚢 Deployment

### Azure Deployment

The project is configured for deployment on Microsoft Azure:

- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service
- **Database**: Azure Cosmos DB
- **Secrets**: Azure Key Vault

---

## 📝 License

This project is public.

---

**Happy coding! 🎉**
