function saveSVG(svgElement, name)
{
    // Convert svg to a string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    // Create a blob object from the string data
    const blob = new Blob([svgData], {type: "image/svg+xml"});
    // Create the URL from the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download 
    var a = document.createElement("a");
    a.href = url;
    a.download = name + ".svg";
    a.click();
    
    // Remove this element after the download is triggered
    URL.revokeObjectURL(url);
}


function saveSetups(svgImg)
{
    // Get the parameters
    const params = getFullSetups(svgImg);

    // Convert this one to json
    const paramsStr = JSON.stringify(params, null, 4);

    // Create a blob object from the string data
    const blob = new Blob([paramsStr], {type: "application/json"});
    // Create the URL from the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    var a = document.createElement("a");
    a.href = url;
    a.download = "parameters.json";
    a.click();

    // Remove this element after the download is triggered
    URL.revokeObjectURL(url);
}

function getFullSetups(svgImg)
{
    // Prepare the content to save

    const drawingGroup = d3.select("#drawing-group1");
    let transformStr = "translate(0,0) scale(1)";
    if (!drawingGroup.empty())
    {
        let transformAtr = drawingGroup.attr("transform");
        if (transformAtr !== null)
        {
            transformStr = transformAtr;
        } 
    }

    // Limit layers
    const isLimitLayers = document.getElementById("limit-layers").checked;
    const minLimitLayer = parseInt(document.getElementById("min-layer").value);
    const maxLimitLayer = parseInt(document.getElementById("max-layer").value);

    // Hide singular nodes
    const isHideSingularNode = document.getElementById("hide-singular-nodes").checked;

    // Layout types
    const layoutTypeField = document.getElementById("layout-type");
    const layoutType = layoutTypeField.options[layoutTypeField.selectedIndex].text;

    // Drawing scales
    const xScale = parseFloat(document.getElementById("x-scale").value);
    const yScale = parseFloat(document.getElementById("y-scale").value);

    // Padding 
    const yPaddding = parseFloat(document.getElementById("y-padding").value);
    const layerDiff = parseFloat(document.getElementById("layer-diff").value);
    const xPadding = parseFloat(document.getElementById("x-padding").value);

    // Axes
    const isDrawAxes = document.getElementById("draw-axes").checked;
    const axesColorField = document.getElementById("axes-color");
    const axesColor = axesColorField.options[axesColorField.selectedIndex].text;
    const axesWidth = parseFloat(document.getElementById("axes-width").value); 
    const isShowTime = document.getElementById("axes-show-time").checked;
    const textSize = parseFloat(document.getElementById("axes-text-size").value);
    const timeFrom = parseInt(document.getElementById("axes-time-start").value);
    const distanceFromAxes = parseInt(document.getElementById("axes-distance").value);

    // Birth-Death event
    const xRadius = parseFloat(document.getElementById("x-radius").value);
    const yRadius = parseFloat(document.getElementById("y-radius").value);
    const aScale = parseFloat(document.getElementById("axes-scale").value);

    // Edges
    const deltaMain = parseFloat(document.getElementById("delta-main").value);

    const fudgeX = parseFloat(document.getElementById("fudge-x").value);

    // Color
    const colorTypeField = document.getElementById("color-types");
    const colorType = colorTypeField.options[colorTypeField.selectedIndex].text;

    // Presets and choosing types for categorical color
    const colorPreset = document.getElementById("preset-cat").selectedIndex;
    const chooseTypeField = document.getElementById("cat-color-choose-type");
    const chooseType = chooseTypeField.options[chooseTypeField.selectedIndex].text;

    const hslDecideField = document.getElementById("hsl-decide-type");
    const hslDecideType = hslDecideField.options[hslDecideField.selectedIndex].text;

    const hueField = document.getElementById("hue");
    const hue = hueField.options[hueField.selectedIndex].text;

    const minSaturation = parseFloat(document.getElementById("saturation-min").value);
    const maxSaturation = parseFloat(document.getElementById("saturation-max").value);

    const minLightness = parseFloat(document.getElementById("lightness-min").value);
    const maxLightness = parseFloat(document.getElementById("lightness-max").value);

    // D3
    const d3ColorTypeField = document.getElementById("d3-color-type");
    const d3ColorDecideTypeField = document.getElementById("d3-decide-type");
    const d3ColorDecideType = d3ColorDecideTypeField.options[d3ColorDecideTypeField.selectedIndex].text;

    const d3ColorType = d3ColorTypeField.options[d3ColorTypeField.selectedIndex].text;

    let colorFamilyField, colorSchemeField, numColorField;
    let colorFamily, colorScheme;
    let numColor = 3;

    // Num color is always there, only the visibility changes
    numColorField = document.getElementById("d3-discrete-num-colors");
    numColor = parseInt(numColorField.options[numColorField.selectedIndex].text);

    if (d3ColorType === "Continuous")
    {
        colorFamilyField = document.getElementById("d3-continuous-family");
    } else 
    {   
        // Discrete
        colorFamilyField = document.getElementById("d3-discrete-family");
    }
    colorFamily = colorFamilyField.options[colorFamilyField.selectedIndex].text;
    // Determine the color scheme
    let colorSchemeName = "d3-" + d3ColorType.toLowerCase() + "-" + colorFamily.toLowerCase();
    colorSchemeField = document.getElementById(colorSchemeName);
    colorScheme = colorSchemeField.options[colorSchemeField.selectedIndex].text;

    // Determine the color choose type for d3 discrete
    let d3ColorChooseField = document.getElementById("d3-discrete-color-choose-type");
    let d3ColorChooseType = d3ColorChooseField.options[d3ColorChooseField.selectedIndex].text;

    // Contrast
    const isIncreaseContrast = document.getElementById("increase-contrast").checked;

    // Population color
    const popSetColorScheme = document.getElementById("population-color-schema").selectedIndex;

    const useOpacity = document.getElementById("use-opacity").checked;
    const minOpacity = parseFloat(document.getElementById("opacity-min").value);
    const maxOpacity = parseFloat(document.getElementById("opacity-max").value);

    const inverseColor = document.getElementById("inverse-color").checked;

    // Type of color for each node
    const colorDecideType = document.getElementById("color-decide-type").selectedIndex;

    // Shadow
    // var isUseShadow = document.getElementById("use-shadow").checked;
    const shadowTypeField = document.getElementById("shadow-type");
    const shadowType = shadowTypeField.options[shadowTypeField.selectedIndex].text;

    const haloThickness = parseFloat(document.getElementById("halo-thickness").value);
    const shadowColorField = document.getElementById("color-shadow");
    const colorShadow = shadowColorField.options[shadowColorField.selectedIndex].text;
    const dxShadow = parseFloat(document.getElementById("dx-shadow").value);
    const dyShadow = parseFloat(document.getElementById("dy-shadow").value);
    const stdShadow = parseFloat(document.getElementById("std-shadow").value);
    const opaqueShadow = parseFloat(document.getElementById("opaque-shadow").value);

    const isActiveSplitstreams = document.getElementById("active-splitstreams").checked
    const ssXLength = parseFloat(document.getElementById("splitstreams-x-length").value);
    const ssXPadding = parseFloat(document.getElementById("splitstreams-x-padding").value);

    const secondImageOffset = parseFloat(document.getElementById("second-image-offset").value);

    const crispEdges = document.getElementById("crisp-edges").checked;

    const params = {
        "transformStr" : transformStr,

        "limitLayer" : {
            "isLimitLayer" : isLimitLayers,
            "minLimitLayer" : minLimitLayer,
            "maxLimitLayer" : maxLimitLayer,
            "orgMaxLayer" : svgImg.graph.maxLayer,
        },
        
        "layoutType" : layoutType,

        "hideSingularNodes" : isHideSingularNode,

        "scale" : {
            "xScale" : xScale,
            "yScale" : yScale,
        },


        "padding" : {
            "yPadding" : yPaddding,
            "layerDiff" : layerDiff,
            "xPadding" : xPadding,
        },

        "axes" : {
            "isDrawAxes" : isDrawAxes,
            "axesColor" : axesColor,
            "axesWidth" : axesWidth,
            "axesScale": aScale,
            "isShowTime" : isShowTime,
            "textSize" : textSize,
            "timeFrom" : timeFrom,
            "distanceFromAxes" : distanceFromAxes,
        },

        "birthDeath" : {
            "xRadius" : xRadius,
            "yRadius" : yRadius,
        },

        "deltaMain" : deltaMain,

        "fudgeX" : fudgeX,

        "colorType" : colorType,

        "colorHSL" : {
            "hue" : hue,
            "minSaturation" : minSaturation,
            "maxSaturation" : maxSaturation,
            "minLightness"  : minLightness,
            "maxLightness"  : maxLightness,
            "hslDecideType" : hslDecideType,
            "inverseColor"  : inverseColor
        },

        "colorCat" : {
            "colorPreset" : colorPreset,
            "chooseType" : chooseType,
            "inverseColor" : inverseColor
        },

        "colorD3" : {
            "colorType" : d3ColorType,
            "colorFamily" : colorFamily,
            "colorScheme" : colorScheme,
            "numColor" : numColor,
            "decideType" : d3ColorDecideType,
            "chooseType" : d3ColorChooseType,
            "inverseColor" : inverseColor,
            "increaseContrast" : isIncreaseContrast
        },

        "colorPop" : {
            "colorScheme" : popSetColorScheme,
        },

        "opacity" : {
            "use": useOpacity,
            "minOpacity" : minOpacity,
            "maxOpacity" : maxOpacity,
        },

        "colorDecideType" : colorDecideType,

        "shadowType" : shadowType,

        "dropShadows" : {
            "color" : colorShadow,
            "dx" : dxShadow,
            "dy" : dyShadow,
            "std" : stdShadow,
            "opacity" : opaqueShadow
        },

        "halo" : {
            "color" : colorShadow,
            "thickness" : haloThickness,
        },
        
        "splitstreams" : { 
            "isUse" : isActiveSplitstreams,
            "xMargin" : ssXLength,
            "xPadding" : ssXPadding
        },

        "secondImageOffset" : secondImageOffset,

        "crispEdges" : crispEdges
    };

    return params;
}

// Some helper functions to make the code shorter
function drawContinousLine(svgGroup, line, thickness, interactionStrokeId, counter, groupId)
{
    svgGroup.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", thickness)
            .attr("d", line)
            .attr("id", "interaction-stroke" + counter.toString() + "-g" + groupId);
        interactionStrokeId.push("interaction-stroke" + counter.toString() + "-g" + groupId);
        counter++;
}