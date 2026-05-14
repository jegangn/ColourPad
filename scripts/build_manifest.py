"""Build manifest.json for the ColorPad 213-SVG set.

Re-derives categories from the actual files in src/assets/pictures/.
Run after replacing or adding SVGs to keep manifest in sync.
"""

import json
import sys
from pathlib import Path

PICTURES = Path(__file__).resolve().parent.parent / "src" / "assets" / "pictures"

# Display name overrides for slugs that don't title-case cleanly.
NAME_OVERRIDES = {
    "atv":            "ATV",
    "ufo":            "UFO",
    "suv":            "SUV",
    "saturn-v-rocket": "Saturn V Rocket",
    "fire-chief-suv": "Fire Chief SUV",
    "tuk-tuk":        "Tuk-Tuk",
    "off-road-dune-buggy": "Off-Road Dune Buggy",
    "aerial-hook-and-ladder-fire-truck": "Hook & Ladder Fire Truck",
    "armoured-military-truck": "Armoured Truck",
    "construction-site":     "Construction Site",
    "construction-trailer":  "Construction Trailer",
    "moon-boot-footprint":   "Moon Footprint",
    "race-finish-flag":      "Finish Flag",
    "city-hall":      "City Hall",
}


def display_name(slug: str) -> str:
    if slug in NAME_OVERRIDES:
        return NAME_OVERRIDES[slug]
    return " ".join(w.capitalize() for w in slug.split("-"))


# Category order = order shown in the picker. Earlier categories appear first.
CATEGORIES = {
    "vehicles": [
        "sedan-car", "sports-car", "race-car", "classic-car", "taxi",
        "police-car", "ambulance", "school-bus", "city-bus",
        "double-decker-bus", "pickup-truck", "delivery-truck", "dump-truck",
        "tow-truck", "monster-truck", "tank", "jeep", "suv", "limousine",
        "ice-cream-truck", "food-truck", "milk-truck", "garbage-truck",
        "mail-van", "campervan", "go-kart", "atv", "golf-cart", "hot-rod",
        "armoured-military-truck", "tuk-tuk", "wagon", "pedal-car", "sled",
        "motorbike", "dirt-bike", "motor-scooter", "skateboard",
        "hoverboard", "unicycle", "tricycle", "snowmobile",
        "off-road-dune-buggy", "race-finish-flag",
    ],
    "fire": [
        "pumper-fire-truck", "ladder-fire-truck",
        "aerial-hook-and-ladder-fire-truck", "fire-chief-suv",
        "fire-boat", "fire-helicopter", "fire-hydrant", "fire-station",
    ],
    "construction": [
        "excavator", "bulldozer", "tower-crane", "mobile-crane",
        "cement-mixer-truck", "concrete-pump-truck", "backhoe-loader",
        "front-end-loader", "skid-steer", "road-roller", "asphalt-paver",
        "forklift", "scissor-lift", "cherry-picker", "crawler-crane",
        "wrecking-ball-crane", "jackhammer", "pile-driver", "trencher",
        "log-loader", "road-grader", "wood-chipper", "snowplough",
        "street-sweeper", "dragline-excavator", "mining-haul-truck",
        "scaffolding", "concrete-saw", "tool-box", "reach-stacker",
        "construction-site", "construction-trailer",
    ],
    "trains": [
        "steam-locomotive", "bullet-train", "cargo-train-carriage",
        "passenger-train-carriage", "tram", "monorail", "subway-train",
        "mine-cart", "train-caboose", "cable-car",
    ],
    "aircraft": [
        "passenger-jet", "propeller-plane", "fighter-jet", "biplane",
        "seaplane", "helicopter", "military-helicopter", "hot-air-balloon",
        "blimp", "paraglider", "drone", "cargo-plane", "stealth-bomber",
        "jetpack",
    ],
    "boats": [
        "sailboat", "yacht", "cruise-ship", "cargo-ship", "fishing-boat",
        "tugboat", "submarine", "speedboat", "canoe", "rowboat",
        "pirate-ship", "ferry", "jet-ski", "raft", "lifeboat", "anchor",
        "lighthouse", "hovercraft",
    ],
    "space": [
        "classic-finned-rocket", "space-shuttle", "space-capsule",
        "saturn-v-rocket", "starship-rocket", "ufo", "astronaut",
        "satellite", "space-station", "lunar-lander", "mars-rover",
        "lunar-rover", "moon-buggy", "ground-telescope", "space-telescope",
        "space-pod", "astronaut-spacewalk", "jetpack-astronaut",
        "space-helmet", "moon-boot-footprint", "planet-earth",
        "planet-mars", "planet-saturn", "full-moon", "crescent-moon",
        "sun", "five-point-star", "shooting-star", "asteroid",
        "spiral-galaxy", "friendly-alien", "tentacle-alien", "space-dog",
        "big-dipper", "black-hole", "comet", "solar-panel-array",
        "satellite-dish", "mars-colony-dome", "alien-spaceship",
        "battle-cruiser", "cargo-shuttle", "escape-pod",
        "exploration-shuttle", "interstellar-cruiser", "mothership",
        "science-vessel", "starfighter",
    ],
    "robots": [
        "classic-robot", "humanoid-robot", "robot-dinosaur", "giant-mech",
        "battle-mech", "hover-bot", "robot-arm", "robot-dog",
        "service-robot", "spider-robot", "tin-robot", "utility-droid",
    ],
    "buildings": [
        "apartment-building", "bank", "barn", "cafe", "church", "city-hall",
        "courthouse", "diner", "factory", "gas-station", "gym", "hospital",
        "house", "kindergarten", "library", "movie-theater", "playground",
        "police-station", "post-office", "school", "shopping-mall", "silo",
        "skyscraper", "supermarket", "swimming-pool", "warehouse",
        "windmill",
    ],
}


def main():
    all_slugs = [s for slugs in CATEGORIES.values() for s in slugs]

    # Cross-check against disk: every SVG should be categorised, every
    # categorised slug should have a file.
    on_disk = {f.stem for f in PICTURES.glob("*.svg")}
    declared = set(all_slugs)
    missing_on_disk = declared - on_disk
    uncategorised = on_disk - declared

    if missing_on_disk:
        print(f"ERROR: {len(missing_on_disk)} categorised slug(s) have no SVG:")
        for s in sorted(missing_on_disk):
            print(f"  - {s}.svg")
        sys.exit(1)

    if uncategorised:
        print(f"WARNING: {len(uncategorised)} SVG file(s) not categorised "
              f"(will not appear in picker):")
        for s in sorted(uncategorised):
            print(f"  - {s}.svg")

    # Duplicate check
    seen = set()
    dupes = [s for s in all_slugs if s in seen or seen.add(s)]
    if dupes:
        print(f"ERROR: duplicate slugs in CATEGORIES: {dupes}")
        sys.exit(1)

    # Build manifest
    entries = []
    for category, slugs in CATEGORIES.items():
        for slug in slugs:
            entries.append({
                "id": slug,
                "name": display_name(slug),
                "category": category,
                "svg": f"{slug}.svg",
            })

    manifest_path = PICTURES / "manifest.json"
    manifest_path.write_text(
        json.dumps(entries, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"Wrote {manifest_path}")
    print(f"  {len(entries)} entries across {len(CATEGORIES)} categories:")
    for cat, slugs in CATEGORIES.items():
        print(f"    {cat:14s} {len(slugs):3d}")


if __name__ == "__main__":
    main()
