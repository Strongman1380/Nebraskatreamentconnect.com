# 🏥 Nebraska Treatment Connect

**Live Website:** [nebraskatreatmentconnect.com](https://nebraskatreatmentconnect.com)

A comprehensive web directory of addiction and mental health treatment facilities across Nebraska. This platform helps individuals and families find appropriate treatment centers, halfway houses, outpatient services, and detox centers throughout the state.

## Features

### Public Features
- **Facility Search & Filtering**: Filter by age group (Adult/Juvenile), gender served (Male/Female), and treatment type (Substance Abuse/Mental Health)
- **Detailed Facility Information**: Each facility displays name, type, current availability status, address, phone, and website
- **Interactive Actions**: 
  - Get directions (opens in default map app)
  - Call facility (click-to-call functionality)
  - Visit website (opens in new tab)

### Provider Portal
- **Firebase Authentication**: Secure Google Cloud-based authentication with email verification
- **User Management**: Account creation, password reset, and profile management
- **Status Management**: Providers can update availability status for their assigned facilities
- **Real-time Updates**: Status changes are immediately reflected in the public directory
- **Cloud Storage**: User data stored securely in Firestore database

### Recovery Support Tools
- **CBT Tools**: Interactive cognitive behavioral therapy tools including:
  - Thought Record worksheets for challenging negative thoughts
  - Mood tracking with visual charts and pattern recognition
  - Coping skills toolbox with personalized strategies
  - Anxiety management techniques and exercises
  - Behavioral activation planning
  - Sleep hygiene tracking
- **Motivation Center**: Comprehensive motivation support featuring:
  - Daily inspirational quotes and affirmations
  - Personal goal setting and tracking
  - Recovery milestone celebrations
  - Progress visualization and analytics
  - Success stories from others in recovery
  - Motivation level tracking
- **Recovery Planner**: Structured planning tools including:
  - Personalized recovery goal setting
  - Action step planning and tracking
  - Relapse prevention planning
  - Support network management
  - Recovery timeline with milestones
  - Progress monitoring and reporting
  - Crisis resource directory

## Application Structure

```
src/
├── index.html              # Main public-facing page
├── provider-dashboard.html  # Provider portal
├── cbt-tools.html          # CBT tools and worksheets
├── motivation-center.html  # Motivation and goal tracking
├── recovery-planner.html   # Recovery planning tools
├── styles.css              # Main stylesheet
├── scripts.js              # Main application JavaScript
├── provider-dashboard.js   # Provider portal JavaScript
├── cbt-tools.js           # CBT tools functionality
├── motivation-center.js   # Motivation center functionality
├── recovery-planner.js    # Recovery planner functionality
├── firebase-auth.js       # Firebase authentication service
├── config.js              # Configuration file
└── README.md              # This file
```

## Demo Credentials

For testing the provider portal functionality, use these demo credentials:

**Provider 1:**
- Username: `provider1`
- Password: `password123`
- Manages: Sunrise Place, Seekers of Serenity Place

**Provider 2:**
- Username: `provider2`
- Password: `password456`
- Manages: Valley Hope of O'Neill, CenterPointe Campus for Hope

## Facility Data

The application includes comprehensive information on Nebraska residential treatment centers including:

1. **Horizon Recovery of Omaha** - Council Bluffs East
2. **Mid Plains Center for Behavioral Healthcare** - Grand Island
3. **CenterPointe** - Multiple facilities in Lincoln
4. **Bridge Behavioral Health** - Lincoln
5. **Saint Monica Behavioral Health** - Women's programs in Lincoln
6. **Nebraska Urban Indian Health Coalition** - Lincoln and Omaha locations
7. **Northpoint Nebraska** - Substance abuse treatment in Omaha
8. **Sunrise Place** - Norfolk facility with substance abuse and mental health treatment
9. **Seekers of Serenity Place** - Columbus facility offering short-term residential treatment

Plus many more facilities across Nebraska with detailed information on treatment types, populations served, and contact information.

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: Firebase Authentication (Google Cloud)
- **Database**: Cloud Firestore (Google Cloud)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Roboto)
- **Maps**: Google Maps API

## Key Features Implementation

### Search and Filtering
- Real-time filtering as users type or change filter selections
- Combination of text search and dropdown filters
- Results counter updates dynamically

### Facility Cards
- Visual status indicators with color coding:
  - Green: Openings Available
  - Red: No Openings
  - Orange: Waitlist/Accepting Assessments
  - Gray: Status Not Updated
- Responsive grid layout

### Provider Dashboard
- Firebase Authentication with email verification
- Cloud-based user profile management
- Facility assignment based on provider credentials
- Status update forms with immediate feedback
- Timestamp tracking for status changes
- Secure data storage in Firestore

### Accessibility Features
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast color scheme
- Responsive design for mobile devices

## Business Logic

### YRTC Kearney Exclusion
The application specifically excludes "YRTC Kearney" from all public listings as per requirements.

### Status Management
- Providers can only update facilities assigned to their account
- Status changes are timestamped
- Five status options available:
  - Openings Available
  - No Openings
  - Waitlist
  - Accepting Assessments
  - Emergency/Crisis Only

## Installation & Setup

1. **Clone or download the project files**

2. **Set up Firebase (Required for Provider Portal)**
   - Follow the detailed instructions in `FIREBASE_SETUP.md`
   - Create a Firebase project in Google Cloud Console
   - Enable Authentication and Firestore
   - Get your Firebase configuration

3. **Configure API keys**
   - Copy `config.js.example` to `config.js`
   - Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key
   - Replace Firebase configuration placeholders with your actual Firebase config
   - Ensure Google Maps API key has Geocoding API and Maps JavaScript API enabled

4. **Open the application**
   - Open `index.html` in a web browser for the public interface
   - Open `provider-signin.html` to access the provider portal

5. **For production deployment**
   - Serve through HTTPS (required for Firebase Auth)
   - Update Firestore security rules for production
   - Use environment variables for sensitive configuration

## Security Considerations

- **Firebase Authentication**: Secure Google Cloud-based authentication with email verification
- **Firestore Security Rules**: Database access controlled by user authentication and authorization
- **API Key Protection**: Google Maps and Firebase API keys should be restricted by domain/IP in Google Cloud Console
- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **HTTPS**: Required for Firebase Auth and recommended for all production deployments
- **Configuration**: Sensitive configuration separated from code (config.js not in version control)
- **Email Verification**: Users must verify their email addresses before accessing the system
- **Admin Approval**: New provider accounts require admin approval before activation

## Future Enhancements

This prototype demonstrates the core functionality. In a production environment, consider:

- Backend API with proper authentication
- Database integration (PostgreSQL/MySQL)
- Real user management system
- Admin panel for facility management
- Email notifications for status changes
- Advanced search capabilities
- Mobile app development
- Integration with mapping services
- Analytics and reporting features

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Support

For questions about this application, please contact the development team.