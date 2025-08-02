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