import app from "./app";
// import { seedFinancialProducts } from "./lib/seedProducts";

const port = Number(process.env["PORT"]) || 8080;

app.listen(port, "0.0.0.0", async () => {
  console.log(`Server listening on port ${port}`);
  // await seedFinancialProducts().catch(err => console.error("Seed error:", err));
});
