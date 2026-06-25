# CarBooking

CarBooking is a full-stack car and ride-booking platform for customers, drivers, and administrators. It includes a React web app, an Expo mobile app, and a Node/Express API with MySQL, Stripe payments, Google Maps/Places, image uploads, live tracking, notifications, and role-based control panels.

## Main features

### Customer experience

- Register, login, logout, forgot password, and reset password
- Update profile name and change account password
- Beautiful web and mobile home screens with hero banner support
- Pickup and drop-off autocomplete through Google Places
- Current-location pickup support
- Automatic distance and fare calculation after pickup/drop-off selection
- Date/time scheduling with mobile date picker support
- Car selection with customer-visible car images
- Booking confirmation, empty form reset after successful booking, and polished alerts
- Stripe payments on web and mobile
- Dark native Stripe Payment Sheet on mobile
- My bookings/dashboard screens with booking, payment, and ride status
- Ride history filters and notifications
- Live driver location and ride tracking

### Admin experience

- Admin dashboard/control panel for business management
- Booking table/cards with search, filtering, pagination, and summaries
- Paid, unpaid, and refunded payment status visible on admin booking cards
- Booking travel time and booking creation time visible to admins
- Manage booking status: pending, accepted, completed, cancelled
- Manage fleet cars from web and mobile
- Create, edit, and delete cars
- Car image support by URL or file upload
- Homepage hero banner support by URL or file upload
- Upload validation for JPG, PNG, and WebP images up to 5 MB

### Driver experience

- Driver workspace/control panel
- View available accepted rides
- Claim assigned work
- Share live foreground location
- Stop sharing location
- Complete rides
- Driver, customer, and admin notifications through Socket.IO

## Technology stack

| Layer | Technology |
| --- | --- |
| Web | React 19, Vite, Tailwind CSS |
| Mobile | Expo SDK 56, Expo Router, React Native 0.85 |
| API | Node.js, Express 5 |
| Database | MySQL, Sequelize |
| Auth | JWT, bcryptjs |
| Validation | Zod, React Hook Form |
| Maps | Google Maps, Google Places, react-native-maps |
| Payments | Stripe Payment Intents, Stripe Elements, Stripe React Native Payment Sheet |
| Realtime | Socket.IO |
| Uploads | Multer |
| Email | Nodemailer |

## Project structure

    car-booking/
    |-- server/
    |   |-- controllers/       API handlers
    |   |-- middleware/        auth, role checks, validation, uploads
    |   |-- models/            Sequelize models
    |   |-- routes/            Express routes
    |   |-- services/          email and notification helpers
    |   |-- socket/            Socket.IO live tracking
    |   |-- uploads/           runtime uploaded images
    |   +-- validation/        Zod schemas
    |-- web/
    |   +-- src/
    |       |-- api/             Axios client
    |       |-- components/      shared UI, checkout, maps
    |       |-- pages/           app pages and dashboards
    |       +-- validation/     web form schemas
    +-- mobile/
        |-- app/               Expo Router screens and tabs
        |-- src/
        |   |-- components/      mobile UI and booking components
        |   |-- context/         auth/session state
        |   |-- lib/             API, types, helpers
        |   +-- validation/     mobile form schemas
        +-- app.config.js      native Maps/build config

## Requirements

- Node.js 20 or newer
- npm or Yarn 1.x
- MySQL 8 or compatible
- Google Cloud project with billing enabled
- Stripe test account
- SMTP account for production password-reset email
- Android Studio/Xcode if building native mobile development builds

## Environment setup

### Server environment

Create server/.env:

    PORT=5000
    WEB_URL=http://localhost:3000
    DB_HOST=localhost
    DB_NAME=car_booking_db
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_DIALECT=mysql
    JWT_SECRET=replace_with_a_long_random_secret
    STRIPE_SECRET_KEY=sk_test_your_secret_key
    GOOGLE_PLACES_API_KEY=your_server_restricted_places_key
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=your_smtp_user
    SMTP_PASSWORD=your_smtp_password
    MAIL_FROM=CarBooking <no-reply@example.com>

GOOGLE_PLACES_API_KEY is used by the server-side Places proxy at /api/places. Use a server/API-restricted key for it.

### Web environment

Create web/.env:

    VITE_GOOGLE_MAPS_API_KEY=your_browser_maps_key
    VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key

The browser Google key should allow your local origin, for example http://localhost:3000, and should have Maps JavaScript API and Places API enabled.

### Mobile environment

Create mobile/.env:

    EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000
    EXPO_PUBLIC_STRIPE_KEY=pk_test_your_publishable_key
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_development_maps_key
    EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your_android_restricted_key
    EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=your_ios_restricted_key

