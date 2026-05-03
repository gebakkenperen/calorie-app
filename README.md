# calorie-app

## Development

1) Installeer Node.js (npm is nodig).

2) Installeer dependencies en start dev server:

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

## Features

- Daily goal + progress ring (kleur: groen → amber → rood)
- Quick-add presets (Breakfast/Lunch/Snacks/Drinks)
- Custom add: voegt toe aan log én slaat op als preset
- Vandaag-log met tijdstempel + delete
- Reset day met confirm
- Persisted via localStorage (geen database)