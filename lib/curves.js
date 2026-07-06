// Curves string for the shapes

class Curves {
    constructor()
    {

    }

    arcFromCoords(p1X, p1Y, p2X, p2Y, radius, direction, padding)
    {
        // Direction = 0 => Death node => padding + x
        // Direction = 1 => Birth node => padding - x
        // Determine the correct direction
        const movement = direction === 0 ? 1 : -1;
        return "M" + p1X + "," + p1Y // Move to (x, y) 
            + "L" + (p1X + movement * padding.x) + "," + p1Y // Draw a horizontaline
            + "A" + radius.x + "," + radius.y + " 0 0 " + direction
            + (p2X + movement * padding.x) + "," + p2Y
            + "L" + p2X + "," + p2Y;
    }

    arcFromNode(node, scaler, radius, direction)
    {
        // Extract node layout
        var nodeLayout = node.layout
        var nodeX = nodeLayout.x * scaler.x * 100;
        var nodeY = nodeLayout.y * scaler.y * 100;
        var nodeWidth = nodeLayout.width * scaler.y * 100;

        return  "M" + nodeX + "," + (nodeY + nodeWidth) 
                + "A" + radius.x + "," + radius.y + " 0 0 " 
                + direction + " " + nodeX + "," + (nodeY - nodeWidth);
    }

    // arcFromCoords(p1X, p1Y, p2X, p2Y, radius, direction)
    // {
    //     return "M" + p1X + "," + p1Y + "A" + radius.x + "," + radius.y + " 0 0"
    //             + direction + " " + p2X +  "," +  p2Y;
    // }

    edgeFromNodes(node1, node2, scaler, delta, padding)
    {
        // First node
        var layout1 = node1.layout;
        var p1Width = layout1.width * scaler.y * 100;
        var p1X     = layout1.x * scaler.x * 100;
        var p1Y     = layout1.y * scaler.y * 100;

        // Second node
        var layout2 = node2.layout;
        var p2Width = layout2.width * scaler.y * 100;
        var p2X     = layout2.x * scaler.x * 100;
        var p2Y     = layout2.y * scaler.y * 100;

        return "M" + p1X + "," + (p1Y + p1Width)   // Move to (x, y+w)
                + "L" + (p1X + padding.x) + ","  + (p1Y + p1Width) // Draw the line (x + padding, y + w)

                + "C" + (p1X + delta * (p2X - p1X)) + "," + (p1Y + p1Width) + "," + (p1X + delta * (p2X - p1X)) + "," + (p2Y + p2Width) + "," + (p2X - padding.x) + "," + (p2Y + p2Width) // Draw Bezier curve to node2 with xPadding

                + "L" + p2X + "," + (p2Y + p2Width) // Draw horizontal line from the offset to the center of node2

                + "L" + p2X + "," + (p2Y - p2Width) // Draw vertical line from top to bottom of node2

                + "L" + (p2X - padding.x) + "," + (p2Y - p2Width) // Draw horizontal line from the bottom of node2 to the offset

                + "C" + (p1X + delta * (p2X - p1X)) + "," + (p2Y - p2Width) + "," + (p1X + delta * (p2X - p1X)) + "," + (p1Y - p1Width) + "," + (p1X + padding.x) + "," + (p1Y - p1Width) // Draw Bezier curve back to node1 with the offset

                + "L" + p1X + "," + (p1Y - p1Width) // Draw back to the bottom of node1
    }

    edgeFromCoords(p1UpperX, p1UpperY, p2UpperX, p2UpperY, p1LowerX, p1LowerY, p2LowerX, p2LowerY,  
                    delta, padding)
    {
        return "M" + p1UpperX + "," + p1UpperY   // Move to (x, y)
                + "L" + (p1UpperX + padding) + ","  + p1UpperY // Draw the line (x + padding, y)

                + "C" + (p1UpperX + delta * (p2UpperX - p1UpperX)) + "," + p1UpperY + "," + (p1UpperX + delta * (p2UpperX - p1UpperX)) + "," + p2UpperY + "," + (p2UpperX - padding) + "," + p2UpperY // Draw Bezier curve to p2U with Padding

                + "L" + p2UpperX + "," + p2UpperY // Draw horizontal line to p2U

                + "L" + p2LowerX + "," + p2LowerY // Draw vertical line from p2L

                + "L" + (p2LowerX - padding) + "," + p2LowerY // Draw horizontal line from the bottom of p2L to the offset

                + "C" + (p1LowerX + delta * (p2LowerX - p1LowerX)) + "," + p2LowerY + "," + (p1LowerX + delta * (p2LowerX - p1LowerX)) + "," + p1LowerY + "," + (p1LowerX + padding) + "," + p1LowerY // Draw Bezier curve back to p1L with the offset

                + "L" + p1LowerX + "," + p1LowerY // Draw back to the p1L
    }

