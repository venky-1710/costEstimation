# Cost Estimation Application

A comprehensive full-stack web application for building construction material traders to digitize their estimation process and track customer interactions.

## Features

### Core Features
- **Multi-User System**: Admin, Trader, and Customer roles
- **Digital Estimates**: Create, edit, view, and manage estimates
- **Customer Management**: Track customer information, referrals, and interaction history
- **Master Data Management**: Brands, Items, UOM, Categories
- **Estimate Tracking**: Monitor estimate status, conversion rates, and customer responses
- **Validity Management**: Set estimate validity periods with default values
- **Discount & Loading**: Support for both percentage and fixed amount discounts and loading charges

### Business Features
- **Customer Referral Tracking**: Track how customers were referred (engineers, masons, other customers)
- **Customer Tagging**: Group customers with hashtags for targeted messaging
- **Estimate Conversion Tracking**: Monitor which estimates convert to actual orders
- **Invoice Integration**: Ready for Tally integration with invoice number tracking
- **Communication History**: Track estimates sent via WhatsApp, Email, or Print
- **Search & Analytics**: Search estimates by items, customers, and generate reports

### Technical Features
- **MERN Stack**: MongoDB, Express.js, React.js, Node.js
- **Authentication**: JWT-based authentication with role-based access control
- **Responsive Design**: Modern, clean UI that works on all devices
- **Real-time Updates**: Live dashboard with business statistics
- **RESTful API**: Well-structured API endpoints for all operations

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- bcryptjs for password hashing
- CORS enabled
- Express Validator for input validation

### Frontend
- React.js with Hooks
- React Router DOM for navigation
- Axios for API calls
- React Hot Toast for notifications
- React Icons for UI icons
- Modern CSS with Flexbox/Grid

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/cost_estimation
     JWT_SECRET=your_super_secret_jwt_key_here
     JWT_EXPIRE=30d
     NODE_ENV=development
     ```

4. Start MongoDB service on your machine

5. Start the server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The client will start on `http://localhost:3000`

## Usage

### First Time Setup

1. Register as an Admin user
2. Create trader accounts for material traders
3. Traders can then:
   - Add brands and items to their inventory
   - Register customers
   - Create estimates
   - Track conversions

### User Roles

#### Admin
- Manage all users (traders and customers)
- View system-wide analytics
- Access to all data across traders

#### Trader
- Manage their customers
- Create and manage brands/items
- Generate estimates
- Track business performance
- Manage customer relationships

#### Customer
- View estimates sent to them
- Access estimate history

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Customer Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/search/phone/:phone` - Search by phone

### Estimate Management
- `GET /api/estimates` - Get all estimates
- `POST /api/estimates` - Create new estimate
- `PUT /api/estimates/:id` - Update estimate
- `DELETE /api/estimates/:id` - Delete estimate
- `GET /api/estimates/:id` - Get estimate details
- `PUT /api/estimates/:id/send` - Mark estimate as sent

### Master Data
- `GET /api/brands` - Get brands
- `POST /api/brands` - Create brand
- `GET /api/items` - Get items
- `POST /api/items` - Create item

## Project Structure

```
cost-estimation/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   └── package.json
└── README.md
```

## Key Features Implementation

### Estimate Number Generation
- Automatic generation with format: `EST-YYYY-NNNN`
- Unique per trader with sequential numbering

### Customer Referral System
- Track referral source (customer, engineer, mason, other)
- Link referred customers to referrer for analytics

### Estimate Validity
- Configurable validity period for estimates
- Automatic status updates for expired estimates

### Conversion Tracking
- Mark estimates as converted when orders are placed
- Link to Tally invoice numbers for accounting integration

### Customer Tagging
- Hashtag-based customer grouping (#VIP, #Engineer, #Contractor)
- Used for targeted communication and analytics

## Future Enhancements

1. **Tally Integration**: Direct integration with Tally accounting software
2. **WhatsApp Integration**: Send estimates directly via WhatsApp API
3. **Email Templates**: Customizable email templates for estimates
4. **PDF Generation**: Generate PDF estimates for printing/sharing
5. **Advanced Analytics**: Detailed business intelligence dashboards
6. **Mobile App**: React Native mobile application
7. **Multi-language Support**: Support for regional languages

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Environment variable configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the GitHub repository.
