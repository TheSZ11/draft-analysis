#!/usr/bin/env python3
"""
Import Collected Stats
Import manually collected 2024-25 season stats into the FPL dataset
"""

import json
import os
from datetime import datetime

def import_player_stats(stats_file):
    """
    Import manually collected stats into the FPL dataset
    
    Args:
        stats_file: JSON file containing collected player stats
    """
    
    # Load current FPL dataset
    with open('public/fpl-data.json', 'r') as f:
        fpl_data = json.load(f)
    
    # Load collected stats
    if not os.path.exists(stats_file):
        print(f"❌ Stats file not found: {stats_file}")
        return False
    
    with open(stats_file, 'r') as f:
        collected_stats = json.load(f)
    
    # Convert fpl_data to dict for faster lookup
    player_dict = {player['name']: i for i, player in enumerate(fpl_data)}
    
    updated_count = 0
    not_found_count = 0
    
    print("🔄 Importing collected player stats...")
    print("=" * 60)
    
    # Process each collected player
    for player_stats in collected_stats:
        player_name = player_stats.get('name', '').strip()
        
        if not player_name:
            print(f"⚠️  Skipping entry with no name")
            continue
        
        if player_name in player_dict:
            player_index = player_dict[player_name]
            
            # Update the player's stats
            original_player = fpl_data[player_index]
            
            # Core stats that affect recommendations
            stats_to_update = [
                'minutes', 'goals', 'assists', 'assistsSecond', 
                'shotsOnTarget', 'shots', 'keyPasses', 'tacklesWon',
                'interceptions', 'clearances', 'blockedShots', 'aerialsWon',
                'saves', 'cleanSheets', 'goalsConceded', 'pkSaves',
                'yellowCards', 'redCards'
            ]
            
            # Track what changed
            changes = []
            for stat in stats_to_update:
                if stat in player_stats and player_stats[stat] != original_player.get(stat, 0):
                    old_value = original_player.get(stat, 0)
                    new_value = player_stats[stat]
                    original_player[stat] = new_value
                    changes.append(f"{stat}: {old_value} → {new_value}")
            
            if changes:
                print(f"✅ Updated {player_name}:")
                for change in changes[:3]:  # Show first 3 changes
                    print(f"   • {change}")
                if len(changes) > 3:
                    print(f"   • ... and {len(changes) - 3} more changes")
                updated_count += 1
            else:
                print(f"ℹ️  No changes needed for {player_name}")
                
        else:
            print(f"❌ Player not found in dataset: {player_name}")
            not_found_count += 1
    
    print("=" * 60)
    print(f"📊 IMPORT SUMMARY:")
    print(f"   • Players updated: {updated_count}")
    print(f"   • Players not found: {not_found_count}")
    
    if updated_count > 0:
        # Create backup
        backup_filename = f"fpl-data-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        os.rename('public/fpl-data.json', f'public/{backup_filename}')
        
        # Save updated dataset
        with open('public/fpl-data.json', 'w') as f:
            json.dump(fpl_data, f, indent=2)
        
        print(f"💾 Original dataset backed up to: {backup_filename}")
        print(f"💾 Updated dataset saved to: fpl-data.json")
        
        return True
    else:
        print("ℹ️  No updates made to dataset")
        return False

def create_sample_stats_file():
    """
    Create a sample stats file showing the expected format
    """
    
    sample_data = [
        {
            "name": "Martin Zubimendi",
            "team": "ARS",  # Current PL team code
            "position": "M",
            "minutes": 2430,  # 2024-25 season minutes
            "goals": 3,
            "assists": 5,
            "assistsSecond": 2,
            "shotsOnTarget": 15,
            "shots": 45,
            "keyPasses": 67,
            "tacklesWon": 89,
            "interceptions": 56,
            "clearances": 23,
            "blockedShots": 12,
            "aerialsWon": 34,
            "saves": 0,
            "cleanSheets": 0,
            "goalsConceded": 0,
            "pkSaves": 0,
            "yellowCards": 4,
            "redCards": 0,
            "previous_club": "Real Sociedad",
            "previous_league": "La Liga",
            "data_source": "FBref 2024-25",
            "collection_date": "2025-01-16",
            "notes": "All competitions combined"
        }
    ]
    
    with open('collected_stats_sample.json', 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print("📝 Sample stats file created: collected_stats_sample.json")
    print("   Use this format for your collected data")

def validate_stats_file(stats_file):
    """
    Validate the format of a collected stats file
    """
    
    try:
        with open(stats_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    if not isinstance(data, list):
        print("❌ File must contain a list of player objects")
        return False
    
    required_fields = ['name', 'minutes', 'goals', 'assists']
    
    for i, player in enumerate(data):
        if not isinstance(player, dict):
            print(f"❌ Entry {i+1} is not a valid object")
            return False
        
        for field in required_fields:
            if field not in player:
                print(f"❌ Entry {i+1} missing required field: {field}")
                return False
        
        if not player['name'].strip():
            print(f"❌ Entry {i+1} has empty name")
            return False
    
    print(f"✅ File format is valid ({len(data)} players)")
    return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("USAGE:")
        print("  python3 import_collected_stats.py <command> [file]")
        print("")
        print("COMMANDS:")
        print("  sample    - Create a sample stats file")
        print("  validate  - Validate a stats file format")
        print("  import    - Import stats into FPL dataset")
        print("")
        print("EXAMPLES:")
        print("  python3 import_collected_stats.py sample")
        print("  python3 import_collected_stats.py validate my_stats.json")
        print("  python3 import_collected_stats.py import my_stats.json")
    else:
        command = sys.argv[1].lower()
        
        if command == "sample":
            create_sample_stats_file()
        elif command == "validate":
            if len(sys.argv) < 3:
                print("❌ Please provide a file to validate")
            else:
                validate_stats_file(sys.argv[2])
        elif command == "import":
            if len(sys.argv) < 3:
                print("❌ Please provide a file to import")
            else:
                if validate_stats_file(sys.argv[2]):
                    import_player_stats(sys.argv[2])
        else:
            print(f"❌ Unknown command: {command}") 