# Admin Panel

## Overview

The Admin Panel is a protected section of the application that allows administrators to manage products and categories. Only users with the `admin` role can access this panel.

## Features

### Products Management

- **View All Products**: List all products with their details
- **Create Product**: Add new products with images, pricing, and inventory
- **Edit Product**: Update existing product information
- **Delete Product**: Remove products from the marketplace

### Categories Management

- **View All Categories**: List all categories with hierarchical relationships
- **Create Category**: Add new categories with auto-generated slugs
- **Edit Category**: Update category information
- **Delete Category**: Remove categories

## Access Control

### Admin Role

The admin panel uses role-based access control. Users must have the `admin` role in their Azure AD B2C token claims to access the admin panel.

### Admin Guard

The `adminGuard` protects all admin routes and:

1. Checks if the user is logged in
2. Verifies the user has the `admin` role in their token claims
3. Redirects unauthorized users to the home page

## Routes

- `/admin` - Admin panel main page (redirects to `/admin/products`)
- `/admin/products` - Products management
- `/admin/categories` - Categories management

## Navigation

When a user with admin privileges logs in, an "Admin" link appears in the main navigation bar, providing easy access to the admin panel.

## Technical Implementation

### Frontend Components

- **AdminComponent**: Main container with tab navigation
- **AdminProductsComponent**: Products CRUD interface
- **AdminCategoriesComponent**: Categories CRUD interface

### Services

- **AdminProductsService**: Handles product API operations
- **AdminCategoriesService**: Handles category API operations

### Backend Endpoints

#### Products

- `GET /api/products` - Get all products
- `GET /api/products/{productId}/seller/{sellerId}` - Get specific product
- `POST /api/products` - Create product
- `PUT /api/products/{productId}/seller/{sellerId}` - Update product
- `DELETE /api/products/{productId}/seller/{sellerId}` - Delete product

#### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/{categoryId}` - Get specific category
- `POST /api/categories` - Create category
- `PUT /api/categories/{categoryId}` - Update category
- `DELETE /api/categories/{categoryId}` - Delete category

## Security Considerations

1. **Frontend Protection**: The `adminGuard` prevents unauthorized route access
2. **Backend Validation**: Backend endpoints should implement additional authorization checks
3. **Token Validation**: Verify the `admin` role in JWT tokens on the backend

## Future Enhancements

- Implement audit logging for admin actions
- Add bulk operations for products and categories
- Add image upload functionality
- Add advanced filtering and search
- Add analytics dashboard