For a physical phone, do not use localhost. Use your computer LAN IP, for example http://192.168.1.20:5000, and allow port 5000 through Windows Firewall.

Android native Maps keys must allow package name com.jahanmal.carbooking and the debug/release signing SHA-1. iOS keys must allow bundle identifier com.jahanmal.carbooking.

After changing native map keys, rebuild the mobile app with npx expo run:android or npx expo run:ios; hot reload is not enough for native key changes.

Never commit .env files or production secrets.

## Installation

Install the API dependencies:

    cd server
    npm install

Install the web dependencies:

    cd ../web
    npm install

Install the mobile dependencies:

    cd ../mobile
    npm install

Yarn also works if you prefer it.

## Database setup

Create the development database:

    CREATE DATABASE car_booking_db
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;

The API uses safe sequelize.sync() on startup to create missing tables. It does not use sync({ alter: true }), because repeated alter syncs can create duplicate MySQL indexes.

Optional local seed data:

    cd server
    node seedAdmin.js
    node seedDriver.js
    node seedCars.js

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@test.com | admin123 |
| Driver | driver@test.com | driver123 |

Seed accounts are only for local development.

## Running locally

Start the API:

    cd server
    npm run dev

Start the web app:

    cd web
    npm run dev

Open http://localhost:3000. The API runs at http://localhost:5000.

Start the mobile app:

    cd mobile
    npx expo start

For native Stripe and Google Maps testing, use a development build:

    npx expo run:android
    npx expo run:ios

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| Server | npm run dev | Start API with Nodemon |
| Server | npm start | Start API normally |
| Server | npm run migrate:tracking | Legacy tracking migration |
| Server | npm run seed:driver | Create demo driver |
| Web | npm run dev | Start Vite on port 3000 |
| Web | npm run build | Build production web app |
| Web | npm run preview | Preview production build |
| Web | npm run lint | Run web ESLint |
| Mobile | npm start | Start Expo |
| Mobile | npm run android | Build/run Android development app |
| Mobile | npm run ios | Build/run iOS development app |
| Mobile | npm run web | Run Expo web target |
| Mobile | npm run lint | Run Expo lint |

## Core models

- User: customer, admin, or driver account.
- Car: fleet car with name, type, image URL, price per kilometer, and availability data.
- Booking: route, coordinates, schedule, fare, selected car, status, payment status, and Stripe references.
- RideTracking: claimed driver, current position, movement data, sharing state, and last seen time.
- Notification: persistent user notification with metadata, link, read state, and timestamp.
- SiteSetting: homepage appearance values such as hero banner image/title/copy.
- PasswordResetToken: hashed, expiring, single-use password reset token.

Booking states: pending, accepted, completed, cancelled.

Payment states: unpaid, paid, refunded.

## API overview

Protected routes require this header:

    Authorization: Bearer <jwt>

| Area | Method and endpoint | Access |
| --- | --- | --- |
| Auth | POST /api/auth/register | Public |
| Auth | POST /api/auth/login | Public |
| Password reset | POST /api/auth/forgot-password | Public |
| Password reset | POST /api/auth/reset-password | Public |
| Account | GET /api/auth/profile | Authenticated |
| Account | PUT /api/auth/profile | Authenticated owner |
| Account | PUT /api/auth/change-password | Authenticated owner |
| Cars | GET /api/cars | Public |
| Cars | POST /api/cars | Admin |
| Cars | PUT /api/cars/:id | Admin |
| Cars | DELETE /api/cars/:id | Admin |
| Uploads | POST /api/uploads/image | Admin |
| Bookings | POST /api/bookings | Customer |
| Bookings | GET /api/bookings/my-bookings | Customer |
| Bookings | GET /api/bookings/all | Admin |
| Bookings | PUT /api/bookings/:id/status | Admin |
| Bookings | PUT /api/bookings/:id/cancel | Booking owner |
| Payments | POST /api/payments/create-payment-intent | Booking owner |
| Payments | POST /api/payments/mark-paid | Booking owner |
| Tracking | GET /api/tracking/driver/rides | Driver |
| Tracking | POST /api/tracking/:bookingId/claim | Driver |
| Tracking | PUT /api/tracking/:bookingId/stop | Driver |
| Tracking | PUT /api/tracking/:bookingId/complete | Claimed driver |
| Tracking | GET /api/tracking/:bookingId | Ride participant |
| Notifications | GET /api/notifications | Authenticated |
| Notifications | PUT /api/notifications/read-all | Authenticated |
| Notifications | PUT /api/notifications/:id/read | Notification owner |
| Places | GET /api/places/autocomplete | Public |
| Places | GET /api/places/details | Public |
| Appearance | GET /api/settings/home | Public |
| Appearance | PUT /api/settings/home | Admin |

