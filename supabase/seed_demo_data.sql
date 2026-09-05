-- ====================================================================
-- CUSTECH MARKETPLACE - DEMO SAMPLE DATA SEED SCRIPT
-- Run this AFTER you create your first account on CUSTECH Marketplace!
-- It automatically assigns these rich campus listings to your user.
-- ====================================================================

DO $$
DECLARE
    demo_user_id UUID;
    cat_laptops UUID;
    cat_phones UUID;
    cat_materials UUID;
    cat_housing UUID;
    cat_services UUID;
    list1_id UUID;
    list2_id UUID;
    list3_id UUID;
    list4_id UUID;
    list5_id UUID;
BEGIN
    -- 1. Grab the first registered user
    SELECT id INTO demo_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'Please sign up/register an account first on http://localhost:3000/register before running this seed script!';
        RETURN;
    END IF;

    -- Update demo user profile to be CUSTECH Verified
    UPDATE profiles
    SET 
        display_name = 'Ibrahim Musa (Demo Seller)',
        matric_number = 'CST/2022/COM/014',
        department = 'Computer Science',
        faculty = 'Faculty of Computing',
        academic_level = '400',
        phone = '08000000001',
        whatsapp_number = '08000000001',
        bank_name = 'OPay',
        account_number = '8012345678',
        account_name = 'IBRAHIM MUSA',
        verification_status = 'approved',
        trust_level = 'custech_verified',
        rating_avg = 4.9,
        rating_count = 14,
        completed_transactions = 18
    WHERE user_id = demo_user_id;

    -- Grab Category IDs
    SELECT id INTO cat_laptops FROM categories WHERE slug = 'laptops' LIMIT 1;
    SELECT id INTO cat_phones FROM categories WHERE slug = 'phones' LIMIT 1;
    SELECT id INTO cat_materials FROM categories WHERE slug = 'school-materials' LIMIT 1;
    SELECT id INTO cat_housing FROM categories WHERE slug = 'self-contained' LIMIT 1;
    SELECT id INTO cat_services FROM categories WHERE slug = 'web-development' LIMIT 1;

    -- 1. Sample Laptop Listing
    INSERT INTO listings (user_id, seller_id, category_id, title, description, price, condition, location, status, listing_type, view_count, is_featured)
    VALUES (
        demo_user_id, demo_user_id, cat_laptops,
        'HP EliteBook 840 G5 - Core i5, 16GB RAM, 512GB SSD',
        'Clean UK-used HP EliteBook 840 G5 laptop. Battery lasts 5+ hours during Osara power cuts. Keyboard light, fingerprint scanner, and original charger included. Perfect for Computer Science, Engineering, and final year projects.',
        19500000, -- 195,000 NGN
        'like_new',
        'Faculty of Computing / SUB',
        'active',
        'product',
        42,
        TRUE
    ) RETURNING id INTO list1_id;

    INSERT INTO listing_images (listing_id, url, position)
    VALUES (list1_id, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', 0);

    -- 2. Engineering Drawing Board
    INSERT INTO listings (user_id, seller_id, category_id, title, description, price, condition, location, status, listing_type, view_count)
    VALUES (
        demo_user_id, demo_user_id, cat_materials,
        'A2 Engineering Drawing Board + T-Square & Set Squares',
        'Complete 200L Engineering drawing package. Wooden A2 drawing board with clips, 60cm T-square, 30/60 and 45 degree set squares, and drawing tube. Barely used, bought for technical drawing.',
        1800000, -- 18,000 NGN
        'good',
        'Engineering Complex, Osara',
        'active',
        'product',
        27
    ) RETURNING id INTO list2_id;

    INSERT INTO listing_images (listing_id, url, position)
    VALUES (list2_id, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 0);

    -- 3. iPhone 12 Mini
    INSERT INTO listings (user_id, seller_id, category_id, title, description, price, condition, location, status, listing_type, view_count)
    VALUES (
        demo_user_id, demo_user_id, cat_phones,
        'iPhone 12 Mini - 128GB Black (Factory Unlocked)',
        'Factory unlocked iPhone 12 Mini 128GB. Battery health 86%. TrueTone, Face ID, and cameras working 100%. Selling because I upgraded. Physical inspection and test at CUSTECH Central Library or SUB foyer.',
        24000000, -- 240,000 NGN
        'good',
        'Central Library / SUB',
        'active',
        'product',
        64
    ) RETURNING id INTO list3_id;

    INSERT INTO listing_images (listing_id, url, position)
    VALUES (list3_id, 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800', 0);

    -- 4. Student Accommodation (Housing)
    INSERT INTO listings (user_id, seller_id, category_id, title, description, price, location, status, listing_type, view_count, is_featured)
    VALUES (
        demo_user_id, demo_user_id, cat_housing,
        'Newly Built Self-Contained Room (5 Mins Walk to CUSTECH Main Gate)',
        'Spacious tiled self-con room with dedicated prepaid meter (light), running borehole water, fenced compound with security guard. Located along Osara-Okene road, just 5 minutes walk to school gate.',
        12000000, -- 120,000 NGN/year
        'Osara Campus Gate Axis',
        'active',
        'housing',
        88,
        TRUE
    ) RETURNING id INTO list4_id;

    INSERT INTO properties (listing_id, property_type, rent_per_year, electricity_type, water_source, distance_to_campus, caution_deposit, is_verified_property)
    VALUES (list4_id, 'self_contained', 12000000, 'Prepaid Meter', 'Borehole with Overhead Tank', '5 mins walk', 1000000, TRUE);

    INSERT INTO listing_images (listing_id, url, position)
    VALUES (list4_id, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', 0);

    -- 5. Student Web Dev & Graphic Design Service
    INSERT INTO listings (user_id, seller_id, category_id, title, description, price, location, status, listing_type, view_count)
    VALUES (
        demo_user_id, demo_user_id, cat_services,
        'Full-Stack Web & Mobile App Development / Final Year Projects',
        '400L Software developer offering website building, React/Next.js frontends, Python APIs, and final year project software design with complete documentation for CUSTECH students.',
        2500000, -- Starting 25,000 NGN
        'Online & Campus Meetup',
        'active',
        'service',
        35
    ) RETURNING id INTO list5_id;

    INSERT INTO services (listing_id, delivery_time, starting_price, completed_jobs, availability)
    VALUES (list5_id, '3-5 days', 2500000, 12, 'available');

    INSERT INTO listing_images (listing_id, url, position)
    VALUES (list5_id, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', 0);

    RAISE NOTICE 'Demo listings created successfully and assigned to user %!', demo_user_id;
END $$;
