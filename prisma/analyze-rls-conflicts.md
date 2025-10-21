[
  {
    "tablename": "recurring_sessions",
    "rls_enabled": true,
    "policy_count": 5,
    "status": "🚨 MANY POLICIES"
  },
  {
    "tablename": "appointments",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "availability_exceptions",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "availability_rules",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "cart_items",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "carts",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "coupons",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "courses",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "external_calendars",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "message_attachments",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "order_items",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "orders",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "slot_holds",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "time_off",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "tutor_courses",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "tutors",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "users",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "webhook_events",
    "rls_enabled": true,
    "policy_count": 1,
    "status": "✅ SINGLE POLICY"
  },
  {
    "tablename": "appointment_modifications",
    "rls_enabled": false,
    "policy_count": 0,
    "status": "❌ NO POLICIES"
  },
  {
    "tablename": "credit_transactions",
    "rls_enabled": false,
    "policy_count": 0,
    "status": "❌ NO POLICIES"
  },
  {
    "tablename": "messages",
    "rls_enabled": false,
    "policy_count": 0,
    "status": "❌ NO POLICIES"
  },
  {
    "tablename": "refund_requests",
    "rls_enabled": false,
    "policy_count": 0,
    "status": "❌ NO POLICIES"
  }
]

[
  {
    "tablename": "appointments",
    "policyname": "Allow all on appointments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "availability_exceptions",
    "policyname": "Allow all on availability_exceptions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "availability_rules",
    "policyname": "Allow all on availability_rules",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "cart_items",
    "policyname": "Allow all on cart_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "carts",
    "policyname": "Allow all on carts",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "coupons",
    "policyname": "Allow all on coupons",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "courses",
    "policyname": "Allow all on courses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "external_calendars",
    "policyname": "Allow all on external_calendars",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "message_attachments",
    "policyname": "Allow authenticated users to access attachments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "order_items",
    "policyname": "Allow all on order_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "orders",
    "policyname": "Allow all on orders",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "Admins can manage all recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "Tutors can view their recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "Users can create recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "has_using_clause": "NO",
    "has_with_check_clause": "YES"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "Users can update their recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "recurring_sessions",
    "policyname": "Users can view their own recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "slot_holds",
    "policyname": "Allow all on slot_holds",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "time_off",
    "policyname": "Allow all on time_off",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "tutor_courses",
    "policyname": "Allow all on tutor_courses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "tutors",
    "policyname": "Allow all on tutors",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "users",
    "policyname": "Allow all on users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  },
  {
    "tablename": "webhook_events",
    "policyname": "Allow all on webhook_events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "has_using_clause": "YES",
    "has_with_check_clause": "NO"
  }
]

[
  {
    "tablename": "recurring_sessions",
    "command": "SELECT",
    "roles": "{public}",
    "policy_count": 2,
    "conflicting_policies": "Users can view their own recurring sessions, Tutors can view their recurring sessions"
  }
]

[
  {
    "table_name": "recurring_sessions",
    "policyname": "Admins can manage all recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "(( SELECT users.role\n   FROM users\n  WHERE (users.id = (auth.uid())::text)) = 'admin'::\"Role\")",
    "with_check": null
  },
  {
    "table_name": "recurring_sessions",
    "policyname": "Tutors can view their recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_expression": "((tutor_id = (auth.uid())::text) OR (( SELECT users.role\n   FROM users\n  WHERE (users.id = (auth.uid())::text)) = 'admin'::\"Role\"))",
    "with_check": null
  },
  {
    "table_name": "recurring_sessions",
    "policyname": "Users can create recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "INSERT",
    "using_expression": null,
    "with_check": "((user_id = (auth.uid())::text) OR (( SELECT users.role\n   FROM users\n  WHERE (users.id = (auth.uid())::text)) = 'admin'::\"Role\"))"
  },
  {
    "table_name": "recurring_sessions",
    "policyname": "Users can update their recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "UPDATE",
    "using_expression": "((user_id = (auth.uid())::text) OR (( SELECT users.role\n   FROM users\n  WHERE (users.id = (auth.uid())::text)) = 'admin'::\"Role\"))",
    "with_check": null
  },
  {
    "table_name": "recurring_sessions",
    "policyname": "Users can view their own recurring sessions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_expression": "((user_id = (auth.uid())::text) OR (( SELECT users.role\n   FROM users\n  WHERE (users.id = (auth.uid())::text)) = 'admin'::\"Role\"))",
    "with_check": null
  }
]

[
  {
    "tablename": "appointment_modifications",
    "rls_enabled": false,
    "policy_count": 0,
    "issue": "⚠️ RLS DISABLED"
  },
  {
    "tablename": "credit_transactions",
    "rls_enabled": false,
    "policy_count": 0,
    "issue": "⚠️ RLS DISABLED"
  },
  {
    "tablename": "messages",
    "rls_enabled": false,
    "policy_count": 0,
    "issue": "⚠️ RLS DISABLED"
  },
  {
    "tablename": "refund_requests",
    "rls_enabled": false,
    "policy_count": 0,
    "issue": "⚠️ RLS DISABLED"
  }
]




[
  {
    "metric": "Total Tables",
    "value": "22"
  },
  {
    "metric": "Tables with RLS Enabled",
    "value": "18"
  },
  {
    "metric": "Tables with RLS Disabled",
    "value": "4"
  },
  {
    "metric": "Total Policies",
    "value": "22"
  },
  {
    "metric": "Tables with Multiple Policies",
    "value": "1"
  }
]