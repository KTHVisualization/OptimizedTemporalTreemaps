class ContiniousColorProperties {
    constructor(family, scheme, inverseOrder, opacityMin, opacityMax, decideType) {
        this.family = family;           // "sequential", "diverging", "cyclical"
        this.scheme = scheme;           // "Blues", "Reds", etc.
        this.inverseOrder = inverseOrder; // boolean
        this.opacityMin = opacityMin;   // 0-100
        this.opacityMax = opacityMax;   // 0-100
        this.decideType = decideType; // "Depth" or "Scalar"


        // Initialize the color scheme
        this.getContinuousColorScheme();

    }

    getContinuousColorScheme() {

        // Get the interpolation function from your colorSchemes object
        let interpolateFunction;
        
        if (this.family === "continuousSequential" && colorSchemes.continuousSequential[this.scheme]) {
            interpolateFunction = colorSchemes.continuousSequential[this.scheme]();
        } else if (this.family === "continuousDiverging" && colorSchemes.continuousDiverging[this.scheme]) {
            interpolateFunction = colorSchemes.continuousDiverging[this.scheme]();
        } else if (this.family === "continuousCyclical" && colorSchemes.continuousCyclical[this.scheme]) {
            interpolateFunction = colorSchemes.continuousCyclical[this.scheme]();
        } else {
            // Default fallback
            interpolateFunction = colorSchemes.continuousSequential['Greys']();
        }
        // Store the interpolation function (not an array like discrete!)
        this.interpolateFunction = interpolateFunction;

        

    }        
}



class DiscreteColorProperties {
    constructor(family, scheme, count, inverseOrder, opacityMin, opacityMax, decideType, colorArray=[]) {
        this.family = family;           // "sequential", "diverging", "cyclical"
        this.scheme = scheme;           // "Blues", "Reds", etc.
        this.count = count;             // number of colors
        this.inverseOrder = inverseOrder; // boolean
        this.opacityMin = opacityMin;   // 0-100
        this.opacityMax = opacityMax;   // 0-100
        this.decideType = decideType; // "Depth" or "Scalar"
        this.colorArray = colorArray; // Array of colors if provided

        // Initialize the color scheme
        this.getDiscreteColorScheme();

    }

    getDiscreteColorScheme() {

        // Get the color array from your colorSchemes object
        let discreteColorArray = this.colorArray;

        // If we originally wanted 2 colors, take extremes from 3-color array
        if (this.count === 2 && discreteColorArray && discreteColorArray.length >= 3) {
            discreteColorArray = [discreteColorArray[0], discreteColorArray[2]]; // Take first and last
        }
        



        // Safety guard
        if (!Array.isArray(discreteColorArray) || discreteColorArray.length === 0) {
            discreteColorArray = colorSchemes.sequential['Blues'](this.count || 4);
        }

        // Apply inverse order if needed
        if (this.inverseOrder) {
            discreteColorArray = [...discreteColorArray].reverse();
        }

        // Store the final color array
        this.colorArray = discreteColorArray;
        this.numDiscreteColor = discreteColorArray.length;

        //TODO: Handle opacityMin and opacityMax if needed and other things
    }

}