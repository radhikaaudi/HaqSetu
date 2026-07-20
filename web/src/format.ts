import type { Lang } from "./types";

const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");

const PERIOD: Record<Lang, { month: string; year: string; oneTime: string }> = {
  hi: { month: "/ माह", year: "/ वर्ष", oneTime: "एकमुश्त" },
  mr: { month: "/ महिना", year: "/ वर्ष", oneTime: "एकरकमी" },
  en: { month: "/ month", year: "/ year", oneTime: "one-time" }
};

/** Turns a scheme's free-form benefit object into a short human amount string. */
export function formatBenefit(benefit: Record<string, unknown>, lang: Lang): string {
  const p = PERIOD[lang];
  const month = benefit.amount_inr_per_month;
  const year = benefit.amount_inr_per_year;
  const once = benefit.amount_inr;
  if (typeof month === "number") return `${rupees(month)} ${p.month}`;
  if (typeof year === "number") return `${rupees(year)} ${p.year}`;
  if (typeof once === "number") return `${rupees(once)} ${p.oneTime}`;
  if (typeof benefit.type === "string") return benefit.type;
  return "";
}

const FACT_LABEL: Record<Lang, Record<string, string>> = {
  hi: {
    full_name: "पूरा नाम", age: "उम्र", gender: "लिंग", marital_status: "वैवाहिक स्थिति",
    annual_income_inr: "सालाना आय", household_size: "परिवार के सदस्य", state: "राज्य", district: "ज़िला",
    category: "श्रेणी", owns_land: "ज़मीन", occupation: "काम", children: "बच्चों की जानकारी",
    "children.girls": "बेटियों की संख्या", "children.in_school": "स्कूल जाने वाले बच्चे",
    area_type: "क्षेत्र (गाँव/शहर)", willing_unskilled_work: "मज़दूरी के लिए तैयार"
  },
  mr: {
    full_name: "पूर्ण नाव", age: "वय", gender: "लिंग", marital_status: "वैवाहिक स्थिती",
    annual_income_inr: "वार्षिक उत्पन्न", household_size: "कुटुंब सदस्य", state: "राज्य", district: "जिल्हा",
    category: "प्रवर्ग", owns_land: "जमीन", occupation: "काम", children: "मुलांची माहिती",
    "children.girls": "मुलींची संख्या", "children.in_school": "शाळेत जाणारी मुलं",
    area_type: "क्षेत्र (गाव/शहर)", willing_unskilled_work: "मजुरीसाठी तयार"
  },
  en: {
    full_name: "Full name", age: "Age", gender: "Gender", marital_status: "Marital status",
    annual_income_inr: "Annual income", household_size: "Household size", state: "State", district: "District",
    category: "Category", owns_land: "Land ownership", occupation: "Occupation", children: "Children details",
    "children.girls": "Number of daughters", "children.in_school": "Children in school",
    area_type: "Area (rural/urban)", willing_unskilled_work: "Willing to do manual work"
  }
};

/** Human label for a fact path or a verification marker, in the chosen language. */
export function factLabel(path: string, lang: Lang): string {
  if (path.startsWith("verification:")) return path.replace("verification:", "");
  return FACT_LABEL[lang][path] ?? path.replace(/_/g, " ");
}
