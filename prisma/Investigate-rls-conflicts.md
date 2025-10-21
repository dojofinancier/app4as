[
  {
    "tablename": "recurring_sessions",
    "command": "ALL",
    "roles": "{public}",
    "policy_count": 2,
    "conflicting_policies": "admin_all_recurring_sessions, students_all_own_recurring_sessions",
    "issue": "CONFLICT DETECTED"
  },
  {
    "tablename": "refund_requests",
    "command": "ALL",
    "roles": "{public}",
    "policy_count": 2,
    "conflicting_policies": "users_all_own_refund_requests, admin_all_refund_requests",
    "issue": "CONFLICT DETECTED"
  }
]

[
  {
    "tablename": "recurring_sessions",
    "policyname": "admin_all_recurring_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "is_admin()",
    "with_check": null,
    "status": "CONFLICTING POLICY"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "students_all_own_recurring_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "((auth.uid())::text = user_id)",
    "with_check": null,
    "status": "CONFLICTING POLICY"
  },
  {
    "tablename": "refund_requests",
    "policyname": "admin_all_refund_requests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "is_admin()",
    "with_check": null,
    "status": "CONFLICTING POLICY"
  },
  {
    "tablename": "refund_requests",
    "policyname": "users_all_own_refund_requests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "((auth.uid())::text = user_id)",
    "with_check": null,
    "status": "CONFLICTING POLICY"
  }
]

[
  {
    "conflict_type": "Multiple ALL policies",
    "tablename": "recurring_sessions",
    "roles": "{public}",
    "policy_count": 2,
    "policies": "students_all_own_recurring_sessions, admin_all_recurring_sessions"
  },
  {
    "conflict_type": "Multiple ALL policies",
    "tablename": "refund_requests",
    "roles": "{public}",
    "policy_count": 2,
    "policies": "users_all_own_refund_requests, admin_all_refund_requests"
  }
]

[
  {
    "tablename": "recurring_sessions",
    "policyname": "admin_all_recurring_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "🚨 CONFLICT"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "students_all_own_recurring_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "🚨 CONFLICT"
  },
  {
    "tablename": "refund_requests",
    "policyname": "admin_all_refund_requests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "🚨 CONFLICT"
  },
  {
    "tablename": "refund_requests",
    "policyname": "users_all_own_refund_requests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "🚨 CONFLICT"
  },
  {
    "tablename": "appointment_modifications",
    "policyname": "admin_all_appointment_modifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "appointment_modifications",
    "policyname": "users_select_own_appointment_modifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "appointments",
    "policyname": "Allow all on appointments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "availability_exceptions",
    "policyname": "Allow all on availability_exceptions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "availability_rules",
    "policyname": "Allow all on availability_rules",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "cart_items",
    "policyname": "Allow all on cart_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "carts",
    "policyname": "Allow all on carts",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "coupons",
    "policyname": "Allow all on coupons",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "courses",
    "policyname": "Allow all on courses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "credit_transactions",
    "policyname": "admin_all_credit_transactions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "credit_transactions",
    "policyname": "users_select_own_credit_transactions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "external_calendars",
    "policyname": "Allow all on external_calendars",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "message_attachments",
    "policyname": "Allow authenticated users to access attachments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "messages",
    "policyname": "users_all_own_messages",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "messages",
    "policyname": "admin_select_messages",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "order_items",
    "policyname": "Allow all on order_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "orders",
    "policyname": "Allow all on orders",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "tutors_select_own_recurring_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "slot_holds",
    "policyname": "Allow all on slot_holds",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "time_off",
    "policyname": "Allow all on time_off",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "tutor_courses",
    "policyname": "Allow all on tutor_courses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "tutors",
    "policyname": "Allow all on tutors",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "users",
    "policyname": "Allow all on users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  },
  {
    "tablename": "webhook_events",
    "policyname": "Allow all on webhook_events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO",
    "conflict_status": "✅ OK"
  }
]

[
  {
    "drop_statement": "DROP POLICY IF EXISTS admin_all_recurring_sessions ON recurring_sessions;",
    "reason": "CONFLICTING POLICY"
  },
  {
    "drop_statement": "DROP POLICY IF EXISTS students_all_own_recurring_sessions ON recurring_sessions;",
    "reason": "CONFLICTING POLICY"
  },
  {
    "drop_statement": "DROP POLICY IF EXISTS admin_all_refund_requests ON refund_requests;",
    "reason": "CONFLICTING POLICY"
  },
  {
    "drop_statement": "DROP POLICY IF EXISTS users_all_own_refund_requests ON refund_requests;",
    "reason": "CONFLICTING POLICY"
  }
]