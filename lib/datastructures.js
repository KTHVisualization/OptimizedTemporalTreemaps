// Data classes to store parameters

class SizeScalers {
    constructor(xScale, yScale)
    {
        this.x = xScale;
        this.y = yScale;
        this.allScale = 100;
    }
}

class Radii {
    constructor(xRadius, yRadius)
    {
        this.x = xRadius;
        this.y = yRadius;
    }
}

class Axes {
    constructor(color, width, scale, isShowTime, textSize, timeFrom, distanceFromAxes, timeSteps)
    {
        this.color = color;
        this.width = width;
        this.scale = scale;
        // Padding on the y-direction for the axes
        this.padding = 0.5;
        this.isShowTime = isShowTime;
        this.textSize = textSize;
        this.timeFrom = timeFrom;
        this.distanceFromAxes = distanceFromAxes;
        this.timeSteps = timeSteps;
    }
}

class DropShadowProperties {
    constructor(id, color, dx, dy, std, opacity)
    {
        this.id = id;
        this.color = color;
        this.width = 10;
        this.height = 10; // Fixed number for w and h
        this.dx = dx;
        this.dy = dy;
        this.std = std;
        this.opacity = opacity;
    }
}

class HaloProperties {
    constructor(color, thicknessPercentage, opacity)
    {
        this.color = color;
        this.thicknessPercentage = thicknessPercentage;
        this.opacity = opacity;
    }
}

class PaddingProperties {
    constructor(x, y, xPercentage, layerDiff)
    {
        this.x = x;
        this.y = y;
        this.xPercentage = xPercentage;
        this.layerDiff = layerDiff;
    }
}

class LimitLayersProperties {
    constructor(isApply, min, max, orgMax)
    {
        this.isApply = isApply;
        // First clamp min and max to the correct values
        min = min >= max ? max - 1 : min;
        min = min >= 0 ? min : 0;
        if (isApply)
        {
            this.min = min;
            this.max = orgMax > max ? max : orgMax;
        } else {
            this.min = 0;
            this.max = orgMax;
        }
    }
}

class OpacityProperties {
    constructor(isApply, min, max)
    {   
        this.isApply = isApply;
        min = min > max ? max - 1 : min;
        min = min >= 0 ? min : 0;
        
        const opacityBucket = [new Bucket([0, 1], [min, max])];
        this.opacityScaler = new ColorScaler(opacityBucket);
    }

    getOpacity(t)
    {
        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));

        return this.opacityScaler.getValue(t) / 100.;
    }
}

class OtherProperties {
    constructor(hideSingularNodes, fudgeX, crispEdges=false)
    {
        this.hideSingularNodes = hideSingularNodes;
        this.fudgeX = fudgeX;
        this.crispEdges = crispEdges;
    }
}


class SplitstreamsFeatures {
    constructor(isActive, xLength, xPadding)
    {
        this.isActive = isActive;
        this.xLength = xLength;
        this.xPadding = xPadding;
    }
}

class InteractionProperties {
    constructor(lineThickness)
    {
        this.lineThickness = lineThickness;
    }
}


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
