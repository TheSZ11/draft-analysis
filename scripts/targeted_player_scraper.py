#!/usr/bin/env python3
"""
Targeted Player Scraper
Focused scraper for the 3 remaining high-priority transfer players with flexible name matching
"""

import pandas as pd
from bs4 import BeautifulSoup
import json
import time
from io import StringIO
import sys
import re

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configuration ---
SEASON = "2024-2025"
MAX_RETRIES = 3
RETRY_DELAY = 5

# Targeted player configurations with alternative name variations
TARGET_PLAYERS = {
    "La Liga": {
        "comp_id": "12",
        "name": "La-Liga",
        "players": [
            {
                "primary_name": "Martin Zubimendi",
                "alt_names": ["Martín Zubimendi", "M. Zubimendi", "Zubimendi"],
                "club": "Real Sociedad",
                "alt_clubs": ["Real Sociedad", "Sociedad"]
            },
            {
                "primary_name": "Jorgen Strand Larsen", 
                "alt_names": ["Jørgen Strand Larsen", "J. Strand Larsen", "Strand Larsen"],
                "club": "Celta Vigo",
                "alt_clubs": ["Celta Vigo", "Celta", "RC Celta"]
            }
        ]
    },
    "Super Lig": {
        "comp_id": "26",
        "name": "Super-Lig",
        "players": [
            {
                "primary_name": "Yasin Ozcan",
                "alt_names": ["Y. Ozcan", "Yasin Özcan", "Ozcan"],
                "club": "Kasimpasa",
                "alt_clubs": ["Kasimpasa", "Kasımpaşa", "Kasimpasa SK"]
            }
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

def normalize_name(name):
    """Normalize names for flexible matching"""
    if not name:
        return ""
    # Remove accents, convert to lowercase, remove extra spaces
    normalized = str(name).lower().strip()
    normalized = re.sub(r'[àáâãäå]', 'a', normalized)
    normalized = re.sub(r'[èéêë]', 'e', normalized)
    normalized = re.sub(r'[ìíîï]', 'i', normalized)
    normalized = re.sub(r'[òóôõöø]', 'o', normalized)
    normalized = re.sub(r'[ùúûü]', 'u', normalized)
    normalized = re.sub(r'[ñ]', 'n', normalized)
    normalized = re.sub(r'[ç]', 'c', normalized)
    # Remove punctuation and extra spaces
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()

def build_urls_for_league(league_config):
    """Build FBref URLs for a specific league"""
    comp_id = league_config["comp_id"]
    name = league_config["name"]
    
    return {
        "standard": f"https://fbref.com/en/comps/{comp_id}/{SEASON}/stats/{SEASON}-{name}-Stats",
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

def find_players_with_debug(df, target_players, league_name):
    """Find players with detailed debugging"""
    if df.empty:
        print(f"    ❌ Empty dataframe for {league_name}")
        return pd.DataFrame()
    
    print(f"    🔍 Searching in {len(df)} total players...")
    
    # Show some sample player names for debugging
    sample_names = df['Player'].head(10).tolist() if 'Player' in df.columns else []
    print(f"    📝 Sample names in data: {sample_names[:5]}")
    
    found_players = []
    
    for target in target_players:
        primary_name = target["primary_name"]
        alt_names = target["alt_names"]
        club = target["club"]
        alt_clubs = target["alt_clubs"]
        
        print(f"    🎯 Looking for: {primary_name} at {club}")
        print(f"       Alt names: {alt_names}")
        print(f"       Alt clubs: {alt_clubs}")
        
        # Try to find by name variations
        player_found = False
        for _, row in df.iterrows():
            player_name = str(row.get('Player', ''))
            team_name = str(row.get('Squad', ''))
            
            # Normalize names for comparison
            norm_player = normalize_name(player_name)
            norm_team = normalize_name(team_name)
            
            # Check all name variations
            name_matches = False
            for name_var in [primary_name] + alt_names:
                norm_target = normalize_name(name_var)
                if norm_target in norm_player or norm_player in norm_target:
                    name_matches = True
                    break
            
            # Check all club variations
            club_matches = False
            for club_var in [club] + alt_clubs:
                norm_club = normalize_name(club_var)
                if norm_club in norm_team or norm_team in norm_club:
                    club_matches = True
                    break
            
            if name_matches and club_matches:
                print(f"    ✅ FOUND: {player_name} at {team_name}")
                found_players.append(row)
                player_found = True
                break
            elif name_matches:
                print(f"    ⚠️  Name match but wrong club: {player_name} at {team_name}")
            elif club_matches:
                print(f"    ⚠️  Club match: {team_name} (checking {player_name})")
        
        if not player_found:
            print(f"    ❌ NOT FOUND: {primary_name}")
            
            # Show players from the target club for debugging
            club_players = []
            for _, row in df.iterrows():
                team_name = str(row.get('Squad', ''))
                norm_team = normalize_name(team_name)
                for club_var in [club] + alt_clubs:
                    norm_club = normalize_name(club_var)
                    if norm_club in norm_team or norm_team in norm_club:
                        club_players.append(row.get('Player', 'Unknown'))
                        break
            
            if club_players:
                print(f"       Players at {club}: {club_players[:10]}")
            else:
                print(f"       No players found at {club} (club might not be in league)")
    
    if found_players:
        return pd.DataFrame(found_players).reset_index(drop=True)
    else:
        return pd.DataFrame()

def scrape_targeted_players(driver, league_name, league_config):
    """Scrape data for targeted players in a specific league"""
    print(f"\n🔍 Scraping {league_name}...")
    target_names = [p['primary_name'] for p in league_config['players']]
    print(f"   Target players: {target_names}")
    
    urls = build_urls_for_league(league_config)
    
    # Just get standard stats for now
    try:
        df = get_table_as_df(driver, urls["standard"], "stats_standard")
        filtered_df = find_players_with_debug(df, league_config['players'], league_name)
        return {"standard": filtered_df}
    except Exception as e:
        print(f"    ❌ Error scraping {league_name}: {e}")
        return {"standard": pd.DataFrame()}

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
    print("🎯 Starting Targeted Player Scraper...")
    print("=" * 60)
    
    total_players = sum(len(config['players']) for config in TARGET_PLAYERS.values())
    print(f"Target: {total_players} high-priority players")
    
    print("\nInitializing browser...")
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = uc.Chrome(options=options, use_subprocess=True)
    
    all_players_data = []
    
    try:
        for league_name, league_config in TARGET_PLAYERS.items():
            dataframes = scrape_targeted_players(driver, league_name, league_config)
            
            if not dataframes["standard"].empty:
                cleaned_df = clean_and_format_data(dataframes["standard"])
                
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
        output_filename = "targeted_players_stats_2024-25.json"
        with open(output_filename, 'w') as f:
            json.dump(all_players_data, f, indent=2)
        
        print(f"\n✅ SUCCESS! Collected stats for {len(all_players_data)} players")
        print(f"💾 Data saved to: {output_filename}")
        
        # Show summary
        for player in all_players_data:
            print(f"  📊 {player['name']} ({player['previous_league']}): {player['minutes']} mins, {player['goals']} goals, {player['assists']} assists")
            
    else:
        print("\n❌ No player data collected")
        print("This might be due to:")
        print("  • Different name spellings in FBref")
        print("  • Players not in these leagues for 2024-25")
        print("  • Club names different in FBref")
    
    return len(all_players_data)

if __name__ == "__main__":
    players_collected = main()
    sys.exit(0 if players_collected > 0 else 1) 