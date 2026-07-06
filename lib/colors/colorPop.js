class ColorPopulation
{
    constructor(setNumber)
    {
        switch (setNumber)
        {
            case 0:
                this.scheme = { 0: ["#253494"], // Dark pink for europe 
                                1: ["#bebada", "#0570b0", "#e31a1c", "#dd3497"],  // Grey: non-aligned, Dark blue: NATO, Red: Warsaw, Purple: CSTO
                                2: ["#e6f598", "#feb24c", "#fa9fb5"]  // Light blue: NATO member, Light red: Warsaw member, Purple: CSTO member
                            };
                break;

            case 1:
                this.scheme = { 0: ["#4d004b"], // Dark pink for europe 
                    1: ["#969696", "#1d91c0", "#fc4e2a", "#807dba"],  // Grey: non-aligned, Dark blue: NATO, Red: Warsaw, Purple: CSTO
                    2: ["#7fcdbb", "#feb24c", "#bcbddc"]  // Light blue: NATO member, Light red: Warsaw member, Purple: CSTO member
                };
                break;

            case 2:
            default:
                this.scheme = {
                    // Level 0: root of the tree
                    0: ["#FFFFFF"],
                    // Level 1: independent countries and military alliances
                    1: [
                        "#FFBA00", //independent country, original Lightness = #216901, used Lightness = 40
                        "#024dfd", //NATO - North Atlantic Treaty Organization: used official blue color Pantone 280 C = #012169, but then Lightness increased to 50
                        "#fd024d", //Warsaw Treaty (of Friendship, Cooperation and Mutual Assistance): chosen as triadic red of NATO blue, original lightness = #690121
                        "#fd02cb"  //CSTO - Collective Security Treaty Organization: chosen as analogous color to Warsaw Treaty color, original lightness = #690155
                       ],
                    //Level 2: countries who are part of an alliance
                    2: ["#81a6fe", //NATO member state: base color converted to HSL and then chosen 75% Lightness
                        "#fe81a6", //Warsaw Treaty member state
                        "#fe81e5"  //CSTO member state
                       ]
                };
                break;
        }
    }

    determineColorFromName(name)
    {
        switch (name)
        {
            case "root":
                return this.scheme[0][0];
            case "NATO":
                return this.scheme[1][1];
            case "WARSAW":
                return this.scheme[1][2];
            case "CSTO":
                return this.scheme[1][3];
            default:
                // Not any of the above
                // Split the name 
                let nameParts = name.split(" ");
                // Check the first part
                switch (nameParts[0])
                {
                    case "NATO":
                        return this.scheme[2][0];
                    case "WARSAW":
                        return this.scheme[2][1];
                    case "CSTO":
                        return this.scheme[2][2]
                    default:
                        return this.scheme[1][0];
                }
        }
    }
}