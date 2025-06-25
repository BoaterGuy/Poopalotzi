# Marina Management System - Project Documentation

## Overview
Comprehensive marina management system with admin dashboard, customer portal, employee workflow tools, and Clover payment integration. The system handles pump-out service requests, boat management, customer accounts, and real-time payment processing for marina operations.

## Recent Changes
- ✅ Completed comprehensive Clover integration analysis and testing (June 25, 2025)
- ✅ Fixed website payment forms to include tax calculation consistently ($75 + $6 = $81)  
- ✅ Enhanced payment processing to send customer information from website forms to Clover
- ✅ Verified order creation working correctly with accurate amounts and customer data
- ✅ Confirmed line items display properly: "Service: $75" + "Tax: $6" = "$81 total"
- ⚠️ Identified core issue: API token lacks "Payments" permission scope
- ⚠️ Orders show "paid" state but "OPEN" paymentState, preventing Net Sales reporting
- 🎯 Solution identified: Need API token with "Payments" + "Orders" + "Read" permissions

## Current Status  
✅ **Order Creation**: Orders successfully created in Clover with accurate $81 totals ($75 + $6 tax)
✅ **Tax Integration**: Website now includes tax in all payment flows consistently
✅ **Customer Data**: Names, emails, phones properly stored and linked to Clover orders
✅ **Line Items**: Service and tax breakdown correctly displayed in Clover dashboard
✅ **Token Updated**: New API token with Payments permission installed in system
❌ **Payment Processing**: Still receiving 401 Unauthorized despite token having Payments scope
❌ **Order Completion**: Orders remain in "OPEN" paymentState, not appearing in Net Sales
🔍 **Investigation**: Testing specific API endpoints to identify permission issue

## Clover Integration Status
- Configuration Status: ⚠️ FUNCTIONAL BUT LIMITED - Token permissions insufficient for payment completion
- Merchant ID: 7NV1RDCFDVTC1 (verified and authenticated)
- API Token: Current token has "Orders" + "Read" permissions only, lacks "Payments" scope
- Environment: Sandbox 
- Order Creation: ✅ Complete - orders with customer data, tax, and line items
- Tax Integration: ✅ Complete - consistent $75 + $6 = $81 across all payment flows
- Customer Data: ✅ Complete - names, emails, phones stored and linked to orders
- Payment Completion: ❌ Failed - "Payment must define a valid tender id" error
- Dashboard Impact: Orders remain "Open", don't appear in Net Sales reporting

**Root Cause**: API token lacks "Payments" permission scope
**Solution Steps**:
1. Go to https://sandbox.dev.clover.com/developers/
2. Select merchant 7NV1RDCFDVTC1 → Setup → API Tokens
3. Create new token with "Payments" + "Orders" + "Read" permissions
4. Update token in admin panel for real payment processing

## User Preferences
- Focus on fixing core functionality over extensive explanations
- Prioritize working payment processing for marina services
- Maintain clean, readable code structure

## Login Credentials
- **Member Account**: member@poopalotzi.com / admin123
- **Admin Account**: admin@poopalotzi.com / admin123