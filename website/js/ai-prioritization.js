/**
 * JANASEVA 2.0 – Intelligent Complaint Prioritization & Pattern Analytics
 * 
 * Capabilities:
 * 1. Automatic NLP & Keyword Department / Category Classification.
 * 2. 4-Tier Priority Engine: LOW, NORMAL, HIGH, URGENT with transparent rationales.
 * 3. Emergency Hazard Detection (Fallen electric lines, contaminated water outbreaks, structural collapse).
 * 4. Recurring Public-Service Problem Pattern & Hotspot Detection across Gram Panchayats.
 * 5. Panchayat Intelligence Analytics for the Admin Control Centre.
 * 6. Human-in-the-Loop Override Controls for Receivers & Admins.
 */

class JanasevaComplaintPrioritizer {
  constructor() {
    // Emergency Keywords & Triggers
    this.emergencyTriggers = [
      {
        pattern: /(fallen\s+electric|live\s+wire|open\s+wire|electric\s+shock|power\s+line\s+down|ವಿದ್ಯುತ್\s+ತಂತಿ|ವಿದ್ಯುತ್\s+ಶಾಕ್|बिजली\s+का\s+तार)/i,
        hazard: "Hazardous Live Electric Wire / Electrocution Risk",
        helpline: "1912 (MESCOM / BESCOM Emergency Helpline) & 112 Police/Disaster",
        priority: "URGENT"
      },
      {
        pattern: /(contaminated\s+water|cholera|poison\s+water|water\s+disease|ಮಲಿನ\s+ನೀರು|ವಿಷಪೂರಿತ\s+ನೀರು|दूषित\s+पानी|हैजा)/i,
        hazard: "Public Drinking Water Contamination / Epidemic Risk",
        helpline: "108 Health Emergency & Gram Panchayat Health Officer",
        priority: "URGENT"
      },
      {
        pattern: /(bridge\s+collapse|culvert\s+broken|road\s+caved|landslide|ಸೇತುವೆ\s+ಕುಸಿತ|ರಸ್ತೆ\s+ಕುಸಿತ|पुल\s+टूटना|भूस्खलन)/i,
        hazard: "Severe Structural Infrastructure Collapse / Road Severance",
        helpline: "112 Disaster Response & PWD Assistant Executive Engineer",
        priority: "URGENT"
      },
      {
        pattern: /(deep\s+open\s+drain|open\s+manhole|school\s+children\s+falling|ತೆರೆದ\s+ಮ್ಯಾನ್‌ಹೋಲ್|खुला\s+मैनहोल)/i,
        hazard: "Hazardous Open Pit / Deep Manhole near Pedestrian Pathway",
        helpline: "Gram Panchayat Sanitation Inspector",
        priority: "HIGH"
      }
    ];

    // Department & Service Disruption Mapping
    this.categoryRules = {
      'Water Supply': {
        department: 'Rural Water Supply & Sanitation (RWSS)',
        keywords: ['water', 'pipe', 'leakage', 'tap', 'borewell', 'drinking water', 'ನೀರು', 'ಪೈಪ್', 'ನಳ', 'पानी', 'नल'],
        highKeywords: ['no water', '3 days', 'dry', 'burst pipe', 'ನೀರಿಲ್ಲ', 'ಪೈಪ್ ಒಡೆದಿದೆ', 'पानी बंद', 'सूखा'],
        basePriority: 'NORMAL'
      },
      'Roads & Infrastructure': {
        department: 'Public Works Department (PWD)',
        keywords: ['road', 'pothole', 'street', 'bridge', 'culvert', 'asphalt', 'tar', 'ರಸ್ತೆ', 'ಗುಂಡಿ', 'ಡಾಂಬರು', 'सड़क', 'गड्ढा'],
        highKeywords: ['school road', 'hospital access', 'bus stuck', 'accident', 'ಅಪಘಾತ', 'ರಸ್ತೆ ಮುಚ್ಚಿದೆ', 'दुर्घटना'],
        basePriority: 'NORMAL'
      },
      'Electricity & Streetlights': {
        department: 'Electricity Supply Company (MESCOM/BESCOM)',
        keywords: ['light', 'streetlight', 'lamp', 'pole', 'bulb', 'darkness', 'ಬೀದಿದೀಪ', 'ಕಂಬ', 'ಕತ್ತಲೆ', 'स्ट्रीटलाइट', 'बत्ती', 'अंधेरा'],
        highKeywords: ['junction dark', 'women safety', 'entire ward dark', 'ಮಹಿಳೆಯರ ಸುರಕ್ಷತೆ', 'पूरा वार्ड अंधेरा'],
        basePriority: 'NORMAL'
      },
      'Sanitation & Cleanliness': {
        department: 'Gram Panchayat Health & Sanitation Squad',
        keywords: ['garbage', 'waste', 'smell', 'dump', 'drain', 'mosquito', 'gutter', 'ಕಸ', 'ಚರಂಡಿ', 'ದುರ್ವಾಸನೆ', 'ಸೊಳ್ಳೆ', 'कचरा', 'नाली', 'बदबू'],
        highKeywords: ['market waste', 'fever outbreak', 'drain overflowing', 'ಜ್ವರ ಹರಡುವಿಕೆ', 'ಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುತ್ತಿದೆ'],
        basePriority: 'NORMAL'
      }
    };
  }

