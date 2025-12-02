/**
 * Medical terminology database and utilities
 * Supports medical abbreviation expansion and critical phrase detection
 */

export const MEDICAL_ABBREVIATIONS: Record<string, string> = {
    // Vital Signs
    BP: "blood pressure",
    HR: "heart rate",
    RR: "respiratory rate",
    T: "temperature",
    O2: "oxygen",
    SpO2: "oxygen saturation",

    // Common Medical Terms
    SOB: "shortness of breath",
    DOB: "date of birth",
    DOE: "dyspnea on exertion",
    CP: "chest pain",
    HA: "headache",
    N_V: "nausea and vomiting",
    Abd: "abdomen",
    Dx: "diagnosis",
    Tx: "treatment",
    Rx: "prescription",
    Hx: "history",
    Sx: "symptoms",

    // Time-related
    BID: "twice daily",
    TID: "three times daily",
    QID: "four times daily",
    PRN: "as needed",
    STAT: "immediately",
    QD: "once daily",
    HS: "at bedtime",
    AC: "before meals",
    PC: "after meals",

    // Routes of Administration
    PO: "by mouth",
    IV: "intravenous",
    IM: "intramuscular",
    SC: "subcutaneous",
    SL: "sublingual",

    // Lab & Diagnostics
    CBC: "complete blood count",
    CMP: "comprehensive metabolic panel",
    BMP: "basic metabolic panel",
    PT: "prothrombin time",
    PTT: "partial thromboplastin time",
    INR: "international normalized ratio",
    HbA1c: "glycated hemoglobin",
    TSH: "thyroid-stimulating hormone",
    ECG: "electrocardiogram",
    EKG: "electrocardiogram",
    CT: "computed tomography",
    MRI: "magnetic resonance imaging",
    CXR: "chest X-ray",

    // Emergency & Critical
    CPR: "cardiopulmonary resuscitation",
    AED: "automated external defibrillator",
    ICU: "intensive care unit",
    ER: "emergency room",
    ED: "emergency department",
    MI: "myocardial infarction",
    CVA: "cerebrovascular accident (stroke)",
    PE: "pulmonary embolism",
    DVT: "deep vein thrombosis",
    COPD: "chronic obstructive pulmonary disease",
    CHF: "congestive heart failure",
    HTN: "hypertension",
    DM: "diabetes mellitus",
    UTI: "urinary tract infection",
    URI: "upper respiratory infection",
};

export const CRITICAL_EMERGENCY_PHRASES = [
    "chest pain",
    "difficulty breathing",
    "severe bleeding",
    "loss of consciousness",
    "stroke symptoms",
    "heart attack",
    "allergic reaction",
    "severe pain",
    "seizure",
    "poisoning",
    "head injury",
    "broken bone",
    "severe burn",
];

export const COMMON_SYMPTOMS = [
    "fever",
    "cough",
    "headache",
    "nausea",
    "vomiting",
    "diarrhea",
    "pain",
    "dizziness",
    "fatigue",
    "weakness",
    "rash",
    "swelling",
    "itching",
];

export const COMMON_MEDICATIONS = [
    "aspirin",
    "ibuprofen",
    "acetaminophen",
    "paracetamol",
    "amoxicillin",
    "metformin",
    "lisinopril",
    "atorvastatin",
    "omeprazole",
    "insulin",
];

/**
 * Expands medical abbreviations in text while preserving original formatting
 */
export function expandMedicalAbbreviations(text: string): string {
    let expandedText = text;

    // Sort by length descending to handle longer abbreviations first
    const sortedAbbrevs = Object.keys(MEDICAL_ABBREVIATIONS).sort(
        (a, b) => b.length - a.length
    );

    for (const abbrev of sortedAbbrevs) {
        // Match abbreviation as whole word (case-insensitive)
        const regex = new RegExp(`\\b${abbrev}\\b`, "gi");
        const expansion = MEDICAL_ABBREVIATIONS[abbrev];

        expandedText = expandedText.replace(
            regex,
            (match) => `${match} (${expansion})`
        );
    }

    return expandedText;
}

/**
 * Detects if text contains critical emergency terms
 */
export function containsEmergencyTerms(text: string): boolean {
    const lowerText = text.toLowerCase();
    return CRITICAL_EMERGENCY_PHRASES.some((phrase) =>
        lowerText.includes(phrase)
    );
}

/**
 * Detects if text contains medical content
 */
export function isMedicalContent(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check for medical abbreviations
    const hasAbbreviation = Object.keys(MEDICAL_ABBREVIATIONS).some((abbrev) =>
        new RegExp(`\\b${abbrev}\\b`, "i").test(text)
    );

    // Check for common medical terms
    const hasMedicalTerm =
        COMMON_SYMPTOMS.some((term) => lowerText.includes(term)) ||
        COMMON_MEDICATIONS.some((term) => lowerText.includes(term)) ||
        CRITICAL_EMERGENCY_PHRASES.some((term) => lowerText.includes(term));

    return hasAbbreviation || hasMedicalTerm;
}

/**
 * Prepares text for medical translation by expanding abbreviations
 * and adding context markers
 */
export function prepareMedicalText(text: string): {
    processedText: string;
    isEmergency: boolean;
    isMedical: boolean;
    detectedTerms: string[];
} {
    const isEmergency = containsEmergencyTerms(text);
    const isMedical = isMedicalContent(text);

    // Detect which medical terms are present
    const detectedTerms: string[] = [];
    const lowerText = text.toLowerCase();

    Object.keys(MEDICAL_ABBREVIATIONS).forEach((abbrev) => {
        if (new RegExp(`\\b${abbrev}\\b`, "i").test(text)) {
            detectedTerms.push(abbrev);
        }
    });

    // Expand abbreviations for better translation
    const processedText = expandMedicalAbbreviations(text);

    return {
        processedText,
        isEmergency,
        isMedical,
        detectedTerms,
    };
}
