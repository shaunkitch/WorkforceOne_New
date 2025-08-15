-- Migration: Create default Store Visit Form
-- Description: Creates a default store visit form for outlet visits
-- Version: 034

-- Insert a default Store Visit Form for each organization
INSERT INTO forms (
    title,
    description,
    status,
    fields,
    organization_id,
    created_by
)
SELECT 
    'Store Visit Form' as title,
    'Standard form for completing outlet/store visits' as description,
    'active' as status,
    '[
        {
            "id": "visit_type",
            "type": "select",
            "label": "Visit Type",
            "required": true,
            "options": ["Regular Visit", "Inspection", "Delivery", "Collection", "Customer Service", "Other"]
        },
        {
            "id": "store_condition",
            "type": "rating",
            "label": "Store Condition",
            "required": true,
            "min": 1,
            "max": 5
        },
        {
            "id": "staff_present",
            "type": "number",
            "label": "Number of Staff Present",
            "required": true,
            "min": 0
        },
        {
            "id": "products_checked",
            "type": "checkbox",
            "label": "Products/Inventory Checked",
            "required": false
        },
        {
            "id": "display_checked",
            "type": "checkbox",
            "label": "Display/Merchandising Checked",
            "required": false
        },
        {
            "id": "issues_found",
            "type": "textarea",
            "label": "Issues Found",
            "placeholder": "Describe any issues or concerns",
            "required": false
        },
        {
            "id": "action_required",
            "type": "select",
            "label": "Follow-up Action Required",
            "required": true,
            "options": ["None", "Minor Follow-up", "Urgent Action", "Management Review"]
        },
        {
            "id": "visit_notes",
            "type": "textarea",
            "label": "Additional Notes",
            "placeholder": "Any additional comments about the visit",
            "required": false
        },
        {
            "id": "customer_feedback",
            "type": "textarea",
            "label": "Customer Feedback",
            "placeholder": "Any feedback from customers or staff",
            "required": false
        },
        {
            "id": "visit_completed",
            "type": "checkbox",
            "label": "Visit Completed Successfully",
            "required": true
        }
    ]'::jsonb as fields,
    o.id as organization_id,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM forms f 
    WHERE f.organization_id = o.id 
    AND f.title = 'Store Visit Form'
);

-- Also create a simpler Quick Visit Form
INSERT INTO forms (
    title,
    description,
    status,
    fields,
    organization_id,
    created_by
)
SELECT 
    'Quick Visit Form' as title,
    'Quick form for simple outlet check-ins' as description,
    'active' as status,
    '[
        {
            "id": "visit_status",
            "type": "select",
            "label": "Visit Status",
            "required": true,
            "options": ["All Good", "Minor Issues", "Major Issues"]
        },
        {
            "id": "notes",
            "type": "textarea",
            "label": "Visit Notes",
            "placeholder": "Quick notes about the visit",
            "required": false
        },
        {
            "id": "follow_up_needed",
            "type": "checkbox",
            "label": "Follow-up Needed",
            "required": false
        }
    ]'::jsonb as fields,
    o.id as organization_id,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM forms f 
    WHERE f.organization_id = o.id 
    AND f.title = 'Quick Visit Form'
);

-- Update outlet form requirements to use the Store Visit Form by default
UPDATE outlets 
SET form_required = true
WHERE form_required IS NULL;

COMMENT ON TABLE forms IS 'Forms including default Store Visit Forms for outlet visits';