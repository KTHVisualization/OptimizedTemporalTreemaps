class TemporalTreemapPlusLib {
    constructor(graph, containerID, limitLayer_, layoutType_, scaler_, 
                colorType_, colorDecideType_, 
                colorProperties_, colorPop_, colorCode_,
                opacity_, 
                paddings_, isDrawAxes_, axes_, radii_, delta_, 
                shadowType_, halo_, dropShadow_, 
                otherProperties_,
                splitStreamsProp_,
                moveByOffset_ = false,
                drawOffset_ = 0,
                containerIdx = 1
            )
    {
        this.graph = graph;
        this.containerID = containerID;
        
        this.limitLayer = limitLayer_;
        
        this.colorProperties = colorProperties_;

        // Layout type
        this.layoutType = layoutType_;
        // Scalers
        this.scaler = scaler_;

        // Radius to draw the arcs
        this.radii = radii_;

        // Type of the color
        this.colorType = colorType_;
        this.colorDecideType = colorDecideType_;


        this.colorPop = colorPop_;
     
        this.colorCode = colorCode_;

        this.opacity = opacity_;

        // Parameters for the axes
        this.isDrawAxes = isDrawAxes_;

        this.axes = axes_;
        // Delta when drawing the graph
        this.delta = delta_;

        this.otherProperties = otherProperties_;

        this.splitStreamsProp = splitStreamsProp_;
        this.clipPathCounter = 

        // Offsets when drawing the gradients
        // Given by percentage
        this.startOffset = 20;
        this.endOffset = 80;

        // Gradient counter for their IDs in the svg
        this.gradientCounter = 0;
        this.deltaIntersect = 0.2;


        // Caches to store the highest and lowest in y-direction
        this.yHighest = - Number.MIN_VALUE;
        this.yLowest = Number.MAX_VALUE,
        // Cache to store the x-positions
        this.xPosition = [];
        this.counter = 0;

        // Shadow properties
        this.shadowType = shadowType_
        this.halo = halo_;
        this.dropShadow = dropShadow_;

        // Padding
        this.paddings = paddings_;

        // Move the figure to below using y-offset
        this.isMoveByOffset = false;
        this.yOffset = 10;


        // Draw offset
        this.drawOffset = drawOffset_;


        // Move the second figure
        this.containerIdx = containerIdx;

        // Cache to store the smallest width of the node
        // Necessary to draw the halo
        this.wLowest = Number.MAX_VALUE;

        // Object to draw the Bezier curves
        this.curves = new Curves();

        this.forwardEdgesTime = {};
        this.backwardEdgesTime = {};
        
        if (this.graph.minScalar === this.graph.maxScalar)
            this.graph.maxScalar = this.graph.minScalar + 1;

        
         // Adjust the scale base on the layout type
        if (this.layoutType === "(x,y) and width Optimized")
        {
            // No scale
            // Set all of them to be 1
            this.scaler.x = 1.;
            this.scaler.y = 1.;
            this.axes.scale = 1.0;
            // No y padding as well
            this.paddings.y = 0.;
        }

        if (this.layoutType === "y and width Optimized")
        {
            // No scale for y and width
            this.scaler.y = 1.;
            this.axes.scale = 1.0;
            // No y padding
            this.paddings.y = 0.;
        }

        // Get the container to draw this graph
        var container = document.getElementById(containerID);

        // Initialize the SVG
        container.innerHTML = "";
 
        this.svg = d3.select("#" + containerID).append("svg").attr("class", "TTMP").attr("id", "TTMP" + containerIdx.toString())
                                                .attr("color-interpolation-filters", "sRGB");
        // Draw containers
        this.defTag = this.svg.append("defs");
        var root = this.svg.append('g').attr("id", "drawing-group" + this.containerIdx.toString());
        this.root = root;

        // Add resize event
        const resize = e => {
            var containerSize = container.getBoundingClientRect();

            this.svg.attr("width", containerSize.width).attr("height", containerSize.height);
        }

        resize();
        window.addEventListener("resize", resize);

        // Only need to be reset if the layout is not-optimized
        if (this.layoutType === "Non-Optimized")
            this.initializeLayout(true);
        else 
            this.initializeLayout(false);

        // Add y-padding
        this.addYPadding();
        // Ony add this if the layout is un-optimized
        if (this.layoutType === "Non-Optimized")
        {
            
            // Compute slots
            this.computeSlots();
        } else {
            // We need to keep track of the require information to draw the axes 
            this.getNodeInformationAxes();
        }

        this.computeXPadding();

        // Compute the shadow if we choose to draw
        if (this.shadowType === "Drop Shadow" || this.shadowType === "Drop Shadow with Fudge")
        {
            this.defineShadows();
        }
    }

    drawTree()
    {
        // We want to draw from lower levels first
        var edgesTime = this.graph.edgesTime;
        var levels = [];
        for (var level in edgesTime)
        {
            levels.push(parseFloat(level));
        }
        // Levels now contains other elements as well.
        this.levels = levels.sort();
        // Add layers group
        for (var i = 0; i < this.levels.length; i++)
        {
            this.root.append("g").attr("id", "layer" + this.formatNumber(this.levels[i]) + "-g" + this.containerIdx.toString());
        }

        // Add an additional layer for the interaction
        this.root.append("g").attr("id", "interaction-g" + this.containerIdx.toString());


        // Draw the axes
        if (this.isDrawAxes)
        {
            this.drawAllAxes();
        }

        // Draw the layers
        for (var i = 0; i < this.levels.length; i++)
        {
            if (this.levels[i] >= this.limitLayer.min && this.levels[i] < this.limitLayer.max + 1)
            {
                this.drawBirthLayer(this.levels[i]);
                this.drawEdgesLayer(this.levels[i]);

                // Now we draw the edges with parent-children switch
                // Only need to draw if we are not using opacity
                if (!this.opacity.isApply)
                    this.drawParentChildSwitchLayer(this.levels[i]);
                this.drawDeathLayer(this.levels[i]);
            }
        }

        // Draw the shadow
        if (this.shadowType === "Drop Shadow" || this.shadowType === "Drop Shadow with Fudge")
        {
            // this.applyDropShadowAllLayers(this.levels[i])
        }
    }

    drawEdgesLayer(layer)
    {   
        var edgesTime = this.graph.edgesTime;
        var nodes = this.graph.nodes;

        var layerEdges = edgesTime[layer];
        var currSvgGroup = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());
    
        for (var startNode in layerEdges)
        {
            var endNodes = layerEdges[startNode];
            // Draw edges
            for (var endNode of endNodes)
            {
                this.drawEdge(startNode, endNode, currSvgGroup, layer);
            }
        }
    }

    drawBirthLayer(layer)
    {
        // Draw the born death events and put them in the previous layer
        var bornNodes = this.graph.nodesBorn || {};
        var bornNodesLayer = bornNodes[layer] || [];

        var bornDeathNodes = this.graph.nodesBornDie || {};
        var bornDeathNodesLayers = bornDeathNodes[layer] || [];
        // var bornNodesLayer = bornNodes[layer] || [];

        var currSvgGroup = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());
        if (bornNodesLayer.length > 0)
        {
            for (var bornNode of bornNodesLayer)
            {
                this.drawArc(bornNode, 1, currSvgGroup, layer);
            }
        }

        if (!this.otherProperties.hideSingularNodes && bornDeathNodesLayers.length > 0)
        {
            for (var bornNode of bornDeathNodesLayers)
            {
                this.drawArc(bornNode, 1, currSvgGroup, layer);
            }
        }
    }

    drawDeathLayer(layer)
    {
        // Draw the born death events and put them in the previous layer
        var dieNodes = this.graph.nodesDie || {};
        var dieNodesLayer = dieNodes[layer] || [];
        // var dieNodesLayer = dieNodes[layer] || [];

        var bornDeathNodes = this.graph.nodesBornDie || {};
        var bornDeathNodesLayers = bornDeathNodes[layer] || [];
        var currSvgGroup = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());
    
        if (dieNodesLayer.length > 0)
        {
            // There are nodes born in this layer
            for (var dieNode of dieNodesLayer)
            {
                this.drawArc(dieNode, 0, currSvgGroup, layer);
            }
        }

        if (!this.otherProperties.hideSingularNodes && bornDeathNodesLayers.length > 0)
        {
            for (var bornNode of bornDeathNodesLayers)
            {
                this.drawArc(bornNode, 0, currSvgGroup, layer);
            }
        }
    }

    drawBirthDeathLayer(layer, levels)
    {
        // Draw the born death events and put them in the previous layer
        var dieNodes = this.graph.nodesDie || {};
        var bornNodes = this.graph.nodesBorn || {};

        var bornNodesLayer = bornNodes[levels[layer]] || [];
        var dieNodesLayer = dieNodes[levels[layer]] || [];
        var currSvgGroup = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());
        if (bornNodesLayer.length > 0)
        {
            for (var bornNode of bornNodesLayer)
            {
                this.drawArc(bornNode, 1, currSvgGroup, layer);
            }
        }
        if (dieNodesLayer.length > 0)
        {
            // There are nodes born in this layer
            for (var dieNode of dieNodesLayer)
            {
                this.drawArc(dieNode, 0, currSvgGroup, layer);
            }
        }
    }

    drawParentChildSwitchLayer(layer)
    {
        // Special events variables
        var edgesSwitchParentChild = this.graph.edgesSwitchParentChild || [];

        // Now we draw the edges with parent-children switch
        var currSvgGroup = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());

        var parentChildSwitchLayer = edgesSwitchParentChild[layer] || {};
        if (Object.keys(parentChildSwitchLayer).length > 0)
        {
            for (var startNodeName in parentChildSwitchLayer)
            {
                var listEdgesFrom = parentChildSwitchLayer[startNodeName];
                for (var edgeFrom of listEdgesFrom)
                {
                    this.drawParentChildSwitch(startNodeName, edgeFrom[0], edgeFrom[1], edgeFrom[2], currSvgGroup, layer);
                }
            }
        }
    }

    applyDropShadowAllLayers(levels)
    {
        for (var i = 0; i < levels.length; i ++)
        {
            var svgGroup = d3.select("#layer" + i + "-g" + this.containerIdx.toString());
            svgGroup.attr("filter", "url(#" + this.dropShadow.id + "-edges" + + "-g" + this.containerIdx.toString() + ")");
        }
    }

    drawAllAxes()
    {
        // for (let xPos of this.xPosition)
        // {
        //     this.drawTimestepAxis(xPos, this.root);
        // }
        for (let i = 0; i < this.xPosition.length; i++)
        {
            this.drawTimestepAxis(this.xPosition[i], i, this.root);
        }
    }

    drawEdge(node1Name, node2Name, parent, layer)
    {

        var nodes = this.graph.nodes;

        let node1 = nodes[node1Name];
        let node2 = nodes[node2Name]

        // First node
        var layout1 = node1.layout;
        var p1Width = layout1.width * this.scaler.y * this.scaler.allScale;
        var p1X     = layout1.x * this.scaler.x * this.scaler.allScale;
        var p1Y     = layout1.y * this.scaler.y * this.scaler.allScale + this.drawOffset;

        // Second node
        var layout2 = node2.layout;
        var p2Width = layout2.width * this.scaler.y * this.scaler.allScale;
        var p2X     = layout2.x * this.scaler.x * this.scaler.allScale;
        var p2Y     = layout2.y * this.scaler.y * this.scaler.allScale + this.drawOffset;

        // We build the necessary coordinates to draw the Bezier curves
        var p1UpperX = p1X;
        var p1UpperY = p1Y + p1Width;
        var p2UpperX = p2X + this.otherProperties.fudgeX;
        var p2UpperY = p2Y + p2Width;

        var p1LowerX = p1X;
        var p1LowerY = p1Y - p1Width;
        var p2LowerX = p2X + this.otherProperties.fudgeX;
        var p2LowerY = p2Y - p2Width;

        // Calculate the thickness of this edge
        var edgeThickness = (p1Width + p2Width) / 2;

        // Get the color to fill in
        var newGradID = this.getGradientColor2Nodes(node1, node2);

        // If active splitstreams
        let edgeClipPathId;
        if (this.splitStreamsProp.isActive)
        {
            // Get the clip path
            edgeClipPathId = this.defineEdgeClipPath(node1Name, node2Name, layer);
        }


        if (this.shadowType === "Drop Shadow with Fudge")
        {
            // Create a path with no fill
    
            var shadowPath = parent.append("path")
                            .attr("fill", "url(#" + newGradID + ")")
                            .attr("d", this.curves.edgeFromCoords(
                                p1UpperX, p1UpperY, p2UpperX - this.otherProperties.fudgeX, p2UpperY,
                                p1LowerX, p1LowerY, p2LowerX - this.otherProperties.fudgeX, p2LowerY,
                                this.delta, this.paddings.x
                            ))
                            .attr("filter", "url(#" + this.dropShadow.id + "-edges" + "-g" + this.containerIdx.toString() + ")")
            ;
                    
            if (this.splitStreamsProp.isActive)
            {
                shadowPath.attr("clip-path", "url(#" + edgeClipPathId + ")");
            }

            // if (this.otherProperties.crispEdges)
            // {
            //     shadowPath.attr("shape-rendering", "crispEdges");
            // }
        }
        

        var currPath = parent.append("path")
                        .attr("fill", "url(#" + newGradID + ")")
                        // .attr("shape-rendering", "crispEdges")
                        .attr("d", this.curves.edgeFromCoords(
                            p1UpperX, p1UpperY, p2UpperX, p2UpperY,
                            p1LowerX, p1LowerY, p2LowerX, p2LowerY,
                            this.delta, this.paddings.x
                        ))
                        .attr("id", node1Name + "-" + node2Name + "-e" + "-g" + this.containerIdx.toString())
                        .attr("vector-effect", "non-scaling-stroke")
                        ;
        if (this.otherProperties.crispEdges)
        {
            currPath.attr("shape-rendering", "crispEdges");
        }
        
        var percentageLayer;
        if (this.opacity.isApply)
        {
            // Determine the opacity, based on the node layer
            if (node1.layer >= this.limitLayer.min && node1.layer <= this.limitLayer.max)
                percentageLayer = (node1.layer - this.limitLayer.min) / (this.limitLayer.max - this.limitLayer.min);
            else 
                // Don't care
                percentageLayer = 1.;
            currPath.attr("fill-opacity", this.opacity.getOpacity(percentageLayer));
        }

        switch (this.shadowType)
        {
            case "Drop Shadow":
                currPath.attr("filter", "url(#" + this.dropShadow.id + "-edges" + "-g" + this.containerIdx.toString() + ")");
                break;
            case "Halo":
                {
                    let line1 = parent.append("path")
                        .attr("fill", "none")
                        .attr("stroke", this.halo.color)
                        .attr("stroke-width", this.halo.thicknessPercentage * this.wLowest * this.scaler.y * this.scaler.allScale)
                        .attr("stroke-opacity", this.halo.opacity)
                        .attr("d", this.curves.bezierCurveFromCoords(
                            p1UpperX, p1UpperY, p2UpperX, p2UpperY,
                            this.delta, this.paddings.x
                        ));
                    let line2 = parent.append("path")
                            .attr("fill", "none")
                            .attr("stroke", this.halo.color)
                            .attr("stroke-width", this.halo.thicknessPercentage * this.wLowest * this.scaler.y * this.scaler.allScale)
                            .attr("stroke-opacity", this.halo.opacity) 
                            .attr("d", this.curves.bezierCurveFromCoords(
                                p1LowerX, p1LowerY, p2LowerX, p2LowerY,
                                this.delta, this.paddings.x
                            ));
                    if (this.splitStreamsProp.isActive)
                    {
                        line1.attr("clip-path", "url(#" + edgeClipPathId + ")");
                        line2.attr("clip-path", "url(#" + edgeClipPathId + ")");
                    }
                    break;
                }
                
            case "Drop Shadow with Fudge":
                
                break;
            default:

        }

        if (this.splitStreamsProp.isActive)
        {
            currPath.attr("clip-path", "url(#" + edgeClipPathId + ")");
        }

    }

    // Draw birth-death events
    // Representing by the arcs
    drawArc(nodeName, direction, parent, layer)
    {
        var nodes = this.graph.nodes;
        var node = nodes[nodeName];

        // Extract node layout
        var nodeLayout = node.layout
        var nodeX = nodeLayout.x * this.scaler.x * this.scaler.allScale;
        var nodeY = nodeLayout.y * this.scaler.y * this.scaler.allScale + this.drawOffset;
        var nodeWidth = nodeLayout.width * this.scaler.y * this.scaler.allScale;

        // Only do this if we haven't decided the color
        if (node.color === undefined)
            node.color = this.determineNodeColor(node);
        
        // We calculate the coordinates for drawing
        let fudgeX = direction === 0 ? this.otherProperties.fudgeX : 0;
        var p1X = nodeX + fudgeX;
        var p1Y = nodeY + nodeWidth;
        var p2X = nodeX + fudgeX;
        var p2Y = nodeY - nodeWidth;

        // Start drawing
        // If active splitstreams
        let arcClipPathId;
        if (this.splitStreamsProp.isActive)
        {
            // Get the clip path
            arcClipPathId = this.defineArcClipPath(nodeName, direction, layer);
        }
        if (this.shadowType === "Drop Shadow with Fudge")
        {
            var shadowPath = parent.append("path")
                            .attr("fill", node.color)
                            .attr("d", 
                                this.curves.arcFromCoords(p1X - fudgeX, p1Y, p2X - fudgeX, p2Y, this.radii, direction, this.paddings)
                            )
                            .attr("filter", "url(#" + this.dropShadow.id + "-arcs" + "-g" + this.containerIdx.toString() + ")");
            ;
            if (this.splitStreamsProp.isActive)
            {
                shadowPath.attr("clip-path", "url(#" + arcClipPathId + ")");
            }

            // if (this.otherProperties.crispEdges)
            // {
            //     shadowPath.attr("shape-rendering", "crispEdges");
            // }
        }

        var currPath = parent.append("path")
            .attr("fill", node.color)
            //~ .attr("shape-rendering", "crispEdges")
            .attr("d", 
                this.curves.arcFromCoords(p1X, p1Y, p2X, p2Y, this.radii, direction, this.paddings)
            )
            .attr("id", nodeName + "-a" + "-g" + this.containerIdx.toString())
            ;

        if (this.otherProperties.crispEdges)
        {
            currPath.attr("shape-rendering", "crispEdges");
        }
        
        var percentageLayer;
        if (this.opacity.isApply)
        {
            // Determine the opacity, based on the node layer
            if (node.layer >= this.limitLayer.min && node.layer <= this.limitLayer.max)
                percentageLayer = (node.layer - this.limitLayer.min) / (this.limitLayer.max - this.limitLayer.min);
            else 
                // Don't care
                percentageLayer = 1.;
            currPath.attr("fill-opacity", this.opacity.getOpacity(percentageLayer));
        }

        switch (this.shadowType)
        {
            case "Drop Shadow":
                currPath.attr("filter", "url(#" + this.dropShadow.id + "-arcs" + "-g" + this.containerIdx.toString() + ")");
                break;
            case "Halo":
                // Create a larger line outside of the arc
                let stroke = parent.append("path")
                .attr("fill", "none")
                .attr("stroke", this.halo.color)
                .attr("stroke-width", this.halo.thicknessPercentage * this.wLowest * this.scaler.y * this.scaler.allScale)
                .attr("stocke-opacity", this.halo.opacity)
                .attr("d", 
                    this.curves.arcFromCoords(p1X, p1Y, p2X, p2Y, this.radii, direction, this.paddings)
                );
                if (this.splitStreamsProp.isActive)
                {
                    stroke.attr("clip-path", "url(#" + arcClipPathId + ")");
                }
                break;

            case "Drop Shadow with Fudge":
                // Draw an no-fill arc without fudge
                break;
            default:

        }

        if (this.splitStreamsProp.isActive)
        {
            currPath.attr("clip-path", "url(#" + arcClipPathId + ")");
        }
    }

    // Handle the parent-child switch edges
    // params:
    // prevParent: name of the original parent
    // currChild: name of the parent that become child in the next timestep
    // prevChild: name of the original child
    // currParent: name of the child that become parent in the next timestep

    drawParentChildSwitch(prevParentName, currChildName, prevChildName, currParentName, parent, layer)
    {
        // Get the Bezier curve
        // Direction = 1 for upper and -1 for the lower curve
        function getCubicBezierCurve(node1, node2, direction, xScale, yScale, delta, xPadding, allScale, offset)
        {
            // Layout info
            // Start node
            var layout1 = node1.layout;
            var p1Width = layout1.width * yScale * allScale;
            var p1X     = layout1.x * xScale * allScale + xPadding;
            var p1Y     = layout1.y * yScale * allScale + offset;

            // Endnode
            var layout2 = node2.layout;
            var p2Width = layout2.width * yScale * allScale;
            var p2X     = layout2.x * xScale * allScale - xPadding;
            var p2Y     = layout2.y * yScale * allScale + offset;
            
            // We find the intersection between 2 Bezier curves
            // Redetermine the points we used to draw
            var startX = p1X;
            var startY = p1Y + p1Width * direction;

            var control1X = p1X + delta * (p2X - p1X);
            var control1Y = p1Y + p1Width * direction;

            var control2X = p1X + delta * (p2X - p1X);
            var control2Y = p2Y + p2Width * direction;

            var endX = p2X;
            var endY = p2Y + p2Width * direction;

            // Return the curve
            var curve = new Bezier(startX, startY, control1X, control1Y, control2X, control2Y, endX, endY);
            return curve;
        }
        var nodes = this.graph.nodes;

        var prevParent = nodes[prevParentName];
        var currChild = nodes[currChildName];

        var prevChild = nodes[prevChildName];
        var currParent = nodes[currParentName];
        
        // Get the Bezier curves connecting these points as drawn
        var upperCurveParentChild = getCubicBezierCurve(prevParent, currChild, 1, this.scaler.x, this.scaler.y, this.delta, this.paddings.x, this.scaler.allScale, this.drawOffset);
        var upperCurveChildParent = getCubicBezierCurve(prevChild, currParent, 1, this.scaler.x, this.scaler.y, this.delta, this.paddings.x, this.scaler.allScale, this.drawOffset);

        // Get the intersection between those two
        var upperIntersection = upperCurveParentChild.intersects(upperCurveChildParent);

        if (upperIntersection.length == 0)
            return;

        // Get the Bezier curves connecting these points as drawn
        var lowerCurveParentChild = getCubicBezierCurve(prevParent, currChild, -1, this.scaler.x, this.scaler.y, this.delta, this.paddings.x, this.scaler.allScale, this.drawOffset);
        var lowerCurveChildParent = getCubicBezierCurve(prevChild, currParent, -1, this.scaler.x, this.scaler.y, this.delta, this.paddings.x, this.scaler.allScale, this.drawOffset);

        // Get the intersection between those two
        var lowerIntersection = lowerCurveParentChild.intersects(lowerCurveChildParent);

        if (lowerIntersection.length == 0)
            return;

        // There should be only 1 intersection between each pair of curves in our case
        // The results are arrays consist of t1/t2, where t1 and t2 are the position at which the curves intersect
        // We move a bit to create the sense of space
        upperIntersection = parseFloat(upperIntersection[0].split("/")[0]) + this.deltaIntersect;
        lowerIntersection = parseFloat(lowerIntersection[0].split("/")[0]) + this.deltaIntersect;

        // We now can get the points
        var pointUpper = upperCurveParentChild.get(upperIntersection);
        var pointLower = lowerCurveParentChild.get(lowerIntersection);

        // Get the layout of the child
        var childLayout = currChild.layout;
        var childX = childLayout.x * this.scaler.x * this.scaler.allScale;
        var childY = childLayout.y * this.scaler.y * this.scaler.allScale + this.drawOffset;
        var childWidth = childLayout.width * this.scaler.y * this.scaler.allScale;

        // Color define
        var interpolatedColor = this.interpolateHSLWithOffset(prevParent.color, currChild.color, this.startOffset, this.endOffset, (upperIntersection + lowerIntersection) /2);

        if (interpolatedColor === undefined)
            return;

        var newGradID = this.getGradientColor2Colors(interpolatedColor, currChild.color);

        // Calculate the neccessary coordinates for the half edge
        var p2UpperX = childX + this.otherProperties.fudgeX;
        var p2UpperY = childY + childWidth;
        var p2LowerX = childX + this.otherProperties.fudgeX;
        var p2LowerY = childY - childWidth;


         // If active splitstreams
         let edgeClipPathId;
         if (this.splitStreamsProp.isActive)
         {
            // Get the clip path
            edgeClipPathId = this.defineEdgeClipPath(prevParentName, currChildName, layer);
         }

        // Now draw the curves
        if (this.shadowType === "Drop Shadow with Fudge")
        {
            // Now draw the curves
            var shadowPath = parent.append("path")
                            .attr("fill", "url(#" + newGradID + ")")
                            .attr("d", this.curves.halfEdgeFromCoords(
                                pointUpper.x, pointUpper.y, p2UpperX - this.otherProperties.fudgeX, p2UpperY,
                                pointLower.x, pointLower.y, p2LowerX - this.otherProperties.fudgeX, p2LowerY,
                                this.delta, this.paddings.x 
                            ))
                            .attr("filter", "url(#" + this.dropShadow.id + "-edges" + "-g" + this.containerIdx.toString() + ")")
                            ;
            if (this.splitStreamsProp.isActive)
            {
                shadowPath.attr("clip-path", "url(#" + edgeClipPathId + ")");
            }
            // if (this.otherProperties.crispEdges)
            // {
            //     shadowPath.attr("shape-rendering", "crispEdges");
            // }
        }

        var currPath = parent.append("path")
            .attr("fill", "url(#" + newGradID + ")")
            .attr("d", this.curves.halfEdgeFromCoords(
                pointUpper.x, pointUpper.y, p2UpperX, p2UpperY,
                pointLower.x, pointLower.y, p2LowerX, p2LowerY,
                this.delta, this.paddings.x 
            ))
            .attr("id", prevParentName + "-" + currChildName + "-he" + "-g" + this.containerIdx.toString())
            ;
        if (this.otherProperties.crispEdges)
        {
            currPath.attr("shape-rendering", "crispEdges");
        }
        // Opacity
        var percentageLayer;
        if (this.opacity.isApply)
        {
            // Determine the opacity, based on the node layer
            if (currChild.layer >= this.limitLayer.min && currChild.layer <= this.limitLayer.max)
                percentageLayer = (currChild.layer - this.limitLayer.min) / (this.limitLayer.max - this.limitLayer.min);
            else 
                // Don't care
                percentageLayer = 1.;
            currPath.attr("fill-opacity", this.opacity.getOpacity(percentageLayer));
        }

        switch (this.shadowType)
        {
            case "Drop Shadow":
                currPath.attr("filter", "url(#" + this.dropShadow.id + "-edges" + "-g" + this.containerIdx.toString() + ")");
                break;
            case "Halo":
                {
                    let line1 = parent.append("path")
                        .attr("fill", "none")
                        .attr("stroke", this.halo.color)
                        .attr("stroke-width", this.halo.thicknessPercentage * this.wLowest * this.scaler.y * this.scaler.allScale)
                        .attr("stroke-opacity", this.halo.opacity)
                        .attr("d", this.curves.bezierCurveFromCoords(
                            pointUpper.x, pointUpper.y, p2UpperX, p2UpperY,
                            this.delta, this.paddings.x
                        ));
                    let line2 = parent.append("path")
                            .attr("fill", "none")
                            .attr("stroke", this.halo.color)
                            .attr("stroke-width", this.halo.thicknessPercentage * this.wLowest * this.scaler.y * this.scaler.allScale)
                            .attr("stroke-opacity", this.halo.opacity)
                            .attr("d", this.curves.bezierCurveFromCoords(
                                pointLower.x, pointLower.y, p2LowerX, p2LowerY,
                                this.delta, this.paddings.x
                            ));
                    
                    if (this.splitStreamsProp.isActive)
                    {
                        line1.attr("clip-path", "url(#" + edgeClipPathId + ")");
                        line2.attr("clip-path", "url(#" + edgeClipPathId + ")");
                    }
                    break;
                }
                
            case "Drop Shadow with Fudge":
                
                break;

            
            default:

        }

        if (this.splitStreamsProp.isActive)
        {
            currPath.attr("clip-path", "url(#" + edgeClipPathId + ")");
        }
    }
    

    // Draw the horizontal axes at each timestep
    drawTimestepAxis(xPosition, timestep, parent)
    {
        parent.append("line")
            .attr("x1", xPosition)
            .attr("y1", this.yHighest + this.drawOffset)
            .attr("x2", xPosition)
            .attr("y2", this.yLowest + this.drawOffset)
            .attr("stroke-width", this.axes.width)
            .attr("stroke", this.axes.color);

        // Add text
        if (this.axes.isShowTime) {
            const actualTime = this.axes.timeFrom + (timestep * this.axes.timeSteps);
            parent.append("text")
                .attr("x", xPosition)
                .attr("y", this.yHighest + this.axes.distanceFromAxes + this.drawOffset)
                .attr("text-anchor", "middle")
                .attr("font-size", this.axes.textSize)
                .attr("fill", "black")
                .text(actualTime);
        }
    }


    // Hide a list of layers, unhide all all layers that are not in the list
    hideSomeLayers(layersList)
    {
        // Loop for evey layer
        for (var i = 0; i < this.levels.length; i++)
        {
            // Check if levels[i] is inside the layer list
            // We also have intermediate layers
            // We need to also check for floor and ceil of this
            if (layersList.includes(this.levels[i]) 
                || layersList.includes(Math.ceil(this.levels[i])))
            {
                // Hide this layer
                this.hideLayer(this.levels[i]);
            } else 
            {
                // Unhide this layer
                this.unhideLayer(this.levels[i]);
            }
            
        }
    }

    // Hide a particular layer
    hideLayer(layer)
    {
        if (layer > this.graph.maxLayer)
        {
            return;
        }

        // Set this layer visibility to hidden
        let selected = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());

        // Add the attribute and set it to hidden
        selected.attr("visibility", "hidden");
    }

    // Unhide layer
    unhideLayer(layer)
    {
        if (layer > this.graph.maxLayer)
        {
            return;
        }

        // Check the current visibility and toggle it
        let selected = d3.select("#layer" + this.formatNumber(layer) + "-g" + this.containerIdx.toString());
        selected.attr("visibility", "visible");
    }

    // Determine the color of the node
    // Return the HSL string represent the color
    determineNodeColor(node)
    {
        var color;

        if (this.colorType === "discrete") {
            // Use discrete color logic
            color = this.getDiscreteColor(node);
            return color;
            
        }

        if (this.colorType === "continuous") {
            // Use continuous color logic
            color = this.getContinuousColor(node);
            return color;
            
        }

        if (this.colorType == "population")
        {
            color = this.colorPop.determineColorFromName(node.name);
        }

        if (this.colorType === "code")
        {
            color = this.colorCode.determineColorFromName(node.name);
        }

        return color;
    }

    // Interpolate HSL with offset
    // Given lambda in range [0, 1]
    // color1, color2: HSL color strings
    // offset1, offset2: given by percentage
    interpolateHSLWithOffset(color1, color2, offset1, offset2, lambdaGlobal)
    {
        if (color1 === undefined || color2 === undefined)
            return undefined;

        var hsl1, hsl2;
        // Here we assumed that the color are HSL
        // Clamp lambda to range [0, 1] if it is out of range
        var lambdaLocal = Math.max(0, Math.min(1, lambdaGlobal));
        // Convert the offset to range [0, 1] as well
        var offset1Local = offset1 / 100;
        var offset2Local = offset2 / 100;

        // Adjust the lambda by the offset
        lambdaLocal = (lambdaLocal - offset1Local) / (offset2Local - offset1Local);
        
        // Clamp lambdaLocal again if it is out of range
        lambdaLocal = Math.max(0, Math.min(1, lambdaLocal));
        
        // Convert to hsl
        let color1HSL = d3.hsl(color1);
        let color2HSL = d3.hsl(color2);
        hsl1 = {h : color1HSL.h, s : color1HSL.s * 100, l: color1HSL.l * 100};
        hsl2 = {h : color2HSL.h, s : color2HSL.s * 100, l: color2HSL.l * 100};
     
        // Interpolate between the new values

        var h = hsl1.h + lambdaLocal * (hsl2.h - hsl1.h);
        var s = hsl1.s + lambdaLocal * (hsl2.s - hsl1.s);
        var l = hsl1.l + lambdaLocal * (hsl2.l - hsl1.l);

        return this.getColorString(h, s, l);
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

    // Define the gradient color between 2 colors, one of them is interpolated color
    // Return its unique id
    // color1, color2: hsl strings
    getGradientColor2Colors(color1, color2)
    {
        var gradID = "gradient" + this.gradientCounter + "-g" + this.containerIdx.toString();
        // Define the color tag
        var gradColor = this.defTag.append("linearGradient")
                                .attr("id", gradID)
                                .attr("x1", "0%")
                                .attr("y1", "0%")
                                .attr("x2", "100%")
                                .attr("y2", "0%");

        gradColor.append("stop").attr("offset", "0%").attr("stop-color", color1);
        gradColor.append("stop").attr("offset", this.endOffset + "%").attr("stop-color", color2);

        // Update the counter
        this.gradientCounter += 1;

        return gradID;
    }

    // Define the gradient color between 2 ndoes
    // Return its id 
    getGradientColor2Nodes(node1, node2)
    {
        // Assign the color to the nodes
        if (this.colorDecideType == 0)
        {
            // Normal version
            node1.color = this.determineNodeColor(node1);
            node2.color = this.determineNodeColor(node2);
        } else {
            // Inhereted from the previous version
            // Check if node1 and node 2 has color
            if (node1.color === undefined && node2.color !== undefined)
            {
                node1.color = node2.color;
            }
            else if (node1.color !== undefined && node2.color === undefined)
            {
                node2.color = node1.color;
            }
            else if (node1.color === undefined && node2.color === undefined)
            {
                node1.color = this.determineNodeColor(node1);
                node2.color = node1.color;
            }
            
        }

        // Define the colorID
        var gradID = "gradient" + this.gradientCounter + "-g" + this.containerIdx.toString();

        var gradColor = this.defTag.append("linearGradient")
                                .attr("id", gradID)
                                .attr("x1", "0%")
                                .attr("y1", "0%")
                                .attr("x2", "100%")
                                .attr("y2", "0%");

        gradColor.append("stop").attr("offset", this.startOffset + "%").attr("stop-color", node1.color);
        gradColor.append("stop").attr("offset", this.endOffset + "%").attr("stop-color", node2.color);

        // Update the counter
        this.gradientCounter += 1;

        return gradID;
    }

    getContinuousColor(node) {

        let percentage;
        if (this.colorProperties.decideType === "Depth") {
            if (node.layer >= this.limitLayer.min && node.layer <= this.limitLayer.max) {
                percentage = (node.layer - this.limitLayer.min) / (this.limitLayer.max - this.limitLayer.min);
            } else {
                percentage = 1.0;
            }
        } else {
            // Scalar-based
            percentage = (node.scalar - this.graph.minScalar) / (this.graph.maxScalar - this.graph.minScalar);
        }
        
        // Use the interpolation function directly (key difference from discrete!)
        let baseColor;
        if (this.colorProperties.inverseOrder) {
            baseColor = this.colorProperties.interpolateFunction(1 - percentage);
        } else {
            baseColor = this.colorProperties.interpolateFunction(percentage);
        }

        return baseColor;

    }

    getDiscreteColor(node) {

        let percentage;
        
        if (this.colorProperties.decideType === "Depth") {
            if (node.layer >= this.limitLayer.min && node.layer <= this.limitLayer.max) {
                percentage = (node.layer - this.limitLayer.min) / (this.limitLayer.max - this.limitLayer.min);
            } else {
                percentage = 1.0;
            }
        } else {
            // Scalar-based
            percentage = (node.scalar - this.graph.minScalar) / (this.graph.maxScalar - this.graph.minScalar);
        }
        
        // Get the colors array
        const finalColors = this.colorProperties.colorArray; // Use the colors you already have
        

        // Get color index based on percentage
        const colorIndex = Math.floor(percentage * finalColors.length);
        const clampedIndex = Math.max(0, Math.min(colorIndex, finalColors.length - 1));
        
        // Get the specific color for this node
        let baseColor = finalColors[clampedIndex];
        
        return baseColor;
    }

    defineEdgeClipPath(node1Name, node2Name, layer)
    {
        let ceilVal = Math.ceil(layer);
        var nodes = this.graph.nodes;

        let node1 = nodes[node1Name];
        let node2 = nodes[node2Name]

        // First node
        var layout1 = node1.layout;
        var p1X     = layout1.x * this.scaler.x * this.scaler.allScale;


        // Second node
        var layout2 = node2.layout;
        var p2X     = layout2.x * this.scaler.x * this.scaler.allScale;

        // We build the necessary coordinates 
        var p1UpperX = p1X;
        var p2UpperX = p2X;
       

        // Determine the starting position for the rectangle
        let xRect = p1UpperX + this.splitStreamsProp.xLength + (node1.layer ) * this.splitStreamsProp.xPadding;
        let yRect = 0;

        let offsetVal = node2.layer;
        if (node2.layer < node1.layer)
            offsetVal = offsetVal + 0.5;
        if (node2.layer > node1.layer)
            offsetVal = offsetVal - 0.5;

        let wRect = (p2UpperX - p1UpperX) - 2 * this.splitStreamsProp.xLength - 2 * (offsetVal ) * this.splitStreamsProp.xPadding;
        if (wRect < 0)
            wRect = 0;
        let hRect = "100%";

        let clipPathId = "clip-" + this.clipPathCounter.toString() + "-edges" + "-g" + this.containerIdx.toString();

        let clipPathFilter = this.defTag.append("clipPath").attr("id", clipPathId);
        clipPathFilter.append("rect")
                    .attr("x", xRect.toString())
                    .attr("y", yRect.toString() - 100)
                    .attr("width", wRect.toString())
                    .attr("height", hRect);
        
        this.clipPathCounter++;
        return clipPathId;
    }

    defineArcClipPath(nodeName, direction, layer)
    {
        let ceilVal = Math.ceil(layer);
        var nodes = this.graph.nodes;
        var node = nodes[nodeName];

        // Extract node layout
        var nodeLayout = node.layout
        var nodeX = nodeLayout.x * this.scaler.x * this.scaler.allScale;
        
        // Get the width for the clip
        let wRect; 
        // Set the height
        let hRect = "100%";
        let yRect = 0;

        // Determine the x position for the clip
        let xRect;
        if (direction === 0)
        {
            // Move it by the margin
            xRect = nodeX + this.splitStreamsProp.xLength + (node.layer) * this.splitStreamsProp.xPadding;
            wRect = max(this.radii.x, this.radii.y) * 100;
        } else 
        {
            xRect = nodeX - max(this.radii.x, this.radii.y) * 100;

            // Compute the length
            let diff = nodeX - this.splitStreamsProp.xLength - (node.layer ) * this.splitStreamsProp.xPadding;
            wRect = diff - xRect;
        }
        if (wRect < 0) wRect = 0;
        let clipPathId = "clip-" + this.clipPathCounter.toString() + "-arc" + "-g" + this.containerIdx.toString();

        let clipPathFilter = this.defTag.append("clipPath").attr("id", clipPathId);
        clipPathFilter.append("rect")
                    .attr("x", xRect.toString())
                    .attr("y", yRect.toString())
                    .attr("width", wRect.toString())
                    .attr("height", hRect);
        this.clipPathCounter++;
        return clipPathId;
    }

    defineShadows()
    {   
        // We want 2 separate shadow, one for the edges, and one for the arcs
        var dropShadowFilterEdges = this.defTag.append("filter")
                                .attr("id", this.dropShadow.id + "-edges" + "-g" + this.containerIdx.toString())
                                .attr("width", this.dropShadow.width * 100 * 10 + "%")
                                .attr("height", this.dropShadow.height * 100 * 10 + "%")
                                .attr("x", "0%")
                                .attr("y", "-1000%")
                                .attr("filterUnits", "userSpaceOnUse")
                                ;
        
        dropShadowFilterEdges.append("feDropShadow")
                        .attr("dx", this.dropShadow.dx)
                        .attr("dy", this.dropShadow.dy)
                        .attr("stdDeviation", `${0} ${this.dropShadow.std}`)
                        .attr("flood-color", this.dropShadow.color)
                        .attr("flood-opacity", this.dropShadow.opacity);

        var dropShadowFilterArcs = this.defTag.append("filter")
                        .attr("id", this.dropShadow.id + "-arcs" + "-g" + this.containerIdx.toString())
                        .attr("width",  this.dropShadow.width * 100 * 4 + "%")
                        .attr("height", this.dropShadow.height * 100 * 4 + "%")
                        .attr("x", "0%")
                        .attr("y", "-1000%")
                        ;
        dropShadowFilterArcs.append("feDropShadow")
                    .attr("dx", this.dropShadow.dx)
                    .attr("dy", this.dropShadow.dy)
                    .attr("stdDeviation", `${0} ${this.dropShadow.std}`)
                    .attr("flood-color", this.dropShadow.color)
                    .attr("flood-opacity", this.dropShadow.opacity);
    }

    // Determine the y of the layout of the children of a node
    computeSlots()
    {
        var nodes = this.graph.nodes;
        var edgesHierarchy = this.graph.edgesHierarchy;

        // We loop for each time step
        for (var timeStep in edgesHierarchy)
        {
            var edgesTimestep = edgesHierarchy[timeStep];

            // Consider the case where tree has exactly one node
            if (Object.keys(edgesTimestep).length == 0)
            {
                // Do nothing
                continue;
            }

            // We can determine the root node of this timestep
            // Assuming we are working with trees only
            var allNodes = new Set(Object.keys(edgesTimestep));
            var childNodes = new Set(Object.values(edgesTimestep).flat());
            // Root is the one that is a key but not a children
            var rootNode = [...allNodes].filter(node => !childNodes.has(node));
          
            
            if (rootNode.length === 0)
            {
                console.log("No root detected");
                return;
            }
            else if (rootNode.length > 1)
            {
                console.log("Multiple root detected, not handling for now");
            }

            rootNode = rootNode[0];

            // Now determine the width for nodes in this timestep
            this.determineLayoutY(nodes, rootNode, edgesTimestep, nodes[rootNode].layout.y, true);
        }
    }

    determineLayoutY(nodes, nodeName, edgesList, currentY, isRoot)
    {
        // Get the children list
        var childrenNameList = edgesList[nodeName] || [];

        // Sort based on layout
        var sortLayoutBased = function (a, b) {
            return nodes[a].layout.y - nodes[b].layout.y;
        };
        // Assign the current node its layout's y-pos
        var currNode = nodes[nodeName];
        currNode.layout.y = currentY;

        // If the current node is a root, we may want to update the highest and lowest y
        // Together with appending the x-position
        if (isRoot)
        {
            // The xPosition is to draw the axes only 
            this.xPosition.push(currNode.layout.x * this.scaler.x * this.scaler.allScale);
            this.counter += 1;
            
            // We keep track of these to draw the axes
            const currYHeight = (currNode.layout.y + currNode.layout.width + this.axes.padding) * this.scaler.allScale * this.axes.scale;
            const currYLow = (currNode.layout.y - currNode.layout.width - this.axes.padding) * this.scaler.allScale * this.axes.scale;
            if (currYHeight > this.yHighest)
            {
                this.yHighest = currYHeight; 
            }

            if (currYLow < this.yLowest)
            {
                this.yLowest = currYLow;
            }
        }

        // Recurrsively determine the children y-pos
        if (childrenNameList.length === 1)
        {
            // It gets the y-pos of the current node
            this.determineLayoutY(nodes, childrenNameList[0], edgesList, currentY, false);
        }
        // If the node has more than two children
        else if (childrenNameList.length > 1)
        { 
            childrenNameList = childrenNameList.sort(sortLayoutBased);
            // Determine the gap for each time
            let widthChildren = 0;
            
            for (let chidlrenName of childrenNameList)
            {
                widthChildren += nodes[chidlrenName].layout.width;
            }
            
            // Determine the available space of the parent
            let sizeDiff = currNode.layout.width - widthChildren;
            let gapWidth = sizeDiff / (childrenNameList.length + 1);
            var childY = gapWidth + currNode.layout.y - currNode.layout.width;
           
            for (let childrenName of childrenNameList)
            {
                // Recurrsively call the function
                childY += gapWidth + nodes[childrenName].layout.width;
                this.determineLayoutY(nodes, childrenName, edgesList, childY, false);
                // Update the gap
                childY += gapWidth + nodes[childrenName].layout.width;
            }
        }
    }

    getNodeInformationAxes()
    {
        var nodes = this.graph.nodes;
        var edgesHierarchy = this.graph.edgesHierarchy;

        // We loop for each time step
        for (var timeStep in edgesHierarchy)
        {
            var edgesTimestep = edgesHierarchy[timeStep];

            // Consider the case where tree has exactly one node
            if (Object.keys(edgesTimestep).length == 0)
            {
                // Do nothing
                continue;
            }

            // We can determine the root node of this timestep
            // Assuming we are working with trees only
            var allNodes = new Set(Object.keys(edgesTimestep));
            var childNodes = new Set(Object.values(edgesTimestep).flat());
            // Root is the one that is a key but not a children
            var rootNode = [...allNodes].filter(node => !childNodes.has(node));
          
            
            if (rootNode.length === 0)
            {
                console.log("No root detected");
                return;
            }
            else if (rootNode.length > 1)
            {
                console.log("Multiple root detected, not handling for now");
            }
            rootNode = nodes[rootNode[0]];

            // The xPosition is to draw the axes only 
            this.xPosition.push(rootNode.layout.x * this.scaler.x * this.scaler.allScale);
            
            // We keep track of these to draw the axes
            const currYHeight = (rootNode.layout.y + rootNode.layout.width + this.axes.padding) * this.scaler.allScale;
            const currYLow = (rootNode.layout.y - rootNode.layout.width - this.axes.padding) * this.scaler.allScale;
            if (currYHeight > this.yHighest)
            {
                this.yHighest = currYHeight; 
            }

            if (currYLow < this.yLowest)
            {
                this.yLowest = currYLow;
            }
        }
    }

    computeXPadding()
    {
        // Get a random edge in edgesTime
        var layers = Object.keys(this.graph.edgesTime);
        if (layers.length < 1)
        {
            return 0;
        }

        // Get edges in a random layer
        var randomEdges = this.graph.edgesTime[layers[0]];
        // Check if there is any edge
        var startNodes = Object.keys(randomEdges);
        if (startNodes.length < 1)
        {
            return 0;
        }

        // Get the first start node
        var startNodeName = startNodes[0];
        // Get its end nodes
        var endNodes = randomEdges[startNodeName];
        // Check if it has an end node
        if (endNodes.length < 1)
        {
            return 0;
        }

        // Get the first end node
        var endNodeName = endNodes[0];

        // Get the corresponding startNode and endNode
        var startNode = this.graph.nodes[startNodeName];
        var endNode = this.graph.nodes[endNodeName];

        // Get the x position from their layouts
        var xStart = startNode.layout.x;
        var xEnd = endNode.layout.x;
        // Calculate the distance, and save it to the variable
        this.paddings.x = Math.abs(xEnd - xStart) * this.paddings.xPercentage * this.scaler.x * this.scaler.allScale;
    }

    // Add padding to every node of the tree, except for the leaves
    addYPadding()
    {
        var nodes = this.graph.nodes;

        // Loop for each node
        for (var nodeName in nodes)
        {
            // Get the current node
            var currNode = nodes[nodeName];

            // Increase the width of this node, if it is not at the maxLayer
            if (currNode.layer < this.graph.maxLayer)
            {
                currNode.layout.width += (this.paddings.y - currNode.layer * this.paddings.layerDiff) * currNode.layout.width;
            }
        }

    }

    // Reset layout to original width
    // Also move the offset by some value
    initializeLayout(isInitLayout)
    {
        var nodes = this.graph.nodes;
        for (var nodeName in nodes)
        {
            var currNode = nodes[nodeName];
            if (isInitLayout)
            {
                currNode.layout.width = currNode.width;
                // Keep track of the smallest width
                this.wLowest = currNode.width * this.scaler.allScale < this.wLowest ? currNode.width * this.scaler.allScale : this.wLowest;
            } else 
            {
                this.wLowest = currNode.layout.width * this.scaler.allScale < this.wLowest ? currNode.layout.width * this.scaler.allScale : this.wLowest;
            }
            
            // Delete the node color
            currNode.color = undefined;
            if (this.isMoveByOffset)
            {
                currNode.layout.y += this.yOffset;
            }
        }
    }


    parseTransform(transformStr)
    {
        let translate = transformStr.match(/translate\(([^)]+)\)/);
        let scale = transformStr.match(/scale\(([^)]+)\)/);

        return {
            x: translate ? parseFloat(translate[1].split(",")[0]) : 0,
            y: translate ? parseFloat(translate[1].split(",")[1]) : 0,
            k: scale ? parseFloat(scale[1]) : 1
        };
    }

    formatNumber(val)
    {
        return Number.isInteger(val) ? val.toString() : val.toFixed(1).replace(".", "-");
    }

    // Highlight path only 
    // Need to build the forward and backward map
    buidForwardBackwardTemporalEdges()
    {
        if ((this.forwardEdgesTime === undefined || this.backwardEdgesTime === undefined)
            || (this.forwardEdgesTime.size === 0 || this.backwardEdgesTime.size === 0)
        )
            return;
        // Loop for every layer
        for (var layer in this.graph.edgesTime)
        {
            var edges = this.graph.edgesTime[layer];
            // Build forward edges
            for (var fromNode in edges)
            {
                if (this.forwardEdgesTime[fromNode] === undefined)
                {
                    this.forwardEdgesTime[fromNode] = [];
                }
                var endNodes = edges[fromNode];
                for (var endNode of endNodes)
                {
                    // Create the forward edge
                    this.forwardEdgesTime[fromNode].push(endNode);

                    // Create the backward edge
                    if (this.backwardEdgesTime[endNode] === undefined)
                    {
                        this.backwardEdgesTime[endNode] = [];
                    }
                    this.backwardEdgesTime[endNode].push(fromNode);
                }
            }
        }
    }

    // BFS forwards
    bfsForward(startNode)
    {
        // Initialize the queue
        var queue = [];
        queue.push(startNode);

        // Initialize the visited set
        var visited = new Set();
        visited.add(startNode);

        // Initialize the visited edges
        var visitedEdges = new Set();

        // Initialize the path
        var path = [];

        while (queue.length > 0)
        {
            var currNode = queue.shift();
            path.push(currNode);

            // Get the adjacent nodes of this one
            var children = this.forwardEdgesTime[currNode] || [];
            if (children.length === 0 || children === undefined)
            {
                // No children, death node
                visitedEdges.add(currNode + "-a");
                continue;
            }

            for (var child of children)
            {
                let edge = currNode + "-" + child;
                if (!visitedEdges.has(edge))
                {
                    visitedEdges.add(edge);
                }

                if (!visited.has(child))   
                {
                    queue.push(child);
                    visited.add(child);
                }
            }
        }

        return visitedEdges;
    }

    bfsBackward(startNode)
    {
        // Initialize the queue
        var queue = [];
        queue.push(startNode);

        // Initialize the visited set
        var visited = new Set();
        visited.add(startNode);

        // Initialize the visited edges
        var visitedEdges = new Set();

        // Initialize the path
        var path = [];

        while (queue.length > 0)
        {
            var currNode = queue.shift();
            path.push(currNode);

            // Get the adjacent nodes of this one
            var children = this.backwardEdgesTime[currNode] || [];
            if (children.length === 0 || children === undefined)
            {
                // No children, death node
                visitedEdges.add(currNode + "-a");
                continue;
            }

            for (var child of children)
            {
                let edge = child + "-" + currNode;
                if (!visitedEdges.has(edge))
                {
                    visitedEdges.add(edge);
                }

                if (!visited.has(child))   
                {
                    queue.push(child);
                    visited.add(child);
                }
            }
        }

        return visitedEdges;
    }



    // Highlight path only
    highlightPath(interactiveProperties, otherSvg, groupId=1, showInOther=false)
    {
        this.buidForwardBackwardTemporalEdges();

        // Other group Id for correspondences
        const otherGroupId = groupId === 1 ? 2 : 1;


        const svgElement = document.getElementById("TTMP" + groupId);
        const svgPaths = svgElement.querySelectorAll("path");

        // For the stroke
        let interactionStrokeId = [];
        let interactionStrokeCounter = 0;


        svgPaths.forEach(svgPath => {
            svgPath.addEventListener("mouseover", () => {
                const id = svgPath.getAttribute("id");

                if (id)
                {
                    const relatedPaths = this.buildRelatedPath(id);

                    // For every path in the forward and backward edges, highlight them
                    relatedPaths.forEach(edgeId => {
                        // Get the element
                        const pathEle = document.getElementById(edgeId);
                        if (pathEle)
                        {
                            // Get the line
                            const linePath = pathEle.getAttribute("d");
                            // Get all lines but vertical path
                            const lines = this.curves.extractAllButVerticals(linePath);
                            lines.forEach( line => {
                                // Draw the line 
                                var interactGroup = d3.select("#interaction-g" + groupId);
                                drawContinousLine(interactGroup, line, interactiveProperties.lineThickness, interactionStrokeId, interactionStrokeCounter, groupId);
                            }
                            );

                            if (showInOther)
                            {
                                // Find the correspondence with the other group
                                // Replace the last edgeId by other Id
                                const otherPathId = edgeId.replace(/.$/, otherGroupId.toString() );
                                const otherPathEle = document.getElementById(otherPathId);
                                // Get that element 
                                if (otherPathEle)
                                {
                                    // If it exists
                                    var otherInteractGroup = d3.select("#interaction-g" + otherGroupId);
                                    const otherLinePath = otherPathEle.getAttribute("d");
                                    // Get all lines but vertical path
                                    const otherLines = this.curves.extractAllButVerticals(otherLinePath);
                                    otherLines.forEach( otherLine => {
                                        // Draw the line
                                        drawContinousLine(otherInteractGroup, otherLine, interactiveProperties.lineThickness, interactionStrokeId, interactionStrokeCounter, otherGroupId);
                                    });
                                } else 
                                {
                                    // We will need to draw manually 
                                    // First extract the node indices 
                                    const [startNodeName, endNodeName] = this.extractNodeNamesFromEdgeId(otherPathId);
                                    var otherInteractGroup = d3.select("#interaction-g" + otherGroupId);
                                    // We only draw auxiliary segments if endNodeName is not a
                                    if (endNodeName !== "a")
                                    {
                                        var otherNodes = otherSvg.graph.nodes;

                                        let otherNode1 = otherNodes[startNodeName];
                                        let otherNode2 = otherNodes[endNodeName];

                                        // First node
                                        var layout1 = otherNode1.layout;
                                        var p1Width = layout1.width * otherSvg.scaler.y * otherSvg.scaler.allScale;
                                        var p1X     = layout1.x * otherSvg.scaler.x * otherSvg.scaler.allScale;
                                        var p1Y     = layout1.y * otherSvg.scaler.y * otherSvg.scaler.allScale + otherSvg.drawOffset;

                                        // Second node
                                        var layout2 = otherNode2.layout;
                                        var p2Width = layout2.width * otherSvg.scaler.y * otherSvg.scaler.allScale;
                                        var p2X     = layout2.x * otherSvg.scaler.x * otherSvg.scaler.allScale;
                                        var p2Y     = layout2.y * otherSvg.scaler.y * otherSvg.scaler.allScale + otherSvg.drawOffset;

                                        // We build the necessary coordinates to draw the Bezier curves
                                        var p1UpperX = p1X;
                                        var p1UpperY = p1Y + p1Width;
                                        var p2UpperX = p2X;
                                        var p2UpperY = p2Y + p2Width;

                                        var p1LowerX = p1X;
                                        var p1LowerY = p1Y - p1Width;
                                        var p2LowerX = p2X;
                                        var p2LowerY = p2Y - p2Width;
                                        otherInteractGroup.append("path")
                                                            .attr("fill", "none")
                                                            .attr("stroke", "red")
                                                            .attr("stroke-width", interactiveProperties.lineThickness)
                                                            .attr("d", otherSvg.curves.bezierCurveFromCoords(
                                                                p1UpperX, p1UpperY, p2UpperX, p2UpperY,
                                                                otherSvg.delta, otherSvg.paddings.x
                                                            ))
                                                            .attr("stroke-dasharray", 5.5)
                                                            .attr("id", "interaction-stroke" + interactionStrokeCounter.toString() + "-g" + otherGroupId);
                                        interactionStrokeId.push("interaction-stroke" + interactionStrokeCounter.toString() + "-g" + otherGroupId);
                                        interactionStrokeCounter++;;
                                        otherInteractGroup.append("path")
                                                            .attr("fill", "none")
                                                            .attr("stroke", "red")
                                                            .attr("stroke-width", interactiveProperties.lineThickness)
                                                            .attr("d", otherSvg.curves.bezierCurveFromCoords(
                                                                p1LowerX, p1LowerY, p2LowerX, p2LowerY,
                                                                otherSvg.delta, otherSvg.paddings.x
                                                            ))
                                                            .attr("stroke-dasharray", 5.5)
                                                            .attr("id", "interaction-stroke" + interactionStrokeCounter.toString() + "-g" + otherGroupId);
                                        interactionStrokeId.push("interaction-stroke" + interactionStrokeCounter.toString() + "-g" + otherGroupId);
                                        interactionStrokeCounter++;
                                    }
                                }
                            }
                        }
                    });
                }

            });

            // Add the mouse outside listener
            svgPath.addEventListener("mouseleave", () => {
                // For each interaction stroke in the interactionstorkID, remove it
                interactionStrokeId.forEach(strokeId => {
                    const strokeEle = document.getElementById(strokeId);
                    if (strokeEle)
                    {
                        strokeEle.remove();
                    }
                });
            });
        });
    }


    // Helper function to build all possible related path from a given id
    buildRelatedPath(id)
    {
        // Get the name of the nodes based on this id
        const nodeNames = id.split("-");
        const startNode = nodeNames[0];
        const endNode = nodeNames[1];

        // Get the forward and backward edges
        const forwardEdges = this.bfsBackward(startNode);

        let backwardEdges = [];
        if (endNode !== "a")
        {
            backwardEdges = this.bfsForward(endNode);
        }

        // Concatenate the forward and backward edges into a single set
        let partEdgeId = new Set([...forwardEdges, ...backwardEdges]);

        partEdgeId.add(startNode + "-" + endNode);
        const relatedPaths = [];
        partEdgeId.forEach(edge => {
            // Create all possible ids
            relatedPaths.push(edge + "-e-g" + this.containerIdx.toString());
            relatedPaths.push(edge + "-he-g" + this.containerIdx.toString());
            if (edge.endsWith("-a"))
            {
                relatedPaths.push(edge + "-g" + this.containerIdx.toString());
            }
        });

        return relatedPaths;
    }

    // Extract node name from id
    extractNodeNamesFromEdgeId(edgeId)
    {
        const match = edgeId.match(/^([^-]+)-([^-]+)/);
        return match ? [match[1], match[2]] : null;
    }
}