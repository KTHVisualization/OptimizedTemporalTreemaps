class ColorCategorical {
    constructor(presetIdx, chooseType, inverse=false)
    {
        switch (presetIdx)
        {
            // Single hue 3 sequential colors
            case 0:
                this.colorPreset = ["#deebf7", "#9ecae1",  "#3182bd"];
                break;
            case 1:
                this.colorPreset = ["#e5f5e0", "#a1d99b",  "#31a354"];
                break;
            case 2:
                this.colorPreset = ["#e5f5f9", "#99d8c9",  "#2ca25f"];
                break; 
            // Multi hue 3 sequential colors
            case 3:
                this.colorPreset = ["#e0ecf4", "#9ebcda", "#8856a7"];
                break;
            case 4:
                this.colorPreset = ["#edf8b1", "#7fcdbb", "#2c7fb8"];
                break;
            // Multi hue 6 sequential colors
            case 5: 
                this.colorPreset = ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#2ca25f", "#006d2c"];
                break;
            case 6:
                this.colorPreset = ["#f0f9e8", "#ccebc5", "#a8ddb5", "#7bccc4", "#43a2ca", "#0868ac"];
                break;
            case 7:
                this.colorPreset = ["#feebe2", "#fcc5c0", "#fa9fb5", "#f768a1", "#c51b8a", "#7a0177"];
                break;
            case 8:
                this.colorPreset = ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494"];
                break;
            case 9:
                this.colorPreset = ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"];
                break;
            // Qualitative 6 colors
            case 10:
                this.colorPreset = ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f"];
                break;
            case 11:
                this.colorPreset = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"];
                break;
            case 12:
                this.colorPreset = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33"];           
                break;
            case 13:
                this.colorPreset = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"];
                break;
            case 14: 
                // Diverging 10 colors
                this.colorPreset = ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0","#92c5de","#4393c3", "#2166ac","#053061"];     
                break;
            case 15:
                // NTG-based color, white root
                this.colorPreset = ["#ffffff",'#bd0026','#f03b20','#fd8d3c','#feb24c','#fed976','#ffffb2'];
                break;
            case 16:
                // NTG-based color
                this.colorPreset = ['#bd0026','#f03b20','#fd8d3c','#feb24c','#fed976','#ffffb2'];
                break;
            default:
                this.colorPreset = ["#67001f"];
                break;
        }
        this.chooseType = chooseType;
        this.inverse = inverse;
    }

    getColorString(inputIdx, lowerVal, higherVal)
    {
        // Number of the colors of the preset
        var numColors = this.colorPreset.length;

        // Depending on the type of the color we chose
        var colorIdx;

        switch (this.chooseType)
        {
            case "Cyclic":
                colorIdx = inputIdx % numColors;
                break;

            case "Grouped" :
                // Mapping 
                // @TODO: modify this so that we can draw a specific layer later
                colorIdx = Math.ceil((inputIdx - lowerVal) * (this.colorPreset.length - 1) / (higherVal - lowerVal));
                // Clamp it
                if (colorIdx > this.colorPreset.length - 1)
                    colorIdx = this.colorPreset.length - 1;
                    break; 
            
            case "Clamped":
                colorIdx = inputIdx;
                if (colorIdx > this.colorPreset.length - 1)
                    colorIdx = this.colorPreset.length - 1;
                break;

            case "Random":
                colorIdx = Math.floor(Math.random() * this.colorPreset.length);
                break;
            
            default:
                console.log("Error! Color mode not supported!");
        }
        if (this.inverse)
            colorIdx = numColors - 1 - colorIdx;
        colorIdx = colorIdx < 0 ? 0 : colorIdx;
        return this.colorPreset[colorIdx];
    }
}