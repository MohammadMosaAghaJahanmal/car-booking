# Car Booking System

A full-stack Car Booking System built for learning purposes using **MERN-style architecture with MySQL instead of MongoDB**.

This project covers real-world booking system concepts like:

- User Authentication
- Role-based Access (User/Admin)
- Car Management
- Booking Management
- Google Maps Integration
- Current Location Detection
- Distance Calculation
- Stripe Payment Integration
- Payment Refund on Booking Cancellation

---

# Tech Stack

## Frontend
- React (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Google Maps API
- Stripe

## Backend
- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT Authentication
- bcrypt
- Stripe API

---

# Features

## User Features
- Register / Login
- View available cars
- Select pickup & drop location
- Use current location
- View route on map
- Calculate ride distance
- View estimated price
- Select travel date & time
- Create booking
- Pay booking via Stripe
- Cancel booking
- Auto refund on cancellation if payment completed

---

## Admin Features
- Admin login
- Add cars
- View all bookings
- Accept bookings
- Complete bookings
- Cancel bookings
- Manage booking status

---

# Project Structure

```bash
car-booking-system/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│
├── web/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
```

---

# Database Models

## User
- id
- name
- email
- password
- role

## Car
- id
- name
- type
- pricePerKm

## Booking
- id
- userId
- carId
- pickupAddress
- pickupLat
- pickupLng
- dropAddress
- dropLat
- dropLng
- distanceKm
- totalPrice
- travelDate
- travelTime
- status
- paymentStatus
- stripePaymentIntentId

---

# Booking Status

- pending
- accepted
- completed
- cancelled

---

# Payment Status

- unpaid
- paid
- refunded

---

# API Routes

## Auth
- POST /api/auth/register
- POST /api/auth/login

## Cars
- GET /api/cars
- POST /api/cars
- PUT /api/cars/:id
- DELETE /api/cars/:id

## Bookings
- POST /api/bookings
- GET /api/bookings/my-bookings
- GET /api/bookings/all
- PUT /api/bookings/:id/status
- PUT /api/bookings/:id/cancel

## Payments
- POST /api/payments/create-payment-intent
- POST /api/payments/mark-paid

---

# Google Maps Features

- Places Autocomplete
- Pickup & Drop Marker
- Current Location
- Route Drawing
- Driving Distance Calculation

---

# Stripe Features

- Payment Intent
- Card Payment
- Mark Booking Paid
- Refund Payment on Cancellation

---

# Setup Backend

```bash
cd server
yarn install
```

Create `.env`

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=car_booking_db
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

Run:

```bash
yarn dev
```

---

# Setup Frontend

```bash
cd web
yarn install
```

Create `.env`

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_map_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

Run:

```bash
yarn dev
```

---

# Learning Goals

This project was built to learn:

- Backend Architecture
- MySQL + Sequelize
- Authentication & Authorization
- REST APIs
- Payment Integration
- Google Maps Integration
- Real-world Booking Logic

---

# Future Improvements

- Driver Panel
- Live Driver Tracking
- Notifications
- Mobile App (React Native)
- Booking History Filters
- Coupons
- Scheduled Rides

---

# Author

Jahanmal Agha