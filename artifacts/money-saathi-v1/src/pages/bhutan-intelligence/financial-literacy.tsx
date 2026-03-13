import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { BookOpen, ChevronDown, ChevronRight, Calculator, Shield, PiggyBank, TrendingUp } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  icon: typeof BookOpen;
  iconBg: string;
  sections: { heading: string; content: string }[];
}

const TOPICS: Topic[] = [
  {
    id: "interest",
    title: "How Interest Calculation Works",
    icon: Calculator,
    iconBg: "bg-blue-500/10 text-blue-600",
    sections: [
      {
        heading: "Simple Interest",
        content: "Simple interest is calculated only on the principal amount. Formula: Interest = Principal x Rate x Time. For example, if you deposit Nu. 100,000 at 7% for 3 years, you earn Nu. 21,000 in interest (100,000 x 0.07 x 3)."
      },
      {
        heading: "Compound Interest",
        content: "Compound interest is calculated on the principal plus previously earned interest. Your money grows faster because you earn 'interest on interest'. Most Bhutanese banks compound interest quarterly or annually on fixed deposits. A Nu. 100,000 FD at 8% compounded annually for 3 years becomes Nu. 125,971 — that's Nu. 4,971 more than simple interest."
      },
      {
        heading: "How Banks in Bhutan Calculate Interest",
        content: "Savings accounts typically use daily balance method and credit interest quarterly. Fixed deposits use compound interest credited at maturity or annually. Loan interest is usually calculated on reducing balance — as you pay EMI, the outstanding principal reduces, and you pay less interest over time."
      },
      {
        heading: "Tip for Bhutanese Savers",
        content: "When comparing FD rates across banks like BOB, BNB, or BDB, check the compounding frequency. An 8% rate compounded quarterly gives slightly more than 8% compounded annually. Even a small difference adds up over 5–10 years."
      }
    ]
  },
  {
    id: "debt-ratio",
    title: "Understanding Debt Ratio",
    icon: Shield,
    iconBg: "bg-amber-500/10 text-amber-600",
    sections: [
      {
        heading: "What is Debt Ratio?",
        content: "Debt ratio measures how much of your monthly income goes toward paying debts (EMIs, loan payments, credit card dues). Formula: Debt Ratio = Total Monthly Debt Payments / Total Monthly Income x 100. For example, if you earn Nu. 40,000/month and pay Nu. 12,000 in loan EMIs, your debt ratio is 30%."
      },
      {
        heading: "What's a Healthy Debt Ratio?",
        content: "Below 30% is considered healthy — you have enough room for savings and emergencies. Between 30%–50% means you should be cautious about taking on new debt. Above 50% is a warning sign — most of your income is going toward debt, leaving little room for essentials and savings."
      },
      {
        heading: "Why Banks in Bhutan Check This",
        content: "When you apply for a loan at BOB, BNB, or any Bhutanese bank, they calculate your debt-to-income ratio. Most banks prefer it to be below 40–50% before approving new loans. If your ratio is too high, they may reject your application or offer a smaller amount."
      },
      {
        heading: "How to Improve Your Debt Ratio",
        content: "Pay off smaller debts first (debt snowball method). Avoid taking new loans while existing ones are running. Consider consolidating high-interest debt into a lower-rate loan. Increase your income through side work or skill development. Money Saathi tracks your debt ratio automatically — check your Health Score page."
      }
    ]
  },
  {
    id: "emi",
    title: "EMI Explained",
    icon: Calculator,
    iconBg: "bg-emerald-500/10 text-emerald-600",
    sections: [
      {
        heading: "What is EMI?",
        content: "EMI stands for Equated Monthly Instalment. It's a fixed amount you pay every month to repay a loan. Each EMI has two parts: principal repayment and interest payment. In the early months, a larger portion goes toward interest; as the loan matures, more goes toward principal."
      },
      {
        heading: "EMI Calculation",
        content: "EMI = [P x R x (1+R)^N] / [(1+R)^N - 1], where P is Principal, R is monthly interest rate (annual rate / 12 / 100), and N is total number of months. For a Nu. 500,000 housing loan at 10% for 10 years: EMI = approximately Nu. 6,608 per month. Over 10 years, you'd pay a total of Nu. 7,92,960 — meaning Nu. 2,92,960 goes to interest."
      },
      {
        heading: "Tips for Managing EMIs",
        content: "Keep total EMIs below 40% of your monthly income. Use Money Saathi's Loan Calculator to find the best EMI for your budget. If possible, make prepayments — even small extra payments reduce your total interest significantly. Choose a longer tenure for lower EMIs, but remember you'll pay more interest overall."
      },
      {
        heading: "EMI vs Flat Rate Interest",
        content: "Some informal lenders in Bhutan quote flat rate interest, which sounds lower but is actually more expensive. A 10% flat rate on a 3-year loan is equivalent to about 18–19% reducing balance rate. Always compare loans using the reducing balance rate, which is what banks use."
      }
    ]
  },
  {
    id: "emergency",
    title: "Building an Emergency Fund",
    icon: Shield,
    iconBg: "bg-red-500/10 text-red-600",
    sections: [
      {
        heading: "Why You Need an Emergency Fund",
        content: "An emergency fund is money set aside for unexpected events — medical emergencies, job loss, urgent home repairs, or natural disasters. In Bhutan, where formal insurance options are limited, an emergency fund is your most important financial safety net."
      },
      {
        heading: "How Much Should You Save?",
        content: "Aim for 3–6 months of essential expenses. If your monthly expenses are Nu. 30,000, your target emergency fund is Nu. 90,000 to Nu. 180,000. Start small — even Nu. 2,000/month adds up. In one year, that's Nu. 24,000, enough to cover many common emergencies."
      },
      {
        heading: "Where to Keep It",
        content: "Keep your emergency fund in a savings account — it needs to be accessible quickly, not locked in an FD. Consider a separate savings account from your daily-use account to avoid spending it. BOB, BNB, and BDB all offer savings accounts with no lock-in and 4–4.5% interest."
      },
      {
        heading: "Common Emergencies in Bhutan",
        content: "Medical expenses (especially if seeking treatment outside Bhutan in India). Vehicle breakdowns and repairs. Unexpected travel for family events. Home repairs after monsoon damage. Agricultural losses. Having even a small fund helps you avoid high-interest informal borrowing during these times."
      }
    ]
  },
  {
    id: "long-term",
    title: "Long-Term Savings Strategies",
    icon: PiggyBank,
    iconBg: "bg-violet-500/10 text-violet-600",
    sections: [
      {
        heading: "The Power of Starting Early",
        content: "If you start saving Nu. 5,000/month at age 25 in an FD earning 8%, by age 55 you'll have approximately Nu. 74,50,000. If you start at 35, you'll have only Nu. 29,50,000. Starting 10 years earlier more than doubles your wealth — this is the power of compound interest over time."
      },
      {
        heading: "Fixed Deposits — The Bhutanese Favorite",
        content: "FDs are the most popular savings vehicle in Bhutan, offering 7–9% interest. They are safe, predictable, and offered by every bank. For long-term goals (house, children's education), consider a ladder strategy: split your savings into FDs of 1, 2, 3, and 5-year tenures. When shorter FDs mature, reinvest them at the longest tenure for better rates."
      },
      {
        heading: "NPPF — Your Retirement Safety Net",
        content: "The National Pension and Provident Fund (NPPF) is mandatory for government and corporate employees. Both employee and employer contribute. The fund grows tax-free and provides a retirement corpus. If you're self-employed, consider making voluntary contributions to build your retirement savings."
      },
      {
        heading: "Goal-Based Savings",
        content: "Assign each savings pool a specific goal: emergency fund (3–6 months expenses), children's education (10–15 year horizon), house down payment (3–5 years), retirement (long-term). Having clear goals makes it easier to stay disciplined. Money Saathi lets you link savings entries to specific goals."
      },
      {
        heading: "Diversification for Bhutanese Investors",
        content: "Don't put all your savings in one place. A balanced approach: 30% in FDs for safety, 20% in savings account for liquidity, 20% in NPPF/pension, 15% in Bhutan stock market (RSEBL), 15% in gold or land. Adjust based on your age, risk tolerance, and goals."
      }
    ]
  }
];

function TopicAccordion({ topic }: { topic: Topic }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = topic.icon;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/10 transition-colors"
      >
        <div className={`p-2.5 rounded-xl shrink-0 ${topic.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base">{topic.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{topic.sections.length} sections</p>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>

      {isOpen && (
        <div className="border-t border-border/50 px-5 pb-5 space-y-5">
          {topic.sections.map((section, i) => (
            <div key={i} className="pt-4">
              <h4 className="font-bold text-sm text-primary mb-2">{section.heading}</h4>
              <p className="text-sm text-foreground/80 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function FinancialLiteracy() {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-foreground">Financial Literacy Center</h1>
          </div>
          <p className="text-muted-foreground">Learn essential financial concepts explained with Bhutanese context and practical examples.</p>
        </div>

        <div className="space-y-3">
          {TOPICS.map(topic => (
            <TopicAccordion key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
