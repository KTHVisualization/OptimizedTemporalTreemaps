class ColorD3 
{
    constructor(colorType, family, schema, numColor,
                decideType, chooseType, inverse=false, increaseContrast=false)
    {
        this.inverse = inverse;
        this.decideType = decideType; // Decide depth/scalar based
        this.chooseType = chooseType;   // Decide the index for the discrete color map
        this.increaseContrast = increaseContrast;   // Decide if we want to increase contrast
        if (colorType == "Continuous")
        {
            this.isContinuous = true;
            this.numColor = 100; // Some random number

            switch (schema)
            {
                case "Rainbow":
                    this.schema = d3.interpolateRainbow;
                    break;
                case "Sinebow":
                    this.schema = d3.interpolateSinebow;
                    break;
                case "BrownGreen":
                    this.schema = d3.interpolateBrBG;
                    break;
                case "PurpleGreen":
                    this.schema = d3.interpolatePRGn;
                    break;
                case "PinkGreen":
                    this.schema = d3.interpolatePiYG;
                    break;
                case "PurpleGold":
                    this.schema = d3.interpolatePuOr;
                    break;
                case "RedBlue":
                    this.schema = d3.interpolateRdBu;
                    break;
                case "RedGrey":
                    this.schema = d3.interpolateRdGy;
                    break;
                case "RedYellowBlue":
                    this.schema = d3.interpolateRdYlBu;
                    break;
                case "RedYelloGreen":
                    this.schema = d3.interpolateRdYlGn;
                    break;
                case "Spectral":
                    this.schema = d3.interpolateSpectral;
                    break;
                case "Blues":
                    this.schema = d3.interpolateBlues;
                    break;
                case "Greens":
                    this.schema = d3.interpolateGreens;
                    break;
                case "Greys":
                    this.schema = d3.interpolateGreys;
                    break;
                case "Oranges":
                    this.schema = d3.interpolateOranges;
                    break;
                case "Purples":
                    this.schema = d3.interpolatePurples;
                    break;
                case "Reds":
                    this.schema = d3.interpolateReds;
                    break;
                case "Turbo":
                    this.schema = d3.interpolateTurbo;
                    break;
                case "Viridis":
                    this.schema = d3.interpolateViridis;
                    break;
                case "Inferno":
                    this.schema = d3.interpolateInferno;
                    break;
                case "Magma":
                    this.schema = d3.interpolateMagma;
                    break;
                case "Plasma":
                    this.schema = d3.interpolatePlasma;
                    break;
                case "Cividis":
                    this.schema = d3.interpolateCividis;
                    break;
                case "Warm":
                    this.schema = d3.interpolateWarm;
                    break;
                case "Cool":
                    this.schema = d3.interpolateCool;
                    break;
                case "CubehelixDefault":
                    this.schema = d3.interpolateCubehelixDefault;
                    break;
                case "WhiteGreen":
                    this.schema = d3.interpolateBuGn;
                    break;
                case "WhitePurple":
                    this.schema = d3.interpolateBuPu;
                    break;
                case "WhiteGreenBlue":
                    this.schema = d3.interpolateGnBu;
                    break;
                case "GoldRed":
                    this.schema = d3.interpolateOrRd;
                    break;
                case "PurpleBlueGreen":
                    this.schema = d3.interpolatePuBuGn;
                    break;
                case "PurpleBlue":
                    this.schema = d3.interpolatePuBu;
                    break;
                case "PurpleRed":
                    this.schema = d3.interpolatePuRd;
                    break;
                case "RedPurple":
                    this.schema = d3.interpolateRdPu;
                    break;
                case "YellowGreenBlue":
                    this.schema = d3.interpolateYlGnBu;
                    break;
                case "YellowGreen":
                    this.schema = d3.interpolateYlGn;
                    break;
                case "YellowGoldBrown":
                    this.schema = d3.interpolateYlOrBr;
                    break;
                case "YellowGoldRed":
                    this.schema = d3.interpolateYlOrRd;
                    break;
                default:
                    this.schema = d3.interpolateBlues;
                    break;
            }

            this.color = d3.scaleSequential(this.schema);

        } else {
            // Discrete color
            // Clamp the value of num color
            if (family === "Sequential" && numColor > 9)
            {
                numColor = 9;
            }

            this.isContinuous = false;

            switch (schema)
            {
                case "Cat10":
                    this.schema = d3.schemeCategory10;
                    break;
                case "Accent":
                    this.schema = d3.schemeAccent;
                    break;
                case "Dark2":
                    this.schema = d3.schemeDark2;
                    break;
                case "Paired":
                    this.schema = d3.schemePaired;
                    break;
                case "Pastel1":
                    this.schema = d3.schemePastel1;
                    break;
                case "Pastel2":
                    this.schema = d3.schemePastel2;
                    break;
                case "Set1":
                    this.schema = d3.schemeSet1;
                    break;
                case "Set2":
                    this.schema = d3.schemeSet2;
                    break;
                case "Set3":
                    this.schema = d3.schemeSet3;
                    break;
                case "BrownGreen":
                    this.schema = d3.schemeBrBG[numColor];
                    break;
                case "PurpleGreen":
                    this.schema = d3.schemePRGn[numColor];
                    break;
                case "PinkGreen":
                    this.schema = d3.schemePiYG[numColor];
                    break;
                case "PurpleGold":
                    this.schema = d3.schemePuOr[numColor];
                    break;
                case "RedBlue":
                    this.schema = d3.schemeRdBu[numColor];
                    break;
                case "RedGrey":
                    this.schema = d3.schemeRdGy[numColor];
                    break;
                case "RedYellowBlue":
                    this.schema = d3.schemeRdYlGn[numColor];
                    break;
                case "RedYellowGreen":
                    this.schema = d3.schemeRdYlGn[numColor];
                    break;
                case "Spectral":
                    this.schema = d3.schemeSpectral[numColor];
                    break;
                case "Blues":
                    this.schema = d3.schemeBlues[numColor];
                    break;
                case "Greens":
                    this.schema = d3.schemeGreens[numColor];
                    break;
                case "Greys":
                    this.schema = d3.schemeGreys[numColor];
                    break;
                case "Oranges":
                    this.schema = d3.schemeOranges[numColor];
                    break;
                case "Purples":
                    this.schema = d3.schemePurples[numColor];
                    break;
                case "Reds":
                    this.schema = d3.schemeReds[numColor];
                    break;
                case "WhiteBlueGreen":
                    this.schema = d3.schemeBuGn[numColor];
                    break;
                case "WhiteBluePurple":
                    this.schema = d3.schemeBuPu[numColor];
                    break;
                case "WhiteGreenBlue":
                    this.schema = d3.schemeGnBu[numColor];
                    break;
                case "GoldRed":
                    this.schema = d3.schemeOrRd[numColor];
                    break;
                case "PurpleBlueGreen":
                    this.schema = d3.schemePuBuGn[numColor];
                    break;
                case "PurpleBlue":
                    this.schema = d3.schemePuBu[numColor];
                    break;
                case "PurpleRed":
                    this.schema = d3.schemePuRd[numColor];
                    break;
                case "RedPurple":
                    this.schema = d3.schemeRdPu[numColor];
                    break;
                case "YellowGreenBlue":
                    this.schema = d3.schemeYlGnBu[numColor];
                    break;
                case "YellowGreen":
                    this.schema = d3.schemeYlGn[numColor];
                    break;
                case "YellowGoldBrown":
                    this.schema = d3.schemeYlOrBr[numColor];
                    break;
                case "YellowGoldRed":
                    this.schema = d3.schemeYlOrRd[numColor];
                    break;
                default:
                    this.schema = d3.schemeBlues[numColor];
                    break;
            }

            this.numColor = this.schema.length;

            const createArray = (n) => [...Array(n).keys()];
            this.color = d3.scaleOrdinal()
                        .domain(createArray(this.schema.length))
                        .range(this.schema);
        }
    }

    sampleContinuousColor(value, minValue, maxValue)
    {
        let percentage = (value - minValue) / (maxValue - minValue);
        
        // Increase contrast?
        // Extremely naiive way to increase contrast
        if (this.increaseContrast)
        {
            if (percentage > 0.5)
                percentage += 0.2;
            if (percentage > 1)
                percentage = 1;

            if (percentage < 0.4 && percentage > 0.1)
                percentage -=0.1;
        }
            
        if (this.inverse)
            percentage = 1 - percentage;

        return this.color(percentage);
    }

    sampleDiscreteColor(value, minValue, maxValue)
    {
        // Decide based on the different value
        var colorIdx;
        // Scale the value based on minValue-maxValue

        var decideValue = value - minValue;

        switch (this.chooseType)
        {
            case "Cyclic":
                colorIdx = decideValue % this.numColor;
                break;
            
            case "Grouped":
                colorIdx = Math.ceil(decideValue * (this.numColor - 1) / (maxValue - minValue));
                // Clamp it
                if (colorIdx > this.numColor -1)
                    colorIdx = this.numColor - 1;
                break;
            case "Clamped":
                colorIdx = decideValue;
                if (colorIdx > this.numColor - 1)
                    colorIdx = this.numColor - 1;
            default:
                console.log("Color not supported");
        }

        if (this.inverse)
            colorIdx = this.numColor - 1 - colorIdx;
        colorIdx = colorIdx < 0 ? 0 : colorIdx;
        return this.color(colorIdx);
    }
}