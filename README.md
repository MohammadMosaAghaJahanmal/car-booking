# CarBooking

CarBooking is a full-stack ride-booking platform for customers, administrators, and drivers. It includes route planning, scheduled rides, Stripe payments, live tracking, fleet management, uploads, and notifications.

## Features

### Customers
- JWT registration and login
- Secure email password reset with hashed, single-use, 15-minute tokens
- Self-service display-name and password updates
- Google Places pickup and destination search
- Interactive maps, current location, automatic distance and fare calculations
- Scheduled rides and car selection with images
- Stripe checkout with polished loading, validation, success, and error states
- Cancellation and eligible refunds
- Live driver tracking, ride-history filters, and real-time notifications

### Administrators
- Booking summaries, search, filters, pagination, and calendar
- Booking status and fleet management
- Car and homepage hero images through URL or file upload
- Admin-only JPG, PNG, and WebP uploads with previews and a 5 MB limit

### Drivers
- Driver console, available rides, claiming, and assignment notifications
- Live browser geolocation sharing and offline updates

## Technology

| Layer | Technology |
| --- | --- |
| Web | React 19, Vite, Tailwind CSS |
| Data and routing | Axios, React Router |
| Validation | Zod, React Hook Form |
| Maps | Google Maps and Places |
| Payments | Stripe Elements and Payment Intents |
| API | Node.js, Express 5 |
| Database | MySQL, Sequelize |
| Authentication | JWT, bcrypt |
| Real-time | Socket.IO |
| Uploads | Multer |

## Structure

    car-booking/
    |-- server/
    |   |-- controllers/    API handlers
    |   |-- middleware/     Auth, validation, uploads
    |   |-- models/         Sequelize models
    |   |-- routes/         Express routes
    |   |-- services/       Notification services
    |   |-- socket/         Live tracking
    |   |-- uploads/        Runtime images
    |   `-- validation/     Zod schemas
    `-- web/src/
        |-- api/            Axios client
        |-- assets/         Bundled images
        |-- components/     Shared UI and checkout
        |-- pages/          Application pages
        `-- validation/     Client schemas

## Requirements

- Node.js 20 or newer
- Yarn 1.x
- MySQL 8 or compatible
- Google Maps key with Maps JavaScript and Places enabled
- Stripe test-mode publishable and secret keys

## Installation

    cd car-booking/server
    yarn install
    cd ../web
    yarn install

Create `server/.env`:

    PORT=5000
    WEB_URL=http://localhost:3000
    DB_HOST=localhost
    DB_NAME=car_booking_db
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_DIALECT=mysql
    JWT_SECRET=replace_with_a_long_random_secret
    STRIPE_SECRET_KEY=sk_test_your_secret_key
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=your_smtp_user
    SMTP_PASSWORD=your_smtp_password
    MAIL_FROM=CarBooking <no-reply@example.com>

Create `web/.env`:

    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
    VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key

Never commit environment files or use production Stripe keys locally.

## Database setup

    CREATE DATABASE car_booking_db
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;

The API runs safe `sequelize.sync()` at startup to create missing tables.

Optional development data:

    cd server
    node seedAdmin.js
    node seedDriver.js
    node seedCars.js

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@test.com` | `admin123` |
| Driver | `driver@test.com` | `driver123` |

Seed accounts are for local development only.

## Running locally

Terminal one:

    cd server
    yarn dev

Terminal two:

    cd web
    yarn dev

Open `http://localhost:3000`. The API uses `http://localhost:5000`.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| Server | `yarn dev` | Start with Nodemon |
| Server | `yarn start` | Start normally |
| Server | `yarn migrate:tracking` | Legacy tracking migration |
| Server | `yarn seed:driver` | Create demo driver |
| Web | `yarn dev` | Start Vite |
| Web | `yarn build` | Production build |
| Web | `yarn preview` | Preview build |
| Web | `yarn lint` | Run ESLint |

## Models

- **User:** customer, admin, or driver.
- **Car:** name, type, image, and per-kilometer price.
- **Booking:** route, coordinates, schedule, fare, status, and Stripe reference.
- **RideTracking:** driver, position, movement data, sharing state, and last seen.
- **Notification:** persistent message, link, metadata, and read time.
- **SiteSetting:** key-value configuration such as the homepage hero.
- **PasswordResetToken:** hashed, expiring, single-use password reset request.

Booking states: `pending`, `accepted`, `completed`, `cancelled`.
Payment states: `unpaid`, `paid`, `refunded`.

## API overview

Protected routes require `Authorization: Bearer <jwt>`.

