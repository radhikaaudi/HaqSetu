import type { Lang, Localized } from "./types";

export const LANGUAGES: { code: Lang; label: string; speech: string }[] = [
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
  { code: "mr", label: "मराठी", speech: "mr-IN" },
  { code: "en", label: "English", speech: "en-IN" }
];

/** Reads a localized string, falling back to Hindi then English if a regional key is absent. */
export function pick(text: Localized | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang] ?? text.hi ?? text.en ?? "";
}

type UiKey =
  | "tagline"
  | "speak_title"
  | "speak_hint"
  | "tap_to_speak"
  | "listening"
  | "type_instead"
  | "upload_title"
  | "upload_hint"
  | "add_photo"
  | "change_photo"
  | "remove"
  | "cta"
  | "try_example"
  | "working"
  | "working_hint"
  | "start_over"
  | "read_aloud"
  | "stop_reading"
  | "sec_papers"
  | "sec_claims"
  | "sec_paperwork"
  | "why"
  | "eligible"
  | "needs_info"
  | "not_eligible"
  | "needs_info_hint"
  | "download_form"
  | "bring_these"
  | "where_submit"
  | "deadline"
  | "no_deadline"
  | "filled_from"
  | "field_needs_info"
  | "empty_claims"
  | "verifier_note"
  | "error_title"
  | "try_again"
  | "nothing_yet";

