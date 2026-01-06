import csv
import json
import networkx as nx
from collections import defaultdict
import sys

removesmallcountries = len(sys.argv) > 1 and sys.argv[1] == "removesmall"
if removesmallcountries:
    threshold = int(sys.argv[2])
minyear = 0
maxyear = 2025
if len(sys.argv) > 3:
    minyear = int(sys.argv[3])
if len(sys.argv) > 4:
    maxyear = int(sys.argv[4])
small = set()
populationdata = {}
with open("population.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        populationdata[row["Country"]] = {}
        for k,v in row.items():
            if k != "Country" and k.strip() != "" and v.strip() != "":
                populationdata[row["Country"]][int(k)] = float(v)
                if float(v) < threshold:
                    small.add(row["Country"])

print("Removed", small)
years = set()
for country, data in populationdata.items():
    years.update(data.keys())
years = sorted(list(years))
nonpermanentcountriesneedswork = set(["Czechoslovakia", "West Germany", "East Germany", "Yugoslavia", "Soviet Union", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Uzbekistan", "Armenia", "Azerbaijan", "Georgia", "Serbia", "Montenegro", "Belarus", "Bosnia and Herzegovina", "Croatia", "Czechia", "Estonia", "Germany", "Latvia", "Lithuania", "Moldova", "Russian Federation", "Serbia and Montenegro", "Slovakia", "Slovenia", "Macedonia", "Ukraine"])
if removesmallcountries:
    nonpermanentcountriesneedswork -= small

temporalgraph = nx.DiGraph()
hierarchicalgraph = nx.DiGraph()
countries = set()
for country, data in populationdata.items():
    if country in small and removesmallcountries: continue
    countries.add(country)
    for y in years:        
        if y not in data:
            continue
        temporalgraph.add_node((country, y), population=data[y])
        hierarchicalgraph.add_node((country, y), population=data[y])


for country in ["Lithuania", "Moldova", "Estonia", "Latvia", "Georgia", "Ukraine", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Uzbekistan", "Belarus", "Moldova", "Russian Federation", "Armenia", "Azerbaijan", "Georgia"]:
    if country in small and removesmallcountries: continue
    assert((country, 1991) in temporalgraph.nodes)
    temporalgraph.add_edge(("Soviet Union", 1990), (country, 1991))

nonpermanentcountriesneedswork -= set(["Soviet Union", "Lithuania", "Moldova", "Estonia", "Latvia", "Georgia", "Ukraine", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Uzbekistan", "Belarus", "Moldova", "Russian Federation", "Armenia", "Azerbaijan", "Georgia"])

for country in ["Croatia", "Slovenia", "Macedonia", "Bosnia and Herzegovina", "Serbia and Montenegro"]:
    if country in small and removesmallcountries: continue
    assert((country, 1992) in temporalgraph.nodes)
    temporalgraph.add_edge(("Yugoslavia", 1991), (country, 1992))
nonpermanentcountriesneedswork -= set(["Yugoslavia", "Croatia", "Slovenia", "Macedonia", "Bosnia and Herzegovina", "Serbia and Montenegro"])

for country in ["Czechia", "Slovakia"]:
    if country in small and removesmallcountries: continue
    assert((country, 1993) in temporalgraph.nodes)
    temporalgraph.add_edge(("Czechoslovakia", 1992), (country, 1993))
nonpermanentcountriesneedswork -= set(["Czechoslovakia", "Czechia", "Slovakia"])

for country in ["West Germany", "East Germany"]:
    if country in small and removesmallcountries: continue
    assert((country, 1990) in temporalgraph.nodes)
    temporalgraph.add_edge((country, 1990), ("Germany", 1991))
nonpermanentcountriesneedswork -= set(["West Germany", "East Germany", "Germany"])


for country in ["Serbia", "Montenegro"]:
    if country in small and removesmallcountries: continue
    assert((country, 2006) in temporalgraph.nodes)
    temporalgraph.add_edge(("Serbia and Montenegro", 2005), (country, 2006))
nonpermanentcountriesneedswork -= set(["Serbia and Montenegro", "Serbia", "Montenegro"])

NATO = defaultdict(set)
WARSAW = defaultdict(set)
CSTO = defaultdict(set)
GUAM = defaultdict(set)

for year in range(2009, years[-1]+1): NATO[year].add("Albania")
for year in years: NATO[year].add("Belgium")
for year in range(2004, years[-1]+1): NATO[year].add("Bulgaria")
for year in range(2009, years[-1]+1): NATO[year].add("Croatia")
for year in range(1999, years[-1]+1): NATO[year].add("Czechia")
for year in years: NATO[year].add("Denmark")
for year in range(2004, years[-1]+1): NATO[year].add("Estonia")
for year in range(2023, years[-1]+1): NATO[year].add("Finland")
for year in years: NATO[year].add("France")
for year in range(years[0], 1990+1): NATO[year].add("West Germany")
for year in range(1991, years[-1]+1): NATO[year].add("Germany")
for year in years: NATO[year].add("Greece")
for year in range(1999, years[-1]+1): NATO[year].add("Hungary")
for year in years: NATO[year].add("Iceland")
for year in years: NATO[year].add("Italy")
for year in range(2004, years[-1]+1): NATO[year].add("Latvia")
for year in range(2004, years[-1]+1): NATO[year].add("Lithuania")
for year in range(2017, years[-1]+1): NATO[year].add("Montenegro")
for year in years: NATO[year].add("Netherlands")
for year in range(2020, years[-1]+1): NATO[year].add("Macedonia")
for year in years: NATO[year].add("Norway")
for year in range(1999, years[-1]+1): NATO[year].add("Poland")
for year in years: NATO[year].add("Portugal")
for year in range(2004, years[-1]+1): NATO[year].add("Romania")
for year in range(2004, years[-1]+1): NATO[year].add("Slovakia")
for year in range(2004, years[-1]+1): NATO[year].add("Slovenia")
for year in range(1982, years[-1]+1): NATO[year].add("Spain")
for year in range(2024, years[-1]+1): NATO[year].add("Sweden")
for year in years: NATO[year].add("United Kingdom")
for year in years: NATO[year].add("Channel Islands")
for year in years: NATO[year].add("Gibraltar")
for year in years: NATO[year].add("Faroe Islands")
for year in years: NATO[year].add("Isle of Man")

for year in range(years[0], 1990+1): 
    WARSAW[year].add("Bulgaria")
    WARSAW[year].add("Czechoslovakia")
    WARSAW[year].add("East Germany")
    WARSAW[year].add("Hungary")
    WARSAW[year].add("Poland")
    WARSAW[year].add("Romania")
    WARSAW[year].add("Soviet Union")

# CSTO group
for year in range(1992, years[-1] + 1): 
    CSTO[year].add("Russian Federation")
    CSTO[year].add("Kazakhstan")
    CSTO[year].add("Armenia")
    CSTO[year].add("Tajikistan")
    CSTO[year].add("Kyrgyzstan")

for year in range(1994, years[-1] + 1):
    CSTO[year].add("Belarus")

for year in range(1994, 1999 + 1): CSTO[year].add("Azerbaijan")
for year in range(1994, 1999 + 1): CSTO[year].add("Georgia")
for year in range(1992, 1999 + 1): CSTO[year].add("Uzbekistan")

if removesmallcountries:
    for year in years:
        NATO[year] -= small
        CSTO[year] -= small
        WARSAW[year] -= small

for country, year in temporalgraph.nodes:
    if country in NATO[year]:
        hierarchicalgraph.add_edge(("NATO", year), (country, year))
    elif country in WARSAW[year]:
        hierarchicalgraph.add_edge(("WARSAW", year), (country, year))
    elif country in CSTO[year]:
        hierarchicalgraph.add_edge(("CSTO", year), (country, year))
    else:
        hierarchicalgraph.add_edge(("root", year), (country, year))
    if (country, year+1) in temporalgraph.nodes:
        temporalgraph.add_edge((country, year), (country, year+1))
for year in years:
    for org in ["NATO", "WARSAW", "CSTO"]:
        if (org, year) in hierarchicalgraph.nodes:
            hierarchicalgraph.add_edge(("root", year), (org, year))
            if (org, year+1) in hierarchicalgraph.nodes:
                temporalgraph.add_edge((org, year), (org, year+1))
for year in years[:-1]:
    temporalgraph.add_edge(("root", year), ("root", year+1))

def fillpopulation(g: nx.DiGraph, n):
    if "exactpopulation" not in g.nodes[n]:
        g.nodes[n]["exactpopulation"] = 0
        if len(g.adj[n]) == 0:
            g.nodes[n]["exactpopulation"] = g.nodes[n]["population"]
        else:
            for u in g.adj[n]:
                fillpopulation(g, u)
                g.nodes[n]["exactpopulation"] += g.nodes[u]["exactpopulation"]
    if "population" not in g.nodes[n]:
        if n[0] == "root":
            g.nodes[n]["population"] = g.nodes[n]["exactpopulation"]*1.5*1.5
        else:
            g.nodes[n]["population"] = 0
            for u in g.adj[n]:
                fillpopulation(g, u)
                g.nodes[n]["population"] += g.nodes[u]["population"]
            g.nodes[n]["population"] *= 1.5

for n in hierarchicalgraph.nodes:
    fillpopulation(hierarchicalgraph, n)
    temporalgraph.nodes[n]["population"] = hierarchicalgraph.nodes[n]["population"]
    

jsonobj = {}
indexnodes = {}

# Update nodes name to reflect the military alliances
NATO_info = {   "Albania": 2009, 
                "Belgium": 1975,
                "Bulgaria": 2004,
                "Croatia": 2009,
                "Czechia": 1999,
                "Denmark": 1975,
                "Estonia": 2004,
                "Finland": 2023,
                "France": 1975,
                "West Germany": 1975,
                "Germany": 1991,
                "Greece": 1975,
                "Hungary": 1999,
                "Iceland": 1975,
                "Italy": 1975,
                "Latvia": 2004,
                "Lithuania": 2004,
                "Netherlands": 1975,
                "Macedonia": 2020,
                "Norway": 1975,
                "Poland": 1999,
                "Portugal": 1975,
                "Romania": 2004,
                "Slovakia": 2004,
                "Slovenia": 2004,
                "Spain": 1982,
                "Sweden": 2024,
                "United Kingdom": 1975,
                "Channel Islands": 1975,
                "Gibraltar": 1975,
                "Faroe Islands": 1975,
                "Isle of Man": 1975,
            }

Warsaw_info = { "Bulgaria": 1975,
                "Czechoslovakia": 1975,
                "East Germany": 1975,
                "Hungary": 1975,
                "Poland": 1975,
                "Romania": 1975,
                "Soviet Union": 1975
}

CSTO_info = { "Russian Federation": [1992, 2025],
                "Kazakhstan" : [1992, 2025],
                "Armenia": [1992, 2025],
                "Tajikistan": [1992, 2025],
                "Kyrgyzstan": [1992, 2025],
                "Belarus": [1994, 2025],
                "Azerbaijan": [1994, 1999],
                "Georgia": [1994, 1999],
                "Uzbekistan": [1992, 1999]
}

if removesmallcountries:
    for country in small:
        if country in NATO_info:
            del NATO_info[country]
        if country in Warsaw_info:
            del Warsaw_info[country]
        if country in CSTO_info:
            del CSTO_info[country]

for n in list(temporalgraph.nodes):
    if not (minyear <= n[1] <= maxyear):
        temporalgraph.remove_node(n)
        hierarchicalgraph.remove_node(n)

jsonobj["nodes"] = []
for country, year in temporalgraph.nodes:
    if country not in indexnodes:
        indexnodes[(country, year)] = len(indexnodes)
    
    node_name = ""
    # Create new name for the node
    if country in ["CSTO", "WARSAW", "CSTO"]:
        node_name = f"{country}"
    elif country in NATO_info and year >= NATO_info[country]:
        node_name = f"NATO {country}"
    elif country in Warsaw_info and year >= Warsaw_info[country] and year < 1991:
        node_name = f"WARSAW {country}"
    elif country in CSTO_info and year >= CSTO_info[country][0] and year <= CSTO_info[country][1]:
        node_name = f"CSTO {country}"
    else:
        node_name = f"{country}"
    # Manually add some padding to the NATO, CSTO, Wasaw and root
    node_val = temporalgraph.nodes[(country, year)]["population"]/1000 
    jsonobj["nodes"].append({"name": node_name, 
                             "timeStep": year-years[0], 
                             "areaValues": node_val})
jsonobj["edgesTime"] = []
jsonobj["edgesHierarchy"] = []

for u in temporalgraph.nodes:
    adjnodes = temporalgraph.adj[u]
    adjnodes = list(map(lambda v: indexnodes[v], adjnodes))
    if len(adjnodes) > 0:
        jsonobj["edgesTime"].append([indexnodes[u], adjnodes])

for u in hierarchicalgraph.nodes:
    adjnodes = hierarchicalgraph.adj[u]
    adjnodes = list(map(lambda v: indexnodes[v], adjnodes))
    if len(adjnodes) > 0:
        jsonobj["edgesHierarchy"].append([indexnodes[u], adjnodes])

with open(f"population_largean{threshold}_{minyear}_{maxyear}.json", "w") as f: json.dump(jsonobj, f, indent=4)