| Area | Method and endpoint | Access |
| --- | --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| Password reset | POST /api/auth/forgot-password, POST /api/auth/reset-password | Public |
| Account | GET /api/auth/profile, PUT /api/auth/profile | Authenticated owner |
| Account | PUT /api/auth/change-password | Authenticated owner |
| Cars | `GET /api/cars` | Public |
| Cars | `POST /api/cars`, `PUT /api/cars/:id`, `DELETE /api/cars/:id` | Admin |
| Uploads | `POST /api/uploads/image` | Admin |
| Bookings | `POST /api/bookings`, `GET /api/bookings/my-bookings` | Customer |
| Bookings | `GET /api/bookings/all`, `PUT /api/bookings/:id/status` | Admin |
| Bookings | `PUT /api/bookings/:id/cancel` | Owner |
| Payments | `POST /api/payments/create-payment-intent` | Owner |
| Payments | `POST /api/payments/mark-paid` | Owner |
| Tracking | `GET /api/tracking/driver/rides` | Driver |
| Tracking | `POST /api/tracking/:bookingId/claim`, `PUT /api/tracking/:bookingId/stop` | Driver |
| Tracking | `GET /api/tracking/:bookingId` | Ride participant |
| Notifications | `GET /api/notifications`, `PUT /api/notifications/read-all` | Authenticated |
| Notifications | `PUT /api/notifications/:id/read` | Owner |
| Appearance | `GET /api/settings/home` | Public |
| Appearance | `PUT /api/settings/home` | Admin |

Car and booking list endpoints support search, filters, sorting, and pagination. Uploads use multipart field `image`; JPG, PNG, and WebP are accepted up to 5 MB.

Socket events include `join-booking`, `driver-location`, `driver-offline`, and `stop-sharing`.

## Account settings

Authenticated users can update their own display name and change their password from /profile. Account ownership comes exclusively from the verified JWT; profile routes do not accept a target user ID. Password changes require the current password, reject password reuse, and invalidate active reset links.

## Password reset flow

1. A user submits an email address and always receives the same generic response.
2. The server creates a random token, stores only its SHA-256 hash, and sets a 15-minute expiry.
3. Nodemailer sends the reset URL through SMTP.
4. The reset page validates and submits the new password.
5. The server consumes every active reset token for the account after updating the password.

When SMTP is absent outside production, the API logs and returns a development-only reset URL. Production requires SMTP configuration.

## Secure payment flow

1. The server verifies booking ownership and rejects paid or cancelled bookings.
2. It creates a CAD Stripe PaymentIntent.
3. Stripe Elements collects card details; this application never stores them.
4. Stripe confirms the payment.
5. The server retrieves and verifies status, amount, currency, user, and booking metadata.
6. Only then is the booking marked paid and a notification created.
7. Eligible paid cancellations are refunded through Stripe.

Use test mode and official Stripe test cards during development.

## Image storage

Uploads are stored in `server/uploads` and served at `/uploads/:filename`. Runtime files are excluded from Git. Use durable object storage such as S3 or R2 in production.

## Security

- bcrypt password hashing and JWT-protected APIs and sockets
- Customer, admin, and driver role checks
- Zod request validation
- Restricted upload MIME type, count, and size
- Server-side Stripe PaymentIntent verification
- Environment-based secrets

For production, add HTTPS, rate limiting, security headers, database backups, durable uploads, restrictive CORS, and Stripe webhooks.

## Troubleshooting

### MySQL: Too many keys specified
Repeated `sync({ alter: true })` can create duplicate indexes. This project uses plain `sync()`. Remove duplicate development indexes or recreate the development database.

### Hero image remains old
Inspect `/api/settings/home` and confirm its `/uploads/...` URL works. Settings disable caching and refresh when the window regains focus.

### Password reset email does not arrive

Check the SMTP host, port, secure mode, credentials, sender address, spam folder, and server logs. Restart the API after changing environment variables.

### Payment initialization fails
Confirm Stripe keys use test mode, the booking belongs to the signed-in user, and it is neither paid nor cancelled. Safe messages appear in the UI while diagnostics remain in server logs.

### Google Maps fails
Enable Maps JavaScript and Places, configure billing and origin restrictions, add the Vite key, and restart Vite.

### CORS failure
Set `WEB_URL` to the exact frontend origin and restart the API.

## Production

1. Build the web app with `yarn build`.
2. Serve `web/dist` through a static host or reverse proxy.
3. Start the API with production environment variables.
4. Use HTTPS and managed MySQL.
5. Move uploads to durable object storage.
6. Configure Stripe webhooks and restrict API keys.

## Author

Jahanmal Agha
