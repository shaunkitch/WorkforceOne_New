-- =============================================
-- ABSOLUTE MINIMAL - Just create tables, nothing else
-- =============================================

-- Create payslips table (mobile app needs this)
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_pay DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_calls table (mobile app needs this)
CREATE TABLE IF NOT EXISTS daily_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table (mobile app needs this)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_requests table (mobile app needs this)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant basic permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON payslips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_calls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Absolute minimal tables created successfully!';
    RAISE NOTICE '📱 Mobile app should now work without crashes!';
    RAISE NOTICE '🎯 Tables: payslips, daily_calls, attendance, leave_requests';
END $$;