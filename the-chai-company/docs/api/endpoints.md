# 🔌 API Endpoints Documentation

Comprehensive documentation for all REST API endpoints in the ordering system, including request/response formats, authentication requirements, and usage examples.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Menu Management](#menu-management)
- [Platter Management](#platter-management)
- [Order Management](#order-management)
- [Table Management](#table-management)
- [Analytics](#analytics)
- [Error Handling](#error-handling)

## 🔐 Authentication

### Overview
Most endpoints require authentication for admin operations. Customer-facing endpoints are typically public.

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

## 🍽️ Menu Management

### GET /api/menuitems
Retrieve all menu items with optional filtering.

**Query Parameters:**
- `category` (string): Filter by category
- `status` (string): Filter by status (`in_stock`, `out_of_stock`)
- `limit` (number): Limit results
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "item_id",
      "title": "Margherita Pizza",
      "description": "Classic cheese pizza",
      "price": 250,
      "category": "Pizza",
      "image": "base64_string",
      "variations": ["Small", "Medium (+₹50)", "Large (+₹100)"],
      "status": "in_stock",
      "createdAt": "2025-12-10T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

### POST /api/menuitems
Create a new menu item.

**Request Body:**
```json
{
  "title": "Custom Pizza",
  "description": "Pizza with custom toppings",
  "price": 300,
  "category": "Pizza",
  "image": "base64_string",
  "variations": [
    { "name": "Small", "price": "0" },
    { "name": "Medium", "price": "50" },
    { "name": "Large", "price": "100" }
  ],
  "status": "in_stock"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Menu item created successfully",
  "data": {
    "_id": "new_item_id",
    "title": "Custom Pizza",
    "price": 300,
    "variations": ["Small", "Medium (+₹50)", "Large (+₹100)"]
  }
}
```

### PUT /api/updateItem
Update an existing menu item.

**Request Body:**
```json
{
  "id": "item_id",
  "title": "Updated Pizza Name",
  "price": 350,
  "variations": [
    { "name": "Small", "price": 0 },
    { "name": "Medium", "price": 50 }
  ]
}
```

### DELETE /api/deleteItem
Delete a menu item.

**Request Body:**
```json
{
  "id": "item_id"
}
```

## 🍱 Platter Management

### GET /api/platter
Retrieve all platters.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "platter_id",
      "title": "Sharing Platter",
      "description": "Perfect for groups",
      "basePrice": 500,
      "platterCategory": "Sharing",
      "image": "base64_string",
      "categories": [
        {
          "categoryName": "Main Protein",
          "options": ["Chicken", "Beef", "Fish"]
        }
      ],
      "additionalChoices": [
        {
          "heading": "Extra Sides",
          "options": [
            { "name": "Fries", "uuid": "side-1" },
            { "name": "Salad", "uuid": "side-2" }
          ]
        }
      ],
      "status": "in_stock"
    }
  ]
}
```

### POST /api/platter
Create a new platter.

**Request Body:**
```json
{
  "title": "Family Platter",
  "description": "Large platter for families",
  "basePrice": 800,
  "platterCategory": "Family",
  "image": "base64_string",
  "categories": [
    {
      "categoryName": "Protein Choice",
      "options": ["Chicken", "Mutton"]
    }
  ],
  "additionalChoices": [
    {
      "heading": "Extra Rice",
      "options": [
        { "name": "Plain Rice", "uuid": "rice-1" },
        { "name": "Jeera Rice", "uuid": "rice-2" }
      ]
    }
  ],
  "status": "in_stock"
}
```

### PUT /api/updatePlatter
Update an existing platter.

**Request Body:**
```json
{
  "id": "platter_id",
  "title": "Updated Family Platter",
  "basePrice": 850,
  "categories": [
    {
      "categoryName": "Updated Protein Choice",
      "options": ["Chicken", "Mutton", "Fish"]
    }
  ]
}
```

## 📋 Order Management

### GET /api/orders
Retrieve orders with filtering and pagination.

**Query Parameters:**
- `status` (string): Filter by status
- `tableId` (string): Filter by table
- `limit` (number): Limit results
- `page` (number): Page number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-001",
      "customerName": "John Doe",
      "customerPhone": "+1234567890",
      "ordertype": "dinein",
      "tableId": "table-1",
      "items": [
        {
          "id": "item_id",
          "title": "Custom Pizza",
          "price": 300,
          "quantity": 1,
          "variations": ["Large"],
          "image": "base64_string"
        }
      ],
      "subtotal": 300,
      "deliveryFee": 50,
      "totalAmount": 350,
      "status": "confirmed",
      "orderTime": "2025-12-10T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "customerName": "Jane Smith",
  "customerPhone": "+1234567890",
  "ordertype": "dinein",
  "tableId": "table-5",
  "items": [
    {
      "id": "item_id",
      "title": "Margherita Pizza",
      "price": 250,
      "quantity": 2,
      "variations": ["Medium"],
      "image": "base64_string"
    }
  ],
  "specialInstructions": "Extra cheese please"
}
```

### PUT /api/updateorderstatus
Update order status.

**Request Body:**
```json
{
  "orderId": "order_id",
  "status": "preparing"
}
```

### GET /api/order-status
Get detailed order status for customer tracking.

**Query Parameters:**
- `orderNumber` (string): Order number
- `tableId` (string): Table ID for dine-in orders

## 🪑 Table Management

### GET /api/tables
Retrieve all tables.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "table_id",
      "tableNumber": 1,
      "capacity": 4,
      "status": "available",
      "currentOrder": null,
      "location": "Main Hall"
    }
  ]
}
```

### POST /api/tables
Create a new table.

**Request Body:**
```json
{
  "tableNumber": 10,
  "capacity": 6,
  "location": "Private Room"
}
```

### PUT /api/tables/[id]
Update table information.

### GET /api/getOrderByTableId
Get order details for a specific table.

## 📊 Analytics

### GET /api/analytics
Get basic analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 45000,
    "popularItems": [
      { "name": "Margherita Pizza", "orders": 45 },
      { "name": "Chicken Biryani", "orders": 32 }
    ],
    "orderStatus": {
      "pending": 5,
      "confirmed": 10,
      "preparing": 8,
      "ready": 12,
      "completed": 115
    }
  }
}
```

### GET /api/analytics/details
Get detailed analytics with date ranges.

**Query Parameters:**
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `groupBy` (string): Group by day/week/month

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field_error"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `SERVER_ERROR`: Internal server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## 🔧 Rate Limiting

### Limits
- **Authenticated Requests:** 1000/hour
- **Public Requests:** 100/hour
- **File Uploads:** 10/hour

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📝 Data Formats

### Date/Time
All dates use ISO 8601 format:
```json
"2025-12-10T12:00:00.000Z"
```

### Currency
All prices in Indian Rupees (INR) as integers (paise):
```json
"price": 250  // Represents ₹250.00
```

### Images
Base64 encoded strings for menu item and platter images:
```json
"image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
```

---

## 🔗 Related Documentation

- [Variation System](../features/variation-system.md)
- [Component Library](../components/ui-components.md)
- [Cursor Rules](../../.cursorrules)

---

**Last Updated:** December 2025
**API Version:** v1.0.0
