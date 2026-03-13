import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, getProfileType, calculateScore, calculateBusinessScore } from "../lib/financialEngine";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Money Saathi AI — a friendly, knowledgeable financial advisor specializing in Bhutan's financial ecosystem. You have deep knowledge of:

- Bhutanese banks: Bank of Bhutan (BOB), Bhutan National Bank (BNB), Bhutan Development Bank (BDB), T Bank, Druk PNB
- Bhutanese currency: Ngultrum (BTN), pegged 1:1 with Indian Rupee (INR)
- Local interest rates: Savings (4-4.5%), FDs (7-9%), Housing loans (9-11%), Personal loans (12-15%)
- NPPF (National Pension and Provident Fund) for retirement
- RSEBL (Royal Securities Exchange of Bhutan Limited) stock market
- RICBL (Royal Insurance Corporation of Bhutan) and BICL insurance
- Bhutanese tax system and government financial policies
- Rural and agricultural financial considerations
- GNH (Gross National Happiness) philosophy and its impact on financial planning

Guidelines:
- Always use BTN currency format: "Nu. X" (e.g., Nu. 50,000)
- Be practical and actionable — give specific numbers and steps
- Reference Bhutanese institutions by name
- Be culturally sensitive to Bhutanese values and family structures
- Keep responses concise but thorough (2-4 paragraphs max)
- If asked something outside finance, politely redirect to financial topics
- Use simple language — many users may be first-time financial planners`;

let openaiClient: any = null;

function getOpenAIClient() {
  if (openaiClient) return openaiClient;

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error("AI integration is not configured");
  }

  const OpenAI = require("openai").default;
  openaiClient = new OpenAI({ apiKey, baseURL });
  return openaiClient;
}

router.post("/ask-ai", requireAuth, async (req, res): Promise<void> => {
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ message: "Message is required" });
    return;
  }

  let client;
  try {
    client = getOpenAIClient();
  } catch {
    res.status(503).json({ message: "AI assistant is currently unavailable" });
    return;
  }

  try {
    const summary = await getFinancialSummary(req.userId!);
    const profileType = await getProfileType(req.userId!);
    const isBusiness = profileType === "small_business";

    let scoreInfo = "";
    if (summary.totalMonthlyIncome > 0) {
      if (isBusiness) {
        const bScore = calculateBusinessScore(summary);
        scoreInfo = `\n\nUser's current financial snapshot (Business mode):
- Monthly Revenue: Nu. ${Math.round(summary.totalMonthlyIncome).toLocaleString()}
- Monthly Operating Expenses: Nu. ${Math.round(summary.totalMonthlyExpenses).toLocaleString()}
- Monthly Obligations: Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}
- Cash Reserves: Nu. ${Math.round(summary.totalSavingsBalance).toLocaleString()}
- Financial Health Score: ${Math.round(bScore.totalScore)}/100 (${bScore.category})
- Profit Margin: ${Math.round(bScore.profitMargin * 100)}%
- Debt-to-Revenue Ratio: ${Math.round(bScore.debtRatio * 100)}%`;
      } else {
        const score = calculateScore(summary);
        scoreInfo = `\n\nUser's current financial snapshot (Individual mode):
- Monthly Income: Nu. ${Math.round(summary.totalMonthlyIncome).toLocaleString()}
- Monthly Expenses: Nu. ${Math.round(summary.totalMonthlyExpenses).toLocaleString()}
- Monthly Obligations: Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}
- Total Savings: Nu. ${Math.round(summary.totalSavingsBalance).toLocaleString()}
- Financial Health Score: ${Math.round(score.totalScore)}/100 (${score.category})
- Debt Ratio: ${Math.round(score.debtRatio * 100)}%
- Emergency Fund Coverage: ${Math.round(score.emergencyFundCoverage * 10) / 10} months`;
      }
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT + scoreInfo },
    ];

    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await client.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to get AI response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }
  }
});

export default router;
