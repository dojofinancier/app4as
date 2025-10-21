# 4AS Tutor Booking Application - Development Roadmap

> **Note:** This document has been superseded by the **[Consolidated Roadmap](./CONSOLIDATED_ROADMAP.md)** which merges the original prompt, implementation plan, and this roadmap into a single, comprehensive source of truth.
>
> **Please refer to [CONSOLIDATED_ROADMAP.md](./CONSOLIDATED_ROADMAP.md) for:**
> - Complete V1 scope and specifications
> - Detailed implementation phases
> - Cross-cutting concerns and consistency rules
> - Current status of all features
> - Technical dependencies and implementation order
> - V2 deferred features

---

## Legacy Overview (Archived)
This document originally tracked the development progress of dashboard features. It has been consolidated into the main roadmap.

## Feature Checklist

### ✅ Completed Features

#### Student Dashboard
- [x] **Student Profile**: Name, email, account creation date
- [x] **Upcoming Reservations**: List with basic info
- [x] **Past Reservations**: List with basic info
- [x] **Quick Actions**: Book more sessions, view cart
- [x] **Order History**: Basic order display with amounts

#### Tutor Dashboard
- [x] **Overview Tab**: Stats (today's appointments, upcoming appointments, hourly rate)
- [x] **Profile Info**: Display name, bio, courses taught, status
- [x] **Today's Appointments**: List of today's sessions
- [x] **Basic Availability Tab**: View recurring availability rules (UI only)

#### Admin Dashboard
- [x] **Overview Tab**: Basic stats cards
- [x] **Tutors Tab**: Fully functional tutor management system
- [x] **Basic UI**: Courses, Coupons, Appointments, Orders tabs (UI only)

### 🚧 Features to Implement

#### Student Dashboard
- [x] **Enhanced Profile Management**: Change password, update profile info
- [x] **Reservation Management**: Cancel, modify, reschedule appointments
- [x] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [x] **Payment Methods**: Manage saved credit cards
- [x] **Recurring Sessions**: Book weekly/bi-weekly sessions
- [ ] **Support Tickets**: Submit and track support requests
- [ ] **File Management**: Upload/download files for appointments
- [ ] **Learning Analytics**: Track progress and session history

#### Tutor Dashboard
- [ ] **Set Availabilities**: Default week with overrides
- [ ] **Appointments Tab**: Modify or cancel appointments
- [ ] **Student Messaging**: Send message to student
- [ ] **Meeting Links**: Add meeting link (zoom, teams, etc)
- [ ] **Availability Status**: Set yourself not available
- [ ] **Evaluation Score**: See your evaluation score
- [ ] **Course Management**: See courses with possibility to add new courses
- [ ] **Earnings Dashboard**: Monthly hours and earnings, current month vs completed payments
- [ ] **Training Resources**: Guides, SOPs and teaching materials

#### Admin Dashboard
- [ ] **Enhanced Overview**: This month vs last month revenue, unanswered support tickets
- [ ] **Course Management**: Full CRUD operations with materials upload
- [ ] **Enhanced Tutor Management**: Ratings, earnings, payment status
- [ ] **Coupon Management**: Full CRUD operations
- [ ] **Appointment Management**: Status tracking and management
- [ ] **Order Management**: Refund functionality
- [ ] **Revenue Analytics**: Yearly/monthly revenue, by course/tutor
- [ ] **Student Management**: Complete student management system
- [ ] **Support System**: Ticket management and resolution

## Detailed Feature Specifications

# STUDENT DASHBOARD FEATURES

### 1. Enhanced Profile Management
**Status**: ✅ Completed  
**Priority**: High  
**Description**: Allow students to manage their profile information.

**Requirements**:
- [x] Change password functionality
- [x] Update profile information (name, phone)

**Database Changes**:
- [x] Enhance `User` model with additional fields (stripeCustomerId, defaultPaymentMethodId)

**UI Components**:
- [x] Profile settings form
- [x] Password change form
- [x] Profile management tab in student dashboard

### 2. Reservation Management
**Status**: ✅ Completed  
**Priority**: High  
**Description**: Allow students to manage their appointments (cancel, modify, reschedule).

**Requirements**:
- [x] Cancel appointment functionality
- [x] Reschedule appointment functionality
- [x] Credit bank system for cancellations
- [x] Cancellation policy enforcement (2 hours)
- [x] Rescheduling validation (24 hours)
- [x] Webhook notifications for changes

**Database Changes**:
- [x] Enhance `Appointment` model with cancellation fields
- [x] Add appointment modification tracking
- [x] Add cancellation reason tracking
- [x] Create `CreditTransaction` model
- [x] Create `RefundRequest` model
- [x] Create `AppointmentModification` model

**UI Components**:
- [x] Reservation management tab
- [x] Cancel appointment modal with credit/refund options
- [x] Reschedule appointment form
- [x] Credit bank display and history

### 3. Student Messaging System
**Status**: ✅ Completed (Phase 1 & 2)
**Priority**: High
**Description**: Direct messaging system between students and tutors with file attachments.

**Requirements**:
- [x] Send messages to tutors
- [x] View message history
- [x] Message notifications (make.com webhook)
- [x] File attachments (Phase 2)
- [x] Message status tracking (sent status)


**Database Changes**:
- [x] Create `Message` model
- [x] Create `MessageAttachment` model (Phase 2)


**UI Components**:
- [x] Message composer
- [x] Message thread view
- [x] File upload component (Phase 2)
- [x] Message notifications

### 4. Payment Methods Management
**Status**: ✅ Completed  
**Priority**: High  
**Description**: Manage saved payment methods for easy booking.

**Requirements**:
- [x] Save credit card information (via Stripe)
- [x] Manage saved payment methods
- [x] Set default payment method
- [x] Payment method validation
- [x] Secure payment method storage

**Database Changes**:
- [x] Add `stripeCustomerId` to `User` model
- [x] Add `defaultPaymentMethodId` to `User` model

**UI Components**:
- [x] Payment methods list
- [x] Add payment method form
- [x] Payment method management interface

### 5. Recurring Sessions Booking
**Status**: ✅ Completed  
**Priority**: Medium  
**Description**: Allow students to book recurring sessions.

**Requirements**:
- [x] Set up recurring session patterns
- [x] Weekly/bi-weekly booking options
- [x] Manage recurring sessions
- [x] Automatic session creation
- [x] Recurring session modifications

**Database Changes**:
- [x] Create `RecurringSession` model
- [x] Link to `Appointment` model

**UI Components**:
- [x] Recurring session setup form
- [x] Recurring session management
- [x] Pattern selection interface

### 6. Support Ticket System
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Submit and track support requests.

**Requirements**:
- [ ] Submit support tickets
- [ ] Track ticket status
- [ ] View ticket history
- [ ] File attachments for tickets
- [ ] Ticket categories

**Database Changes**:
- [ ] Create `SupportTicket` model
- [ ] Create `TicketAttachment` model
- [ ] Create `TicketCategory` model

**UI Components**:
- [ ] Ticket submission form
- [ ] Ticket status tracking
- [ ] Ticket history view


# 2 TUTOR DASHBOARD FEATURES

### 2.1 Set Availabilities (Default Week with Overrides)
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow tutors to set their default weekly availability and create specific overrides for certain dates.

**Requirements**:
- [ ] Weekly availability grid (7 days x time slots)
- [ ] Add/edit/delete availability rules
- [ ] Specific date overrides (exceptions)
- [ ] Time off management
- [ ] Bulk availability updates
- [ ] Availability validation (no conflicts)

**Database Changes**:
- [ ] Enhance `AvailabilityRule` model
- [ ] Enhance `AvailabilityException` model
- [ ] Enhance `TimeOff` model

**UI Components**:
- [ ] Weekly availability calendar
- [ ] Add availability form
- [ ] Edit availability form
- [ ] Time off form
- [ ] Availability exceptions form

### 2.2 Appointments Tab (Modify or Cancel)
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow tutors to modify or cancel their appointments with proper validation.

**Requirements**:
- [ ] View all appointments (past, present, future)
- [ ] Cancel appointment functionality
- [ ] Reschedule appointment functionality
- [ ] Appointment details view
- [ ] Cancellation policy enforcement
- [ ] Student notification on changes

**Database Changes**:
- [ ] Enhance `Appointment` model with tutor actions
- [ ] Add appointment modification tracking

**UI Components**:
- [ ] Appointment list with actions
- [ ] Cancel appointment modal
- [ ] Reschedule appointment form
- [ ] Appointment details modal

### 2.3 Student Messaging System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Direct messaging system between tutors and students.

**Requirements**:
- [ ] Send messages to students
- [ ] View message history
- [ ] Message templates
- [ ] File attachments
- [ ] Message notifications
- [ ] Message status tracking

**Database Changes**:
- [ ] Create `Message` model
- [ ] Create `MessageAttachment` model
- [ ] Create `MessageTemplate` model

**UI Components**:
- [ ] Message composer
- [ ] Message thread view
- [ ] Message templates selector
- [ ] File upload component

### 2.4 Meeting Links Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow tutors to add and manage meeting links for their sessions.

**Requirements**:
- [ ] Add meeting link (Zoom, Teams, Google Meet, etc.)
- [ ] Edit meeting links
- [ ] Meeting link validation
- [ ] Platform-specific settings
- [ ] Meeting link sharing with students

**Database Changes**:
- [ ] Create `MeetingLink` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Meeting link form
- [ ] Platform selector
- [ ] Meeting link display
- [ ] Meeting link editor

### 2.5 Availability Status Management
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow tutors to set themselves as unavailable for certain periods.

**Requirements**:
- [ ] Set unavailable status
- [ ] Set unavailable periods
- [ ] Emergency unavailability
- [ ] Status notifications to students
- [ ] Status history tracking

**Database Changes**:
- [ ] Enhance `Tutor` model with availability status
- [ ] Create `TutorUnavailability` model

**UI Components**:
- [ ] Availability status toggle
- [ ] Unavailability period form
- [ ] Status history view

### 2.6 Evaluation Score Display
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Display tutor evaluation scores and feedback from students.

**Requirements**:
- [ ] Average rating display
- [ ] Individual session ratings
- [ ] Rating trends over time
- [ ] Review comments
- [ ] Rating breakdown by criteria

**Database Changes**:
- [ ] Create `TutorRating` model
- [ ] Create `RatingCriteria` model

**UI Components**:
- [ ] Rating display component
- [ ] Rating history chart
- [ ] Review comments list
- [ ] Rating breakdown view

### 2.7 Course Management
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow tutors to view and add courses they can teach.

**Requirements**:
- [ ] View assigned courses
- [ ] Request new course assignments
- [ ] Course proficiency levels
- [ ] Course status management
- [ ] Course performance metrics

**Database Changes**:
- [ ] Enhance `TutorCourse` model
- [ ] Add course proficiency tracking

**UI Components**:
- [ ] Course list with actions
- [ ] Course request form
- [ ] Course proficiency selector
- [ ] Course performance dashboard

### 2.8 Earnings Dashboard
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Comprehensive earnings tracking and financial analytics.

**Requirements**:
- [ ] Monthly hours tracking
- [ ] Monthly earnings calculation
- [ ] Current month vs completed payments
- [ ] Earnings history
- [ ] Payment status tracking
- [ ] Tax reporting preparation

**Database Changes**:
- [ ] Create `TutorEarning` model
- [ ] Create `Payment` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Earnings summary cards
- [ ] Monthly earnings chart
- [ ] Payment status list
- [ ] Earnings export functionality

### 2.9 Training Resources
**Status**: 🚧 In Progress  
**Priority**: Low  
**Description**: Access to guides, SOPs, and teaching materials.

**Requirements**:
- [ ] Resource library access
- [ ] Search and filter resources
- [ ] Resource categories
- [ ] Download tracking
- [ ] Resource ratings
- [ ] New resource notifications

**Database Changes**:
- [ ] Create `TrainingResource` model
- [ ] Create `ResourceCategory` model
- [ ] Create `ResourceDownload` model

**UI Components**:
- [ ] Resource library grid
- [ ] Resource search
- [ ] Resource viewer
- [ ] Download tracking

# 3 ADMIN DASHBOARD FEATURES

### 3.1 Enhanced Overview Tab
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Enhanced overview with revenue comparison and support tickets.

**Requirements**:
- [ ] This month vs last month revenue comparison
- [ ] Unanswered support tickets list
- [ ] Recent orders with enhanced details
- [ ] System health indicators
- [ ] Quick action buttons

**Database Changes**:
- [ ] Add revenue calculation queries
- [ ] Link to support ticket system

**UI Components**:
- [ ] Revenue comparison charts
- [ ] Support tickets widget
- [ ] Enhanced stats cards
- [ ] Quick action panel

### 3.2 Course Management System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Complete course management with materials upload.

**Requirements**:
- [ ] Create new courses (full name, slug, sigle, institution, description, rate, active)
- [ ] Edit existing courses
- [ ] Delete courses
- [ ] Upload course materials
- [ ] Course rate management (student rate vs tutor rate)
- [ ] Course status management
- [ ] Course analytics

**Database Changes**:
- [ ] Enhance `Course` model with new fields
- [ ] Create `CourseMaterial` model
- [ ] Add course rate tracking

**UI Components**:
- [ ] Course creation form
- [ ] Course editing form
- [ ] Course materials upload
- [ ] Course management interface

### 3.3 Enhanced Tutor Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Enhanced tutor management with ratings, earnings, and payment tracking.

**Requirements**:
- [ ] Edit tutor hourly rates
- [ ] View and edit tutor ratings and reviews
- [ ] View availability utilization
- [ ] View tutor earnings (current and historical)
- [ ] Edit payment status (mark monthly invoice as paid)
- [ ] Confirmation number input for payments
- [ ] Tutor performance analytics

**Database Changes**:
- [ ] Create `TutorRating` model
- [ ] Create `TutorEarning` model
- [ ] Create `TutorPayment` model
- [ ] Add payment confirmation tracking

**UI Components**:
- [ ] Tutor earnings dashboard
- [ ] Payment status management
- [ ] Rating and review management
- [ ] Performance analytics charts

### 3.4 Coupon Management System
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Complete coupon management with usage tracking.

**Requirements**:
- [ ] Create new coupons
- [ ] Edit existing coupons
- [ ] Delete coupons
- [ ] Coupon usage tracking
- [ ] Coupon performance analytics
- [ ] Coupon validation rules

**Database Changes**:
- [ ] Enhance `Coupon` model
- [ ] Add usage tracking
- [ ] Add performance metrics

**UI Components**:
- [ ] Coupon creation form
- [ ] Coupon editing form
- [ ] Usage tracking dashboard
- [ ] Performance analytics

### 3.5 Appointment Management System
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Enhanced appointment management with status tracking.

**Requirements**:
- [ ] View all appointments with enhanced details
- [ ] Appointment status management
- [ ] Bulk appointment operations
- [ ] Appointment conflict resolution
- [ ] Appointment analytics

**Database Changes**:
- [ ] Enhance `Appointment` model
- [ ] Add appointment management tracking

**UI Components**:
- [ ] Enhanced appointment list
- [ ] Appointment management interface
- [ ] Bulk operations panel
- [ ] Conflict resolution tools

### 3.6 Order Management System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Enhanced order management with refund functionality.

**Requirements**:
- [ ] View all orders with enhanced details
- [ ] Order status management
- [ ] Refund orders functionality
- [ ] Cancel corresponding appointments on refund
- [ ] Order analytics
- [ ] Refund tracking

**Database Changes**:
- [ ] Enhance `Order` model
- [ ] Create `Refund` model
- [ ] Add refund tracking

**UI Components**:
- [ ] Enhanced order list
- [ ] Refund processing interface
- [ ] Order analytics dashboard
- [ ] Refund tracking system

### 3.7 Revenue Analytics Dashboard
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Comprehensive revenue analytics and reporting.

**Requirements**:
- [ ] Yearly revenue tracking
- [ ] Monthly revenue tracking
- [ ] Revenue by course (cumulative)
- [ ] Revenue by tutor (cumulative)
- [ ] Refunds tracking (from Stripe)
- [ ] Tutor payment tracking
- [ ] Revenue trends and forecasting

**Database Changes**:
- [ ] Create revenue calculation views
- [ ] Add refund tracking from Stripe
- [ ] Add payment tracking

**UI Components**:
- [ ] Revenue analytics dashboard
- [ ] Revenue charts and graphs
- [ ] Payment tracking interface
- [ ] Refund monitoring system

### 3.8 Student Management System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Complete student management and support system.

**Requirements**:
- [ ] View all students with detailed profiles
- [ ] Student activity tracking
- [ ] Account status management (active/suspended)
- [ ] Student support ticket management
- [ ] Student analytics
- [ ] Communication tools

**Database Changes**:
- [ ] Create `StudentProfile` model
- [ ] Create `StudentActivity` model
- [ ] Link to support ticket system

**UI Components**:
- [ ] Student management interface
- [ ] Student profile viewer
- [ ] Activity tracking dashboard
- [ ] Support ticket management

### 3.9 Support System Management
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Complete support ticket management and resolution system.

**Requirements**:
- [ ] View all support tickets
- [ ] Ticket status management
- [ ] Ticket assignment to staff
- [ ] Ticket resolution tracking
- [ ] Support analytics
- [ ] Communication tools

**Database Changes**:
- [ ] Create `SupportTicket` model
- [ ] Create `TicketAssignment` model
- [ ] Add support analytics

**UI Components**:
- [ ] Support ticket dashboard
- [ ] Ticket management interface
- [ ] Assignment tools
- [ ] Resolution tracking



## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required for all user-facing content
- Mobile-first responsive design approach
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies, input validation)
- Add comprehensive logging for debugging and monitoring
- Test all features thoroughly before deployment
- Document all new API endpoints and database changes

## Last Updated
Created: December 2024  
Last Modified: December 2024
