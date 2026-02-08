import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

/**
 * Crea una sesión de checkout para pago único
 */
export async function createCheckoutSession({
  priceInCents,
  description,
  userId,
  paymentType,
  successUrl,
  cancelUrl,
}: {
  priceInCents: number;
  description: string;
  userId: string;
  paymentType: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "mxn",
          product_data: {
            name: description,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      paymentType,
    },
  });

  return session;
}

/**
 * Crea una suscripción mensual
 */
export async function createSubscription({
  customerId,
  priceId,
}: {
  customerId: string;
  priceId: string;
}) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  return subscription;
}

/**
 * Crea o recupera un cliente de Stripe
 */
export async function getOrCreateCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name: string;
  userId: string;
}) {
  // Buscar cliente existente
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Crear nuevo cliente
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return customer;
}
