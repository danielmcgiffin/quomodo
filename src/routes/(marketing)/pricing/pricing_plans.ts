export const defaultPlanId = "free"

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "One workspace to map your first operational atlas.",
    price: "$0",
    priceIntervalName: "per month",
    stripe_price_id: null,
    features: [
      "1 workspace",
      "Core atlas CRUD (roles, systems, processes, actions, flags)",
      "Up to 3 collaborators",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "For small teams formalizing repeatable operations.",
    price: "$49",
    priceIntervalName: "per month",
    stripe_price_id: "price_1T0MQHLeepTzGf1NbD28pMhu",
    stripe_product_id: "prod_TyJ2z0btpQXugh",
    features: [
      "Everything in Free",
      "Up to 10 collaborators",
      "Priority support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For multi-team operators running several active workflows.",
    price: "$99",
    priceIntervalName: "per month",
    stripe_price_id: "price_1T0MS3LeepTzGf1NDO7Pl11a",
    stripe_product_id: "prod_TyJ4L2QxWhOsPg",
    features: [
      "Everything in Basic",
      "Up to 50 collaborators",
      "Expanded support SLAs",
    ],
  },
]
