# Student dashboard feature suggestions
_Exported on 10/17/2025 at 10:28:40 EDT from Cursor (1.7.46)_

---

**User**

I want to do a roadmap for adding and testing all functionalities and I want to make sure I dont forget anything. I will start with the student dashboard and list out all the features I want in the dashboard. I want you to tell me if there is additional features that could be usefull in that context from a business and UX perspectives.
Student dashboard features
- Student profile(name, email, account creation date)
- Upcoming reservations (Annuler, modifier, envoyer un message, link to the meeting in zoom or teams)
- Past reservation (see messages on those reservations)
- Reserver plus de séances and panier
- My orders with amount spent
- Change password
Anything I am missing?

---

**Cursor**

I'll analyze your student dashboard features and suggest additional ones from both business and UX perspectives. Let me first examine the current codebase to understand the existing functionality and then provide comprehensive recommendations.


Let me read the relevant files directly to understand the current implementation:


Now let me check the appointment card component and other relevant files to understand the current functionality:


Now let me create a comprehensive roadmap for the student dashboard with additional features from business and UX perspectives:


Based on my analysis of your current codebase and student dashboard features, here's a comprehensive roadmap with additional features that would be valuable from both business and UX perspectives:

## Current Student Dashboard Features ✅
Your current features are well-structured and cover the basics:

1. **Student Profile** (name, email, account creation date)
2. **Upcoming Reservations** (cancel, modify, download ICS)
3. **Past Reservations** (view history)
4. **Quick Actions** (book more sessions, view cart)
5. **Order History** (with amounts spent)

## Additional Features You're Missing (Business & UX Value)

### 🔐 **Account Management & Security**
- **Change Password** (you mentioned this - essential for security)
- **Two-Factor Authentication (2FA)** - Critical for account security
- **Login History** - Show recent login attempts and locations
- **Account Deactivation/Deletion** - GDPR compliance
- **Email Verification Status** - Ensure valid contact info

### 📊 **Learning Analytics & Progress**
- **Learning Statistics Dashboard**
  - Total hours of tutoring completed
  - Number of sessions per course
  - Progress tracking over time
  - Favorite tutors and courses
- **Session History with Ratings** - Rate past sessions (1-5 stars)
- **Learning Goals & Milestones** - Set and track academic objectives
- **Performance Trends** - Visual charts showing improvement over time

### 💬 **Communication & Support**
- **Direct Messaging with Tutors** - In-app messaging system
- **Session Notes & Feedback** - View tutor notes from past sessions
- **Support Ticket System** - Submit and track support requests
- **FAQ & Help Center** - Self-service support
- **Live Chat Support** - Real-time assistance

### 🎯 **Personalization & Recommendations**
- **Recommended Tutors** - Based on past bookings and preferences
- **Course Recommendations** - Suggest related courses
- **Personalized Learning Path** - Curated course progression
- **Study Reminders** - Email/SMS notifications for upcoming sessions
- **Learning Preferences** - Save preferred times, tutors, subjects

### 💰 **Financial Management**
- **Payment Methods Management** - Add/remove credit cards
- **Billing History & Invoices** - Download PDF invoices
- **Refund Requests** - Submit and track refund requests
- **Loyalty Points System** - Earn points for bookings, redeem for discounts
- **Subscription Plans** - Monthly/yearly packages for regular students

### 📅 **Enhanced Booking Features**
- **Recurring Sessions** - Set up weekly/bi-weekly sessions
- **Session Templates** - Save common booking preferences
- **Waitlist Management** - Join waitlists for popular time slots
- **Group Session Booking** - Book sessions with friends
- **Session Preparation** - Upload materials before sessions

### 🔔 **Notifications & Alerts**
- **Notification Preferences** - Customize email/SMS/push notifications
- **Session Reminders** - 24h, 2h, 15min before sessions
- **Payment Reminders** - For failed payments
- **New Tutor Availability** - Alerts when preferred tutors have new slots
- **Promotional Notifications** - Special offers and discounts

### 📱 **Mobile & Accessibility**
- **Mobile App Features** - Native mobile experience
- **Offline Mode** - View upcoming sessions without internet
- **Accessibility Features** - Screen reader support, high contrast mode
- **Multi-language Support** - Beyond French (English, Spanish)

### 🎓 **Academic Integration**
- **Grade Tracking** - Record and track academic performance
- **Assignment Help Requests** - Submit specific homework help requests
- **Study Group Formation** - Connect with other students
- **Academic Calendar Integration** - Sync with school schedules
- **Exam Preparation Tools** - Specialized exam prep features

### 📈 **Business Intelligence Features**
- **Usage Analytics** - Detailed reports on learning patterns
- **Cost Analysis** - Spending breakdown by subject/tutor
- **Time Management** - Track study time vs. session time
- **Goal Achievement** - Progress toward academic goals

## Priority Implementation Order

### **Phase 1 (Essential - High Business Value)**
1. Change Password functionality
2. Direct messaging with tutors
3. Session ratings and feedback
4. Payment methods management
5. Enhanced notification system

### **Phase 2 (High UX Value)**
1. Learning statistics dashboard
2. Recurring sessions
3. Recommended tutors/courses
4. Support ticket system
5. Mobile optimization

### **Phase 3 (Advanced Features)**
1. Two-factor authentication
2. Loyalty points system
3. Group session booking
4. Academic integration features
5. Advanced analytics

## Technical Considerations

Based on your current schema, you'll need to add:
- `UserPreferences` table for personalization
- `SessionRating` table for feedback
- `Message` table for communication
- `Notification` table for alerts
- `LoyaltyPoint` table for rewards
- `SupportTicket` table for help requests

Would you like me to help you implement any of these features, starting with the Phase 1 essentials?


The roadmap above provides a comprehensive view of what you currently have and what additional features would significantly enhance both the user experience and business value of your student dashboard. The features are prioritized based on implementation complexity and business impact, helping you plan your development phases effectively.

---

**User**

I have some questions on some of your suffestions.
- Payment method management: Can we safely save credit card info with stripe so that they can easily book a session without re-entering their credit card?
- What do you mean by enhanced notification system beyond direct messaging with tutors?
- Why would we need a support ticket system? Please provide examples or scenarios that would warrant this
- What learning statistics would be relevant?
- How do you see recurring session implemented? For example, if a student wants a weekly session how would that work?

---

**Cursor**

Great questions! Let me address each one with specific details and implementation considerations:


## 1. Payment Method Management with Stripe

**Yes, you can safely save credit card info with Stripe!** Here's how:

### Stripe Payment Methods API
- **Stripe Customer**: Create a Stripe Customer for each user
- **Payment Methods**: Store cards as Payment Methods (not raw card data)
- **Setup Intents**: Use Setup Intents to save cards for future use
- **PCI Compliance**: Stripe handles all PCI compliance requirements

### Implementation Example:
```typescript
// Save a payment method
const setupIntent = await stripe.setupIntents.create({
  customer: user.stripeCustomerId,
  payment_method_types: ['card'],
});

// Use saved payment method for future payments
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // $50.00 CAD
  currency: 'cad',
  customer: user.stripeCustomerId,
  payment_method: savedPaymentMethodId,
  confirm: true,
});
```

### Database Schema Addition:
```prisma
model User {
  // ... existing fields
  stripeCustomerId String? @map("stripe_customer_id")
  defaultPaymentMethodId String? @map("default_payment_method_id")
}
```

## 2. Enhanced Notification System

Beyond direct messaging, here are the notification types I meant:

### **System Notifications:**
- **Session Reminders**: "Your session with Marie starts in 2 hours"
- **Payment Confirmations**: "Payment of $75 CAD received for your session"
- **Booking Confirmations**: "Your session on March 15th at 2 PM is confirmed"
- **Cancellation Alerts**: "Your session has been cancelled by the tutor"
- **New Availability**: "Your favorite tutor has new slots available"

### **Business Notifications:**
- **Promotional Offers**: "20% off your next booking - use code SAVE20"
- **Loyalty Rewards**: "You've earned 100 points! Redeem for $10 off"
- **Seasonal Campaigns**: "Back to school special - book 5 sessions, get 1 free"

### **Learning Notifications:**
- **Study Reminders**: "Don't forget your math session tomorrow"
- **Progress Updates**: "You've completed 10 sessions this month!"
- **Goal Reminders**: "You're 2 sessions away from your monthly goal"

## 3. Support Ticket System - Real Scenarios

Here are actual scenarios where students would need support tickets:

### **Technical Issues:**
- "I can't join my Zoom meeting - the link isn't working"
- "My payment was charged twice but I only booked one session"
- "The calendar is showing wrong times for my timezone"
- "I can't upload my homework files for the session"

### **Booking Problems:**
- "I need to reschedule but it's less than 2 hours before my session"
- "The tutor cancelled last minute and I need a refund"
- "I booked the wrong course and need to change it"
- "My session disappeared from my dashboard"

### **Account Issues:**
- "I forgot my password and the reset email isn't working"
- "My email address changed and I can't access my account"
- "I want to delete my account and all my data"
- "I need to change my billing address for tax purposes"

### **Learning Concerns:**
- "My tutor isn't showing up to sessions"
- "The tutor's teaching style doesn't match my learning needs"
- "I need to switch to a different tutor for this course"
- "I'm not satisfied with the quality of instruction"

### **Billing Questions:**
- "Why was I charged $150 when the session was only $75?"
- "I need a receipt for my tax return"
- "My credit card expired, how do I update it?"
- "I want to dispute a charge"

## 4. Relevant Learning Statistics

Here are the most valuable learning statistics for students:

### **Progress Tracking:**
- **Total Learning Hours**: "You've completed 45 hours of tutoring"
- **Sessions Completed**: "You've had 30 successful sessions"
- **Courses Taken**: "You've studied 3 different subjects"
- **Tutors Worked With**: "You've learned from 5 different tutors"

### **Time-Based Analytics:**
- **Weekly/Monthly Activity**: "You've had 4 sessions this month"
- **Learning Streak**: "You've had sessions for 6 weeks in a row"
- **Peak Learning Times**: "You're most active on Tuesday evenings"
- **Session Duration Trends**: "You prefer 90-minute sessions"

### **Performance Metrics:**
- **Completion Rate**: "You've completed 95% of your booked sessions"
- **Cancellation Rate**: "You've cancelled 2 out of 30 sessions"
- **Favorite Subjects**: "Math is your most-booked subject (60%)"
- **Preferred Tutors**: "You book with Marie 80% of the time"

### **Financial Insights:**
- **Total Spent**: "You've invested $1,200 in your education"
- **Average Session Cost**: "Your average session costs $40"
- **Monthly Spending**: "You spend $200/month on tutoring"
- **Savings from Coupons**: "You've saved $150 with promotional codes"

