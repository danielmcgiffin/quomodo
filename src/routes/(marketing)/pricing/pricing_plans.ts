export const defaultPlanId = "free"

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "A free plan to get you started!",
    price: "$0",
    priceIntervalName: "per month",
    stripe_price_id: null,
    features: ["MIT Licence", "Fast Performance", "Stripe Integration"],
  },
  {
    id: "basic",
    name: "Basic",
    description:
      "A plan to test the purchase experience. Try buying this with the test credit card 4242424242424242.",
    price: "$49",
    priceIntervalName: "per month",
    stripe_price_id: "price_1SzalNPcqYKiXIgE6eJ3s99K",
    stripe_product_id: "prod_TxVmLXa4KnSeOf",
    features: [
      "Everything in Free",
      "Support us with fake money",
      "Test the purchase experience",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description:
      "A plan to test the upgrade experience. Try buying this with the test credit card 4242424242424242.",
    price: "$249",
    priceIntervalName: "per month",
    stripe_price_id: "price_1SzalhPcqYKiXIgE1X3lJYnY",
    stripe_product_id: "prod_TxVnF0CI7gR8zi",
    features: [
      "Everything in Pro",
      "Try the 'upgrade plan' UX",
      "Still actually free!",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    description:
      "A plan to test the upgrade experience. Try buying this with the test credit card 4242424242424242.",
    price: "$599",
    priceIntervalName: "per month",
    stripe_price_id: "price_1SzalzPcqYKiXIgErlDOkwTq",
    stripe_product_id: "prod_TxVnwX3N0zpFgg",
    features: [
      "Everything in Pro",
      "Try the 'upgrade plan' UX",
      "Still actually free!",
    ],
  },
]
