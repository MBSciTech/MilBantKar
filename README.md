# MilBantKar

MilBantKar is a comprehensive web application designed for group expense management and event tracking. The platform enables users to create events, track shared expenses, manage budgets, and settle payments efficiently. Built with a modern full-stack architecture, it provides features like QR code scanning for quick payments, data visualization, and an admin panel for oversight.

## Project Purpose

The application addresses the common challenges of managing shared expenses among friends, family, or colleagues during events, trips, or group activities. Key features include:

- **Event Management**: Create and manage events with participant tracking
- **Expense Tracking**: Log and categorize expenses with automatic splitting
- **Budget Planning**: Set and monitor budgets for events
- **Payment Integration**: QR code scanning for seamless payment recording
- **Data Visualization**: Charts and graphs for expense analysis
- **User Authentication**: Secure signup/login system
- **Admin Panel**: Administrative oversight and user management

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Authentication**: Custom user authentication
- **File Upload**: Support for image uploads
- **CORS**: Cross-origin resource sharing enabled

### Frontend
- **React.js** with React Router for navigation
- **Bootstrap** for responsive UI components
- **Axios** for API communication
- **Recharts** for data visualization
- **QR Code Integration**: HTML5 QR code scanning
- **React Bootstrap** for enhanced UI components

## Project Structure

```
MilBantKar/
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   ├── Alert.js
│   │   ├── Event.js
│   │   ├── expenceLog.js
│   │   └── User.js
│   └── upload/
├── frontend/
│   ├── package.json
│   ├── README.md
│   ├── build/
│   │   ├── asset-manifest.json
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── static/
│   │       ├── css/
│   │       │   └── main.aade924a.css
│   │       └── js/
│   │           ├── 453.54292a4b.chunk.js
│   │           ├── main.86cf206e.js
│   │           └── main.86cf206e.js.LICENSE.txt
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       ├── components/
│       │   ├── Budget.js
│       │   ├── Dashboard.js
│       │   ├── EventPage.css
│       │   ├── EventPage.js
│       │   ├── Events.js
│       │   ├── Footer.js
│       │   ├── History.js
│       │   ├── Navbar.js
│       │   ├── Profile.js
│       │   ├── QRScanner.css
│       │   └── QRScanner.js
│       └── pages/
│           ├── AdminPanel.css
│           ├── AdminPanel.js
│           ├── Help.js
│           ├── Login.js
│           ├── Main.js
│           ├── Signup.js
│           ├── Transaction.js
│           ├── Visualise.js
│           └── Welcome.js
```

## Key Components

### Backend Components
- **server.js**: Main Express server with API routes and MongoDB connection
- **models/**: Mongoose schemas for data modeling
  - `User.js`: User authentication and profile data
  - `expenceLog.js`: Expense tracking records
  - `Event.js`: Event management data
  - `Alert.js`: Notification and alert system
- **upload/**: Directory for file uploads (images, receipts)

### Frontend Components
- **components/**: Reusable React components
  - `Dashboard.js`: Main dashboard with overview
  - `Events.js`: Event listing and management
  - `Budget.js`: Budget planning interface
  - `History.js`: Expense history viewer
  - `QRScanner.js`: QR code payment scanner
  - `Navbar.js` & `Footer.js`: Navigation components
- **pages/**: Full-page components
  - `Login.js` & `Signup.js`: Authentication pages
  - `Transaction.js`: Expense entry interface
  - `Visualise.js`: Data visualization dashboard
  - `AdminPanel.js`: Administrative controls
  - `Help.js`: User assistance page

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

### Backend Setup
```bash
cd backend
npm install
# Configure environment variables in .env file
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string=secrete string given by developer only.
```

## API Endpoints

The backend provides RESTful API endpoints for:
- User authentication (signup/login)
- Event CRUD operations
- Expense logging and retrieval
- Budget management
- File upload handling
- Admin panel functionality

## Features

### User Features
- Secure user registration and login
- Event creation and participation
- Expense tracking with categories
- Budget setting and monitoring
- QR code payment scanning
- Personal expense history
- Profile management

### Admin Features
- User management
- Event oversight
- System-wide analytics
- Alert and notification management

### Technical Features
- Responsive design with Bootstrap
- Real-time data visualization
- QR code integration for payments
- File upload support
- Cross-platform compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please refer to the Help page within the application or contact the development team. 
