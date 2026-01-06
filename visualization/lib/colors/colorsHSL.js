// Determine hue and saturation for the color

class Bucket {
    constructor(tRange_, valueRange_)
    {
        this.tRange = tRange_; // [start, end] range for t
        this.valueRange = valueRange_; // [start, end] range for values
    }

    contains(t)
    {
        // Check if t is within the bucket's range
        return this.tRange[0] <= t && t <= this.tRange[1];
    }

    scale(t)
    {
        // Scale t within the bucket to the value range
        const [tStart, tEnd] = this.tRange;
        const [valStart, valEnd] = this.valueRange;
    
        return Math.round(valStart + ((t - tStart) / (tEnd - tStart)) * (valEnd - valStart));
    }
}

class ColorScaler {
    constructor(buckets_)
    {
        this.buckets = buckets_;
    }

    // Get the values from the bucket
    getValue(t){
        for (const bucket of this.buckets)
        {
            if (bucket.contains(t))
            {
                return bucket.scale(t);
            }
        }
    }
}

class ColorsHSL {
    constructor(hueName, minSaturation, maxSaturation, minLightness, maxLightness, decideType, inverse=false)
    {
        switch (hueName)
        {
            case "coldToWarm":
                this.hueBuckets = [
                    new Bucket([0, 1/3], [220, 200]), // Blue for lower value
                    new Bucket([1/3, 1], [30, 0]), // Yellow to red for higher value
                ];
                break;
            case "magma":
                this.hueBuckets = [
                    new Bucket([0, 1], [0, 60])  // Red to yellow
                ];
                break;
            case "viridis":
                this.hueBuckets = [
                    new Bucket([0, 1/4], [250, 220]), // Blue
                    new Bucket([1/4, 1], [130, 60]) // Yellow
                ];
                break;
            case "div-blue-orange":
                this.hueBuckets = [
                    new Bucket([0, 1/2], [250, 180]), // Deep blue to light blue
                    new Bucket([1/2, 1], [50, 20]) // Yellow to orange
                ];
                break;
            case "rainbow":
                this.hueBuckets = [
                    new Bucket([0, 1], [220, 0])
                ];
                break;
            case "light-blue":
                this.hueBuckets = [
                    new Bucket([0, 1], [209, 210])
                ];
                break;
            case "dark-blue":
                this.hueBuckets = [
                    new Bucket([0, 1], [229, 230])
                ];
                break;
            case "light-green":
                this.hueBuckets = [
                    new Bucket([0, 1], [119, 120])
                ];
                break;
            case "green-yellow":
                this.hueBuckets = [
                    new Bucket([0, 1], [151, 51])
                ];
                break;
            case "yellow":
                this.hueBuckets = [
                    new Bucket([0, 1], [60, 61])
                ];
                break;
            case "orange":
                this.hueBuckets = [
                    new Bucket([0, 1], [39, 40])
                ];
                break;
            case "red":
                this.hueBuckets = [
                    new Bucket([0, 1], [0, 1])
                ];
                break;
            default:
                this.hueBuckets = [
                    new Bucket([0, 1/3], [220, 180]), // Blue for lower value
                    new Bucket([1/3, 1], [50, 5]), // Yellow to red for higher value
                ];
                break;
        }

        // Clamp the min and max to the correct value
        minSaturation = minSaturation > maxSaturation ? maxSaturation - 1 : minSaturation;
        minLightness = minLightness > maxLightness ? maxLightness - 1 : minLightness;  

        this.hueScaler = new ColorScaler(this.hueBuckets);

        this.saturationBuckets = [
            new Bucket([0, 1], [minSaturation, maxSaturation])       
        ];
        this.saturationScaler = new ColorScaler(this.saturationBuckets);

        this.lightnessBuckets = [
            new Bucket([0, 1], [minLightness, maxLightness])
        ];
        this.lightnessScaler = new ColorScaler(this.lightnessBuckets);
        this.inverse = inverse;
        this.decideType = decideType;   
    }
    

    hue(t)
    {
        // Clamp t to [0, 1]
        if (this.inverse)
            t = 1 - t;
        t = Math.max(0, Math.min(1, t));

        return this.hueScaler.getValue(t);
    }

    saturation(t)
    {
        // Clamp t to [0, 1]
        if (this.inverse)
            t = 1 - t;
        t = Math.max(0, Math.min(1, t));

        return this.saturationScaler.getValue(t);
    }

    lightness(t)
    {
        if (this.inverse)
            t = 1 - t;
        t = Math.max(0, Math.min(1, t));

        return this.lightnessScaler.getValue(t);
    }

    // Extract the h, s, l value as number from the string
    parseHSLString(hslString)
    {
        var parts = hslString.match(/hsl\(\s*(\d+)\s*,\s*(\d+(\.\d+)?)%\s*,\s*(\d+(\.\d+)?)%\s*\)/);
        return {
            h : parseFloat(parts[1]),
            s : parseFloat(parts[2]),
            l : parseFloat(parts[4])
        };
    }

    // Get the string from h, s, l values
    getColorString(hue, saturation, lightness)
    {
        // Clamp values to ensure they are within range
        hue = Math.max(0, Math.min(360, hue));
        saturation = Math.max(0, Math.min(100, saturation));
        lightness = Math.max(0, Math.min(100, lightness));
        return "hsl(" + hue + ", " + saturation + "%, " + lightness +"%)";
    }

    getColorStringT(t)
    {
        return this.getColorString(this.hue(t), this.saturation(t), this.lightness(t));
    }

    // Convert Hex to HSL color string
    // Source: https://css-tricks.com/converting-color-spaces-in-javascript/
    hexToHSL(hex)
    {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);
        // Scale to [0, 1]
        r /= 255, g /= 255, b /= 255;
        // Find the max and min of the RBG
        var maxRBG = Math.max(r, g, b), minRBG = Math.min(r, g, b);

        // Calculate the chroma 
        var delta = maxRBG - minRBG;
        var h, s, l;

        // Calculate the difference
        switch (delta)
        {
            case 0:
                h = 0;
                break;
            case r:
                h = ((g - b) / delta) % 6;
                break;
            case g:
                h = (b - r) / delta + 2;
                break;
            default:
                h = (r - g) / delta + 4;
        }

        h = Math.round(h * 60);
        h = h < 0 ? h + 360 : h;
        l = (maxRBG + minRBG) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Scale by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        return this.getColorString(h, s, l);
    }
}