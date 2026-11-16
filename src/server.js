const { createApp } = require('./app');
const { createDatabase } = require('./database');

const port = Number(process.env.PORT || 3000);
const db = createDatabase();
const app = createApp(db);

app.listen(port, () => {
  console.log(`Parking panel is running at http://localhost:${port}`);
});
