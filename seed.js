const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const countrySchema = new mongoose.Schema({
  name: String,
  code: String,
  gdpPerCapita: Number,
  continent: String
});

const Country = mongoose.model('Country', countrySchema);

const countries = [
  { name: 'Afghanistan', code: 'AFG', gdpPerCapita: 500, continent: 'Asia' },
  { name: 'Pakistan', code: 'PAK', gdpPerCapita: 1500, continent: 'Asia' },
  { name: 'India', code: 'IND', gdpPerCapita: 2300, continent: 'Asia' },
  { name: 'United States', code: 'USA', gdpPerCapita: 70000, continent: 'North America' },
  { name: 'United Kingdom', code: 'GBR', gdpPerCapita: 46000, continent: 'Europe' },
  { name: 'Canada', code: 'CAN', gdpPerCapita: 52000, continent: 'North America' },
  { name: 'Australia', code: 'AUS', gdpPerCapita: 64000, continent: 'Oceania' },
  { name: 'Germany', code: 'DEU', gdpPerCapita: 51000, continent: 'Europe' },
  { name: 'Nigeria', code: 'NGA', gdpPerCapita: 2000, continent: 'Africa' },
  { name: 'Kenya', code: 'KEN', gdpPerCapita: 1800, continent: 'Africa' },
  { name: 'Egypt', code: 'EGY', gdpPerCapita: 3500, continent: 'Africa' },
  { name: 'Saudi Arabia', code: 'SAU', gdpPerCapita: 30000, continent: 'Asia' },
  { name: 'Turkey', code: 'TUR', gdpPerCapita: 13000, continent: 'Asia' },
  { name: 'Russia', code: 'RUS', gdpPerCapita: 12000, continent: 'Europe' },
  { name: 'China', code: 'CHN', gdpPerCapita: 12000, continent: 'Asia' },
  { name: 'Japan', code: 'JPN', gdpPerCapita: 40000, continent: 'Asia' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Country.deleteMany({});
  await Country.insertMany(countries);
  console.log('✅ Countries seeded!');
  process.exit(0);
};

seed();
