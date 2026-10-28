// Real 2020 US Census populations (via Wikipedia infobox citing the 2020 Census). Order matches STAGES.
// Sources: https://en.wikipedia.org/wiki/<Town> (population_total, population_as_of = 2020 census)
const TOWNS=[
 {n:"Niceville, FL",pop:15772,dens:1094,src:"https://en.wikipedia.org/wiki/Niceville,_Florida"},
 {n:"Crestview, FL",pop:27134,dens:1593,src:"https://en.wikipedia.org/wiki/Crestview,_Florida"},
 {n:"Tallahassee, FL",pop:196169,dens:1926,src:"https://en.wikipedia.org/wiki/Tallahassee,_Florida"},
 {n:"Valdosta, GA",pop:55378,dens:1539,src:"https://en.wikipedia.org/wiki/Valdosta,_Georgia"},
 {n:"Waycross, GA",pop:13942,dens:1175,src:"https://en.wikipedia.org/wiki/Waycross,_Georgia"},
 {n:"Savannah, GA",pop:147780,dens:1300,src:"https://en.wikipedia.org/wiki/Savannah,_Georgia"},
 {n:"Charleston, SC",pop:150227,dens:1306,src:"https://en.wikipedia.org/wiki/Charleston,_South_Carolina"},
 {n:"Kingstree, SC",pop:3244,dens:1020,src:"https://en.wikipedia.org/wiki/Kingstree,_South_Carolina"},
 {n:"Florence, SC",pop:39899,dens:1705,src:"https://en.wikipedia.org/wiki/Florence,_South_Carolina"},
 {n:"Pamplico, SC",pop:1061,dens:655,src:"https://en.wikipedia.org/wiki/Pamplico,_South_Carolina"}];
// Scene scale tiers, chosen from population by tier(pop). Any new town just needs a pop.
const TIERS=[
 {id:"major",min:150000,bld:46,hMax:.62,road:.42,trees:2,wreck:7,tower:1},
 {id:"mid",min:50000,bld:30,hMax:.40,road:.32,trees:5,wreck:5},
 {id:"town",min:10000,bld:16,hMax:.22,road:.22,trees:9,wreck:3,water:1},
 {id:"small",min:3000,bld:8,hMax:.14,road:.14,trees:14,wreck:2},
 {id:"rural",min:0,bld:4,hMax:.09,road:.08,trees:26,wreck:1,farm:1}];
function tier(pop){return TIERS.find(t=>pop>=t.min)}