## 5. Recurring Sessions Implementation

Here's how I envision recurring sessions working:

### **User Interface:**
```
"Book Recurring Session"
├── Select Course & Tutor
├── Choose Duration (60/90/120 min)
├── Pick Start Date & Time
├── Select Frequency:
│   ├── Weekly (same day/time)
│   ├── Bi-weekly (every 2 weeks)
│   └── Monthly (same date each month)
├── Set End Date:
│   ├── After X sessions (e.g., 10 sessions)
│   ├── Until specific date
│   └── Ongoing (no end date)
└── Review & Confirm
```

### **Database Schema:**
```prisma
model RecurringSession {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  tutorId       String   @map("tutor_id")
  courseId      String   @map("course_id")
  startDate     DateTime @map("start_date")
  endDate       DateTime? @map("end_date")
  frequency     String   // "weekly", "biweekly", "monthly"
  durationMin   Int      @map("duration_min")
  maxSessions   Int?     @map("max_sessions")
  sessionsCreated Int    @default(0) @map("sessions_created")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  
  // Relations
  user    User    @relation(fields: [userId], references: [id])
  tutor   Tutor   @relation(fields: [tutorId], references: [id])
  course  Course  @relation(fields: [courseId], references: [id])
  appointments Appointment[]
}
```

### **Implementation Logic:**
```typescript
// Create recurring sessions
export async function createRecurringSessions(recurringSessionId: string) {
  const recurring = await prisma.recurringSession.findUnique({
    where: { id: recurringSessionId }
  });
  
  const sessions = [];
  let currentDate = new Date(recurring.startDate);
  
  while (shouldCreateSession(currentDate, recurring)) {
    // Check tutor availability
    const isAvailable = await checkTutorAvailability(
      recurring.tutorId, 
      currentDate, 
      recurring.durationMin
    );
    
    if (isAvailable) {
      // Create individual appointment
      const appointment = await createAppointment({
        userId: recurring.userId,
        tutorId: recurring.tutorId,
        courseId: recurring.courseId,
        startDatetime: currentDate,
        durationMin: recurring.durationMin,
        isRecurring: true,
        recurringSessionId: recurring.id
      });
      
      sessions.push(appointment);
    }
    
    // Move to next occurrence
    currentDate = getNextOccurrence(currentDate, recurring.frequency);
  }
  
  return sessions;
}
```

### **User Experience:**
1. **Booking**: Student sets up recurring pattern once
2. **Automatic Creation**: System creates individual sessions based on pattern
3. **Flexibility**: Student can cancel/modify individual sessions
4. **Management**: Dashboard shows recurring pattern + individual sessions
5. **Pause/Resume**: Student can pause recurring sessions temporarily

### **Business Benefits:**
- **Predictable Revenue**: Regular recurring income
- **Student Retention**: Easier for students to maintain learning routine
- **Reduced Booking Friction**: One-time setup vs. multiple bookings
- **Tutor Planning**: Tutors can better plan their schedules

Would you like me to elaborate on any of these implementations or help you start building any of these features?


```typescript
// Save a payment method
const setupIntent = await stripe.setupIntents.create({
  customer: user.stripeCustomerId,
  payment_method_types: ['card'],
});

// Use saved payment method for future payments
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // $50.00 CAD
  currency: 'cad',
  customer: user.stripeCustomerId,
  payment_method: savedPaymentMethodId,
  confirm: true,
});
```

```plaintext
model User {
  // ... existing fields
  stripeCustomerId String? @map("stripe_customer_id")
  defaultPaymentMethodId String? @map("default_payment_method_id")
}
```

```plaintext
"Book Recurring Session"
├── Select Course & Tutor
├── Choose Duration (60/90/120 min)
├── Pick Start Date & Time
├── Select Frequency:
│   ├── Weekly (same day/time)
│   ├── Bi-weekly (every 2 weeks)
│   └── Monthly (same date each month)
├── Set End Date:
│   ├── After X sessions (e.g., 10 sessions)
│   ├── Until specific date
│   └── Ongoing (no end date)
└── Review & Confirm
```

```plaintext
model RecurringSession {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  tutorId       String   @map("tutor_id")
  courseId      String   @map("course_id")
  startDate     DateTime @map("start_date")
  endDate       DateTime? @map("end_date")
  frequency     String   // "weekly", "biweekly", "monthly"
  durationMin   Int      @map("duration_min")
  maxSessions   Int?     @map("max_sessions")
  sessionsCreated Int    @default(0) @map("sessions_created")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  
  // Relations
  user    User    @relation(fields: [userId], references: [id])
  tutor   Tutor   @relation(fields: [tutorId], references: [id])
  course  Course  @relation(fields: [courseId], references: [id])
  appointments Appointment[]
}
```

```typescript
// Create recurring sessions
export async function createRecurringSessions(recurringSessionId: string) {
  const recurring = await prisma.recurringSession.findUnique({
    where: { id: recurringSessionId }
  });
  
  const sessions = [];
  let currentDate = new Date(recurring.startDate);
  
  while (shouldCreateSession(currentDate, recurring)) {
    // Check tutor availability
    const isAvailable = await checkTutorAvailability(
      recurring.tutorId, 
      currentDate, 
      recurring.durationMin
    );
    
    if (isAvailable) {
      // Create individual appointment
      const appointment = await createAppointment({
        userId: recurring.userId,
        tutorId: recurring.tutorId,
        courseId: recurring.courseId,
        startDatetime: currentDate,
        durationMin: recurring.durationMin,
        isRecurring: true,
        recurringSessionId: recurring.id
      });
      
      sessions.push(appointment);
    }
    
    // Move to next occurrence
    currentDate = getNextOccurrence(currentDate, recurring.frequency);
  }
  
  return sessions;
}
```

---

**User**

Ok so here is my final tutor dashboard features I want implemented. 
Student info (name, email, etc.)
Past appointments listing
Future appointments (change, cancel, message tutors)
Change Password functionality
Direct messaging with tutors
Payment methods management
Book additionnal sessions
Book Recurring sessions (weekly, bi-weekly, for X sessions)
Support ticket system
File upload/download in appointment
See the meeting link (zoom, teams, etc)

Before implementing anything, lets move on to tutor dashboard. here are the features i would like. Again, please suggest others from a business perspective.
- see appoinments
- modify or cancel appointments
- send message to student
- Add a meeting link (zoom, teams, etc)
- Set availabilities (default week with possibility to overide with specific availabilities )
- Possibility to set yourself not available
- see hourly rate
- See your evaluation score
- See your courses with possibility to add new courses given (from database list of course)


---

**Cursor**

Let me first examine the current tutor dashboard implementation and then provide comprehensive suggestions for additional features from a business perspective.


Now let me create a comprehensive roadmap for the tutor dashboard with additional business-focused features:


## Current Tutor Dashboard Features ✅

Based on your current implementation, you have:

