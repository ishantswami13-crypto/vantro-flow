import json
import math
import random

# Simulate the Natural Earth land polygon data
# Generates ~50,000 land surface points

def lat_lng_in_land(lat, lng):
    """Approximate land detection based on major continents"""
    regions = [
        # India & South Asia
        (6, 37, 68, 98),
        # Southeast Asia
        (-10, 28, 95, 155),
        # China
        (18, 54, 98, 135),
        # Japan/Korea
        (30, 46, 129, 146),
        # Europe
        (35, 71, -12, 40),
        # UK/Ireland
        (49, 61, -11, 2),
        # Africa
        (-35, 38, -18, 52),
        # North America
        (15, 72, -168, -52),
        # Greenland
        (59, 84, -57, -11),
        # South America
        (-56, 13, -82, -34),
        # Australia
        (-44, -10, 113, 154),
        # New Zealand
        (-47, -34, 166, 178),
        # Russia/Siberia
        (50, 78, 30, 180),
        # Middle East
        (12, 42, 35, 65),
        # Central Asia
        (37, 56, 50, 90),
        # Madagascar
        (-26, -12, 43, 51),
        # Sri Lanka
        (6, 10, 79, 82),
        # Indonesia
        (-8, 6, 95, 141),
        # Philippines
        (4, 21, 117, 127),
        # Alaska
        (54, 72, -168, -130),
        # Canada islands
        (70, 84, -120, -60),
        # Scandinavia
        (55, 72, 5, 31),
        # Iceland
        (63, 67, -25, -13),
    ]
    for (lat_min, lat_max, lng_min, lng_max) in regions:
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return True
    return False

random.seed(42)
points = []
step = 0.4  # Resolution — smaller = more points

lat = -90.0
while lat <= 90:
    lng = -180.0
    while lng <= 180:
        if lat_lng_in_land(lat, lng):
            jitter_lat = lat + (random.random() - 0.5) * 0.2
            jitter_lng = lng + (random.random() - 0.5) * 0.2
            elevation = random.random() * 0.015
            points.append({
                "lat": round(jitter_lat, 4),
                "lng": round(jitter_lng, 4),
                "elev": round(elevation, 4)
            })
        lng += step
    lat += step

print(f"Generated {len(points)} points")

with open("public/globe-points.json", "w") as f:
    json.dump(points, f, separators=(',', ':'))

print("Saved to public/globe-points.json")
