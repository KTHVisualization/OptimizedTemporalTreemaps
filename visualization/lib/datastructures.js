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
    constructor(color, width, scale, isShowTime, textSize, timeFrom, distanceFromAxes)
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
    constructor(color, thicknessPercentage)
    {
        this.color = color;
        this.thicknessPercentage = thicknessPercentage;
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