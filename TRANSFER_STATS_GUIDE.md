# 🎯 Transfer Player Stats Collection Guide

## 📊 **Current Situation Analysis**

### ✅ **What We Discovered**
- **49 total players** with 0 minutes in your FPL dataset (new transfers)
- **19 players mapped** to previous clubs from transfer data
- **4 additional players found** in unmapped list that were actually in transfer data
- **Total actionable players: 23** from major leagues with good data availability

### 🔍 **Why Some "Unmapped" Players Had Zero Stats**
Several players like Rayan Ait-Nouri, Marcus Bettinelli, etc. appeared unmapped but were actually **legitimate transfer players** from the transfer file. They have zero stats because they're new to their current PL teams.

## 🎯 **Target Players for Data Collection**

### **Phase 1: Major European Leagues (14 players)**
These have excellent FBref coverage and reliable 2024-25 data:

| **League** | **Players** | **FBref URL** |
|------------|-------------|---------------|
| **La Liga** | Martin Zubimendi (Real Sociedad)<br/>Jorgen Strand Larsen (Celta Vigo) | https://fbref.com/en/comps/12/stats/La-Liga-Stats |
| **Bundesliga** | Florian Wirtz (Bayer Leverkusen)<br/>Hugo Ekitike (Eintracht Frankfurt)<br/>Jamie Gittens (Borussia Dortmund)<br/>Freddie Woodman (Bayer Leverkusen) | https://fbref.com/en/comps/20/stats/Bundesliga-Stats |
| **Serie A** | Tijjani Reijnders (AC Milan) | https://fbref.com/en/comps/11/stats/Serie-A-Stats |
| **Ligue 1** | Marco Bizot (Brest)<br/>Eli Junior Kroupi (Lorient)<br/>Adrien Truffert (Rennes) | https://fbref.com/en/comps/13/stats/Ligue-1-Stats |
| **Eredivisie** | Jordan Henderson (Ajax)<br/>Zepiqueno Redmond (Feyenoord)<br/>Antoni Milambo (Feyenoord) | https://fbref.com/en/comps/23/stats/Eredivisie-Stats |
| **Super Lig** | Yasin Ozcan (Kasimpasa) | https://fbref.com/en/comps/26/stats/Super-Lig-Stats |

### **Phase 2: Skip PL Internal Transfers**
These players were already in Premier League and should have existing stats:
- Christian Norgaard (Brentford) 
- Noni Madueke (Chelsea)
- Djordje Petrovic (Chelsea) 
- Caoimhin Kelleher (Liverpool)
- Marcus Bettinelli (Chelsea ← Chelsea)
- Rayan Ait-Nouri (Man City ← Wolves)

## 📋 **Manual Collection Process**

### **Step-by-Step Instructions**

1. **Visit League URL** → Click on previous team → Find player
2. **Look for 2024-25 season stats** (NOT 2023-24!)
3. **Copy key statistics** into JSON template
4. **Save and import** using provided tools

### **Key Stats to Collect**
Focus on these stats that impact your recommendation system:

**Offensive:**
- Goals, Assists, Shots, Shots on Target, Key Passes

**Defensive:** 
- Tackles Won, Interceptions, Clearances, Blocks, Aerials Won

**General:**
- Minutes Played, Yellow Cards, Red Cards

**Goalkeepers:**
- Saves, Clean Sheets, Goals Conceded, Penalty Saves

### **Data Template**
Use `player_stats_template.json` as your template:

```json
{
  "name": "Martin Zubimendi",
  "team": "ARS", 
  "position": "M",
  "minutes": 2430,
  "goals": 3,
  "assists": 5,
  "shotsOnTarget": 15,
  "shots": 45,
  "keyPasses": 67,
  "tacklesWon": 89,
  "interceptions": 56,
  "clearances": 23,
  "blockedShots": 12,
  "aerialsWon": 34,
  "yellowCards": 4,
  "redCards": 0,
  "previous_club": "Real Sociedad",
  "previous_league": "La Liga",
  "data_source": "FBref 2024-25"
}
```

## 🛠️ **Tools Created for You**

| **File** | **Purpose** | **Usage** |
|----------|-------------|-----------|
| `transfer_collection_plan.json` | Complete player mapping with URLs | Reference for data collection |
| `player_stats_template.json` | JSON template for each player | Copy and fill with FBref data |
| `collected_stats_sample.json` | Example of correct format | See expected structure |
| `import_collected_stats.py` | Import tool for FPL dataset | `python3 import_collected_stats.py import your_file.json` |
| `scripts/multi_league_scraper.py` | Automated scraper (needs dependencies) | Alternative if you install packages |

## 📈 **Expected Impact**

### **Before Collection:**
- 14 high-value players ranked extremely low (zero stats)
- Missing quality options in draft recommendations
- Incomplete transfer market analysis

### **After Collection:**
- Accurate 2024-25 performance data for key transfers
- Better draft rankings based on actual performance
- More strategic transfer insights

## 🚀 **Recommended Next Steps**

### **Option 1: Manual Collection (Recommended)**
1. Start with **La Liga players** (2 players, easiest)
2. Move to **Bundesliga** (4 players, good coverage)
3. Continue through other leagues systematically
4. Use `import_collected_stats.py` to update dataset

### **Option 2: Automated Scraping**
If you want to try the automated approach:
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install pandas beautifulsoup4 selenium undetected-chromedriver lxml

# Run scraper
cd scripts
python3 multi_league_scraper.py
```

### **Option 3: Hybrid Approach**
1. Try automated scraper for major leagues
2. Fall back to manual collection for missed players
3. Combine results using import tool

## ⚠️ **Important Notes**

- **Only use 2024-25 season data** - this is crucial for accuracy
- **Some players may have split seasons** - sum stats across competitions
- **Missing players**: 32 players still need previous club research
- **Quality over quantity**: Focus on the 14 mapped players first

## 🎯 **Success Metrics**

- **Immediate goal**: Collect stats for 14 mapped players
- **Medium term**: Research and collect remaining 32 players  
- **Long term**: Automate this process for future transfer windows

---

**Ready to start?** Begin with Martin Zubimendi and Jorgen Strand Larsen from La Liga - they should be the easiest to find and will validate the process works well. 