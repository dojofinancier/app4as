# PowerShell Test Examples for All Webhook Types
# Usage: Copy and paste each example into PowerShell (make sure your dev server is running)

$baseUrl = "http://localhost:3000/api/test/webhooks"

# Set your test API key (add TEST_WEBHOOK_API_KEY to your .env.local file)
# For development only - this bypasses authentication
$testApiKey = "test-webhook-key-12345"  # Change this to match your .env.local TEST_WEBHOOK_API_KEY

# Headers with test API key
$headers = @{
    "Content-Type" = "application/json"
    "x-test-api-key" = $testApiKey
}

Write-Host "=== Webhook Test Examples ===" -ForegroundColor Cyan
Write-Host "Make sure your Next.js dev server is running on $baseUrl" -ForegroundColor Yellow
Write-Host "Using test API key for authentication bypass (development only)" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# 1. SIGNUP WEBHOOK
# ============================================================================
Write-Host "1. Testing signup webhook..." -ForegroundColor Green
$signupBody = @{
    type = "signup"
    payload = @{
        userId = "user_$(Get-Random)"
        role = "student"
        email = "miguelromain@gmail.com"
        firstName = "Jean"
        lastName = "Dupont"
        phone = "+15141234567"
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $signupBody
Write-Host ""

# ============================================================================
# 2. BOOKING CREATED WEBHOOK
# ============================================================================
Write-Host "2. Testing booking.created webhook..." -ForegroundColor Green
$bookingCreatedBody = @{
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

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $bookingCreatedBody
Write-Host ""

# ============================================================================
# 3. BOOKING CANCELLED WEBHOOK
# ============================================================================
Write-Host "3. Testing booking.cancelled webhook..." -ForegroundColor Green
$bookingCancelledBody = @{
    type = "booking.cancelled"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "miguelromain@gmail.com"
        tutorEmail = "admin@carredastutorat.com"
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

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $bookingCancelledBody
Write-Host ""

# ============================================================================
# 4. BOOKING RESCHEDULED WEBHOOK
# ============================================================================
Write-Host "4. Testing booking.rescheduled webhook..." -ForegroundColor Green
$oldStart = (Get-Date).AddDays(5)
$newStart = (Get-Date).AddDays(7)

$bookingRescheduledBody = @{
    type = "booking.rescheduled"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "miguelromain@gmail.com"
        tutorEmail = "admin@carredastutorat.com"
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

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $bookingRescheduledBody
Write-Host ""

# ============================================================================
# 5. APPOINTMENT COMPLETED WEBHOOK
# ============================================================================
Write-Host "5. Testing appointment.completed webhook..." -ForegroundColor Green
$appointmentCompletedBody = @{
    type = "appointment.completed"
    payload = @{
        appointmentId = "apt_$(Get-Random)"
        userId = "user_123"
        tutorId = "tutor_456"
        studentEmail = "miguelromain@gmail.com"
        tutorEmail = "admin@carredastutorat.com"
        courseId = "course_123"
        courseTitleFr = "Mathématiques Avancées"
        startDatetime = (Get-Date).AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ssZ")
        endDatetime = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        durationMin = 60
        tutorEarningsCad = 80.00
        completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $appointmentCompletedBody
Write-Host ""

# ============================================================================
# 6. ORDER REFUNDED WEBHOOK
# ============================================================================
Write-Host "6. Testing order.refunded webhook..." -ForegroundColor Green
$orderRefundedBody = @{
    type = "order.refunded"
    payload = @{
        orderId = "order_$(Get-Random)"
        userId = "user_123"
        studentEmail = "miguelromain@gmail.com"
        refundAmount = 100.00
        refundReason = "Demande du client"
        stripeRefundId = "re_$(Get-Random)"
        processedBy = "admin_123"
        affectedAppointments = @("apt_001", "apt_002")
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $orderRefundedBody
Write-Host ""

# ============================================================================
# 7. MESSAGE SENT WEBHOOK
# ============================================================================
Write-Host "7. Testing message.sent webhook..." -ForegroundColor Green
$messageSentBody = @{
    type = "message.sent"
    payload = @{
        messageId = "msg_$(Get-Random)"
        senderId = "user_123"
        receiverId = "tutor_456"
        senderName = "Jean Dupont"
        receiverName = "Marie Tremblay"
        senderEmail = "miguelromain@gmail.com"
        receiverEmail = "admin@carredastutorat.com"
        content = "Bonjour, j'aimerais confirmer notre rendez-vous de demain."
        appointmentId = "apt_123"
        appointmentTitle = "Mathématiques Avancées"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $messageSentBody
Write-Host ""

# ============================================================================
# 8. TICKET CREATED WEBHOOK
# ============================================================================
Write-Host "8. Testing ticket.created webhook..." -ForegroundColor Green
$ticketCreatedBody = @{
    type = "ticket.created"
    payload = @{
        ticketId = "ticket_$(Get-Random)"
        userId = "user_123"
        userEmail = "miguelromain@gmail.com"
        studentName = "Jean Dupont"
        subject = "Problème avec le paiement"
        category = "payment"
        priority = "high"
        status = "open"
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $ticketCreatedBody
Write-Host ""

# ============================================================================
# 9. TICKET STATUS CHANGED WEBHOOK
# ============================================================================
Write-Host "9. Testing ticket.status_changed webhook..." -ForegroundColor Green
$ticketStatusChangedBody = @{
    type = "ticket.status_changed"
    payload = @{
        ticketId = "ticket_123"
        userId = "user_123"
        userEmail = "miguelromain@gmail.com"
        studentName = "Jean Dupont"
        oldStatus = "open"
        newStatus = "resolved"
        changedBy = "admin_456"
        reason = "Problème résolu"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $ticketStatusChangedBody
Write-Host ""

# ============================================================================
# 10. TICKET MESSAGE ADDED WEBHOOK
# ============================================================================
Write-Host "10. Testing ticket.message_added webhook..." -ForegroundColor Green
$ticketMessageBody = @{
    type = "ticket.message_added"
    payload = @{
        ticketId = "ticket_123"
        messageId = "msg_$(Get-Random)"
        userId = "user_123"
        userEmail = "miguelromain@gmail.com"
        studentName = "Jean Dupont"
        senderRole = "student"
        message = "Merci pour votre aide, le problème est maintenant résolu."
        isInternal = $false
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $ticketMessageBody
Write-Host ""

# ============================================================================
# 11. RATING CREATED WEBHOOK
# ============================================================================
Write-Host "11. Testing rating.created webhook..." -ForegroundColor Green
$ratingCreatedBody = @{
    type = "rating.created"
    payload = @{
        ratingId = "rating_$(Get-Random)"
        tutorId = "tutor_456"
        courseId = "course_123"
        studentId = "user_123"
        studentEmail = "miguelromain@gmail.com"
        tutorEmail = "admin@carredastutorat.com"
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

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $ratingCreatedBody
Write-Host ""

# ============================================================================
# 12. RATING UPDATED WEBHOOK
# ============================================================================
Write-Host "12. Testing rating.updated webhook..." -ForegroundColor Green
$ratingUpdatedBody = @{
    type = "rating.updated"
    payload = @{
        ratingId = "rating_123"
        tutorId = "tutor_456"
        courseId = "course_123"
        studentId = "user_123"
        studentEmail = "miguelromain@gmail.com"
        tutorEmail = "admin@carredastutorat.com"
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

Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $ratingUpdatedBody
Write-Host ""

Write-Host "=== All webhook tests completed! ===" -ForegroundColor Cyan