    bezierCurveFromCoords(p1X, p1Y, p2X, p2Y, delta, padding)
    {
        return "M" + p1X + "," + p1Y   // Move to (x, y)
                
                + "L" + (p1X + padding) + ","  + p1Y // Draw the line (x + padding, y)

                + "C" + (p1X + delta * (p2X - p1X)) + "," + p1Y + "," + (p1X + delta * (p2X - p1X)) + "," + p2Y + "," + (p2X - padding) + "," + p2Y // Draw Bezier curve to p2 with Padding

                + "L" + p2X + "," + p2Y; // Draw horizontal line to p2

    }    

    halfEdgeFromCoords(p1UpperX, p1UpperY, p2UpperX, p2UpperY, p1LowerX, p1LowerY, p2LowerX, p2LowerY,  
            delta, padding)
    {
        // pointUpper = p1Upper
        // ChildY + childWidht = p2Upper
        // pointLower = p1Lower
        // ChildY - childWidth = p2Lower
        return "M" + p1UpperX + "," + p1UpperY // Move to the top

                + "C" + (p1UpperX + delta * (p2UpperX - p1UpperX)) + "," + p1UpperY + "," + (p1UpperX + delta * (p2UpperX - p1UpperX)) + "," + p2UpperY + "," + (p2UpperX - padding) + "," + p2UpperY  // Draw Bezier curve from the point to the padding 
                
                + "L" + p2UpperX + "," + p2UpperY // Draw horizontal line from the offset to the upper part
                
                + "L" + p2LowerX + "," + p2LowerY // Draw vertical line from top to bottom

                + "L" + (p2LowerX - padding) + "," + p2LowerY // Draw horizontal line from the bottom part to the offset

                + "C" + (p1LowerX + delta * (p2LowerX - p1LowerX)) + "," + p2LowerY + "," + (p1LowerX + delta * (p2LowerX - p1LowerX)) + "," + p1LowerY + "," + p1LowerX + "," + p1LowerY // Draw Bezier cruve from the lower part to the begining
                ;  
    }

    extractAllButVerticals(path)
    {
        // M355.9322033898305,1176.2953556125378
        // L355.9322033898305,1176.2953556125378
        // C381.40593220338985,1176.2953556125378,381.40593220338985,1178.3126443796386,406.87966101694917,1178.3126443796386
        // L406.87966101694917,1178.3126443796386
        // L406.87966101694917,1167.4191315877488
        // L406.87966101694917,1167.4191315877488
        // C381.40593220338985,1167.4191315877488,381.40593220338985,1176.0735073717412,355.9322033898305,1176.0735073717412
        // L355.9322033898305,1176.0735073717412 
        if (path.includes("A"))
        {
            return [path];    // Return the full path if it is an arc
        }

        // Process the path
        let patternFullEdge = /^(M[^L]*L[^C]*C[^L]*L[^L]*)(L[^L]*L[^C]*C[^L]*L.*)$/;
        let pattenHalfEdge = /^(M[^C]*C[^L]*L[^L]*)(L[^L]*L[^C]*C.*) $/

        if (patternFullEdge.test(path))
        {
            // Full path
            let [, firstPart, secondPart] = path.match(patternFullEdge);    
            // Replace the first character of the second part with an M
            secondPart = secondPart.replace(/^L/, "M");

            return [firstPart, secondPart];
        }

        if (pattenHalfEdge.test(path))
        {
            // Half path
            let [, firstPart, secondPart] = path.match(pattenHalfEdge);
            // Replace the first character of the second part with an M
            secondPart = secondPart.replace(/^L/, "M");

            return [firstPart, secondPart];
        }

        // We also have normal vertical lines, don't care
        return [];
    }

}