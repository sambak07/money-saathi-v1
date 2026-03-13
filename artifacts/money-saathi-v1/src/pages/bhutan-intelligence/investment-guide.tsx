import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { TrendingUp, BarChart3, ArrowRightLeft, Target, ChevronDown, ChevronRight } from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: typeof TrendingUp;
  iconBg: string;
  content: { heading: string; text: string }[];
}

const SECTIONS: GuideSection[] = [
  {
    id: "stock-market",
    title: "Bhutan Stock Market Basics",
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10 text-emerald-600",
    content: [
      {
        heading: "Royal Securities Exchange of Bhutan (RSEBL)",
        text: "RSEBL is Bhutan's only stock exchange, established in 1993. It currently lists around 20 companies across sectors like banking (BOB, BNB, BNBL), insurance (RICBL, BICL), manufacturing (BFAL, PCAL), and telecom (TashiCell). Trading happens on weekday mornings, and the market is relatively small but growing."
      },
      {
        heading: "How to Start Investing",
        text: "To invest in Bhutanese stocks, you need to: 1) Open a depository account with the Royal Securities Exchange, 2) Choose a registered broker (most banks offer brokerage services), 3) Fund your account and place buy orders. Minimum investment can be as low as 1 share. BOB and BNB both offer brokerage services."
      },
      {
        heading: "Understanding Stock Returns",
        text: "Stock returns come in two forms: capital gains (when you sell a share for more than you paid) and dividends (annual profit sharing by the company). Bhutanese stocks historically offer dividend yields of 3–8%, which is competitive with FD rates. Some companies like BOB and RICBL have paid consistent dividends for over a decade."
      },
      {
        heading: "Risks to Know",
        text: "The Bhutanese stock market has limited liquidity — you may not always find a buyer or seller quickly. Stock prices can be volatile. Company information may be limited compared to larger markets. Start with well-established companies with a track record of dividend payments. Never invest your emergency fund in stocks."
      }
    ]
  },
  {
    id: "dividends",
    title: "Dividend Investing",
    icon: BarChart3,
    iconBg: "bg-blue-500/10 text-blue-600",
    content: [
      {
        heading: "What Are Dividends?",
        text: "Dividends are a portion of a company's profits distributed to shareholders. In Bhutan, many listed companies pay annual dividends. For example, if you own 100 shares of a company and they declare a Nu. 20/share dividend, you receive Nu. 2,000."
      },
      {
        heading: "High-Dividend Stocks in Bhutan",
        text: "Banking and insurance companies tend to be reliable dividend payers. Bank of Bhutan, Bhutan National Bank, and RICBL have historically paid strong dividends. Look for companies with consistent earnings and a history of paying dividends for 5+ years."
      },
      {
        heading: "Dividend Yield",
        text: "Dividend yield = Annual Dividend Per Share / Current Share Price x 100. A higher yield means more income per invested Ngultrum. A stock priced at Nu. 200 paying Nu. 16 dividend has an 8% yield. Compare this with FD rates (7–9%) to evaluate which gives better returns."
      },
      {
        heading: "Dividend Reinvestment Strategy",
        text: "Instead of spending dividends, reinvest them by buying more shares. This creates a compounding effect similar to compound interest in FDs. Over 10–20 years, reinvested dividends can significantly increase your total portfolio value."
      }
    ]
  },
  {
    id: "fd-vs-equity",
    title: "FD vs Equity Comparison",
    icon: ArrowRightLeft,
    iconBg: "bg-amber-500/10 text-amber-600",
    content: [
      {
        heading: "Safety vs Growth",
        text: "Fixed deposits are safe — your principal is guaranteed by the bank. Returns are predictable (7–9% in Bhutan). Equity (stocks) carry risk — prices can fall, but historically offer higher long-term returns. For Bhutanese investors, FDs are suitable for short-to-medium term goals, while stocks work better for 5+ year horizons."
      },
      {
        heading: "Returns Comparison",
        text: "FDs: 7–9% per year, guaranteed. Bhutan stocks: historically 8–15% per year including dividends (but with ups and downs). Savings account: 4–4.5%. Inflation in Bhutan: 4–6%. FDs barely beat inflation. Stocks have the potential to grow your wealth above inflation over long periods."
      },
      {
        heading: "Liquidity",
        text: "Savings accounts offer instant access. FDs have a lock-in period — early withdrawal incurs a penalty (typically 1–2% lower rate). Stocks can be sold during trading hours, but finding a buyer in Bhutan's small market may take time. For emergency money, use savings accounts. For planned goals, match the instrument to your timeline."
      },
      {
        heading: "A Balanced Approach",
        text: "Don't choose only one — use both. A suggested split for a moderate-risk Bhutanese investor: 50% in FDs for safety and predictable returns, 30% in dividend-paying Bhutanese stocks for growth, 20% in savings/NPPF for liquidity and retirement. Adjust based on your age — younger investors can take more risk."
      }
    ]
  },
  {
    id: "wealth-planning",
    title: "Long-Term Wealth Planning",
    icon: Target,
    iconBg: "bg-violet-500/10 text-violet-600",
    content: [
      {
        heading: "Setting Financial Goals",
        text: "Define specific goals with timelines: Emergency fund (build in 1–2 years), House down payment (3–5 years, Nu. 5–10 lakh), Children's education (10–15 years), Retirement (20–30 years). Each goal needs a different savings strategy and investment instrument."
      },
      {
        heading: "The 50/30/20 Rule for Bhutan",
        text: "A simple budgeting framework: 50% of income for needs (rent, food, utilities, transport), 30% for wants (entertainment, dining out, festivals), 20% for savings and debt repayment. If you earn Nu. 40,000/month: Nu. 20,000 for needs, Nu. 12,000 for wants, Nu. 8,000 for savings. Adjust the ratios based on your situation — if you have high debt, shift more toward the 20%."
      },
      {
        heading: "Land and Property in Bhutan",
        text: "Real estate is a traditional wealth-building strategy in Bhutan. Land values in Thimphu and Paro have appreciated significantly. However, property requires large capital, is illiquid, and maintenance costs add up. If you invest in property, ensure it doesn't consume all your savings — maintain diversification."
      },
      {
        heading: "Inflation Protection",
        text: "With inflation at 4–6% in Bhutan, your money loses purchasing power over time. Nu. 100,000 today will buy only about Nu. 55,000 worth of goods in 10 years at 6% inflation. To beat inflation, your investments must earn above the inflation rate. FDs at 8% give a real return of 2–4%. Stocks historically offer better inflation protection."
      },
      {
        heading: "Building Generational Wealth",
        text: "In Bhutanese culture, family financial security spans generations. Strategies: Build a diversified portfolio of FDs, stocks, and property. Ensure adequate insurance coverage. Create a will or succession plan. Educate the next generation about financial management. Start children's savings accounts early — even Nu. 1,000/month from birth grows significantly by the time they need it for education."
      }
    ]
  }
];

function SectionAccordion({ section }: { section: GuideSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = section.icon;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/10 transition-colors"
      >
        <div className={`p-2.5 rounded-xl shrink-0 ${section.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base">{section.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{section.content.length} topics</p>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>

      {isOpen && (
        <div className="border-t border-border/50 px-5 pb-5 space-y-5">
          {section.content.map((item, i) => (
            <div key={i} className="pt-4">
              <h4 className="font-bold text-sm text-primary mb-2">{item.heading}</h4>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function InvestmentGuide() {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Investment Guide</h1>
          <p className="text-muted-foreground mt-1">Understand investment options available in Bhutan and build a strategy for long-term wealth.</p>
        </div>

        <div className="space-y-3">
          {SECTIONS.map(section => (
            <SectionAccordion key={section.id} section={section} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
