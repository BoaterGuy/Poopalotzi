# Marina Management System - Project Documentation

## Overview
Comprehensive marina management system with admin dashboard, customer portal, employee workflow tools, and Clover payment integration. The system handles pump-out service requests, boat management, customer accounts, and real-time payment processing for marina operations.

## Recent Changes
- ✅ Fixed website payment forms to include tax calculation in Clover orders (June 25, 2025)
- ✅ Enhanced payment processing to send customer information from website forms to Clover
- ✅ Implemented consistent tax handling across all payment flows ($75 + $6 = $81)
- ✅ Added order completion attempts to help with Clover dashboard reporting
- ✅ Verified orders display correctly with line items: "Service: $75" + "Tax: $6" = "$81 total"
- ⚠️ Orders remain "Open" instead of "Paid" due to API token permission limitations
- 🎯 Ready for production: Need API token with "Payments" scope to complete order processing

## Current Status  
✅ **Order Creation**: Orders successfully created in Clover with accurate $81 totals ($75 + $6 tax)
✅ **Tax Integration**: Website now includes tax in all payment flows consistently
✅ **Customer Data**: Names, emails, phones properly stored and linked to Clover orders
✅ **Line Items**: Service and tax breakdown correctly displayed in Clover dashboard
✅ **Transaction Logging**: Payment metadata stored in database with order references
✅ **Website Payments**: Fixed to include tax calculation and customer information
⚠️ **Order Status**: Orders remain "Open" instead of "Paid" due to API token permissions
🎯 **Production Ready**: Need "Payments" scope on API token to complete order processing

## Clover Integration Status
- Configuration Status: ⚠️ PARTIAL - Token permissions insufficient  
- Merchant ID: 7NV1RDCFDVTC1 (verified and authenticated)
- API Token: Current token lacks "Payments" permission scope
- Environment: Sandbox 
- Order Creation: ✅ Working - orders appear in Clover dashboard with correct amounts
- Tax Handling: ✅ Fixed - website now includes tax in all payment flows
- Customer Data: ✅ Working - names and contact info properly stored
- Payment Status: ⚠️ Orders show "Open" instead of "Paid" due to token permissions
- **Current Issue**: Orders don't appear in Net Sales because they remain "Open"
- **Solution**: Create API token with "Payments" permission to complete order processing

## User Preferences
- Focus on fixing core functionality over extensive explanations
- Prioritize working payment processing for marina services
- Maintain clean, readable code structure

## Login Credentials
- **Member Account**: member@poopalotzi.com / admin123
- **Admin Account**: admin@poopalotzi.com / admin123