import { Allergen } from '../types';

export const ALLERGENS: Allergen[] = [
  {
    id: 'gluten',
    name: 'Gluten',
    description: 'Found in wheat, barley, rye, and oats. Causes issues for people with celiac disease or gluten sensitivity.',
    keywords: [
      'wheat', 'barley', 'rye', 'oat', 'oats', 'flour', 'bread', 'pasta', 'semolina',
      'spelt', 'kamut', 'farro', 'durum', 'triticale', 'malt', 'bulgur', 'couscous',
      'gluten', 'starch', 'wheat starch', 'wheat flour', 'breadcrumbs', 'croutons',
      'seitan', 'farina', 'wheat germ', 'wheat bran',
    ],
    color: '#F59E0B',
  },
  {
    id: 'dairy',
    name: 'Dairy / Milk',
    description: 'Contains lactose and milk proteins (casein, whey). Causes issues for those with lactose intolerance or milk allergy.',
    keywords: [
      'milk', 'dairy', 'lactose', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt',
      'whey', 'casein', 'lactose', 'ghee', 'curd', 'kefir', 'fromage', 'brie',
      'cheddar', 'mozzarella', 'parmesan', 'ricotta', 'sour cream', 'half-and-half',
      'condensed milk', 'evaporated milk', 'ice cream', 'custard', 'lactalbumin',
      'lactoglobulin', 'buttermilk', 'skimmed milk',
    ],
    color: '#3B82F6',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    description: 'Egg proteins (albumin, lysozyme) can trigger allergic reactions. Common in baked goods and many processed foods.',
    keywords: [
      'egg', 'eggs', 'egg white', 'egg yolk', 'albumin', 'ovalbumin', 'lysozyme',
      'mayonnaise', 'mayo', 'meringue', 'hollandaise', 'egg powder', 'dried egg',
      'egg solids', 'globulin', 'livetin', 'ovalbumin', 'ovomucin', 'ovomucoid',
      'ovotransferrin', 'silici albuminate',
    ],
    color: '#EAB308',
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    description: 'A legume that causes one of the most common and severe food allergies. Found in many cuisines and unexpected products.',
    keywords: [
      'peanut', 'peanuts', 'groundnut', 'groundnuts', 'peanut butter', 'peanut oil',
      'arachis oil', 'monkey nuts', 'beer nuts', 'mixed nuts', 'nut butter',
    ],
    color: '#92400E',
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    description: 'Includes almonds, cashews, walnuts, hazelnuts, pistachios, and more. A common and potentially severe allergen.',
    keywords: [
      'almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 'hazelnut',
      'hazelnuts', 'pistachio', 'pistachios', 'pecan', 'pecans', 'brazil nut',
      'brazil nuts', 'macadamia', 'pine nut', 'pine nuts', 'nut', 'nuts',
      'praline', 'marzipan', 'nougat', 'gianduja', 'nutella',
    ],
    color: '#78350F',
  },
  {
    id: 'fish',
    name: 'Fish',
    description: 'Fish allergy is one of the most common allergies and often persists into adulthood. Includes all finfish.',
    keywords: [
      'fish', 'salmon', 'tuna', 'cod', 'haddock', 'halibut', 'tilapia', 'bass',
      'flounder', 'trout', 'anchovy', 'anchovies', 'sardine', 'sardines', 'herring',
      'mackerel', 'mahi', 'swordfish', 'snapper', 'pollock', 'fish sauce',
      'worcestershire', 'caesar dressing', 'fish oil', 'fish stock',
    ],
    color: '#0EA5E9',
  },
  {
    id: 'shellfish',
    name: 'Shellfish / Crustaceans',
    description: 'Crustaceans like shrimp, crab, and lobster are potent allergens. The allergy often causes severe reactions.',
    keywords: [
      'shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crawfish', 'crayfish',
      'barnacle', 'krill', 'langoustine', 'shellfish', 'crustacean', 'seafood',
    ],
    color: '#F97316',
  },
  {
    id: 'molluscs',
    name: 'Molluscs',
    description: 'Includes squid, oysters, mussels, scallops, and clams. A distinct allergen category from crustacean shellfish.',
    keywords: [
      'squid', 'calamari', 'oyster', 'oysters', 'mussel', 'mussels', 'scallop',
      'scallops', 'clam', 'clams', 'octopus', 'snail', 'escargot', 'abalone',
      'mollusc', 'mollusk', 'whelk', 'cockle',
    ],
    color: '#7C3AED',
  },
  {
    id: 'soy',
    name: 'Soy',
    description: 'Soybeans and soy products are widely used in processed foods. A common allergen especially in infants.',
    keywords: [
      'soy', 'soya', 'soybean', 'soybeans', 'tofu', 'tempeh', 'miso', 'edamame',
      'soy sauce', 'tamari', 'shoyu', 'soy milk', 'soy protein', 'textured vegetable protein',
      'tvp', 'hydrolyzed soy protein', 'soy lecithin', 'natto',
    ],
    color: '#65A30D',
  },
  {
    id: 'sesame',
    name: 'Sesame',
    description: 'Sesame seeds and sesame oil are increasingly recognized as a major allergen. Found in many Middle Eastern and Asian foods.',
    keywords: [
      'sesame', 'sesame seed', 'sesame oil', 'tahini', 'til', 'gingelly', 'benne',
      'hummus', 'sesame flour', 'sesame paste',
    ],
    color: '#D97706',
  },
  {
    id: 'mustard',
    name: 'Mustard',
    description: 'Mustard seeds and mustard products are a recognized EU allergen. Present in condiments, dressings, and spice blends.',
    keywords: [
      'mustard', 'mustard seed', 'mustard powder', 'mustard oil', 'mustard leaf',
      'dijon', 'wholegrain mustard', 'yellow mustard', 'brown mustard',
    ],
    color: '#CA8A04',
  },
  {
    id: 'celery',
    name: 'Celery',
    description: 'Celery stalks, leaves, seeds, and root can all cause allergic reactions. Often found in soups and spice blends.',
    keywords: [
      'celery', 'celeriac', 'celery seed', 'celery salt', 'celery oil', 'celery root',
    ],
    color: '#4ADE80',
  },
  {
    id: 'lupin',
    name: 'Lupin',
    description: 'Lupin (lupine) flour and seeds are used in some gluten-free and European foods. May cross-react with peanut allergy.',
    keywords: [
      'lupin', 'lupine', 'lupin flour', 'lupin seed', 'lupin bean',
    ],
    color: '#A78BFA',
  },
  {
    id: 'sulphites',
    name: 'Sulphites / Sulphur Dioxide',
    description: 'Used as preservatives in dried fruits, wine, and processed foods. Can trigger asthma and other reactions.',
    keywords: [
      'sulphite', 'sulphites', 'sulfite', 'sulfites', 'sulphur dioxide', 'sulfur dioxide',
      'so2', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228',
      'metabisulphite', 'metabisulfite',
    ],
    color: '#F43F5E',
  },
  {
    id: 'corn',
    name: 'Corn / Maize',
    description: 'Corn derivatives are ubiquitous in processed foods. Corn sensitivity can cause digestive and inflammatory symptoms.',
    keywords: [
      'corn', 'maize', 'cornstarch', 'corn starch', 'corn syrup', 'high fructose corn syrup',
      'hfcs', 'corn flour', 'cornmeal', 'corn oil', 'popcorn', 'grits', 'hominy',
      'polenta', 'dextrose', 'maltodextrin', 'corn sugar',
    ],
    color: '#FCD34D',
  },
  {
    id: 'nightshades',
    name: 'Nightshades',
    description: 'The nightshade family includes tomatoes, peppers, eggplant, and potatoes. May cause inflammation in sensitive individuals.',
    keywords: [
      'tomato', 'tomatoes', 'pepper', 'peppers', 'bell pepper', 'eggplant', 'aubergine',
      'potato', 'potatoes', 'paprika', 'chili', 'chilli', 'cayenne', 'goji berry',
      'tomatillo', 'nightshade',
    ],
    color: '#EF4444',
  },
];

export const ALLERGEN_MAP: Record<string, Allergen> = ALLERGENS.reduce(
  (acc, allergen) => ({ ...acc, [allergen.id]: allergen }),
  {}
);

export function detectAllergens(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const allergen of ALLERGENS) {
    for (const keyword of allergen.keywords) {
      // Use word-boundary-like check: keyword appears as a whole word/phrase
      const regex = new RegExp(`(?<![a-z])${keyword.replace(/[-/]/g, '[-/]')}(?![a-z])`, 'i');
      if (regex.test(lowerText)) {
        if (!found.includes(allergen.id)) {
          found.push(allergen.id);
        }
        break;
      }
    }
  }

  return found;
}
