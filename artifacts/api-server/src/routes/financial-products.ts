import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { db, financialProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/financial-products", async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(financialProductsTable);
    res.json(rows);
  } catch (error) {
    console.error("financial-products route error:", error);
    res.status(500).json({ message: "Failed to load financial products", error: String(error) });
  }
});

router.post("/financial-products", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const {
    institutionName, productCategory, productName,
    interestRate, minimumBalance, tenure, fees, keyFeatures, sourceUrl,
    interestRateMin, interestRateMax, minimumBalanceValue,
    tenureMonthsMin, tenureMonthsMax, feeValue,
    productSubcategory, targetSegment, currency, isActive,
  } = req.body;

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
      interestRateMin: interestRateMin ?? null,
      interestRateMax: interestRateMax ?? null,
      minimumBalanceValue: minimumBalanceValue ?? null,
      tenureMonthsMin: tenureMonthsMin ?? null,
      tenureMonthsMax: tenureMonthsMax ?? null,
      feeValue: feeValue ?? null,
      productSubcategory: productSubcategory || null,
      targetSegment: targetSegment || null,
      currency: currency || "BTN",
      isActive: isActive ?? true,
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

  const {
    institutionName, productCategory, productName,
    interestRate, minimumBalance, tenure, fees, keyFeatures, sourceUrl,
    interestRateMin, interestRateMax, minimumBalanceValue,
    tenureMonthsMin, tenureMonthsMax, feeValue,
    productSubcategory, targetSegment, currency, isActive,
  } = req.body;

  if (!institutionName || !productCategory || !productName) {
    res.status(400).json({ message: "Institution name, product category, and product name are required" });
    return;
  }

  const updates: Record<string, unknown> = {
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
  };

  if (interestRateMin !== undefined) updates.interestRateMin = interestRateMin;
  if (interestRateMax !== undefined) updates.interestRateMax = interestRateMax;
  if (minimumBalanceValue !== undefined) updates.minimumBalanceValue = minimumBalanceValue;
  if (tenureMonthsMin !== undefined) updates.tenureMonthsMin = tenureMonthsMin;
  if (tenureMonthsMax !== undefined) updates.tenureMonthsMax = tenureMonthsMax;
  if (feeValue !== undefined) updates.feeValue = feeValue;
  if (productSubcategory !== undefined) updates.productSubcategory = productSubcategory || null;
  if (targetSegment !== undefined) updates.targetSegment = targetSegment || null;
  if (currency !== undefined) updates.currency = currency || "BTN";
  if (isActive !== undefined) updates.isActive = isActive;

  const [product] = await db
    .update(financialProductsTable)
    .set(updates)
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
