[
  {
    "schemaname": "public",
    "table_name": "appointment_modifications",
    "Total Inserts": 2,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 2,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "appointments",
    "Total Inserts": 11,
    "Total Updates": 2,
    "Total Deletes": 6,
    "Current Rows": 5,
    "Dead Rows": 8
  },
  {
    "schemaname": "public",
    "table_name": "availability_exceptions",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "availability_rules",
    "Total Inserts": 18,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 18,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "cart_items",
    "Total Inserts": 12,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 12,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "carts",
    "Total Inserts": 4,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 4,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "coupons",
    "Total Inserts": 2,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 2,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "courses",
    "Total Inserts": 8,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 3,
    "Dead Rows": 5
  },
  {
    "schemaname": "public",
    "table_name": "credit_transactions",
    "Total Inserts": 1,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 1,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "external_calendars",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "message_attachments",
    "Total Inserts": 1,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 1,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "messages",
    "Total Inserts": 8,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 8,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "order_items",
    "Total Inserts": 12,
    "Total Updates": 12,
    "Total Deletes": 0,
    "Current Rows": 12,
    "Dead Rows": 12
  },
  {
    "schemaname": "public",
    "table_name": "orders",
    "Total Inserts": 13,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 13,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "payment_intent_data",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "recurring_sessions",
    "Total Inserts": 2,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 2,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "refund_requests",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "slot_holds",
    "Total Inserts": 63,
    "Total Updates": 0,
    "Total Deletes": 48,
    "Current Rows": 13,
    "Dead Rows": 50
  },
  {
    "schemaname": "public",
    "table_name": "time_off",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  },
  {
    "schemaname": "public",
    "table_name": "tutor_courses",
    "Total Inserts": 14,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 6,
    "Dead Rows": 8
  },
  {
    "schemaname": "public",
    "table_name": "tutors",
    "Total Inserts": 18,
    "Total Updates": 0,
    "Total Deletes": 1,
    "Current Rows": 4,
    "Dead Rows": 14
  },
  {
    "schemaname": "public",
    "table_name": "users",
    "Total Inserts": 58,
    "Total Updates": 15,
    "Total Deletes": 7,
    "Current Rows": 28,
    "Dead Rows": 31
  },
  {
    "schemaname": "public",
    "table_name": "webhook_events",
    "Total Inserts": 0,
    "Total Updates": 0,
    "Total Deletes": 0,
    "Current Rows": 0,
    "Dead Rows": 0
  }
]

-- 1. Users table (core user accounts)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "role",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'student'::\"Role\""
  },
  {
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": "CURRENT_TIMESTAMP"
  },
  {
    "column_name": "stripe_customer_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "default_payment_method_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "credit_balance",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  }
]

-- 2. Courses table (pricing and course info)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "title_fr",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "description_fr",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": "CURRENT_TIMESTAMP"
  },
  {
    "column_name": "student_rate_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "45.00"
  }
]

-- 3. Tutors table (tutor profiles and rates)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "display_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "bio_fr",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "hourly_base_rate_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "priority",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "100"
  },
  {
    "column_name": "active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  }
]

-- 4. Carts table (shopping baskets)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "user_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "coupon_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": "CURRENT_TIMESTAMP"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]

-- 5. Cart_items table (individual cart items)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "cart_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "course_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "tutor_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "start_datetime",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "duration_min",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "unit_price_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "line_total_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  }
]

-- 6. Slot_holds table (temporary reservations)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "user_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "tutor_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "course_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "start_datetime",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "duration_min",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "expires_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "recurring_session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]

-- 7. Payment_intent_data table (payment details storage)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "(gen_random_uuid())::text"
  },
  {
    "column_name": "payment_intent_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "cart_data",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  }
]

-- 8. Orders table (completed purchases)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "user_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "subtotal_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "discount_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "column_name": "total_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "currency",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'CAD'::text"
  },
  {
    "column_name": "stripe_payment_intent_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "stripe_checkout_session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'created'::\"OrderStatus\""
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": "CURRENT_TIMESTAMP"
  }
]

-- 9. Order_items table (individual purchased items)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "order_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "course_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "tutor_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "start_datetime",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "duration_min",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "unit_price_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "line_total_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "end_datetime",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "column_name": "tutor_earnings_cad",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0.00"
  }
]

-- 10. Appointments table (scheduled sessions)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "user_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "tutor_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "course_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "start_datetime",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "end_datetime",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'scheduled'::\"AppointmentStatus\""
  },
  {
    "column_name": "order_item_id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "cancellation_reason",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "cancelled_by",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "cancelled_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "recurring_session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]

-- 11. Coupons table (discount codes)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "code",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "value",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  },
  {
    "column_name": "starts_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "ends_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "max_redemptions",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "redemption_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  }
]

-- 12. Webhook_events table (payment notifications)
[
  {
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "source",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "payload_json",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "processed_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "is_nullable": "NO",
    "column_default": "CURRENT_TIMESTAMP"
  }
]
