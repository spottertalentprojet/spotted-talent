# Configuration Stripe (Entreprise)

Ces fonctions sont prêtes pour :
- `stripe-create-checkout-session`
- `stripe-create-customer-portal`
- `stripe-webhook`

## Variables d'environnement Supabase Functions

Configurer ces secrets dans Supabase :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Price IDs Stripe (abonnements)
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_YEARLY`
- `STRIPE_PRICE_BOOST_MONTHLY`
- `STRIPE_PRICE_BOOST_YEARLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`

### Price IDs Stripe (add-ons)
- `STRIPE_PRICE_ADDON_URGENT_LABEL_MONTHLY`
- `STRIPE_PRICE_ADDON_URGENT_LABEL_YEARLY`
- `STRIPE_PRICE_ADDON_SPONSORED_VISIBILITY_MONTHLY`
- `STRIPE_PRICE_ADDON_SPONSORED_VISIBILITY_YEARLY`
- `STRIPE_PRICE_ADDON_SMART_SCREENING_MONTHLY`
- `STRIPE_PRICE_ADDON_SMART_SCREENING_YEARLY`
- `STRIPE_PRICE_ADDON_SMS_PACK_MONTHLY`
- `STRIPE_PRICE_ADDON_SMS_PACK_YEARLY`

## Déploiement des fonctions

```bash
supabase functions deploy stripe-create-checkout-session
supabase functions deploy stripe-create-customer-portal
supabase functions deploy stripe-webhook
```

## Webhook Stripe

Dans Stripe, pointer le webhook vers :

`https://<project-ref>.functions.supabase.co/stripe-webhook`

Événements recommandés :
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
