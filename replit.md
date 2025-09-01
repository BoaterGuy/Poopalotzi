# Poopalotzi - Boat Pump-Out Service

## Overview
Poopalotzi is a professional boat pump-out service application designed to streamline operations for marina services. It features an admin dashboard, a customer portal, and employee workflow tools. The system facilitates pump-out service requests, manages boat information, handles customer accounts, and integrates real-time payment processing. The project aims to provide a comprehensive solution for managing boat pump-out services, from scheduling to payment, with a vision to become a leading solution in the marine service industry by providing efficient and reliable service management.

## User Preferences
- Focus on fixing core functionality over extensive explanations
- Prioritize working payment processing for marina services
- Maintain clean, readable code structure

## System Architecture
The application is built using React for the frontend, served by Vite. It incorporates a robust authentication system with role-based access control (admin and member roles). A unified credit system manages user `totalPumpOuts`, where credits are consumed for scheduling services and restored upon cancellation. Payment is required only when credits are exhausted. The system utilizes a PostgreSQL database for managing user data, boat information, service requests, and email notification preferences, with session persistence. UI/UX decisions prioritize a clean, responsive design with consistent styling (Tailwind CSS) across all components, including forms, dialogs, and navigation. Security measures include proper environment variable handling for API keys, input validation, and sanitization for all forms and API endpoints. The system enforces HTTPS for production environments with `secure: true`, `sameSite: 'none'` for cross-origin requests, and `httpOnly: true` for session cookies, along with `app.set("trust proxy", 1)` for environment compatibility.

## External Dependencies
- **Clover**: For payment processing and order management in production environment only. All sandbox support has been removed. It handles real credit card tokenization and processes live payments through OAuth integration.
- **Brevo (formerly Sendinblue)**: For email services, handling transactional emails such as contact form submissions, welcome emails, subscription confirmations, payment notifications, and service schedule confirmations. Admin notifications for pump-out requests are also sent via Brevo.

## Recent Changes
- **Production-Only Clover Integration** (August 30, 2025): Removed all sandbox references and manual token setup. System now requires OAuth authentication with live Clover accounts only. This ensures proper security and eliminates test/placeholder tokens.
- **TypeScript Error Resolution** (September 1, 2025): Fixed critical null safety issues in clover-service.ts that were causing compilation failures and preventing proper application startup. OAuth system now working correctly with status 200 responses.
- **Complete Sandbox Code Elimination** (September 1, 2025): Successfully removed all remaining sandbox references, endpoints, tender IDs, and environment detection logic. System is now 100% production-only with direct production URL references and proper CLOVER_ENDPOINTS structure. All TypeScript errors resolved and application building cleanly.