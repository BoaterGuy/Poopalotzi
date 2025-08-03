# Poopalotzi - Boat Pump-Out Service

## Overview
Poopalotzi is a professional boat pump-out service application designed to streamline operations for marina services. It features an admin dashboard, a customer portal, and employee workflow tools. The system facilitates pump-out service requests, manages boat information, handles customer accounts, and integrates real-time payment processing. The project aims to provide a comprehensive solution for managing boat pump-out services, from scheduling to payment.

## User Preferences
- Focus on fixing core functionality over extensive explanations
- Prioritize working payment processing for marina services
- Maintain clean, readable code structure

## System Architecture
The application is built using React for the frontend, served by Vite. It incorporates a robust authentication system with role-based access control (admin and member roles). A unified credit system manages user `totalPumpOuts`, where credits are consumed for scheduling services and restored upon cancellation. Payment is required only when credits are exhausted. The system utilizes a database for managing user data, boat information, service requests, and email notification preferences. UI/UX decisions prioritize a clean, responsive design with consistent styling (Tailwind CSS) across all components, including forms, dialogs, and navigation. Security measures include proper environment variable handling for API keys, input validation, and sanitization for all forms and API endpoints.

## External Dependencies
- **Clover**: For payment processing and order management. Currently configured in sandbox environment with limitations on payment completion due to token permissions.
- **Brevo (formerly Sendinblue)**: For email services, handling transactional emails such as contact form submissions, welcome emails, subscription confirmations, payment notifications, and service schedule confirmations.

## Recent Development (August 2, 2025)

✅ **EXTERNAL BROWSER SESSION COOKIE FIX APPLIED**:
   - **Issue**: Session cookies not persisting in external browsers (Chrome, Safari) when accessing Replit app
   - **Root Cause**: Incorrect cookie configuration for cross-origin requests and HTTPS requirements
   - **Solution Applied**: 
     * Force HTTPS settings (`secure: true`) for external browser compatibility
     * `sameSite: 'none'` for cross-origin HTTPS requests
     * `httpOnly: true` for security
     * Forced proxy trust configuration (`app.set("trust proxy", 1)`) before session middleware
     * Enhanced debugging logs to track external browser behavior
   - **Configuration**: Environment auto-detected (REPLIT_DOMAINS and REPL_SLUG present)
   - **Status**: Fixed and ready for external browser testing

✅ **CREDIT REFRESH ISSUE RESOLVED**:
   - **Issue**: Credit adjustments not reflecting correctly in customer management table
   - **Root Cause**: Query key mismatch between credit queries and cache invalidation
   - **Solution Applied**:
     * Fixed query key structure to match API endpoint pattern
     * Enhanced optimistic updates with proper cache management
     * Added immediate refetch after successful updates
     * Improved error handling with rollback functionality
   - **Status**: Real-time credit updates now working correctly

✅ **BULK PLAN DISPLAY ISSUE RESOLVED**:
   - **Issue**: Bulk plan users showing dashes instead of program names in customer management
   - **Root Cause**: CustomerCreditDisplay component only showing credits, not service level names for bulk plans
   - **Solution Applied**:
     * Enhanced CustomerCreditDisplay component to detect bulk plan users
     * Added service level name display for bulk plan types
     * Maintained existing credit functionality for one-time service users
     * Added proper Badge styling for bulk plan names
   - **Status**: Bulk plan users now show their program names correctly

✅ **CUSTOMER SORTING ENHANCEMENT ADDED**:
   - **Feature**: Alphabetical sorting of customers by last name in customer management table
   - **Implementation**: Added sorting logic to filteredCustomers array
   - **Details**:
     * Primary sort by last name (case-insensitive)
     * Secondary sort by first name when last names match
     * Maintains existing search functionality
   - **Status**: Customer table now displays in alphabetical order by last name

