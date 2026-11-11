// Icon, tone and short description for each crop status card.
export const STATUS_CARDS = {
  fallow: { icon: 'area', tone: 'blue', description: 'Fields not yet in use.' },
  land_prep: { icon: 'fields', tone: 'amber', description: 'Being prepared for planting.' },
  planted: { icon: 'planted', tone: 'green', description: 'Recently planted fields.' },
  growing: { icon: 'sprout', tone: 'green', description: 'Crops in the growing stage.' },
  harvested: { icon: 'harvest', tone: 'amber', description: 'Harvest completed.' },
}
