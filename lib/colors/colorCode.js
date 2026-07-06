class ColorCode
{
    constructor()
    {
        this.scheme = {
            // Level 0: root
            // Blue for c++
            // blue for js
            // yellow for root, greens for doc
            0: ["#dabb0b"],
            // 
            1: [
                "#3182bd", // C++ level 1
                "#de2d26", // Js level 1
                "#31a354", // Docs level 1
            ],
            2: [
                "#9ecae1",  // C++ level 2 (includes/src)
                "#fc9272", // Js level 2 
                "#a1d99b", // Docs level 2
            ],
            3: [
                "#deebf7", // C++ level 3 (datastructures/processors)
                "#fee0d2", // Js level 3
                "#e5f5e0", // Docs level 3
            ],
            4: [
                "#f2f0f7",  // C++ level 4 (files)
                "#f2f0f7", // Js level 4
                "#f2f0f7", // Docs level 4
            ]
        }
    }

    determineColorFromName(name)
    {
        const match = name.match(/(GitRepo[12].*)/);
        const shortened = match ? match[0] : "";
        
        if (shortened)
        {
            // Count the number of slash after the shortened path
            const slashCount = (shortened.match(/\//g) || []).length;
            if (slashCount === 0)
            {
                return "#dabb0b";
            }    
            // Get the first part after the first slash
            const firstPartAfterSlash = shortened.includes("/") ? shortened.split("/")[1] : "";

            // Determine the color based on the slash count and first part after slash
            switch (firstPartAfterSlash)
            {
                case "c":
                    return this.scheme[slashCount][0];
                case "js":
                    return this.scheme[slashCount][1];
                default:
                    return this.scheme[slashCount][2];
            }
        }

        
    }
}