export const UI: Record<Lang, Record<UiKey, string>> = {
  hi: {
    tagline: "जो कागज़ आप नहीं पढ़ सकते, उससे आपके हक़ तक",
    speak_title: "अपनी बात बोलिए",
    speak_hint: "बताइए आप कौन हैं और आपकी स्थिति क्या है",
    tap_to_speak: "बोलने के लिए दबाएँ",
    listening: "सुन रहे हैं…",
    type_instead: "या यहाँ लिखिए",
    upload_title: "कागज़ की फोटो लगाइए",
    upload_hint: "कोई भी सरकारी कागज़ या नोटिस",
    add_photo: "फोटो जोड़ें",
    change_photo: "फोटो बदलें",
    remove: "हटाएँ",
    cta: "मेरे हक़ दिखाइए",
    try_example: "सुनीता का उदाहरण आज़माएँ",
    working: "आपके हक़ खोजे जा रहे हैं…",
    working_hint: "आपके शब्द और कागज़ पढ़े जा रहे हैं",
    start_over: "नया शुरू करें",
    read_aloud: "सुनें",
    stop_reading: "रोकें",
    sec_papers: "आपके कागज़ का मतलब",
    sec_claims: "आप क्या पा सकते हैं",
    sec_paperwork: "आपका तैयार कागज़",
    why: "क्यों:",
    eligible: "आप पात्र हैं",
    needs_info: "और जानकारी चाहिए",
    not_eligible: "अभी पात्र नहीं",
    needs_info_hint: "फैसले के लिए यह जानकारी चाहिए:",
    download_form: "भरा हुआ फॉर्म डाउनलोड करें",
    bring_these: "ये कागज़ ले जाएँ",
    where_submit: "कहाँ जमा करें",
    deadline: "अंतिम तारीख",
    no_deadline: "कोई तय तारीख नहीं",
    filled_from: "यह जानकारी से भरा गया:",
    field_needs_info: "इन खानों के लिए जानकारी चाहिए:",
    empty_claims: "अभी कोई पक्का हक़ नहीं मिला। नीचे दी गई जानकारी जोड़ें और दोबारा कोशिश करें।",
    verifier_note: "हर हक़ किसी नियम से और हर भरा खाना किसी तथ्य से जुड़ा है — HaqSetu अंदाज़ा नहीं लगाता।",
    error_title: "कुछ गड़बड़ हो गई",
    try_again: "दोबारा कोशिश करें",
    nothing_yet: "बोलिए या कागज़ की फोटो लगाइए"
  },
  mr: {
    tagline: "जो कागद तुम्ही वाचू शकत नाही, त्यातून तुमच्या हक्कांपर्यंत",
    speak_title: "तुमचं बोला",
    speak_hint: "तुम्ही कोण आहात आणि तुमची परिस्थिती काय आहे ते सांगा",
    tap_to_speak: "बोलण्यासाठी दाबा",
    listening: "ऐकत आहोत…",
    type_instead: "किंवा इथे लिहा",
    upload_title: "कागदाचा फोटो लावा",
    upload_hint: "कोणताही सरकारी कागद किंवा नोटीस",
    add_photo: "फोटो जोडा",
    change_photo: "फोटो बदला",
    remove: "काढा",
    cta: "माझे हक्क दाखवा",
    try_example: "सुनीताचं उदाहरण पाहा",
    working: "तुमचे हक्क शोधत आहोत…",
    working_hint: "तुमचे शब्द आणि कागद वाचले जात आहेत",
    start_over: "नवीन सुरू करा",
    read_aloud: "ऐका",
    stop_reading: "थांबा",
    sec_papers: "तुमच्या कागदाचा अर्थ",
    sec_claims: "तुम्हाला काय मिळू शकतं",
    sec_paperwork: "तुमचा तयार कागद",
    why: "का:",
    eligible: "तुम्ही पात्र आहात",
    needs_info: "अधिक माहिती हवी",
    not_eligible: "सध्या पात्र नाही",
    needs_info_hint: "निर्णयासाठी ही माहिती हवी:",
    download_form: "भरलेला फॉर्म डाउनलोड करा",
    bring_these: "हे कागद सोबत न्या",
    where_submit: "कुठे जमा करा",
    deadline: "शेवटची तारीख",
    no_deadline: "ठराविक तारीख नाही",
    filled_from: "ही माहितीवरून भरलं:",
    field_needs_info: "या रकान्यांसाठी माहिती हवी:",
    empty_claims: "अजून कोणताही निश्चित हक्क सापडला नाही. खालील माहिती जोडा आणि पुन्हा प्रयत्न करा.",
    verifier_note: "प्रत्येक हक्क एका नियमाशी आणि प्रत्येक भरलेलं रकाना एका तथ्याशी जोडलेलं आहे — HaqSetu अंदाज लावत नाही.",
    error_title: "काहीतरी चुकलं",
    try_again: "पुन्हा प्रयत्न करा",
    nothing_yet: "बोला किंवा कागदाचा फोटो लावा"
  },
  en: {
    tagline: "From paper you can't read to the rights you're owed",
    speak_title: "Speak your situation",
    speak_hint: "Tell us who you are and what your situation is",
    tap_to_speak: "Tap to speak",
    listening: "Listening…",
    type_instead: "Or type here",
    upload_title: "Add a photo of a paper",
    upload_hint: "Any government document or notice",
    add_photo: "Add photo",
    change_photo: "Change photo",
    remove: "Remove",
    cta: "Show my rights",
    try_example: "Try Sunita's example",
    working: "Finding what you're owed…",
    working_hint: "Reading your words and your papers",
    start_over: "Start over",
    read_aloud: "Listen",
    stop_reading: "Stop",
    sec_papers: "What your paper means",
    sec_claims: "What you can claim",
    sec_paperwork: "Your ready paperwork",
    why: "Why:",
    eligible: "You qualify",
    needs_info: "Needs more info",
    not_eligible: "Not eligible yet",
    needs_info_hint: "To decide, we still need:",
    download_form: "Download the filled form",
    bring_these: "Bring these documents",
    where_submit: "Where to submit",
    deadline: "Deadline",
    no_deadline: "No fixed deadline",
    filled_from: "Filled from:",
    field_needs_info: "These fields still need information:",
    empty_claims: "No confirmed rights yet. Add the information below and try again.",
    verifier_note: "Every right is backed by a rule and every filled field by a fact — HaqSetu never guesses.",
    error_title: "Something went wrong",
    try_again: "Try again",
    nothing_yet: "Speak, or add a photo of a paper"
  }
};

export const EXAMPLE_TRANSCRIPT: Record<Lang, string> = {
  hi: "मेरा नाम सुनीता है और मेरी उम्र 41 साल है। मैं विधवा हूँ। मेरे दो बच्चे हैं, जिनमें एक बेटी है जो स्कूल जाती है। मेरी सालाना आय पचास हज़ार रुपये है। मैं उत्तर प्रदेश में रहती हूँ।",
  mr: "माझं नाव सुनीता आहे आणि माझं वय ४१ वर्षं आहे. मी विधवा आहे. मला दोन मुलं आहेत, त्यात एक मुलगी आहे जी शाळेत जाते. माझं वार्षिक उत्पन्न पन्नास हजार रुपये आहे. मी उत्तर प्रदेशात राहते.",
  en: "My name is Sunita and I am 41 years old. I am a widow. I have two children, including one daughter who goes to school. My annual income is fifty thousand rupees. I live in Uttar Pradesh."
};
