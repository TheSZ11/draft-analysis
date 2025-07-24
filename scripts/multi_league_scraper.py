#!/usr/bin/env python3
"""
Multi-League FBref Scraper
Enhanced scraper to collect 2024-25 season stats for transfer players from multiple leagues
"""

import pandas as pd
from bs4 import BeautifulSoup
import json
import time
from io import StringIO
import sys
import os

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configuration ---
SEASON = "2024-2025"
MAX_RETRIES = 3
RETRY_DELAY = 5

# League configurations with FBref competition IDs
LEAGUE_CONFIGS = {
    "La Liga": {
        "comp_id": "12",
        "name": "La-Liga",
        "players": [
            {"name": "Martin Zubimendi", "club": "Real Sociedad"},
            {"name": "Jorgen Strand Larsen", "club": "Celta Vigo"}
        ]
    },
    "Bundesliga": {
        "comp_id": "20", 
        "name": "Bundesliga",
        "players": [
            {"name": "Florian Wirtz", "club": "Bayer Leverkusen"},
            {"name": "Hugo Ekitike", "club": "Eintracht Frankfurt"},
            {"name": "Jamie Gittens", "club": "Borussia Dortmund"},
            {"name": "Freddie Woodman", "club": "Bayer Leverkusen"}
        ]
    },
    "Serie A": {
        "comp_id": "11",
        "name": "Serie-A", 
        "players": [
            {"name": "Tijjani Reijnders", "club": "AC Milan"}
        ]
    },
    "Ligue 1": {
        "comp_id": "13",
        "name": "Ligue-1",
        "players": [
            {"name": "Marco Bizot", "club": "Brest"},
            {"name": "Eli Junior Kroupi", "club": "Lorient"},
            {"name": "Adrien Truffert", "club": "Rennes"}
        ]
    },
    "Eredivisie": {
        "comp_id": "23",
        "name": "Eredivisie",
        "players": [
            {"name": "Jordan Henderson", "club": "Ajax"},
            {"name": "Zepiqueno Redmond", "club": "Feyenoord"},
            {"name": "Antoni Milambo", "club": "Feyenoord"}
        ]
    },
    "Super Lig": {
        "comp_id": "26",
        "name": "Super-Lig",
        "players": [
            {"name": "Yasin Ozcan", "club": "Kasimpasa"}
        ]
    }
}

COLUMN_MAP = {
    'Player': 'name', 'Pos': 'position', 'Squad': 'team', 'Age': 'age', 'Min': 'minutes', 
    'Gls': 'goals', 'Ast': 'assists', 'Sh': 'shots', 'SoT': 'shotsOnTarget', 'KP': 'keyPasses', 
    'TklW': 'tacklesWon', 'Int': 'interceptions', 'Succ': 'dribbles', 'Crs': 'accCrosses', 
    'Fls': 'foulsCommitted', 'Fld': 'foulsSuffered', 'Off': 'offsides', 'PKmiss': 'pkMissed', 
    'PKwon': 'pkDrawn', 'OG': 'ownGoals', 'Disp': 'dispossessed', 'Recov': 'recoveries',
    'Won': 'aerialsWon', 'Blocks': 'blockedShots', 'Clr': 'clearances', 'CrdY': 'yellowCards', 
    'CrdR': 'redCards', 'Saves': 'saves', 'PKsv': 'pkSaves', 'Crosses': 'highClaims', 
    'GA': 'goalsConceded', 'CS': 'cleanSheets'
}

def build_urls_for_league(league_config):
    """Build FBref URLs for a specific league"""
    comp_id = league_config["comp_id"]
    name = league_config["name"]
    
    return {
        "standard": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/stats/{SEASON}-{name}-Stats",
        "shooting": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/shooting/{SEASON}-{name}-Stats",
        "passing": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/passing/{SEASON}-{name}-Stats",
        "defense": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/defense/{SEASON}-{name}-Stats",
        "possession": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/possession/{SEASON}-{name}-Stats",
        "goalkeeping": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/keepers/{SEASON}-{name}-Stats"
    }

def get_table_as_df(driver, url, table_id):
    """Navigates to a specific URL and parses the table"""
    print(f"  Fetching table '{table_id}' from {url}...")
    
    driver.get(url)
    time.sleep(5)

    WebDriverWait(driver, 30).until(
        EC.visibility_of_element_located((By.ID, table_id))
    )
    
    page_source = driver.page_source
    soup = BeautifulSoup(page_source.replace("", ""), 'lxml')
    
    table = soup.find('table', id=table_id)
    if table is None:
        raise ValueError(f"Could not find table with id '{table_id}'")

    df = pd.read_html(StringIO(str(table)), flavor='lxml')[0]
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(1)
        
    df = df.loc[:,~df.columns.duplicated()]
    df = df[df['Player'] != 'Player'].reset_index(drop=True)

    return df

def filter_players_from_df(df, target_players):
    """Filter dataframe to only include target players"""
    if df.empty:
        return df
        
    # Create normalized names for matching
    def normalize_name(name):
        return name.lower().strip().replace("'", "").replace("-", " ")
    
    target_names = {normalize_name(p["name"]): p for p in target_players}
    
    filtered_players = []
    for _, row in df.iterrows():
        player_name = normalize_name(str(row.get('Player', '')))
        if player_name in target_names:
            filtered_players.append(row)
            print(f"    ✅ Found: {row.get('Player', 'Unknown')}")
    
    if filtered_players:
        return pd.DataFrame(filtered_players).reset_index(drop=True)
    else:
        return pd.DataFrame()