✅ **BULK PLAN SERVICE LEVEL DISPLAY FIXED** (August 3, 2025):
   - **Issue**: Bulk plan users showing dashes in both Service Level and Credits columns
   - **Root Cause**: 
     * Credits column logic incorrectly showing service level names instead of dashes
     * Service Level column missing handling for `type === "bulk"` plans
   - **Solution Applied**:
     * **Credits Column**: Fixed CustomerCreditDisplay to show dashes (-) for bulk plan users (serviceLevelId with 0 totalCredits)
     * **Service Level Column**: Enhanced getServiceLevelDisplay function to handle bulk plan type and show full service level names
     * **Credit Display Logic**: Available/Total format (e.g., "2/2") where available = usable credits, total = all credits ever assigned
   - **Status**: Bulk plan users now correctly show service level names in Service Level column and dashes in Credits column

✅ **CREDIT DISPLAY SIMPLIFIED** (August 3, 2025):
   - **Change**: Removed total credit display across all interfaces, now showing only remaining credits
   - **Rationale**: User confirmed purchase history provides sufficient tracking for purchases and admin adjustments
   - **Updates Applied**:
     * **Admin Customer Management**: Credits column shows only available credits (e.g., "4" instead of "4/4")
     * **Member Dashboard**: Credit displays show only remaining credits
     * **Service Request Pages**: Updated error messages to reference remaining credits
     * **PaymentHistory Component**: Fixed API endpoint to `/api/payments/history` for customer access
   - **Purchase History Access**: Both admins and customers can view complete transaction history
     * **Admin Access**: `/api/admin/payments` - view all transactions, filter by user
     * **Customer Access**: `/api/payments/history` - view own transaction history
     * **Admin Adjustments**: Tracked through credit adjustment endpoints with logging
   - **Status**: Credit display simplified while maintaining full purchase/adjustment history access

✅ **MEMBER DASHBOARD CREDIT DISPLAY ENHANCED** (August 3, 2025):
   - **Feature**: Separate "Credits Available" section in member dashboard  
   - **Implementation**: 
     * **Service Plan**: Displays service level name (e.g., "Single Royal Flush")
     * **Credits Available**: Separate section showing remaining credits with color coding
     * **Color Coding**: Green for available credits, red for zero credits
   - **Technical**: Enhanced React Query configuration and fixed TypeScript issues
   - **Session Configuration**: Confirmed external browser compatibility with secure cookie settings
     * **Secure**: `secure: true` for HTTPS compatibility
     * **SameSite**: `sameSite: 'none'` for cross-origin requests
     * **Proxy Trust**: `app.set("trust proxy", 1)` for Replit environment
   - **Status**: Dashboard now clearly displays service plan and credit status in separate sections

✅ **LOGIN CREDENTIALS FIXED** (August 3, 2025):
   - **Issue**: Member login failing with 401 Unauthorized due to password hash mismatch
   - **Root Cause**: Database password hash was corrupted or changed during development
   - **Solution Applied**: Reset member password to known value
   - **Current Login Credentials**:
     * **Member Account**: member@poopalotzi.com / admin123
     * **Admin Account**: admin@poopalotzi.com / admin123
   - **Session Configuration**: External browser compatibility confirmed working
   - **Status**: Login functionality restored for both internal and external browsers

✅ **PRODUCTION HTTPS SESSION AUTHENTICATION WORKING** (August 3, 2025):
   - **Status**: Complete cross-origin authentication system functional
   - **Configuration Applied**:
     * **Trust Proxy**: `app.set("trust proxy", 1)` enabled before all middleware
     * **CORS**: Origin configured for frontend domain with `credentials: true`
     * **Session Cookie Settings**:
       - `secure: true` - HTTPS required for production
       - `httpOnly: true` - Security best practice
       - `sameSite: 'none'` - Cross-origin HTTPS requests
       - `name: 'poopalotzi_session'` - Custom session cookie name (underscore)
     * **Session Store**: PostgreSQL-backed session persistence
   - **Authentication Tests**: ✅ Login creates sessions ✅ Sessions persist across requests
   - **Cookie Analysis**: Correct cookie name format, proper HTTPS security headers
   - **Frontend Domain**: `https://1b423122-988c-4041-913f-504458c4eb91-00-b968ik9ict5p.janeway.replit.dev`
   - **Status**: Ready for production deployment with full cross-origin authentication support