Car and booking list endpoints support search, filtering, sorting, and pagination. Uploads use multipart field image.

## Socket.IO events

The API uses Socket.IO for realtime app updates and driver tracking. Important events include:

- join-booking
- driver-location
- driver-offline
- stop-sharing
- notification updates for authenticated users

## Validation

Validation is handled with reusable schemas instead of hard-coded checks:

- Server request body/query validation uses Zod in server/validation.
- Web and mobile forms use Zod with React Hook Form where forms need structured validation.
- API validation errors are returned as clean messages for the UI.

## Payments

1. The customer opens payment for an owned booking.
2. The server rejects cancelled, already paid, or unauthorized bookings.
3. The server creates a Stripe PaymentIntent with booking/user metadata.
4. Web uses Stripe Elements; mobile uses the native Stripe Payment Sheet.
5. Mobile Payment Sheet is forced to dark theme for consistent card UI.
6. After Stripe confirms payment, the app asks the server to verify the PaymentIntent.
7. The server verifies amount, currency, metadata, and status before marking the booking paid.
8. Admin booking screens show whether the customer has paid.

Use Stripe test mode and official test cards during development.

## Images and uploads

- Uploaded images are stored in server/uploads.
- Uploaded images are served from /uploads/:filename.
- Web and mobile admin screens can upload car images and homepage hero images.
- Admins can also use direct image URLs.
- Runtime uploaded files are excluded from Git.

For production, move uploads to durable storage such as S3, R2, or another object-storage service.

## Google Maps and Places

Web uses a browser Maps key. Mobile native maps use Android/iOS native keys from Expo config. Address autocomplete uses the API proxy:

- GET /api/places/autocomplete?input=Kabul
- GET /api/places/details?placeId=...

This keeps the server-side Places key out of the mobile/web client and gives both apps the same autocomplete behavior.

## Security notes

- bcryptjs password hashing
- JWT-protected API routes and Socket.IO connections
- Customer, admin, and driver role checks
- Zod validation for request bodies and query parameters
- Restricted upload MIME type, count, and size
- Server-side Stripe PaymentIntent verification
- Hashed, single-use, expiring password-reset tokens
- Secrets loaded from environment variables

Before production, add HTTPS, rate limiting, security headers, strict CORS, Stripe webhooks, database backups, durable upload storage, and production-grade logging/monitoring.

## Troubleshooting

### MySQL: Too many keys specified

This happens when sequelize.sync({ alter: true }) repeatedly creates duplicate indexes. The project now uses plain sequelize.sync(). For a development database that already has duplicate indexes, remove the duplicates manually or recreate the development database.

### Hero image remains old

Check GET /api/settings/home and confirm the returned /uploads/... URL opens in the browser. Restart the API if environment or upload paths changed. The UI refreshes settings on page focus, but a stale browser cache may still need a hard refresh during development.

### Payment does not open on mobile

Confirm:

- EXPO_PUBLIC_STRIPE_KEY is a publishable pk_test key.
- STRIPE_SECRET_KEY is a secret sk_test key.
- The booking belongs to the signed-in customer.
- The booking is not cancelled and not already paid.
- You are using a development build, not a limited Expo Go setup, for native Stripe testing.

### Google Maps does not show on mobile

Confirm:

- Maps SDK for Android/iOS is enabled in Google Cloud.
- The Android key allows package com.jahanmal.carbooking and the correct SHA-1.
- The iOS key allows bundle identifier com.jahanmal.carbooking.
- You rebuilt the native app after changing keys.
- The phone can reach the API LAN URL.

### Places autocomplete does not show suggestions

Confirm GOOGLE_PLACES_API_KEY exists in server/.env, Places API is enabled, and this works from the phone/browser:

    http://YOUR_COMPUTER_LAN_IP:5000/api/places/autocomplete?input=Kabul

### Phone cannot connect to API

Physical phones cannot use the computer's localhost. Set EXPO_PUBLIC_API_URL to your computer LAN IP and allow inbound TCP port 5000 through the firewall.

### CORS error on web

Set WEB_URL in server/.env to the exact frontend origin, for example http://localhost:3000, then restart the API.

### Password reset email does not arrive

Check SMTP host, port, secure mode, username, password, sender address, spam folder, and server logs. In non-production development without SMTP, the API can log a reset URL for testing.

## Production checklist

1. Build the web app with npm run build.
2. Serve web/dist from a static host or reverse proxy.
3. Run the API with production environment variables.
4. Use HTTPS everywhere.
5. Use managed MySQL with backups.
6. Move uploads to durable object storage.
7. Configure Stripe webhooks.
8. Restrict all Google and Stripe keys.
9. Add rate limiting and security headers.
10. Build signed mobile apps with production API, Maps, and Stripe keys.

## Author

Jahanmal Agha
