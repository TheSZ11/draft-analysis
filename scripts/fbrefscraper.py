import pandas as pd
from bs4 import BeautifulSoup
import json
import time
from io import StringIO

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configuration ---
SEASON = "2024-2025"
MAX_RETRIES = 3 # <<-- Number of times to retry a failed request
RETRY_DELAY = 5 # <<-- Seconds to wait between retries

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

COLUMN_MAP = {
    'Player': 'name', 'Pos': 'position', 'Squad': 'team', 'Age': 'age', 'Min': 'minutes', 'Gls': 'goals', 'Ast': 'assists',
    'Sh': 'shots', 'SoT': 'shotsOnTarget', 'KP': 'keyPasses', 'TklW': 'tacklesWon', 'Int': 'interceptions',
    'Succ': 'dribbles', 'Crs': 'accCrosses', 'Fls': 'foulsCommitted', 'Fld': 'foulsSuffered', 'Off': 'offsides',
    'PKmiss': 'pkMissed', 'PKwon': 'pkDrawn', 'OG': 'ownGoals', 'Disp': 'dispossessed', 'Recov': 'recoveries',
    'Won': 'aerialsWon', 'Blocks': 'blockedShots', 'Clr': 'clearances', 'CrdY': 'yellowCards', 'CrdR': 'redCards',
    # Goalkeeping stats
    'Saves': 'saves', 'PKsv': 'pkSaves', 'Crosses': 'highClaims', 'GA': 'goalsConceded',
    # Clean sheets (calculated from standard stats)
    'CS': 'cleanSheets'
}

def get_table_as_df(driver, url, table_id):
    """Navigates to a specific URL and parses the table. Throws an exception on failure."""
    print(f"\nAttempting to fetch table '{table_id}' from {url}...")
    
    driver.get(url)
    # Increased sleep to ensure JS has time to fire, even on slow connections
    time.sleep(5)

    # Increased timeout for more patience
    WebDriverWait(driver, 30).until(
        EC.visibility_of_element_located((By.ID, table_id))
    )
    
    page_source = driver.page_source
    soup = BeautifulSoup(page_source.replace("", ""), 'lxml')
    
    table = soup.find('table', id=table_id)
    if table is None:
        # This will trigger the retry logic if the table isn't found
        raise ValueError(f"Could not find table with id '{table_id}' in the page source.")

    df = pd.read_html(StringIO(str(table)), flavor='lxml')[0]
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(1)
        
    df = df.loc[:,~df.columns.duplicated()]
    df = df[df['Player'] != 'Player'].reset_index(drop=True)

    print(f"Successfully parsed table '{table_id}'.")
    return df

def calculate_clean_sheets(standard_df):
    """Calculate clean sheets from standard stats table"""
    print("Calculating clean sheets...")
    
    # Clean sheets are typically shown in the standard stats table
    # If not available, we'll need to calculate from goals conceded
    if 'CS' in standard_df.columns:
        return standard_df['CS']
    else:
        # Fallback: calculate from goals conceded (0 goals = clean sheet)
        # This is a simplified approach - in reality, clean sheets are team-based
        print("Warning: Clean sheets not found in data. Setting to 0.")
        return pd.Series([0] * len(standard_df))

def main():
    print("Initializing browser...")
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = uc.Chrome(options=options, use_subprocess=True)

    dataframes = {}
    try:
        for stat_type, url in URLS.items():
            table_id = TABLE_IDS[stat_type]
            
            # --- NEW: RETRY LOGIC ---
            for attempt in range(MAX_RETRIES):
                try:
                    df = get_table_as_df(driver, url, table_id)
                    dataframes[stat_type] = df
                    # If successful, break the retry loop and move to the next URL
                    break
                except Exception as e:
                    print(f"Attempt {attempt + 1} of {MAX_RETRIES} failed for table '{table_id}'. Error: {e}")
                    if attempt + 1 == MAX_RETRIES:
                        print(f"All retries failed for table '{table_id}'. Skipping.")
                        dataframes[stat_type] = pd.DataFrame() # Assign empty dataframe on final failure
                    else:
                        print(f"Retrying in {RETRY_DELAY} seconds...")
                        time.sleep(RETRY_DELAY)
            
            time.sleep(2) # Brief pause between different page requests
    finally:
        print("\nClosing browser.")
        driver.quit()

    # The rest of the script (merging and saving) remains the same
    print("Merging dataframes...")
    if "standard" not in dataframes or dataframes["standard"].empty:
        print("\n❌ Could not fetch the essential 'standard' stats. Aborting merge.")
        return
        
    merged_df = dataframes["standard"]

    merge_keys = ['Player', 'Squad']
    for name, df in dataframes.items():
        if name == "standard" or df.empty: continue
        
        unique_cols = [col for col in df.columns if col not in merged_df.columns]
        merged_df = pd.merge(merged_df, df[merge_keys + unique_cols], on=merge_keys, how='left', suffixes=('', '_drop'))
        merged_df.drop([col for col in merged_df.columns if 'drop' in col], axis=1, inplace=True)

    print("Cleaning and formatting final data...")
    final_df = merged_df.rename(columns=COLUMN_MAP)
    final_cols = list(COLUMN_MAP.values())
    
    for col in final_cols:
        if col not in final_df.columns:
            final_df[col] = 0

    final_df = final_df[[col for col in final_cols if col in final_df.columns]]

    for col in final_df.columns:
        if col not in ['name', 'position', 'team']:
            final_df[col] = pd.to_numeric(final_df[col], errors='coerce').fillna(0).astype(int)
    
    # Handle Fantrax-specific columns
    fantrax_specific_cols = ['cleanSheets', 'saves', 'pkSaves', 'highClaims', 'goalsConceded', 'handBalls', 'assistsSecond']
    for col in fantrax_specific_cols:
        if col not in final_df.columns: 
            final_df[col] = 0

    # Calculate clean sheets if not available
    if 'cleanSheets' in final_df.columns and final_df['cleanSheets'].sum() == 0:
        final_df['cleanSheets'] = calculate_clean_sheets(dataframes["standard"])

    # Handle position mapping
    final_df['position'] = final_df['position'].str.split(',').str[0].str.slice(0, 2)
    position_map = {'DF': 'D', 'MF': 'M', 'FW': 'F', 'GK': 'G'}
    final_df['position'] = final_df['position'].map(position_map).fillna('M')

    # Add missing Fantrax columns
    if 'handBalls' not in final_df.columns:
        final_df['handBalls'] = 0
    if 'assistsSecond' not in final_df.columns:
        final_df['assistsSecond'] = 0

    player_list = final_df.to_dict(orient='records')
    for i, player in enumerate(player_list): 
        player['id'] = str(i + 1)

    output_filename = "fpl-data-2024-2025.json"
    with open(output_filename, 'w') as f:
        json.dump(player_list, f, indent=4)
        
    print(f"\n✅ Success! Full dataset saved to '{output_filename}'")
    print(f"Total players processed: {len(player_list)}")
    
    # Print summary of key stats
    print("\n📊 Data Summary:")
    print(f"Clean Sheets: {final_df['cleanSheets'].sum()} total")
    print(f"Saves: {final_df['saves'].sum()} total")
    print(f"Goals Conceded: {final_df['goalsConceded'].sum()} total")
    print(f"Penalty Saves: {final_df['pkSaves'].sum()} total")

if __name__ == "__main__":
    main()