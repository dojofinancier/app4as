# Individual Webhook Test Examples
# Copy and paste each example individually into PowerShell

$baseUrl = "http://localhost:3000/api/test/webhooks"

# ============================================================================
# 1. SIGNUP WEBHOOK
# ============================================================================
$body = @{
    type = "signup"
    payload = @{
        userId = "user_$(Get-Random)"
        role = "student"
        email = "newstudent@example.com"
        firstName = "Jean"
        lastName = "Dupont"
        phone = "+15141234567"
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 2. BOOKING CREATED WEBHOOK
# ============================================================================
$body = @{
    type = "booking.created"
    payload = @{
        orderId = "order_$(Get-Random)"
        userId = "user_123"
        currency = "CAD"
        subtotalCad = 200.00
        discountCad = 20.00
        totalCad = 180.00
        couponCode = "TEST20"
        phone = "+15141234567"
        items = @(
            @{
                appointmentId = "apt_$(Get-Random)"
                courseId = "course_123"
                courseTitleFr = "Mathématiques Avancées"
                tutorId = "tutor_456"
                tutorName = "Marie Tremblay"
                startDatetime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
                durationMin = 90
                priceCad = 180.00
                tutorEarningsCad = 144.00
            }
        )
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 3. BOOKING CANCELLED WEBHOOK
# ============================================================================
$body = @{
    type = "booking.cancelled"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "student@example.com"
        tutorEmail = "tutor@example.com"
        courseId = "course_123"
        courseTitleFr = "Mathématiques Avancées"
        cancelledBy = "student"
        cancelledById = "user_123"
        cancellationReason = "Changement de plan"
        startDatetime = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
        endDatetime = (Get-Date).AddDays(5).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        durationMin = 60
        priceCad = 100.00
        creditIssued = 100.00
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 4. BOOKING RESCHEDULED WEBHOOK
# ============================================================================
$oldStart = (Get-Date).AddDays(5)
$newStart = (Get-Date).AddDays(7)
$body = @{
    type = "booking.rescheduled"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "student@example.com"
        tutorEmail = "tutor@example.com"
        courseId = "course_123"
        courseTitleFr = "Mathématiques Avancées"
        rescheduledBy = "student"
        rescheduledById = "user_123"
        reason = "Conflit d'horaire"
        oldStartDatetime = $oldStart.ToString("yyyy-MM-ddTHH:mm:ssZ")
        oldEndDatetime = $oldStart.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        newStartDatetime = $newStart.ToString("yyyy-MM-ddTHH:mm:ssZ")
        newEndDatetime = $newStart.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 5. APPOINTMENT COMPLETED WEBHOOK
# ============================================================================
$body = @{
    type = "appointment.completed"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "student@example.com"
        tutorEmail = "tutor@example.com"
        courseId = "course_123"
        courseTitleFr = "Mathématiques Avancées"
        startDatetime = (Get-Date).AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
        endDatetime = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        durationMin = 60
        tutorEarningsCad = 80.00
        completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 6. ORDER REFUNDED WEBHOOK
# ============================================================================
$body = @{
    type = "order.refunded"
    payload = @{
        orderId = "order_$(Get-Random)"
        userId = "user_123"
        studentEmail = "student@example.com"
        refundAmount = 100.00
        refundReason = "Demande du client"
        stripeRefundId = "re_$(Get-Random)"
        processedBy = "admin_123"
        affectedAppointments = @("apt_001", "apt_002")
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 7. MESSAGE SENT WEBHOOK
# ============================================================================
$body = @{
    type = "message.sent"
    payload = @{
        messageId = "msg_$(Get-Random)"
        senderId = "user_123"
        receiverId = "tutor_456"
        senderName = "Jean Dupont"
        receiverName = "Marie Tremblay"
        senderEmail = "student@example.com"
        receiverEmail = "tutor@example.com"
        content = "Bonjour, j'aimerais confirmer notre rendez-vous de demain."
        appointmentId = "apt_123"
        appointmentTitle = "Mathématiques Avancées"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 8. TICKET CREATED WEBHOOK
# ============================================================================
$body = @{
    type = "ticket.created"
    payload = @{
        ticketId = "ticket_$(Get-Random)"
        userId = "user_123"
        userEmail = "student@example.com"
        studentName = "Jean Dupont"
        subject = "Problème avec le paiement"
        category = "payment"
        priority = "high"
        status = "open"
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 9. TICKET STATUS CHANGED WEBHOOK
# ============================================================================
$body = @{
    type = "ticket.status_changed"
    payload = @{
        ticketId = "ticket_123"
        userId = "user_123"
        userEmail = "student@example.com"
        studentName = "Jean Dupont"
        oldStatus = "open"
        newStatus = "resolved"
        changedBy = "admin_456"
        reason = "Problème résolu"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 10. TICKET MESSAGE ADDED WEBHOOK
# ============================================================================
$body = @{
    type = "ticket.message_added"
    payload = @{
        ticketId = "ticket_123"
        messageId = "msg_$(Get-Random)"
        userId = "user_123"
        userEmail = "student@example.com"
        studentName = "Jean Dupont"
        senderRole = "student"
        message = "Merci pour votre aide, le problème est maintenant résolu."
        isInternal = $false
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 11. RATING CREATED WEBHOOK
# ============================================================================
$body = @{
    type = "rating.created"
    payload = @{
        ratingId = "rating_$(Get-Random)"
        tutorId = "tutor_456"
        courseId = "course_123"
        studentId = "user_123"
        studentEmail = "student@example.com"
        tutorEmail = "tutor@example.com"
        q1Courtoisie = 5
        q2Maitrise = 4
        q3Pedagogie = 5
        q4Dynamisme = 4
        generalScore = 4.5
        hasComment = $true
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

# ============================================================================
# 12. RATING UPDATED WEBHOOK
# ============================================================================
$body = @{
    type = "rating.updated"
    payload = @{
        ratingId = "rating_123"
        tutorId = "tutor_456"
        courseId = "course_123"
        studentId = "user_123"
        studentEmail = "student@example.com"
        tutorEmail = "tutor@example.com"
        q1Courtoisie = 5
        q2Maitrise = 5
        q3Pedagogie = 5
        q4Dynamisme = 5
        generalScore = 5.0
        hasComment = $true
        createdAt = (Get-Date).AddDays(-7).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body