1. **Overview Tab**: Stats (today's appointments, upcoming appointments, hourly rate)
2. **Profile Info**: Display name, bio, courses taught, status
3. **Today's Appointments**: List of today's sessions
4. **Availability Tab**: View recurring availability rules (basic UI)
5. **Appointments Tab**: List all scheduled appointments

## Your Requested Features ✅

Your list covers the essentials:
- See appointments ✅ (partially implemented)
- Modify or cancel appointments
- Send message to student
- Add meeting link (zoom, teams, etc)
- Set availabilities (default week with overrides)
- Set yourself not available
- See hourly rate ✅ (implemented)
- See evaluation score
- See courses with possibility to add new courses

## Additional Features from Business Perspective

### 💰 **Financial Management & Analytics**
- **Earnings Dashboard**
  - Weekly/monthly earnings breakdown
  - Pending payments vs. completed payments
  - Tax reporting (T4A preparation)
  - Payment history and invoices
- **Rate Management**
  - Request rate increases
  - See rate history
  - Compare rates with other tutors
- **Performance Bonuses**
  - Track bonus eligibility
  - View incentive programs

### 📊 **Performance & Quality Metrics**
- **Student Ratings & Reviews**
  - Average rating display
  - Recent reviews and feedback
  - Rating trends over time
  - Response to negative reviews
- **Session Analytics**
  - Completion rate
  - Cancellation rate (by tutor vs. student)
  - No-show rate
  - Average session duration
- **Student Retention Metrics**
  - Repeat booking rate
  - Student lifetime value
  - Course completion rates

### 🎯 **Business Intelligence & Growth**
- **Demand Forecasting**
  - Peak booking times
  - Seasonal trends
  - Course popularity
- **Student Insights**
  - Most common student questions
  - Learning patterns
  - Preferred session types
- **Competitive Analysis**
  - Your ranking among tutors
  - Market positioning
  - Pricing recommendations

### 📚 **Professional Development**
- **Certification Tracking**
  - Required certifications
  - Expiration dates
  - Continuing education credits
- **Skill Assessment**
  - Subject matter expertise levels
  - Teaching effectiveness scores
- **Training Resources**
  - Access to teaching materials
  - Best practices guides
  - Professional development courses

### 🔧 **Operational Efficiency**
- **Calendar Integration**
  - Google Calendar sync
  - Outlook integration
  - Automatic conflict detection
- **Bulk Operations**
  - Mass availability updates
  - Bulk session rescheduling
  - Template-based availability
- **Automation Tools**
  - Auto-respond to common messages
  - Session preparation reminders
  - Follow-up message templates

### 📱 **Communication & Engagement**
- **Message Templates**
  - Pre-written responses for common scenarios
  - Session preparation messages
  - Follow-up templates
- **Student Notes System**
  - Private notes about students
  - Learning progress tracking
  - Session preparation notes
- **Announcement System**
  - Broadcast messages to all students
  - Course-specific announcements
  - Availability changes notifications

### 🛡️ **Compliance & Safety**
- **Background Check Status**
  - Verification status display
  - Renewal reminders
- **Code of Conduct**
  - Access to policies
  - Incident reporting
  - Safety guidelines
- **Data Privacy**
  - Student data handling guidelines
  - GDPR compliance tools

### 🎓 **Teaching Tools & Resources**
- **Resource Library**
  - Upload teaching materials
  - Share resources with students
  - Access to platform resources
- **Session Planning**
  - Pre-session preparation tools
  - Learning objective tracking
  - Progress assessment tools
- **Whiteboard Integration**
  - Digital whiteboard access
  - Session recording capabilities
  - Screen sharing tools

### 📈 **Growth & Marketing**
- **Profile Optimization**
  - SEO suggestions for profile
  - Photo and bio optimization
  - Specialization highlighting
- **Referral Program**
  - Track referral earnings
  - Share referral links
  - Referral performance metrics
- **Social Proof**
  - Student testimonials
  - Success stories
  - Achievement badges

## Priority Implementation Order

### **Phase 1 (Essential - High Business Value)**
1. **Modify/Cancel Appointments** - Core functionality
2. **Student Messaging System** - Communication essential
3. **Meeting Link Management** - Session delivery
4. **Availability Management** - Booking system core
5. **Evaluation Score Display** - Quality metrics

### **Phase 2 (High Business Impact)**
1. **Earnings Dashboard** - Financial transparency
2. **Student Ratings & Reviews** - Quality feedback
3. **Session Analytics** - Performance insights
4. **Calendar Integration** - Operational efficiency
5. **Student Notes System** - Teaching effectiveness

### **Phase 3 (Advanced Features)**
1. **Demand Forecasting** - Business intelligence
2. **Resource Library** - Teaching tools
3. **Bulk Operations** - Efficiency tools
4. **Professional Development** - Growth features
5. **Referral Program** - Growth marketing

## Database Schema Additions Needed

```prisma
// Tutor Performance & Ratings
model TutorRating {
  id        String   @id @default(uuid())
  tutorId   String   @map("tutor_id")
  studentId String   @map("student_id")
  appointmentId String @map("appointment_id")
  rating    Int      // 1-5 stars
  review    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  student     User        @relation(fields: [studentId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Earnings
model TutorEarning {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  appointmentId String   @map("appointment_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  status        String   // pending, paid, disputed
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Student Notes (Private to tutor)
model StudentNote {
  id        String   @id @default(uuid())
  tutorId   String   @map("tutor_id")
  studentId String   @map("student_id")
  note      String   @db.Text
  isPrivate Boolean  @default(true) @map("is_private")
  createdAt DateTime @default(now()) @map("created_at")
  
  tutor   Tutor @relation(fields: [tutorId], references: [id])
  student User  @relation(fields: [studentId], references: [id])
}

// Meeting Links
model MeetingLink {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  platform      String   // zoom, teams, google-meet, etc.
  meetingUrl    String   @map("meeting_url")
  meetingId     String?  @map("meeting_id")
  password      String?
  createdAt     DateTime @default(now()) @map("created_at")
  
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}
```

Would you like me to start implementing any of these features, beginning with the Phase 1 essentials?


```plaintext
// Tutor Performance & Ratings
model TutorRating {
  id        String   @id @default(uuid())
  tutorId   String   @map("tutor_id")
  studentId String   @map("student_id")
  appointmentId String @map("appointment_id")
  rating    Int      // 1-5 stars
  review    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  student     User        @relation(fields: [studentId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Earnings
model TutorEarning {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  appointmentId String   @map("appointment_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  status        String   // pending, paid, disputed
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Student Notes (Private to tutor)
model StudentNote {
  id        String   @id @default(uuid())
  tutorId   String   @map("tutor_id")
  studentId String   @map("student_id")
  note      String   @db.Text
  isPrivate Boolean  @default(true) @map("is_private")
  createdAt DateTime @default(now()) @map("created_at")
  
  tutor   Tutor @relation(fields: [tutorId], references: [id])
  student User  @relation(fields: [studentId], references: [id])
}

// Meeting Links
model MeetingLink {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  platform      String   // zoom, teams, google-meet, etc.
  meetingUrl    String   @map("meeting_url")
  meetingId     String?  @map("meeting_id")
  password      String?
  createdAt     DateTime @default(now()) @map("created_at")
  
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}
```

The roadmap above provides a comprehensive view of what you currently have in your tutor dashboard and what additional features would significantly enhance both the tutor experience and your business operations. The features are prioritized based on implementation complexity and business impact, helping you plan your development phases effectively.

---

**User**

So here are the final features for tutor dashboard. Some of the other features you proposed are good, but ill reserve it for later iterations.
- Overview Tab: Stats (today's appointments, upcoming appointments, hourly rate)
- Profile Info: Display name, bio, courses taught, status
- Today's Appointments: List of today's sessions
- Set availabilities (default week with overrides)
- Appointments Tab (modify or cancel appointments)
- send message to student
- Add a meeting link (zoom, teams, etc)
- Possibility to set yourself not available
- see hourly rate
- See your evaluation score
- See your courses with possibility to add new courses given (from database list of course)
- Earnings dashboard (monthly hours and earnings, current month vs completed payments)
- Training ressources with guides, SOPs and teaching materials

In order to keep track of the features, can you setup a md document that will serve as a plan and checklist while we develop these functions?
Lets now move on to the admin dashboard functionalities. First tell me what is implemented so far and then tell me what could be beneficial to add.

---

**Cursor**

I'll create a comprehensive markdown document to track the tutor dashboard features and then analyze the admin dashboard. Let me start by creating the tracking document and then examining the current admin dashboard implementation.


```markdown
# Tutor Dashboard Development Roadmap

## Overview
This document tracks the development progress of the tutor dashboard features for the 4AS Tutor Booking Application.

## Feature Checklist

### ✅ Completed Features
- [x] **Overview Tab**: Stats (today's appointments, upcoming appointments, hourly rate)
- [x] **Profile Info**: Display name, bio, courses taught, status
- [x] **Today's Appointments**: List of today's sessions
- [x] **Basic Availability Tab**: View recurring availability rules (UI only)

### 🚧 In Progress Features
- [ ] **Set Availabilities**: Default week with overrides
- [ ] **Appointments Tab**: Modify or cancel appointments
- [ ] **Student Messaging**: Send message to student
- [ ] **Meeting Links**: Add meeting link (zoom, teams, etc)
- [ ] **Availability Status**: Set yourself not available
- [ ] **Evaluation Score**: See your evaluation score
- [ ] **Course Management**: See courses with possibility to add new courses
- [ ] **Earnings Dashboard**: Monthly hours and earnings, current month vs completed payments
- [ ] **Training Resources**: Guides, SOPs and teaching materials

## Detailed Feature Specifications

### 1. Set Availabilities (Default Week with Overrides)
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

### 2. Appointments Tab (Modify or Cancel)
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

### 3. Student Messaging
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

### 4. Meeting Links Management
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

### 5. Availability Status Management
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

### 6. Evaluation Score Display
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

### 7. Course Management
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

### 8. Earnings Dashboard
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

### 9. Training Resources
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

## Implementation Phases

### Phase 1: Core Functionality (Weeks 1-2)
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging
4. Meeting Links Management

### Phase 2: Enhanced Features (Weeks 3-4)
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

### Phase 3: Additional Resources (Week 5)
1. Training Resources

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema
- [ ] Create database migrations
- [ ] Update RLS policies
- [ ] Test data integrity

### API Endpoints
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints

### UI/UX Components
- [ ] Responsive design for mobile
- [ ] Accessibility compliance
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Success/error notifications

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing

## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required
- Mobile-first responsive design
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies)
- Add comprehensive logging for debugging

## Last Updated
Created: [Current Date]  
Last Modified: [Current Date]
```

Now let me analyze the current admin dashboard implementation:


Perfect! I've created the `TUTOR_DASHBOARD_ROADMAP.md` document to track your tutor dashboard features. Now let me analyze the current admin dashboard implementation and suggest additional features.

## Current Admin Dashboard Implementation ✅

### **What's Currently Implemented:**

1. **Overview Tab**:
   - Stats cards (active courses, active tutors, active coupons, total revenue)
   - Recent appointments list
   - Recent orders list

2. **Courses Tab**:
   - View all courses with basic info
   - Course status (active/inactive)
   - Basic CRUD buttons (Create, Edit, Delete) - UI only

3. **Tutors Tab**:
   - **Fully functional tutor management system**
   - View all tutors with detailed information
   - Create new tutor accounts (complete workflow)
   - Deactivate tutors
   - View tutor profiles, courses, availability
   - Contact information display

4. **Coupons Tab**:
   - View all coupons with details
   - Coupon usage tracking
   - Basic CRUD buttons (Create, Edit, Delete) - UI only

5. **Appointments Tab**:
   - View all appointments
   - Basic appointment details
   - Status tracking

6. **Orders Tab**:
   - View all orders
   - Order details and status
   - Revenue tracking

### **What's Missing (UI Only - No Backend)**:
- Course creation/editing functionality
- Coupon creation/editing functionality
- Appointment management actions
- Order management actions

## Additional Admin Features from Business Perspective

### 🎯 **High Priority Business Features**

#### **1. Financial Management & Analytics**
- **Revenue Analytics Dashboard**
  - Daily/weekly/monthly revenue trends
  - Revenue by tutor, course, or student
  - Payment success/failure rates
  - Refund tracking and management
- **Financial Reporting**
  - Export financial data for accounting
  - Tax reporting preparation
  - Tutor payment tracking
  - Commission calculations

#### **2. User Management & Support**
- **Student Management**
  - View all students with detailed profiles
  - Student activity tracking
  - Account status management (active/suspended)
  - Student support ticket management
- **User Communication**
  - Send announcements to all users
  - Email templates for common scenarios
  - Bulk messaging capabilities
  - User notification management

#### **3. System Monitoring & Health**
- **Platform Health Dashboard**
  - System uptime monitoring
  - Error rate tracking
  - Performance metrics
  - Database health status
- **Webhook Monitoring**
  - Webhook delivery status
  - Failed webhook retry management
  - Integration health checks

### 🔧 **Operational Management Features**

#### **4. Advanced Course Management**
- **Course Analytics**
  - Popularity metrics
  - Completion rates
  - Student satisfaction scores
- **Course Content Management**
  - Upload course materials
  - Course prerequisites
  - Course categories and tags

#### **5. Advanced Tutor Management**
- **Tutor Performance Analytics**
  - Session completion rates
  - Student ratings and reviews
  - Earnings tracking
  - Availability utilization
- **Tutor Onboarding**
  - Background check status
  - Certification tracking
  - Training completion status
  - Approval workflow

#### **6. Advanced Appointment Management**
- **Appointment Analytics**
  - Booking patterns
  - Cancellation analysis
  - Peak time identification
- **Appointment Actions**
  - Bulk rescheduling
  - Emergency cancellations
  - Conflict resolution
  - Waitlist management

### 📊 **Business Intelligence Features**

#### **7. Advanced Analytics & Reporting**
- **Business Intelligence Dashboard**
  - Key performance indicators (KPIs)
  - Growth metrics
  - Market analysis
  - Competitive insights
- **Custom Reports**
  - Generate custom reports
  - Scheduled report delivery
  - Data export capabilities
  - Visual analytics

#### **8. Marketing & Promotion Management**
- **Campaign Management**
  - Marketing campaign tracking
  - A/B testing for promotions
  - Conversion rate analysis
- **Advanced Coupon Management**
  - Coupon performance analytics
  - Targeted promotions
  - Seasonal campaign management

### 🛡️ **Security & Compliance Features**

#### **9. Security Management**
- **User Security**
  - Login attempt monitoring
  - Suspicious activity detection
  - Account lockout management
- **Data Privacy**
  - GDPR compliance tools
  - Data export/deletion requests
  - Privacy policy management

#### **10. System Configuration**
- **Platform Settings**
  - Global configuration management
  - Feature flags
  - System maintenance mode
- **Integration Management**
  - Third-party service status
  - API key management
  - Webhook configuration

## Priority Implementation Order

### **Phase 1: Essential Business Operations (Weeks 1-2)**
1. **Complete Course Management** - Full CRUD operations
2. **Complete Coupon Management** - Full CRUD operations
3. **Student Management Dashboard** - View and manage students
4. **Financial Analytics** - Revenue tracking and reporting

### **Phase 2: Advanced Management (Weeks 3-4)**
1. **Tutor Performance Analytics** - Ratings, earnings, performance
2. **Appointment Management Actions** - Bulk operations, conflict resolution
3. **User Communication System** - Announcements, messaging
4. **System Health Monitoring** - Uptime, errors, performance

### **Phase 3: Business Intelligence (Weeks 5-6)**
1. **Advanced Analytics Dashboard** - KPIs, trends, insights
2. **Custom Reporting System** - Generate and export reports
3. **Marketing Campaign Management** - Promotions, A/B testing
4. **Security & Compliance Tools** - Monitoring, GDPR compliance

Would you like me to create a similar roadmap document for the admin dashboard features, or would you prefer to start implementing any of these features?


The analysis above shows that your admin dashboard has a solid foundation with the tutor management system being fully functional, while other areas need backend implementation to match the UI. The additional features I've suggested focus on business-critical operations that would significantly enhance your platform's management capabilities and provide valuable insights for business growth.

---

**User**

allright to here are the admin dashboard features I want for now:
Overview Tab:
- Stats cards (active courses, active tutors, active coupons, this month revenue last month revenue)
- Unanswered support tickets list
- Recent orders list
Courses Tab:
- View all courses with basic info
- Course status (active/inactive)
- Upload course materials
- Functional CRUD buttons (Create, Edit, Delete) - (each course has: full name, slug, sigle, institution, description, rate, active) note that the rate used here is what the student pay and is not the same as the tutor hourly rate which is lower.
Tutors Tab:
- Fully functional tutor management system
- View all tutors with detailed information
- Create new tutor accounts (complete workflow)
- Deactivate tutors
- View tutor profiles, courses, availability
- Contact information display and edit
- Edit tutor hourly rate
- Edit tutor ratings and reviews
- View Availibility utilisation
- View tutor earnings (current, historical)
- edit payment status (mark monthly invoice as paid with confirmation number input)
Coupons Tab:
- View all coupons with details
- Coupon usage tracking
- Functional CRUD buttons (Create, Edit, Delete)
Appointments Tab:
- View all appointments
- Basic appointment details
- Status tracking
Orders Tab:
- View all orders
- Order details and status
- Refund an order (and cancel corresponding appointment(s))
Revenue tab
- yearly revenue
- monthly revenue
- revenue by course (cummulative)
- revenue by tutor (cummulative)
- Refunds tracking (from stripe)
- tutor payment tracking
Student Management
- View all students with detailed profiles
- Student activity tracking
- Account status management (active/suspended)
- Student support ticket management
------------------------------
Instead of the @TUTOR_DASHBOARD_ROADMAP.md I want to include all the features that are yet to be implemented and tested including the student dashboard which we discussed before, the tutor dashboard and the admin dashboard features above. We will also add other features and modification to the app to that document which will serve as our general roadmap. Please make the adjustements to the md doc

---

**Cursor**

I'll update the roadmap document to include all the features for student dashboard, tutor dashboard, and admin dashboard that need to be implemented and tested. Let me create a comprehensive roadmap that covers all three dashboards.


```markdown
# 4AS Tutor Booking Application - Complete Development Roadmap

## Overview
This document tracks the development progress of all dashboard features for the 4AS Tutor Booking Application, including Student Dashboard, Tutor Dashboard, and Admin Dashboard.

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
- [ ] **Enhanced Profile Management**: Change password, update profile info
- [ ] **Reservation Management**: Cancel, modify, reschedule appointments
- [ ] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [ ] **Payment Methods**: Manage saved credit cards
- [ ] **Recurring Sessions**: Book weekly/bi-weekly sessions
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

### 1. Set Availabilities (Default Week with Overrides)
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

### 2. Appointments Tab (Modify or Cancel)
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

### 3. Student Messaging
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

### 4. Meeting Links Management
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

### 5. Availability Status Management
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

### 6. Evaluation Score Display
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

### 7. Course Management
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

### 8. Earnings Dashboard
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

### 9. Training Resources
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

## Implementation Phases

### Phase 1: Core Functionality (Weeks 1-2)
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging
4. Meeting Links Management

### Phase 2: Enhanced Features (Weeks 3-4)
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

### Phase 3: Additional Resources (Week 5)
1. Training Resources

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema
- [ ] Create database migrations
- [ ] Update RLS policies
- [ ] Test data integrity

### API Endpoints
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints

### UI/UX Components
- [ ] Responsive design for mobile
- [ ] Accessibility compliance
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Success/error notifications

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing

## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required
- Mobile-first responsive design
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies)
- Add comprehensive logging for debugging

## Last Updated
Created: [Current Date]  
Last Modified: [Current Date]

```

Now let me continue updating the document with the detailed specifications for all dashboards:


```markdown
# 4AS Tutor Booking Application - Complete Development Roadmap

## Overview
This document tracks the development progress of all dashboard features for the 4AS Tutor Booking Application, including Student Dashboard, Tutor Dashboard, and Admin Dashboard.

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
- [ ] **Enhanced Profile Management**: Change password, update profile info
- [ ] **Reservation Management**: Cancel, modify, reschedule appointments
- [ ] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [ ] **Payment Methods**: Manage saved credit cards
- [ ] **Recurring Sessions**: Book weekly/bi-weekly sessions
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
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their profile information and security settings.

**Requirements**:
- [ ] Change password functionality
- [ ] Update profile information (name, email, phone)
- [ ] Profile picture upload
- [ ] Account security settings
- [ ] Two-factor authentication setup

**Database Changes**:
- [ ] Enhance `User` model with additional fields
- [ ] Add profile picture storage
- [ ] Add 2FA settings

**UI Components**:
- [ ] Profile settings form
- [ ] Password change form
- [ ] Security settings panel
- [ ] Profile picture uploader

### 2. Reservation Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their appointments (cancel, modify, reschedule).

**Requirements**:
- [ ] Cancel appointment functionality
- [ ] Reschedule appointment functionality
- [ ] Appointment modification (duration, tutor)
- [ ] Cancellation policy enforcement
- [ ] Rescheduling validation
- [ ] Notification system for changes

**Database Changes**:
- [ ] Enhance `Appointment` model with student actions
- [ ] Add appointment modification tracking
- [ ] Add cancellation reason tracking

**UI Components**:
- [ ] Appointment management interface
- [ ] Cancel appointment modal
- [ ] Reschedule appointment form
- [ ] Appointment modification form

### 3. Student Messaging System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Direct messaging system between students and tutors.

**Requirements**:
- [ ] Send messages to tutors
- [ ] View message history
- [ ] Message notifications
- [ ] File attachments
- [ ] Message status tracking
- [ ] Message templates

**Database Changes**:
- [ ] Create `Message` model
- [ ] Create `MessageAttachment` model
- [ ] Create `MessageTemplate` model

**UI Components**:
- [ ] Message composer
- [ ] Message thread view
- [ ] File upload component
- [ ] Message notifications

### 4. Payment Methods Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Manage saved payment methods for easy booking.

**Requirements**:
- [ ] Save credit card information (via Stripe)
- [ ] Manage saved payment methods
- [ ] Set default payment method
- [ ] Payment method validation
- [ ] Secure payment method storage

**Database Changes**:
- [ ] Add `stripeCustomerId` to `User` model
- [ ] Add `defaultPaymentMethodId` to `User` model

**UI Components**:
- [ ] Payment methods list
- [ ] Add payment method form
- [ ] Payment method management interface

### 5. Recurring Sessions Booking
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow students to book recurring sessions.

**Requirements**:
- [ ] Set up recurring session patterns
- [ ] Weekly/bi-weekly booking options
- [ ] Manage recurring sessions
- [ ] Automatic session creation
- [ ] Recurring session modifications

**Database Changes**:
- [ ] Create `RecurringSession` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Recurring session setup form
- [ ] Recurring session management
- [ ] Pattern selection interface

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

### 7. File Management for Appointments
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Upload and download files related to appointments.

**Requirements**:
- [ ] Upload files before sessions
- [ ] Download tutor-provided materials
- [ ] File organization by appointment
- [ ] File type validation
- [ ] File size limits

**Database Changes**:
- [ ] Create `AppointmentFile` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] File upload interface
- [ ] File download interface
- [ ] File management panel

# TUTOR DASHBOARD FEATURES

### 8. Set Availabilities (Default Week with Overrides)
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

### 2. Appointments Tab (Modify or Cancel)
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

### 3. Student Messaging
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

### 4. Meeting Links Management
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

### 5. Availability Status Management
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

### 6. Evaluation Score Display
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

### 7. Course Management
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

### 8. Earnings Dashboard
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

### 9. Training Resources
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

## Implementation Phases

### Phase 1: Core Functionality (Weeks 1-2)
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging
4. Meeting Links Management

### Phase 2: Enhanced Features (Weeks 3-4)
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

### Phase 3: Additional Resources (Week 5)
1. Training Resources

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema
- [ ] Create database migrations
- [ ] Update RLS policies
- [ ] Test data integrity

### API Endpoints
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints

### UI/UX Components
- [ ] Responsive design for mobile
- [ ] Accessibility compliance
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Success/error notifications

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing

## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required
- Mobile-first responsive design
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies)
- Add comprehensive logging for debugging

## Last Updated
Created: [Current Date]  
Last Modified: [Current Date]

```

Now let me continue with the rest of the tutor dashboard features and add the admin dashboard features:


```markdown
# 4AS Tutor Booking Application - Complete Development Roadmap

## Overview
This document tracks the development progress of all dashboard features for the 4AS Tutor Booking Application, including Student Dashboard, Tutor Dashboard, and Admin Dashboard.

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
- [ ] **Enhanced Profile Management**: Change password, update profile info
- [ ] **Reservation Management**: Cancel, modify, reschedule appointments
- [ ] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [ ] **Payment Methods**: Manage saved credit cards
- [ ] **Recurring Sessions**: Book weekly/bi-weekly sessions
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
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their profile information and security settings.

**Requirements**:
- [ ] Change password functionality
- [ ] Update profile information (name, email, phone)
- [ ] Profile picture upload
- [ ] Account security settings
- [ ] Two-factor authentication setup

**Database Changes**:
- [ ] Enhance `User` model with additional fields
- [ ] Add profile picture storage
- [ ] Add 2FA settings

**UI Components**:
- [ ] Profile settings form
- [ ] Password change form
- [ ] Security settings panel
- [ ] Profile picture uploader

### 2. Reservation Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their appointments (cancel, modify, reschedule).

**Requirements**:
- [ ] Cancel appointment functionality
- [ ] Reschedule appointment functionality
- [ ] Appointment modification (duration, tutor)
- [ ] Cancellation policy enforcement
- [ ] Rescheduling validation
- [ ] Notification system for changes

**Database Changes**:
- [ ] Enhance `Appointment` model with student actions
- [ ] Add appointment modification tracking
- [ ] Add cancellation reason tracking

**UI Components**:
- [ ] Appointment management interface
- [ ] Cancel appointment modal
- [ ] Reschedule appointment form
- [ ] Appointment modification form

### 3. Student Messaging System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Direct messaging system between students and tutors.

**Requirements**:
- [ ] Send messages to tutors
- [ ] View message history
- [ ] Message notifications
- [ ] File attachments
- [ ] Message status tracking
- [ ] Message templates

**Database Changes**:
- [ ] Create `Message` model
- [ ] Create `MessageAttachment` model
- [ ] Create `MessageTemplate` model

**UI Components**:
- [ ] Message composer
- [ ] Message thread view
- [ ] File upload component
- [ ] Message notifications

### 4. Payment Methods Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Manage saved payment methods for easy booking.

**Requirements**:
- [ ] Save credit card information (via Stripe)
- [ ] Manage saved payment methods
- [ ] Set default payment method
- [ ] Payment method validation
- [ ] Secure payment method storage

**Database Changes**:
- [ ] Add `stripeCustomerId` to `User` model
- [ ] Add `defaultPaymentMethodId` to `User` model

**UI Components**:
- [ ] Payment methods list
- [ ] Add payment method form
- [ ] Payment method management interface

### 5. Recurring Sessions Booking
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow students to book recurring sessions.

**Requirements**:
- [ ] Set up recurring session patterns
- [ ] Weekly/bi-weekly booking options
- [ ] Manage recurring sessions
- [ ] Automatic session creation
- [ ] Recurring session modifications

**Database Changes**:
- [ ] Create `RecurringSession` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Recurring session setup form
- [ ] Recurring session management
- [ ] Pattern selection interface

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

### 7. File Management for Appointments
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Upload and download files related to appointments.

**Requirements**:
- [ ] Upload files before sessions
- [ ] Download tutor-provided materials
- [ ] File organization by appointment
- [ ] File type validation
- [ ] File size limits

**Database Changes**:
- [ ] Create `AppointmentFile` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] File upload interface
- [ ] File download interface
- [ ] File management panel

# TUTOR DASHBOARD FEATURES

### 8. Set Availabilities (Default Week with Overrides)
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

### 9. Appointments Tab (Modify or Cancel)
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

### 10. Student Messaging System
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

### 11. Meeting Links Management
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

### 12. Availability Status Management
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

### 13. Evaluation Score Display
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

### 14. Course Management
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

### 15. Earnings Dashboard
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

### 16. Training Resources
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

# ADMIN DASHBOARD FEATURES

### 17. Enhanced Overview Tab
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

### 18. Course Management System
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

### 19. Enhanced Tutor Management
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

### 20. Coupon Management System
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

### 21. Appointment Management System
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

### 22. Order Management System
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

### 23. Revenue Analytics Dashboard
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

### 24. Student Management System
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

### 25. Support System Management
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

### 3. Student Messaging
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

### 4. Meeting Links Management
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

### 5. Availability Status Management
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

### 6. Evaluation Score Display
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

### 7. Course Management
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

### 8. Earnings Dashboard
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

### 9. Training Resources
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

## Implementation Phases

### Phase 1: Core Functionality (Weeks 1-2)
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging
4. Meeting Links Management

### Phase 2: Enhanced Features (Weeks 3-4)
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

### Phase 3: Additional Resources (Week 5)
1. Training Resources

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema
- [ ] Create database migrations
- [ ] Update RLS policies
- [ ] Test data integrity

### API Endpoints
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints

### UI/UX Components
- [ ] Responsive design for mobile
- [ ] Accessibility compliance
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Success/error notifications

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing

## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required
- Mobile-first responsive design
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies)
- Add comprehensive logging for debugging

## Last Updated
Created: [Current Date]  
Last Modified: [Current Date]

```

Now let me update the implementation phases and add the database schema requirements:


```markdown
# 4AS Tutor Booking Application - Complete Development Roadmap

## Overview
This document tracks the development progress of all dashboard features for the 4AS Tutor Booking Application, including Student Dashboard, Tutor Dashboard, and Admin Dashboard.

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
- [ ] **Enhanced Profile Management**: Change password, update profile info
- [ ] **Reservation Management**: Cancel, modify, reschedule appointments
- [ ] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [ ] **Payment Methods**: Manage saved credit cards
- [ ] **Recurring Sessions**: Book weekly/bi-weekly sessions
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
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their profile information and security settings.

**Requirements**:
- [ ] Change password functionality
- [ ] Update profile information (name, email, phone)
- [ ] Profile picture upload
- [ ] Account security settings
- [ ] Two-factor authentication setup

**Database Changes**:
- [ ] Enhance `User` model with additional fields
- [ ] Add profile picture storage
- [ ] Add 2FA settings

**UI Components**:
- [ ] Profile settings form
- [ ] Password change form
- [ ] Security settings panel
- [ ] Profile picture uploader

### 2. Reservation Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their appointments (cancel, modify, reschedule).

**Requirements**:
- [ ] Cancel appointment functionality
- [ ] Reschedule appointment functionality
- [ ] Appointment modification (duration, tutor)
- [ ] Cancellation policy enforcement
- [ ] Rescheduling validation
- [ ] Notification system for changes

**Database Changes**:
- [ ] Enhance `Appointment` model with student actions
- [ ] Add appointment modification tracking
- [ ] Add cancellation reason tracking

**UI Components**:
- [ ] Appointment management interface
- [ ] Cancel appointment modal
- [ ] Reschedule appointment form
- [ ] Appointment modification form

### 3. Student Messaging System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Direct messaging system between students and tutors.

**Requirements**:
- [ ] Send messages to tutors
- [ ] View message history
- [ ] Message notifications
- [ ] File attachments
- [ ] Message status tracking
- [ ] Message templates

**Database Changes**:
- [ ] Create `Message` model
- [ ] Create `MessageAttachment` model
- [ ] Create `MessageTemplate` model

**UI Components**:
- [ ] Message composer
- [ ] Message thread view
- [ ] File upload component
- [ ] Message notifications

### 4. Payment Methods Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Manage saved payment methods for easy booking.

**Requirements**:
- [ ] Save credit card information (via Stripe)
- [ ] Manage saved payment methods
- [ ] Set default payment method
- [ ] Payment method validation
- [ ] Secure payment method storage

**Database Changes**:
- [ ] Add `stripeCustomerId` to `User` model
- [ ] Add `defaultPaymentMethodId` to `User` model

**UI Components**:
- [ ] Payment methods list
- [ ] Add payment method form
- [ ] Payment method management interface

### 5. Recurring Sessions Booking
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow students to book recurring sessions.

**Requirements**:
- [ ] Set up recurring session patterns
- [ ] Weekly/bi-weekly booking options
- [ ] Manage recurring sessions
- [ ] Automatic session creation
- [ ] Recurring session modifications

**Database Changes**:
- [ ] Create `RecurringSession` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Recurring session setup form
- [ ] Recurring session management
- [ ] Pattern selection interface

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

### 7. File Management for Appointments
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Upload and download files related to appointments.

**Requirements**:
- [ ] Upload files before sessions
- [ ] Download tutor-provided materials
- [ ] File organization by appointment
- [ ] File type validation
- [ ] File size limits

**Database Changes**:
- [ ] Create `AppointmentFile` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] File upload interface
- [ ] File download interface
- [ ] File management panel

# TUTOR DASHBOARD FEATURES

### 8. Set Availabilities (Default Week with Overrides)
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

### 9. Appointments Tab (Modify or Cancel)
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

### 10. Student Messaging System
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

### 11. Meeting Links Management
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

### 12. Availability Status Management
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

### 13. Evaluation Score Display
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

### 14. Course Management
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

### 15. Earnings Dashboard
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

### 16. Training Resources
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

# ADMIN DASHBOARD FEATURES

### 17. Enhanced Overview Tab
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

### 18. Course Management System
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

### 19. Enhanced Tutor Management
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

### 20. Coupon Management System
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

### 21. Appointment Management System
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

### 22. Order Management System
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

### 23. Revenue Analytics Dashboard
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

### 24. Student Management System
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

### 25. Support System Management
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

## Implementation Phases

### Phase 1: Core Student & Tutor Features (Weeks 1-3)
**Student Dashboard:**
1. Enhanced Profile Management
2. Reservation Management
3. Student Messaging System
4. Payment Methods Management

**Tutor Dashboard:**
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging System
4. Meeting Links Management

### Phase 2: Advanced Features (Weeks 4-6)
**Student Dashboard:**
1. Recurring Sessions Booking
2. Support Ticket System
3. File Management for Appointments

**Tutor Dashboard:**
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

**Admin Dashboard:**
1. Enhanced Overview Tab
2. Course Management System
3. Enhanced Tutor Management

### Phase 3: Admin & Analytics (Weeks 7-9)
**Admin Dashboard:**
1. Coupon Management System
2. Appointment Management System
3. Order Management System
4. Revenue Analytics Dashboard

### Phase 4: Support & Management (Weeks 10-11)
**Admin Dashboard:**
1. Student Management System
2. Support System Management

**Tutor Dashboard:**
1. Training Resources

## Database Schema Updates Required

### New Models to Create:
```prisma
// Messaging System
model Message {
  id        String   @id @default(uuid())
  senderId  String   @map("sender_id")
  receiverId String  @map("receiver_id")
  appointmentId String? @map("appointment_id")
  content   String   @db.Text
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")
  
  sender      User         @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User         @relation("ReceivedMessages", fields: [receiverId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  attachments MessageAttachment[]
}

model MessageAttachment {
  id        String   @id @default(uuid())
  messageId String   @map("message_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")
  
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

// Meeting Links
model MeetingLink {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  platform      String   // zoom, teams, google-meet, etc.
  meetingUrl    String   @map("meeting_url")
  meetingId     String?  @map("meeting_id")
  password      String?
  createdAt     DateTime @default(now()) @map("created_at")
  
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Ratings & Reviews
model TutorRating {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  studentId     String   @map("student_id")
  appointmentId String   @map("appointment_id")
  rating        Int      // 1-5 stars
  review        String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  student     User        @relation(fields: [studentId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Earnings & Payments
model TutorEarning {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  appointmentId String   @map("appointment_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  status        String   // pending, paid, disputed
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

model TutorPayment {
  id               String   @id @default(uuid())
  tutorId          String   @map("tutor_id")
  month            String   // YYYY-MM format
  totalEarnings    Decimal  @map("total_earnings") @db.Decimal(10, 2)
  status           String   // pending, paid, disputed
  confirmationNumber String? @map("confirmation_number")
  paidAt           DateTime? @map("paid_at")
  createdAt        DateTime @default(now()) @map("created_at")
  
  tutor Tutor @relation(fields: [tutorId], references: [id])
}

// Support Tickets
model SupportTicket {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  subject     String
  description String   @db.Text
  status      String   // open, in_progress, resolved, closed
  priority    String   // low, medium, high, urgent
  category    String
  assignedTo  String?  @map("assigned_to")
  resolvedAt  DateTime? @map("resolved_at")
  createdAt   DateTime @default(now()) @map("created_at")
  
  user       User                @relation(fields: [userId], references: [id])
  assigned   User?               @relation("AssignedTickets", fields: [assignedTo], references: [id])
  attachments TicketAttachment[]
}

model TicketAttachment {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")
  
  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
}

// Recurring Sessions
model RecurringSession {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  tutorId       String   @map("tutor_id")
  courseId      String   @map("course_id")
  startDate     DateTime @map("start_date")
  endDate       DateTime? @map("end_date")
  frequency     String   // weekly, biweekly, monthly
  durationMin   Int      @map("duration_min")
  maxSessions   Int?     @map("max_sessions")
  sessionsCreated Int    @default(0) @map("sessions_created")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  
  user    User    @relation(fields: [userId], references: [id])
  tutor   Tutor   @relation(fields: [tutorId], references: [id])
  course  Course  @relation(fields: [courseId], references: [id])
  appointments Appointment[]
}

// Course Materials
model CourseMaterial {
  id        String   @id @default(uuid())
  courseId  String   @map("course_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  fileType  String   @map("file_type")
  uploadedBy String  @map("uploaded_by")
  createdAt DateTime @default(now()) @map("created_at")
  
  course Course @relation(fields: [courseId], references: [id])
  uploader User @relation(fields: [uploadedBy], references: [id])
}

// Refunds
model Refund {
  id            String   @id @default(uuid())
  orderId       String   @map("order_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  reason        String
  status        String   // pending, processed, failed
  stripeRefundId String? @map("stripe_refund_id")
  processedAt   DateTime? @map("processed_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  order Order @relation(fields: [orderId], references: [id])
}

// Training Resources
model TrainingResource {
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  fileUrl     String   @map("file_url")
  fileType    String   @map("file_type")
  category    String
  tags        String[]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  
  downloads ResourceDownload[]
}

model ResourceDownload {
  id         String   @id @default(uuid())
  resourceId String   @map("resource_id")
  userId     String   @map("user_id")
  downloadedAt DateTime @default(now()) @map("downloaded_at")
  
  resource TrainingResource @relation(fields: [resourceId], references: [id])
  user     User             @relation(fields: [userId], references: [id])
}
```

### Models to Enhance:
```prisma
// Enhance User model
model User {
  // ... existing fields
  stripeCustomerId String? @map("stripe_customer_id")
  defaultPaymentMethodId String? @map("default_payment_method_id")
  profilePicture String? @map("profile_picture")
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  
  // ... existing relations
  sentMessages Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  assignedTickets SupportTicket[] @relation("AssignedTickets")
  recurringSessions RecurringSession[]
  resourceDownloads ResourceDownload[]
}

// Enhance Course model
model Course {
  // ... existing fields
  fullName String @map("full_name")
  sigle String
  institution String
  studentRateCad Decimal @map("student_rate_cad") @db.Decimal(10, 2)
  
  // ... existing relations
  materials CourseMaterial[]
  recurringSessions RecurringSession[]
}

// Enhance Tutor model
model Tutor {
  // ... existing fields
  availabilityStatus String @default("available") @map("availability_status")
  
  // ... existing relations
  ratings TutorRating[]
  earnings TutorEarning[]
  payments TutorPayment[]
  recurringSessions RecurringSession[]
}

// Enhance Appointment model
model Appointment {
  // ... existing fields
  meetingLink MeetingLink?
  rating TutorRating?
  earning TutorEarning?
  recurringSessionId String? @map("recurring_session_id")
  
  // ... existing relations
  messages Message[]
  recurringSession RecurringSession? @relation(fields: [recurringSessionId], references: [id])
}

// Enhance Order model
model Order {
  // ... existing fields
  
  // ... existing relations
  refunds Refund[]
}
```

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema
- [ ] Create database migrations
- [ ] Update RLS policies
- [ ] Test data integrity

### API Endpoints
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints

### UI/UX Components
- [ ] Responsive design for mobile
- [ ] Accessibility compliance
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Success/error notifications

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing

## Notes
- All features should be implemented with proper error handling
- French (Canada) localization required
- Mobile-first responsive design
- Follow existing code patterns and conventions
- Implement proper security measures (RLS policies)
- Add comprehensive logging for debugging

## Last Updated
Created: [Current Date]  
Last Modified: [Current Date]

```

Now let me complete the document with the technical requirements and testing sections:


```markdown
# 4AS Tutor Booking Application - Complete Development Roadmap

## Overview
This document tracks the development progress of all dashboard features for the 4AS Tutor Booking Application, including Student Dashboard, Tutor Dashboard, and Admin Dashboard.

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
- [ ] **Enhanced Profile Management**: Change password, update profile info
- [ ] **Reservation Management**: Cancel, modify, reschedule appointments
- [ ] **Student Messaging**: Send messages to tutors
- [ ] **Meeting Links**: Access to Zoom/Teams meeting links
- [ ] **Payment Methods**: Manage saved credit cards
- [ ] **Recurring Sessions**: Book weekly/bi-weekly sessions
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
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their profile information and security settings.

**Requirements**:
- [ ] Change password functionality
- [ ] Update profile information (name, email, phone)
- [ ] Profile picture upload
- [ ] Account security settings
- [ ] Two-factor authentication setup

**Database Changes**:
- [ ] Enhance `User` model with additional fields
- [ ] Add profile picture storage
- [ ] Add 2FA settings

**UI Components**:
- [ ] Profile settings form
- [ ] Password change form
- [ ] Security settings panel
- [ ] Profile picture uploader

### 2. Reservation Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Allow students to manage their appointments (cancel, modify, reschedule).

**Requirements**:
- [ ] Cancel appointment functionality
- [ ] Reschedule appointment functionality
- [ ] Appointment modification (duration, tutor)
- [ ] Cancellation policy enforcement
- [ ] Rescheduling validation
- [ ] Notification system for changes

**Database Changes**:
- [ ] Enhance `Appointment` model with student actions
- [ ] Add appointment modification tracking
- [ ] Add cancellation reason tracking

**UI Components**:
- [ ] Appointment management interface
- [ ] Cancel appointment modal
- [ ] Reschedule appointment form
- [ ] Appointment modification form

### 3. Student Messaging System
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Direct messaging system between students and tutors.

**Requirements**:
- [ ] Send messages to tutors
- [ ] View message history
- [ ] Message notifications
- [ ] File attachments
- [ ] Message status tracking
- [ ] Message templates

**Database Changes**:
- [ ] Create `Message` model
- [ ] Create `MessageAttachment` model
- [ ] Create `MessageTemplate` model

**UI Components**:
- [ ] Message composer
- [ ] Message thread view
- [ ] File upload component
- [ ] Message notifications

### 4. Payment Methods Management
**Status**: 🚧 In Progress  
**Priority**: High  
**Description**: Manage saved payment methods for easy booking.

**Requirements**:
- [ ] Save credit card information (via Stripe)
- [ ] Manage saved payment methods
- [ ] Set default payment method
- [ ] Payment method validation
- [ ] Secure payment method storage

**Database Changes**:
- [ ] Add `stripeCustomerId` to `User` model
- [ ] Add `defaultPaymentMethodId` to `User` model

**UI Components**:
- [ ] Payment methods list
- [ ] Add payment method form
- [ ] Payment method management interface

### 5. Recurring Sessions Booking
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Allow students to book recurring sessions.

**Requirements**:
- [ ] Set up recurring session patterns
- [ ] Weekly/bi-weekly booking options
- [ ] Manage recurring sessions
- [ ] Automatic session creation
- [ ] Recurring session modifications

**Database Changes**:
- [ ] Create `RecurringSession` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] Recurring session setup form
- [ ] Recurring session management
- [ ] Pattern selection interface

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

### 7. File Management for Appointments
**Status**: 🚧 In Progress  
**Priority**: Medium  
**Description**: Upload and download files related to appointments.

**Requirements**:
- [ ] Upload files before sessions
- [ ] Download tutor-provided materials
- [ ] File organization by appointment
- [ ] File type validation
- [ ] File size limits

**Database Changes**:
- [ ] Create `AppointmentFile` model
- [ ] Link to `Appointment` model

**UI Components**:
- [ ] File upload interface
- [ ] File download interface
- [ ] File management panel

# TUTOR DASHBOARD FEATURES

### 8. Set Availabilities (Default Week with Overrides)
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

### 9. Appointments Tab (Modify or Cancel)
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

### 10. Student Messaging System
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

### 11. Meeting Links Management
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

### 12. Availability Status Management
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

### 13. Evaluation Score Display
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

### 14. Course Management
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

### 15. Earnings Dashboard
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

### 16. Training Resources
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

# ADMIN DASHBOARD FEATURES

### 17. Enhanced Overview Tab
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

### 18. Course Management System
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

### 19. Enhanced Tutor Management
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

### 20. Coupon Management System
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

### 21. Appointment Management System
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

### 22. Order Management System
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

### 23. Revenue Analytics Dashboard
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

### 24. Student Management System
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

### 25. Support System Management
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

## Implementation Phases

### Phase 1: Core Student & Tutor Features (Weeks 1-3)
**Student Dashboard:**
1. Enhanced Profile Management
2. Reservation Management
3. Student Messaging System
4. Payment Methods Management

**Tutor Dashboard:**
1. Set Availabilities
2. Appointments Tab (Modify/Cancel)
3. Student Messaging System
4. Meeting Links Management

### Phase 2: Advanced Features (Weeks 4-6)
**Student Dashboard:**
1. Recurring Sessions Booking
2. Support Ticket System
3. File Management for Appointments

**Tutor Dashboard:**
1. Availability Status Management
2. Evaluation Score Display
3. Course Management
4. Earnings Dashboard

**Admin Dashboard:**
1. Enhanced Overview Tab
2. Course Management System
3. Enhanced Tutor Management

### Phase 3: Admin & Analytics (Weeks 7-9)
**Admin Dashboard:**
1. Coupon Management System
2. Appointment Management System
3. Order Management System
4. Revenue Analytics Dashboard

### Phase 4: Support & Management (Weeks 10-11)
**Admin Dashboard:**
1. Student Management System
2. Support System Management

**Tutor Dashboard:**
1. Training Resources

## Database Schema Updates Required

### New Models to Create:
```prisma
// Messaging System
model Message {
  id        String   @id @default(uuid())
  senderId  String   @map("sender_id")
  receiverId String  @map("receiver_id")
  appointmentId String? @map("appointment_id")
  content   String   @db.Text
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")
  
  sender      User         @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User         @relation("ReceivedMessages", fields: [receiverId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  attachments MessageAttachment[]
}

model MessageAttachment {
  id        String   @id @default(uuid())
  messageId String   @map("message_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")
  
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

// Meeting Links
model MeetingLink {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  platform      String   // zoom, teams, google-meet, etc.
  meetingUrl    String   @map("meeting_url")
  meetingId     String?  @map("meeting_id")
  password      String?
  createdAt     DateTime @default(now()) @map("created_at")
  
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Ratings & Reviews
model TutorRating {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  studentId     String   @map("student_id")
  appointmentId String   @map("appointment_id")
  rating        Int      // 1-5 stars
  review        String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  student     User        @relation(fields: [studentId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

// Tutor Earnings & Payments
model TutorEarning {
  id            String   @id @default(uuid())
  tutorId       String   @map("tutor_id")
  appointmentId String   @map("appointment_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  status        String   // pending, paid, disputed
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])
}

model TutorPayment {
  id               String   @id @default(uuid())
  tutorId          String   @map("tutor_id")
  month            String   // YYYY-MM format
  totalEarnings    Decimal  @map("total_earnings") @db.Decimal(10, 2)
  status           String   // pending, paid, disputed
  confirmationNumber String? @map("confirmation_number")
  paidAt           DateTime? @map("paid_at")
  createdAt        DateTime @default(now()) @map("created_at")
  
  tutor Tutor @relation(fields: [tutorId], references: [id])
}

// Support Tickets
model SupportTicket {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  subject     String
  description String   @db.Text
  status      String   // open, in_progress, resolved, closed
  priority    String   // low, medium, high, urgent
  category    String
  assignedTo  String?  @map("assigned_to")
  resolvedAt  DateTime? @map("resolved_at")
  createdAt   DateTime @default(now()) @map("created_at")
  
  user       User                @relation(fields: [userId], references: [id])
  assigned   User?               @relation("AssignedTickets", fields: [assignedTo], references: [id])
  attachments TicketAttachment[]
}

model TicketAttachment {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")
  
  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
}

// Recurring Sessions
model RecurringSession {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  tutorId       String   @map("tutor_id")
  courseId      String   @map("course_id")
  startDate     DateTime @map("start_date")
  endDate       DateTime? @map("end_date")
  frequency     String   // weekly, biweekly, monthly
  durationMin   Int      @map("duration_min")
  maxSessions   Int?     @map("max_sessions")
  sessionsCreated Int    @default(0) @map("sessions_created")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  
  user    User    @relation(fields: [userId], references: [id])
  tutor   Tutor   @relation(fields: [tutorId], references: [id])
  course  Course  @relation(fields: [courseId], references: [id])
  appointments Appointment[]
}

// Course Materials
model CourseMaterial {
  id        String   @id @default(uuid())
  courseId  String   @map("course_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  fileType  String   @map("file_type")
  uploadedBy String  @map("uploaded_by")
  createdAt DateTime @default(now()) @map("created_at")
  
  course Course @relation(fields: [courseId], references: [id])
  uploader User @relation(fields: [uploadedBy], references: [id])
}

// Refunds
model Refund {
  id            String   @id @default(uuid())
  orderId       String   @map("order_id")
  amountCad     Decimal  @map("amount_cad") @db.Decimal(10, 2)
  reason        String
  status        String   // pending, processed, failed
  stripeRefundId String? @map("stripe_refund_id")
  processedAt   DateTime? @map("processed_at")
  createdAt     DateTime @default(now()) @map("created_at")
  
  order Order @relation(fields: [orderId], references: [id])
}

// Training Resources
model TrainingResource {
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  fileUrl     String   @map("file_url")
  fileType    String   @map("file_type")
  category    String
  tags        String[]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  
  downloads ResourceDownload[]
}

model ResourceDownload {
  id         String   @id @default(uuid())
  resourceId String   @map("resource_id")
  userId     String   @map("user_id")
  downloadedAt DateTime @default(now()) @map("downloaded_at")
  
  resource TrainingResource @relation(fields: [resourceId], references: [id])
  user     User             @relation(fields: [userId], references: [id])
}
```

### Models to Enhance:
```prisma
// Enhance User model
model User {
  // ... existing fields
  stripeCustomerId String? @map("stripe_customer_id")
  defaultPaymentMethodId String? @map("default_payment_method_id")
  profilePicture String? @map("profile_picture")
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  
  // ... existing relations
  sentMessages Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  assignedTickets SupportTicket[] @relation("AssignedTickets")
  recurringSessions RecurringSession[]
  resourceDownloads ResourceDownload[]
}

// Enhance Course model
model Course {
  // ... existing fields
  fullName String @map("full_name")
  sigle String
  institution String
  studentRateCad Decimal @map("student_rate_cad") @db.Decimal(10, 2)
  
  // ... existing relations
  materials CourseMaterial[]
  recurringSessions RecurringSession[]
}

// Enhance Tutor model
model Tutor {
  // ... existing fields
  availabilityStatus String @default("available") @map("availability_status")
  
  // ... existing relations
  ratings TutorRating[]
  earnings TutorEarning[]
  payments TutorPayment[]
  recurringSessions RecurringSession[]
}

// Enhance Appointment model
model Appointment {
  // ... existing fields
  meetingLink MeetingLink?
  rating TutorRating?
  earning TutorEarning?
  recurringSessionId String? @map("recurring_session_id")
  
  // ... existing relations
  messages Message[]
  recurringSession RecurringSession? @relation(fields: [recurringSessionId], references: [id])
}

// Enhance Order model
model Order {
  // ... existing fields
  
  // ... existing relations
  refunds Refund[]
}
```

## Technical Requirements

### Database Schema Updates
- [ ] Update Prisma schema with all new models
- [ ] Create database migrations for all new tables
- [ ] Update RLS policies for new models
- [ ] Test data integrity and relationships
- [ ] Create database indexes for performance
- [ ] Set up foreign key constraints

### API Endpoints & Server Actions
**Student Dashboard:**
- [ ] Profile management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging system endpoints
- [ ] Payment methods management
- [ ] Recurring sessions endpoints
- [ ] Support ticket endpoints
- [ ] File upload/download endpoints

**Tutor Dashboard:**
- [ ] Availability management endpoints
- [ ] Appointment management endpoints
- [ ] Messaging system endpoints
- [ ] Meeting link endpoints
- [ ] Earnings calculation endpoints
- [ ] Rating and review endpoints
- [ ] Training resources endpoints

**Admin Dashboard:**
- [ ] Course management endpoints
- [ ] Enhanced tutor management endpoints
- [ ] Coupon management endpoints
- [ ] Order and refund endpoints
- [ ] Revenue analytics endpoints
- [ ] Student management endpoints
- [ ] Support system endpoints

### UI/UX Components
- [ ] Responsive design for mobile and tablet
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Loading states and error handling
- [ ] Form validation with real-time feedback
- [ ] Success/error notifications
- [ ] Data tables with sorting and filtering
- [ ] Charts and analytics components
- [ ] File upload components
- [ ] Calendar and scheduling components

### Integration Requirements
- [ ] Stripe integration for payment methods
- [ ] Stripe integration for refunds
- [ ] File storage integration (Supabase Storage)
- [ ] Email notification system
- [ ] Webhook handling for external services
- [ ] Calendar integration (Google/Microsoft)

### Security & Performance
- [ ] Implement proper RLS policies
- [ ] Add rate limiting for API endpoints
- [ ] Implement file upload security
- [ ] Add input validation and sanitization
- [ ] Optimize database queries
- [ ] Implement caching where appropriate
- [ ] Add comprehensive logging

## Testing Strategy

### Unit Tests
- [ ] Business logic functions
- [ ] Database operations
- [ ] Utility functions
- [ ] Validation functions
- [ ] Calculation functions (earnings, ratings)

### Integration Tests
- [ ] API endpoint testing
- [ ] Database integration testing
- [ ] Stripe integration testing
- [ ] File upload testing
- [ ] Email notification testing

### End-to-End Tests
- [ ] Student booking workflow
- [ ] Tutor availability management
- [ ] Admin course management
- [ ] Payment processing workflow
- [ ] Support ticket workflow
- [ ] Messaging system workflow

### Performance Testing
- [ ] Database query performance
- [ ] File upload performance
- [ ] Concurrent user testing
- [ ] Memory usage optimization
- [ ] Page load time optimization

## Development Guidelines

### Code Standards
- [ ] Follow existing code patterns and conventions
- [ ] Use TypeScript strict mode
- [ ] Implement proper error handling
- [ ] Add comprehensive JSDoc comments
- [ ] Use consistent naming conventions
- [ ] Follow React best practices

### Localization
- [ ] All user-facing text in French (Canada)
- [ ] Use existing i18n system
- [ ] Add new translation keys as needed
- [ ] Test with French content
- [ ] Ensure proper date/time formatting

### Security
- [ ] Implement proper authentication checks
- [ ] Add authorization for all admin functions
- [ ] Sanitize all user inputs
- [ ] Implement CSRF protection
- [ ] Add audit logging for sensitive operations

### Performance
- [ ] Optimize database queries
- [ ] Implement proper pagination
- [ ] Use React.memo for expensive components
- [ ] Implement lazy loading where appropriate
- [ ] Optimize bundle size

## Deployment & Monitoring

### Deployment
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor for errors

### Monitoring
- [ ] Set up error tracking
- [ ] Monitor performance metrics
- [ ] Track user engagement
- [ ] Monitor payment processing
- [ ] Set up alerts for critical issues

## Success Metrics

### Student Dashboard
- [ ] User engagement with new features
- [ ] Booking completion rate
- [ ] Support ticket resolution time
- [ ] User satisfaction scores

### Tutor Dashboard
- [ ] Availability management usage
- [ ] Earnings tracking accuracy
- [ ] Rating system adoption
- [ ] Training resource usage

### Admin Dashboard
- [ ] Administrative efficiency gains
- [ ] Revenue tracking accuracy
- [ ] Support ticket resolution time
- [ ] System monitoring effectiveness

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

```

Perfect! I've successfully updated the `TUTOR_DASHBOARD_ROADMAP.md` document to be a comprehensive development roadmap that includes:

## What's Now Included:

### **Complete Feature Coverage:**
- **Student Dashboard**: 7 major features (profile management, reservations, messaging, payments, recurring sessions, support tickets, file management)
- **Tutor Dashboard**: 9 major features (availability, appointments, messaging, meeting links, status management, ratings, courses, earnings, training resources)
- **Admin Dashboard**: 9 major features (enhanced overview, course management, tutor management, coupons, appointments, orders, revenue analytics, student management, support system)

### **Detailed Specifications:**
- Each feature has detailed requirements, database changes, and UI components
- Clear priority levels and status tracking
- Comprehensive database schema updates with new models and enhancements

### **Implementation Plan:**
- **4 Phases** spanning 11 weeks
- **Phase 1**: Core student & tutor features (Weeks 1-3)
- **Phase 2**: Advanced features (Weeks 4-6)
- **Phase 3**: Admin & analytics (Weeks 7-9)
- **Phase 4**: Support & management (Weeks 10-11)

### **Technical Requirements:**
- Complete database schema with new models
- API endpoints and server actions
- UI/UX components and integrations
- Security and performance considerations
- Comprehensive testing strategy

### **Development Guidelines:**
- Code standards and best practices
- Localization requirements (French Canada)
- Security and performance guidelines
- Deployment and monitoring strategies
- Success metrics for each dashboard

This roadmap now serves as your complete development plan for all dashboard features. You can use it to track progress, assign tasks, and ensure nothing is missed during development. Each checkbox can be marked as completed as you implement the features.

Would you like me to help you start implementing any specific features from Phase 1, or would you like to make any adjustments to the roadmap?

---

**User**

before we implement anything, I want to fix a bug in the tutor dashboard access: Unhandled Runtime Error
Error: Event handlers cannot be passed to Client Component props.
  <button onClick={function onClick} className=... children=...>
                  ^^^^^^^^^^^^^^^^^^


---

**Cursor**

I can see there's a runtime error in the tutor dashboard related to event handlers being passed to Client Component props. Let me examine the current tutor dashboard implementation to identify and fix this issue.


I found the issue! The problem is in the `app/tableau-de-bord/page.tsx` file on line 60. There's a `button` element with an `onClick` handler in a Server Component, which is not allowed in Next.js 13+ App Router.

The issue is that the page component is a Server Component (no `'use client'` directive), but it contains a button with an `onClick` handler. In Next.js App Router, Server Components cannot have event handlers.

Let me fix this by creating a separate Client Component for the refresh functionality:


```typescriptreact
'use client'

import { Button } from '@/components/ui/button'

export function RefreshButton() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <Button 
      onClick={handleRefresh}
      variant="outline"
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
    >
      Actualiser la page
    </Button>
  )
}
```

Now let me update the dashboard page to use this Client Component:


```typescriptreact
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { TutorDashboard } from '@/components/dashboard/tutor-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { RefreshButton } from '@/components/dashboard/refresh-button'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/connexion')
  }

  // Render different dashboards based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />
    case 'tutor':
      // Check if user has a tutor profile first
      const tutorProfile = await prisma.tutor.findUnique({
        where: { id: user.id },
        include: {
          user: true,
          tutorCourses: {
            include: {
              course: true,
            },
          },
        },
      })

      if (!tutorProfile) {
        // If no tutor profile exists, show setup instructions
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Profil tuteur en cours de configuration</h1>
              <p className="text-muted-foreground mb-6">
                Votre compte tuteur a été créé mais le profil professionnel n'est pas encore configuré. 
                L'administrateur doit finaliser la configuration de votre profil.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Prochaines étapes :</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• L'administrateur va créer votre profil tuteur</li>
                  <li>• Vos disponibilités seront configurées</li>
                  <li>• Vous serez assigné aux cours appropriés</li>
                  <li>• Vous recevrez un email de confirmation</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/connexion" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Retour à la connexion
                </a>
                <button 
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Actualiser la page
                </button>
              </div>
            </div>
          </div>
        )
      }

      // Fetch remaining tutor data with error handling
      let tutorAppointments = []
      let tutorAvailability = { rules: [], exceptions: [], timeOffs: [] }

      try {
        const [appointments, availabilityData] = await Promise.all([
          // Get tutor appointments
          prisma.appointment.findMany({
            where: { tutorId: user.id },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              course: {
                select: {
                  id: true,
                  titleFr: true,
                  slug: true,
                },
              },
              orderItem: {
                select: {
                  unitPriceCad: true,
                  lineTotalCad: true,
                },
              },
            },
            orderBy: { startDatetime: 'asc' },
          }),
          // Get tutor availability
          Promise.all([
            prisma.availabilityRule.findMany({
              where: { tutorId: user.id },
              orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.availabilityException.findMany({
              where: { tutorId: user.id },
              orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.timeOff.findMany({
              where: { tutorId: user.id },
              orderBy: { startDatetime: 'asc' },
            }),
          ]).then(([rules, exceptions, timeOffs]) => ({
            rules: rules || [],
            exceptions: exceptions || [],
            timeOffs: timeOffs || [],
          })),
        ])

        tutorAppointments = appointments || []
        tutorAvailability = availabilityData || { rules: [], exceptions: [], timeOffs: [] }
      } catch (error) {
        console.error('Error fetching tutor data:', error)
        // Continue with empty data rather than crashing
      }

      return (
        <TutorDashboard
          user={user}
          tutorProfile={tutorProfile}
          appointments={tutorAppointments}
          availability={tutorAvailability}
        />
      )
    default:
      // Get student's appointments and orders
      const [appointments, orders] = await Promise.all([
        prisma.appointment.findMany({
          where: { userId: user.id },
          include: {
            course: true,
            tutor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { startDatetime: 'asc' },
        }),
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

      return (
        <StudentDashboard
          user={user}
          appointments={appointments}
          orders={orders}
        />
      )
  }
}


```

```typescriptreact
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { prisma } from '@/lib/prisma'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { TutorDashboard } from '@/components/dashboard/tutor-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { RefreshButton } from '@/components/dashboard/refresh-button'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/connexion')
  }

  // Render different dashboards based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />
    case 'tutor':
      // Check if user has a tutor profile first
      const tutorProfile = await prisma.tutor.findUnique({
        where: { id: user.id },
        include: {
          user: true,
          tutorCourses: {
            include: {
              course: true,
            },
          },
        },
      })

      if (!tutorProfile) {
        // If no tutor profile exists, show setup instructions
        return (
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Profil tuteur en cours de configuration</h1>
              <p className="text-muted-foreground mb-6">
                Votre compte tuteur a été créé mais le profil professionnel n'est pas encore configuré. 
                L'administrateur doit finaliser la configuration de votre profil.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Prochaines étapes :</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• L'administrateur va créer votre profil tuteur</li>
                  <li>• Vos disponibilités seront configurées</li>
                  <li>• Vous serez assigné aux cours appropriés</li>
                  <li>• Vous recevrez un email de confirmation</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/connexion" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Retour à la connexion
                </a>
                <RefreshButton />
              </div>
            </div>
          </div>
        )
      }

      // Fetch remaining tutor data with error handling
      let tutorAppointments = []
      let tutorAvailability = { rules: [], exceptions: [], timeOffs: [] }

      try {
        const [appointments, availabilityData] = await Promise.all([
          // Get tutor appointments
          prisma.appointment.findMany({
            where: { tutorId: user.id },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              course: {
                select: {
                  id: true,
                  titleFr: true,
                  slug: true,
                },
              },
              orderItem: {
                select: {
                  unitPriceCad: true,
                  lineTotalCad: true,
                },
              },
            },
            orderBy: { startDatetime: 'asc' },
          }),
          // Get tutor availability
          Promise.all([
            prisma.availabilityRule.findMany({
              where: { tutorId: user.id },
              orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.availabilityException.findMany({
              where: { tutorId: user.id },
              orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            }),
            prisma.timeOff.findMany({
              where: { tutorId: user.id },
              orderBy: { startDatetime: 'asc' },
            }),
          ]).then(([rules, exceptions, timeOffs]) => ({
            rules: rules || [],
            exceptions: exceptions || [],
            timeOffs: timeOffs || [],
          })),
        ])

        tutorAppointments = appointments || []
        tutorAvailability = availabilityData || { rules: [], exceptions: [], timeOffs: [] }
      } catch (error) {
        console.error('Error fetching tutor data:', error)
        // Continue with empty data rather than crashing
      }

      return (
        <TutorDashboard
          user={user}
          tutorProfile={tutorProfile}
          appointments={tutorAppointments}
          availability={tutorAvailability}
        />
      )
    default:
      // Get student's appointments and orders
      const [appointments, orders] = await Promise.all([
        prisma.appointment.findMany({
          where: { userId: user.id },
          include: {
            course: true,
            tutor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { startDatetime: 'asc' },
        }),
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

      return (
        <StudentDashboard
          user={user}
          appointments={appointments}
          orders={orders}
        />
      )
  }
}


```

Perfect! I've fixed the bug by:

1. **Created a new Client Component** (`components/dashboard/refresh-button.tsx`) that handles the refresh functionality with the `onClick` event handler.

2. **Updated the Server Component** (`app/tableau-de-bord/page.tsx`) to import and use the new `RefreshButton` component instead of having the `onClick` handler directly in the Server Component.

## What was the problem?

The error occurred because:
- The `app/tableau-de-bord/page.tsx` is a **Server Component** (no `'use client'` directive)
- Server Components run on the server and cannot have event handlers like `onClick`
- The button with `onClick={() => window.location.reload()}` was trying to pass an event handler to a Server Component, which is not allowed in Next.js 13+ App Router

## How I fixed it:

- **Separated concerns**: Created a dedicated Client Component for the interactive refresh button
- **Maintained functionality**: The refresh button still works exactly the same way
- **Followed Next.js patterns**: Server Components for data fetching, Client Components for interactivity

The tutor dashboard should now work without the runtime error. The refresh button will still function properly, but now it's properly isolated in a Client Component where event handlers are allowed.

