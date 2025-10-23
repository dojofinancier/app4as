# Database Tables and Payment Flow Guide

## Overview
This guide explains how each database table is used in the payment and booking flow. Tables are organized by their role in the process.

## Core User & Content Tables

### 1. `users` - User Accounts
**Purpose:** Stores all user accounts (students, tutors, admins)
**Payment Flow Role:** 
- Links to orders and appointments
- Stores Stripe customer ID for payment processing
- For guest users: Account is created AFTER payment using billing information

**Key Fields:**
- `id` - Unique user identifier
- `email` - Used for login and billing
- `role` - student/tutor/admin
- `stripe_customer_id` - Links to Stripe for payments
- `default_payment_method_id` - Saved payment method

### 2. `courses` - Available Courses
**Purpose:** Defines what courses can be booked
**Payment Flow Role:** 
- Determines pricing (student_rate_cad vs tutor hourly rate)
- Links to cart items and orders

**Key Fields:**
- `id` - Course identifier
- `title_fr` - Course name
- `student_rate_cad` - What students pay (e.g., $45/hour)
- `hourly_base_rate_cad` - What tutors earn (e.g., $30/hour)

### 3. `tutors` - Tutor Information
**Purpose:** Stores tutor profiles and availability
**Payment Flow Role:**
- Links to appointments and cart items
- Determines tutor earnings calculation

**Key Fields:**
- `id` - Tutor identifier
- `display_name` - Tutor's name
- `hourly_base_rate_cad` - Base rate for earnings calculation

## Shopping Cart System

### 4. `carts` - Shopping Baskets
**Purpose:** Temporary storage for selected sessions before payment
**Payment Flow Role:**
- **For logged-in users:** Linked to user_id
- **For guest users:** Linked to session_id (cookie)
- Contains cart items and optional coupon

**Key Fields:**
- `id` - Cart identifier
- `user_id` - NULL for guest users
- `session_id` - NULL for logged-in users
- `coupon_id` - Optional discount coupon

### 5. `cart_items` - Individual Cart Items
**Purpose:** Each selected session in the cart
**Payment Flow Role:**
- Stores individual session details
- Links to course, tutor, and pricing
- Gets converted to order_items after payment

**Key Fields:**
- `cart_id` - Links to parent cart
- `course_id` - Which course
- `tutor_id` - Which tutor
- `start_datetime` - When the session is
- `duration_min` - How long (60/90/120 minutes)
- `unit_price_cad` - Price per session
- `line_total_cad` - Total for this item

### 6. `slot_holds` - Temporary Reservations
**Purpose:** Prevents double-booking during checkout
**Payment Flow Role:**
- Created when item added to cart
- Expires after 15 minutes
- Deleted after successful payment
- **For guests:** Uses session_id
- **For users:** Uses user_id

**Key Fields:**
- `tutor_id` - Which tutor
- `start_datetime` - When the slot is held
- `expires_at` - When hold expires (15 minutes)
- `user_id` - NULL for guests
- `session_id` - NULL for logged-in users

## Payment Processing

### 7. `payment_intent_data` - Payment Details Storage
**Purpose:** Stores detailed cart information for Stripe webhook processing
**Payment Flow Role:**
- Created when Payment Intent is made
- Contains full cart details (too large for Stripe metadata)
- Deleted after successful webhook processing

**Key Fields:**
- `payment_intent_id` - Links to Stripe Payment Intent
- `cart_data` - Full JSON of cart items and pricing

### 8. `orders` - Completed Purchases
**Purpose:** Records of successful payments
**Payment Flow Role:**
- Created by webhook after successful payment
- Contains total amounts and payment details
- Links to order_items and appointments

**Key Fields:**
- `id` - Order identifier
- `user_id` - Who made the purchase
- `subtotal_cad` - Total before discount
- `discount_cad` - Coupon discount amount
- `total_cad` - Final amount paid
- `status` - paid/failed/refunded
- `stripe_payment_intent_id` - Links to Stripe

### 9. `order_items` - Individual Purchased Items
**Purpose:** Each session that was purchased
**Payment Flow Role:**
- Created from cart_items after payment
- Contains pricing and tutor earnings
- Links to appointments

**Key Fields:**
- `order_id` - Links to parent order
- `course_id`, `tutor_id` - What was purchased
- `start_datetime`, `end_datetime` - When
- `duration_min` - How long
- `unit_price_cad` - What student paid
- `line_total_cad` - Total for this item
- `tutor_earnings_cad` - What tutor earns

## Booking System

### 10. `appointments` - Scheduled Sessions
**Purpose:** Actual booked sessions
**Payment Flow Role:**
- Created after successful payment
- Links to order_item for payment tracking
- Can be cancelled/rescheduled

**Key Fields:**
- `id` - Appointment identifier
- `user_id` - Student
- `tutor_id` - Tutor
- `course_id` - Course
- `start_datetime`, `end_datetime` - When
- `status` - scheduled/cancelled/completed
- `order_item_id` - Links to payment

## Supporting Tables

### 11. `coupons` - Discount Codes
**Purpose:** Discount codes for promotions
**Payment Flow Role:**
- Applied to carts for discounts
- Usage tracked in redemption_count

### 12. `webhook_events` - Payment Notifications
**Purpose:** Logs all Stripe webhook events
**Payment Flow Role:**
- Records payment confirmations
- Helps debug payment issues

### 13. `credit_transactions` - Credit Bank System
**Purpose:** Tracks earned/used credits
**Payment Flow Role:**
- Credits earned from completed sessions
- Credits used for future bookings

## Payment Flow Sequence

1. **Cart Creation:** `carts` + `cart_items` + `slot_holds`
2. **Payment Intent:** `payment_intent_data` (stores cart details)
3. **Payment Success:** Stripe webhook triggers
4. **Order Creation:** `orders` + `order_items` + `appointments`
5. **Cleanup:** Delete `carts`, `cart_items`, `slot_holds`, `payment_intent_data`

## Guest vs Logged-in User Differences

| Aspect | Logged-in User | Guest User |
|--------|----------------|------------|
| Cart Storage | `user_id` in carts table | `session_id` in carts table |
| Slot Holds | `user_id` in slot_holds | `session_id` in slot_holds |
| Account Creation | Already exists | Created after payment |
| Payment Intent | Uses existing Stripe customer | Creates temporary Stripe customer |
| Webhook Processing | Updates existing user | Creates new user account |

## Key Relationships

- `users` → `orders` → `order_items` → `appointments`
- `courses` → `cart_items` → `order_items` → `appointments`
- `tutors` → `cart_items` → `order_items` → `appointments`
- `carts` → `cart_items` (temporary)
- `orders` → `order_items` (permanent)
- `payment_intent_data` → `orders` (via webhook)

