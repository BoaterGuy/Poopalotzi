# Poopalotzi - Boat Pump-Out Service

Professional boat pump-out service application with admin dashboard, customer portal, employee workflow tools, and Brevo email integration.

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Configure your environment variables in `.env`:
   - `BREVO_API_KEY`: Your Brevo API key for email services
   - `ADMIN_EMAIL`: Admin email address (e.g., poopalotzillc@gmail.com)
   - `SENDGRID_FROM_EMAIL`: From email address for notifications
   - `DATABASE_URL`: PostgreSQL database connection string

## Running the Application

- Development: `npm run dev`
- Build: `npm run build`
- Production: `npm start`

## Features

- User authentication and role management
- Boat pump-out service scheduling
- Credit-based payment system
- Email notifications via Brevo
- Admin dashboard for user management
- Employee workflow tools
- Real-time service tracking

## Environment Variables

All sensitive configuration should be stored in environment variables, not in code. See `.env.example` for required variables.

## Security

- All API keys and secrets are stored in environment variables
- Authentication uses secure session management
- Role-based access control for admin functions