def scrape_league(driver, league_name, league_config):
    """Scrape data for a specific league"""
    print(f"\n🔍 Scraping {league_name}...")
    print(f"   Target players: {[p['name'] for p in league_config['players']]}")
    
    urls = build_urls_for_league(league_config)
    table_ids = {
        "standard": "stats_standard",
        "shooting": "stats_shooting", 
        "passing": "stats_passing",
        "defense": "stats_defense",
        "possession": "stats_possession",
        "goalkeeping": "stats_keeper"
    }
    
    dataframes = {}
    
    for stat_type, url in urls.items():
        table_id = table_ids[stat_type]
        
        for attempt in range(MAX_RETRIES):
            try:
                df = get_table_as_df(driver, url, table_id)
                # Filter to only target players
                filtered_df = filter_players_from_df(df, league_config['players'])
                dataframes[stat_type] = filtered_df
                break
            except Exception as e:
                print(f"    ❌ Attempt {attempt + 1} failed for {stat_type}: {e}")
                if attempt + 1 == MAX_RETRIES:
                    dataframes[stat_type] = pd.DataFrame()
                else:
                    time.sleep(RETRY_DELAY)
        
        time.sleep(2)
    
    return dataframes

def merge_league_data(dataframes):
    """Merge different stat types for a league"""
    if "standard" not in dataframes or dataframes["standard"].empty:
        return pd.DataFrame()
        
    merged_df = dataframes["standard"]
    merge_keys = ['Player', 'Squad']
    
    for name, df in dataframes.items():
        if name == "standard" or df.empty: 
            continue
        
        unique_cols = [col for col in df.columns if col not in merged_df.columns]
        if unique_cols:
            merged_df = pd.merge(merged_df, df[merge_keys + unique_cols], 
                               on=merge_keys, how='left', suffixes=('', '_drop'))
            merged_df.drop([col for col in merged_df.columns if 'drop' in col], 
                          axis=1, inplace=True)
    
    return merged_df

def clean_and_format_data(df):
    """Clean and format the scraped data"""
    if df.empty:
        return df
        
    # Rename columns
    df = df.rename(columns=COLUMN_MAP)
    
    # Ensure all required columns exist
    required_cols = ['name', 'position', 'team', 'minutes', 'goals', 'assists', 
                     'shots', 'shotsOnTarget', 'keyPasses', 'tacklesWon', 
                     'interceptions', 'clearances', 'blockedShots', 'aerialsWon',
                     'yellowCards', 'redCards', 'saves', 'cleanSheets', 
                     'goalsConceded', 'pkSaves']
    
    for col in required_cols:
        if col not in df.columns:
            df[col] = 0
    
    # Convert numeric columns
    for col in df.columns:
        if col not in ['name', 'position', 'team']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    
    # Clean position data
    if 'position' in df.columns:
        df['position'] = df['position'].str.split(',').str[0].str.slice(0, 2)
        position_map = {'DF': 'D', 'MF': 'M', 'FW': 'F', 'GK': 'G'}
        df['position'] = df['position'].map(position_map).fillna('M')
    
    # Add missing Fantrax columns
    if 'assistsSecond' not in df.columns:
        df['assistsSecond'] = 0
    
    return df

def main():
    print("🚀 Starting Multi-League Transfer Player Scraper...")
    print("=" * 60)
    
    # Count total players to scrape
    total_players = sum(len(config['players']) for config in LEAGUE_CONFIGS.values())
    print(f"Target: {total_players} players across {len(LEAGUE_CONFIGS)} leagues")
    
    print("\nInitializing browser...")
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = uc.Chrome(options=options, use_subprocess=True)
    
    all_players_data = []
    
    try:
        for league_name, league_config in LEAGUE_CONFIGS.items():
            league_dataframes = scrape_league(driver, league_name, league_config)
            merged_df = merge_league_data(league_dataframes)
            
            if not merged_df.empty:
                cleaned_df = clean_and_format_data(merged_df)
                
                # Add league info for reference
                cleaned_df['previous_league'] = league_name
                
                # Convert to records and add to results
                player_records = cleaned_df.to_dict(orient='records')
                all_players_data.extend(player_records)
                
                print(f"  ✅ {league_name}: {len(player_records)} players collected")
            else:
                print(f"  ❌ {league_name}: No data collected")
    
    finally:
        print("\nClosing browser...")
        driver.quit()
    
    # Save results
    if all_players_data:
        output_filename = "transfer_players_stats_2024-25.json"
        with open(output_filename, 'w') as f:
            json.dump(all_players_data, f, indent=2)
        
        print(f"\n✅ SUCCESS! Collected stats for {len(all_players_data)} players")
        print(f"💾 Data saved to: {output_filename}")
        
        # Show summary
        print(f"\n📊 SUMMARY BY LEAGUE:")
        league_counts = {}
        for player in all_players_data:
            league = player.get('previous_league', 'Unknown')
            league_counts[league] = league_counts.get(league, 0) + 1
        
        for league, count in league_counts.items():
            print(f"  {league}: {count} players")
            
    else:
        print("\n❌ No player data collected")
    
    return len(all_players_data)

if __name__ == "__main__":
    players_collected = main()
    sys.exit(0 if players_collected > 0 else 1) 