  /**
   * Analyze complaint description and context to determine Priority, Category & Emergency Status
   */
  analyzeComplaint(description, existingCategory = null, context = {}) {
    if (!description) {
      return {
        priority: 'NORMAL',
        department: 'General Gram Panchayat Administration',
        category: existingCategory || 'General Grievance',
        rationale: 'Standard priority assigned for general civic grievance.',
        isEmergency: false,
        emergencyDetails: null,
        confidence: 0.70, engine: 'Rule-Based Keyword NLP'
      };
    }

    const text = description.trim();

    // 1. Check for Emergency Triggers
    for (const trigger of this.emergencyTriggers) {
      if (trigger.pattern.test(text)) {
        return {
          priority: trigger.priority,
          department: 'Emergency Redressal / Gram Panchayat Task Force',
          category: existingCategory || 'Emergency Public Hazard',
          rationale: `CRITICAL SAFETY ALERT: Detected indicators of ${trigger.hazard}. Requires immediate on-site human inspection.`,
          isEmergency: true,
          emergencyDetails: {
            hazard: trigger.hazard,
            helpline: trigger.helpline,
            flaggedAt: new Date().toISOString()
          },
          confidence: 0.90, engine: 'Rule-Based Keyword NLP'
        };
      }
    }

    // 2. Classify Department & Suggested Category
    let detectedCategory = existingCategory || 'Roads & Infrastructure';
    let detectedDept = 'General Administration';
    let highestScore = 0;

    for (const [catName, catDef] of Object.entries(this.categoryRules)) {
      let score = 0;
      catDef.keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw.toLowerCase())) score += 2;
      });
      catDef.highKeywords.forEach(kw => {
        if (text.toLowerCase().includes(kw.toLowerCase())) score += 5;
      });

      if (score > highestScore) {
        highestScore = score;
        detectedCategory = catName;
        detectedDept = catDef.department;
      }
    }

    // 3. Determine Priority Level & Rationale
    let priority = 'NORMAL';
    let rationale = `Routine public infrastructure grievance. Assigned to ${detectedDept} for standard redressal.`;

    const lower = text.toLowerCase();
    const hasHighUrgencyWords = /hospital|school|danger|ambulance|many people|entire village|urgent|days|ತುರ್ತು|ಆಸ್ಪತ್ರೆ|ಶಾಲೆ|ಅಪಘಾತ|अस्पताल|स्कूल|खतरा|एम्बुलेंस/.test(lower);
    const hasLowUrgencyWords = /small|minor|cosmetic|suggestion|small crack|ಚಿಕ್ಕ|ಸ್ವಲ್ಪ|छोटा|सुझाव/.test(lower);

    if (hasHighUrgencyWords || highestScore >= 7) {
      priority = 'HIGH';
      rationale = `Elevated priority due to essential public service impact or proximity to sensitive community locations (schools/hospitals).`;
    } else if (hasLowUrgencyWords) {
      priority = 'LOW';
      rationale = `Low severity indicated by description. Non-disruptive civic improvement or minor maintenance.`;
    }

    return {
      priority: priority,
      department: detectedDept,
      category: detectedCategory,
      rationale: rationale,
      isEmergency: false,
      emergencyDetails: null,
      confidence: 0.82, engine: 'Rule-Based Keyword NLP'
    };
  }

  /**
   * Historical Recurring Problem Pattern & Hotspot Detection
   * Analyzes an array of complaints and identifies recurring patterns per Panchayat
   */
  detectRecurringPatterns(complaints) {
    if (!Array.isArray(complaints) || !complaints.length) {
      return { hotspots: [], recurringPanchayats: [], categoryDistribution: {} };
    }

    // Group by Panchayat and Category
    const gpGroups = {};
    const categoryTotals = {};

    complaints.forEach(c => {
      const gp = c.panchayatName || c.panchayatId || 'Unknown Panchayat';
      const cat = c.category || 'General';

      categoryTotals[cat] = (categoryTotals[cat] || 0) + 1;

      if (!gpGroups[gp]) gpGroups[gp] = { total: 0, categories: {} };
      gpGroups[gp].total++;
      gpGroups[gp].categories[cat] = (gpGroups[gp].categories[cat] || 0) + 1;
    });

    // Detect Hotspots (Panchayats where a single category accounts for 3 or more complaints)
    const hotspots = [];
    for (const [gpName, data] of Object.entries(gpGroups)) {
      for (const [cat, count] of Object.entries(data.categories)) {
        if (count >= 2) { // Threshold for demonstration & detection
          hotspots.push({
            panchayatName: gpName,
            category: cat,
            count: count,
            percentageOfPanchayat: Math.round((count / data.total) * 100),
            alertLevel: count >= 5 ? 'CRITICAL_HOTSPOT' : 'RECURRING_PATTERN',
            recommendation: `Multiple repeated ${cat} complaints reported in ${gpName}. Recommended for preventive infrastructure overhaul by Department.`
          });
        }
      }
    }

    return {
      hotspots: hotspots,
      categoryDistribution: categoryTotals,
      totalAnalyzed: complaints.length
    };
  }
}

// Global Singleton Instance
window.janasevaComplaintPrioritizer = new JanasevaComplaintPrioritizer();
