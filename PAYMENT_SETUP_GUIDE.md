# Payment Integration Setup Guide

## Overview
The donation modal now supports multiple payment methods with custom amounts:
- **Ko-fi** (Quick & Easy)
- **PayPal** (Global)
- **UPI** (India Only)
- **Stripe** (Credit/Debit Cards)

Users can choose their own donation amount and select their preferred payment method.

## Payment Methods Setup

### 1. Ko-fi (Already Configured)
No additional setup needed - already linked to your Ko-fi account.

### 2. PayPal Donation Button

**Step 1:** Create a Donation Button
1. Go to [PayPal Donation Buttons](https://www.paypal.com/donate/buttons)
2. Log in to your PayPal account
3. Click **Create Donation Button**
4. Customize your button settings:
   - Choose currency (USD recommended)
   - Set optional suggested amounts
   - Customize button text
5. Click **Create Button**

**Step 2:** Get the Button ID
1. After creating, PayPal will show you the button code
2. Look for the `hosted_button_id` in the generated link
3. Example link: `https://www.paypal.com/donate/?hosted_button_id=XXXXXXXXXX`
4. Copy the `XXXXXXXXXX` part (your button ID)

**Step 3:** Add to `.env.local`
```bash
NEXT_PUBLIC_PAYPAL_BUTTON_ID=XXXXXXXXXX
```

### 3. UPI Payment (India)

**Step 1:** Get Your UPI ID
- Your UPI ID is your payment address (e.g., `yourname@paytm`, `yourname@phonepe`)
- You can find it in any UPI app (Google Pay, PhonePe, Paytm, etc.)

**Step 2:** Add to `.env.local`
```bash
NEXT_PUBLIC_UPI_ID=yourname@paytm
```

**How it works:**
- When Indian users click UPI, it opens their UPI app with pre-filled details
- They can complete payment directly from their UPI app
- Works with all UPI apps (Google Pay, PhonePe, Paytm, BHIM, etc.)

### 4. Stripe Payment Link (Optional)

**Step 1:** Create a Stripe Account
1. Go to [Stripe](https://stripe.com) and create an account
2. Complete account verification

**Step 2:** Create a Payment Link
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Payment Links** in the left sidebar
3. Click **+ New** to create a payment link
4. Configure:
   - Product name: "Support ARMYBATTLES"
   - Choose "Customers choose what to pay" for custom amounts
   - Or set specific price options
   - Set currency (USD recommended)
5. Click **Create Link**

**Step 3:** Copy the Payment Link
1. Stripe will generate a link like: `https://buy.stripe.com/xxxxxxxxxxxxx`
2. Copy this link

**Step 4:** Add to `.env.local`
```bash
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/xxxxxxxxxxxxx
```

## Environment Configuration

Add these to your `.env.local` file:

```bash
# PayPal Donation Button ID
NEXT_PUBLIC_PAYPAL_BUTTON_ID=your_button_id_here

# UPI ID (India)
NEXT_PUBLIC_UPI_ID=yourname@paytm

# Stripe Payment Link (Optional)
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/xxxxxxxxxxxxx
```

## Features Implemented

1. **Custom donation amounts**: Users choose their own amount
2. **Preset amounts**: Quick selection ($3, $5, $10, $20, $50)
3. **Multiple payment methods**: Ko-fi, PayPal, UPI, Stripe
4. **Redirect-based payments**: Opens payment page in new tab
5. **Responsive design**: Works perfectly on mobile and desktop
6. **Conditional display**: Only shows configured payment methods
7. **Global support**: Options for users worldwide

## Payment Method Availability

Payment methods only appear if configured:
- **Ko-fi**: Always visible (hardcoded link)
- **PayPal**: Shows if `NEXT_PUBLIC_PAYPAL_BUTTON_ID` is set
- **UPI**: Shows if `NEXT_PUBLIC_UPI_ID` is set
- **Stripe**: Shows if `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` is set

## Testing

1. **PayPal**: Create a sandbox button for testing
2. **UPI**: Use a test UPI ID (works only on mobile with UPI apps)
3. **Stripe**: Stripe provides test mode by default

## Security Notes

- All credentials are public and safe to expose in client-side code
- Actual payment processing happens on provider's secure servers
- Never commit your `.env.local` file to version control
- The `.env.example` file has been updated with all configurations

## Recommendations

**For best results, enable:**
1. **Ko-fi** - Easiest for quick donations
2. **PayPal** - Most widely used globally
3. **UPI** - Essential for Indian audience
4. **Stripe** - Best for credit/debit card users

## Support Links

- [PayPal Donation Buttons](https://www.paypal.com/donate/buttons)
- [Stripe Payment Links](https://stripe.com/docs/payment-links)
- [UPI Documentation](https://www.npci.org.in/what-we-do/upi/upi-ecosystem)
