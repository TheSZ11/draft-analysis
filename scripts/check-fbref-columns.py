import pandas as pd
from bs4 import BeautifulSoup
import time
from io import StringIO
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configuration ---
SEASON = "2024-2025"

URLS = {
    "standard": f"https://fbref.com/en/comps/9/{SEASON}/stats/{SEASON}-Premier-League-Stats",
    "shooting": f"https://fbref.com/en/comps/9/{SEASON}/shooting/{SEASON}-Premier-League-Stats",
    "passing": f"https://fbref.com/en/comps/9/{SEASON}/passing/{SEASON}-Premier-League-Stats",
    "defense": f"https://fbref.com/en/comps/9/{SEASON}/defense/{SEASON}-Premier-League-Stats",
    "possession": f"https://fbref.com/en/comps/9/{SEASON}/possession/{SEASON}-Premier-League-Stats",
    "goalkeeping": f"https://fbref.com/en/comps/9/{SEASON}/keepers/{SEASON}-Premier-League-Stats"
}

TABLE_IDS = {
    "standard": "stats_standard",
    "shooting": "stats_shooting",
    "passing": "stats_passing",
    "defense": "stats_defense",
    "possession": "stats_possession",
    "goalkeeping": "stats_keeper"
}

def get_table_columns(driver, url, table_id):
    """Get the actual column names from a table, handling multi-level headers"""
    print(f"\n🔍 Checking columns for '{table_id}' from {url}...")
    
    try:
        driver.get(url)
        time.sleep(3)
        
        WebDriverWait(driver, 15).until(
            EC.visibility_of_element_located((By.ID, table_id))
        )
        
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'lxml')
        
        table = soup.find('table', id=table_id)
        if table is None:
            print(f"❌ Table '{table_id}' not found")
            return []
        
        # Try to read the table with pandas to get the actual column names
        try:
            df = pd.read_html(StringIO(str(table)), flavor='lxml')[0]
            
            # Handle multi-level columns
            if isinstance(df.columns, pd.MultiIndex):
                # Get the bottom level (actual stat names)
                columns = df.columns.get_level_values(-1).tolist()
            else:
                columns = df.columns.tolist()
            
            # Filter out empty strings and duplicates
            columns = [col for col in columns if col and col != '']
            columns = list(dict.fromkeys(columns))  # Remove duplicates while preserving order
            
            print(f"✅ Found {len(columns)} actual columns: {columns}")
            return columns
            
        except Exception as e:
            print(f"❌ Error parsing table with pandas: {e}")
            return []
        
    except Exception as e:
        print(f"❌ Error checking '{table_id}': {e}")
        return []

def main():
    print("🔍 Checking available columns in FBRef tables...")
    
    options = uc.ChromeOptions()
    options.add_argument("--headless")  # Run in background
    driver = uc.Chrome(options=options, use_subprocess=True)
    
    try:
        for stat_type, url in URLS.items():
            table_id = TABLE_IDS[stat_type]
            columns = get_table_columns(driver, url, table_id)
            
            # Check for the specific stats we're interested in
            stats_of_interest = ['Fls', 'Fld', 'Off', 'Recov', 'Won', 'Crosses', 'CS', 'Saves', 'PKsv', 'GA']
            found_stats = [col for col in columns if col in stats_of_interest]
            
            if found_stats:
                print(f"🎯 Found stats of interest in {stat_type}: {found_stats}")
            else:
                print(f"❌ No stats of interest found in {stat_type}")
                
            time.sleep(2)
            
    finally:
        driver.quit()
        
    print("\n📋 Summary:")
    print("Stats we're looking for:")
    print("- Fls (Fouls Committed)")
    print("- Fld (Fouls Suffered)") 
    print("- Off (Offsides)")
    print("- Recov (Recoveries)")
    print("- Won (Aerials Won)")
    print("- Crosses (High Claims)")
    print("- CS (Clean Sheets)")
    print("- Saves")
    print("- PKsv (Penalty Saves)")
    print("- GA (Goals Against)")

if __name__ == "__main__":
    main() 