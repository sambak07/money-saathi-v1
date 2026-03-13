import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { db, financialProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/financial-products", requireAuth, async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(financialProductsTable)
    .orderBy(financialProductsTable.productCategory, financialProductsTable.institutionName);

  res.json(products);
});

router.post("/financial-products", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { institutionName, productCategory, productName, interestRate, minimumBalance, tenure, fees, keyFeatures, sourceUrl } = req.body;

  if (!institutionName || !productCategory || !productName) {
    res.status(400).json({ message: "Institution name, product category, and product name are required" });
    return;
  }

  const [product] = await db
    .insert(financialProductsTable)
    .values({
      institutionName,
      productCategory,
      productName,
      interestRate: interestRate || null,
      minimumBalance: minimumBalance || null,
      tenure: tenure || null,
      fees: fees || null,
      keyFeatures: keyFeatures || null,
      sourceUrl: sourceUrl || null,
      lastUpdated: new Date(),
    })
    .returning();

  res.status(201).json(product);
});

router.put("/financial-products/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid product ID" });
    return;
  }

  const { institutionName, productCategory, productName, interestRate, minimumBalance, tenure, fees, keyFeatures, sourceUrl } = req.body;

  if (!institutionName || !productCategory || !productName) {
    res.status(400).json({ message: "Institution name, product category, and product name are required" });
    return;
  }

  const [product] = await db
    .update(financialProductsTable)
    .set({
      institutionName,
      productCategory,
      productName,
      interestRate: interestRate || null,
      minimumBalance: minimumBalance || null,
      tenure: tenure || null,
      fees: fees || null,
      keyFeatures: keyFeatures || null,
      sourceUrl: sourceUrl || null,
      lastUpdated: new Date(),
    })
    .where(eq(financialProductsTable.id, id))
    .returning();

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json(product);
});

router.delete("/financial-products/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid product ID" });
    return;
  }

  const [deleted] = await db
    .delete(financialProductsTable)
    .where(eq(financialProductsTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json({ message: "Product deleted" });
});

export default router;
