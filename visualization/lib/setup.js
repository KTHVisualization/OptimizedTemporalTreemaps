// Ensure the script run after the DOM is loaded
// TODO: Rehaul so that the whole thing is not drawn again every time a parameter changes
document.addEventListener("DOMContentLoaded", function() {

    // Set to the one produced by our drawing codes
    var image;
    // Set the comparison datasets
    var imageCompare;
    let transformStr = "translate(0,0) scale(1)";
    
    let listenerActive = true;
    // Add zoom event 
    var zoom = d3.zoom().scaleExtent([0.01, 10]).on("zoom", function () {
        syncZoom(d3.event.transform);
    });


    function syncZoom(tranformEvent) {
        if (image) 
        {
            var imageRoot = d3.select("#drawing-group1");
            imageRoot.attr("transform", tranformEvent);
        }

        if (imageCompare)
        {
            var imageCompareRoot = d3.select("#drawing-group2");
            imageCompareRoot.attr("transform", tranformEvent);
        }
    }

    function parseTransform(transformStr)
    {
        let translate = transformStr.match(/translate\(([^)]+)\)/);
        let scale = transformStr.match(/scale\(([^)]+)\)/);

        return {
            x: translate ? parseFloat(translate[1].split(",")[0]) : 0,
            y: translate ? parseFloat(translate[1].split(",")[1]) : 0,
            k: scale ? parseFloat(scale[1]) : 1
        };
    }

    function onChangeHighlight()
    {   
        // Get the chosen options


        // Create a new interactive highlight object
        let interactiveHighlight = new InteractionProperties(5);

        
        if (imageCompare)
        {
            image.highlightPath(interactiveHighlight, imageCompare, 1, true);
            imageCompare.highlightPath(interactiveHighlight, image, 2, true);
        } else {
            image.highlightPath(interactiveHighlight, image, 1);
        }
    }

    function onHideLayerBtnClick()
    {   
        // Get hidden layer
        let hiddenLayers = document.getElementById("hidden-layers").value;

        // Convert the input numbers to array
        let arrHiddenLayers = hiddenLayers
                                .split(/[, ]+/) // Split by , and space
                                .filter(num => num !== "")  // Remove empty string
                                .map(num => parseInt(num));
        image.hideSomeLayers(arrHiddenLayers);
        if (imageCompare)
        {
            imageCompare.hideSomeLayers(arrHiddenLayers);
        }
    }

    function updateTreeInfo(maxTime)
    {   
        var selection = selectField.options[selectField.selectedIndex].text;

        const alwaysText = "Depth starts at 0 (root nodes).<br>";
        const treeLayerText = "Tree has " + (window[selection].maxLayer + 1) +
                                " layers (max depth " + window[selection].maxLayer + ") with ";

        const numNodesText = Object.keys(window[selection].nodes).length + " nodes ";

        const numTimestepText = " over " + maxTime + " timesteps (timestep starts at 0).";

        const fullText = alwaysText + treeLayerText + numNodesText + numTimestepText;

        document.getElementById("tree-info").innerHTML = fullText;
    }

    // Add event listener for slider
    function onChangeParams(inputTransformStr="", useInputImageOffset=false, imageOffset=0) 
    {
        if (listenerActive)
        {
            // Get the options
            // Draw roots
            // var isDrawRoots = document.getElementById("draw-roots").checked;

            var isLimitLayers = document.getElementById("limit-layers").checked;
            var minLimitLayer = parseInt(document.getElementById("min-layer").value);
            var maxLimitLayer = parseInt(document.getElementById("max-layer").value);
            

            // Hide singular nodes
            var isHideSingularNode = document.getElementById("hide-singular-nodes").checked;

            // Type of layout
            var layoutTypeField = document.getElementById("layout-type");
            var layoutType = layoutTypeField.options[layoutTypeField.selectedIndex].text;

            // Drawing scales
            var xScale = parseFloat(document.getElementById("x-scale").value);
            var yScale = parseFloat(document.getElementById("y-scale").value);
            

            // Padding
            var yPaddding = parseFloat(document.getElementById("y-padding").value);
            var layerDiff = parseFloat(document.getElementById("layer-diff").value);
            var xPadding = parseFloat(document.getElementById("x-padding").value);

            // Axes
            var isDrawAxes = document.getElementById("draw-axes").checked;
            var axesColorField = document.getElementById("axes-color");
            var axesColor = axesColorField.options[axesColorField.selectedIndex].text;
            var axesWidth = parseFloat(document.getElementById("axes-width").value); 
            var isShowTime = document.getElementById("axes-show-time").checked;
            var textSize = parseFloat(document.getElementById("axes-text-size").value);
            var timeFrom = parseInt(document.getElementById("axes-time-start").value);
            var distanceFromAxes = parseInt(document.getElementById("axes-distance").value);

            // Birth-Death event
            var xRadius = parseFloat(document.getElementById("x-radius").value);
            var yRadius = parseFloat(document.getElementById("y-radius").value);
            var aScale = parseFloat(document.getElementById("axes-scale").value);

            // Edges
            var deltaMain = parseFloat(document.getElementById("delta-main").value);

            let fudgeX = parseFloat(document.getElementById("fudge-x").value);

            // Color
            var colorTypeField = document.getElementById("color-types");
            var colorType = colorTypeField.options[colorTypeField.selectedIndex].text;

            // Presets and choosing types for categorical color
            var colorPreset = document.getElementById("preset-cat").selectedIndex;
            var chooseTypeField = document.getElementById("cat-color-choose-type");
            var chooseType = chooseTypeField.options[chooseTypeField.selectedIndex].text;


            // HSL
            let hslDecideField = document.getElementById("hsl-decide-type");
            let hslDecideType = hslDecideField.options[hslDecideField.selectedIndex].text;

            var hueField = document.getElementById("hue");
            var hue = hueField.options[hueField.selectedIndex].text;

            var minSaturation = parseFloat(document.getElementById("saturation-min").value);
            var maxSaturation = parseFloat(document.getElementById("saturation-max").value);

            var minLightness = parseFloat(document.getElementById("lightness-min").value);
            var maxLightness = parseFloat(document.getElementById("lightness-max").value);


            let d3ColorTypeField = document.getElementById("d3-color-type");
            let d3ColorDecideTypeField = document.getElementById("d3-decide-type");

            let d3ColorDecideType = d3ColorDecideTypeField.options[d3ColorDecideTypeField.selectedIndex].text;

            let d3ColorType = d3ColorTypeField.options[d3ColorTypeField.selectedIndex].text;
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
            let isIncreaseContrast = document.getElementById("increase-contrast").checked;

            // Population color
            let popSetColorScheme = document.getElementById("population-color-schema").selectedIndex;

            var useOpacity = document.getElementById("use-opacity").checked;
            var minOpacity = parseFloat(document.getElementById("opacity-min").value);
            var maxOpacity = parseFloat(document.getElementById("opacity-max").value);

            var inverseColor = document.getElementById("inverse-color").checked;

            // Type of color for each node
            var colorDecideType = document.getElementById("color-decide-type").selectedIndex;

            // Shadow
            // var isUseShadow = document.getElementById("use-shadow").checked;
            var shadowTypeField = document.getElementById("shadow-type");
            var shadowType = shadowTypeField.options[shadowTypeField.selectedIndex].text;

            var haloThickness = parseFloat(document.getElementById("halo-thickness").value);
            var shadowColorField = document.getElementById("color-shadow");
            var colorShadow = shadowColorField.options[shadowColorField.selectedIndex].text;
            var dxShadow = parseFloat(document.getElementById("dx-shadow").value);
            var dyShadow = parseFloat(document.getElementById("dy-shadow").value);
            var stdShadow = parseFloat(document.getElementById("std-shadow").value);
            var opaqueShadow = parseFloat(document.getElementById("opaque-shadow").value);

            var selection = selectField.options[selectField.selectedIndex].text;
            // The second image
            let compareSelection = compareField.options[compareField.selectedIndex].text;

            var isMoveByOffset = true;
            if (!selectedTrees.has(selection))
            {
                // If the selection is chosen for the first time
                selectedTrees.add(selection);
            } 
            else if (compareSelection !== "None" && !selectedTrees.has(compareSelection))
            {
                // If the selection is chosen for the first time
                selectedTrees.add(compareSelection);
            }
            else 
            {
                // The tree has been already chosen
                isMoveByOffset = false;
            }

            // Create the necessary parameter objects
            var orgMaxLayer = window[selection].maxLayer;
            var limitLayerObj = new LimitLayersProperties(isLimitLayers, minLimitLayer, maxLimitLayer, orgMaxLayer);

            var scaler = new SizeScalers(xScale, yScale);
            var colorHSL = new ColorsHSL(hue, minSaturation, maxSaturation, 
                                        minLightness, maxLightness, 
                                        hslDecideType, inverseColor);
            // Always create the categorical color object
            var colorCat = new ColorCategorical(colorPreset, chooseType, inverseColor);
            
            var opacityProps = new OpacityProperties(useOpacity, minOpacity, maxOpacity);

            var paddings = new PaddingProperties(0.0, yPaddding, xPadding, layerDiff);
            var axes = new Axes(axesColor, axesWidth, aScale, isShowTime, textSize, timeFrom, distanceFromAxes);
            var radii = new Radii(xRadius, yRadius);
            var dropShadow = new DropShadowProperties("drop-shadow", colorShadow, 
                                                    dxShadow, dyShadow, stdShadow, opaqueShadow);
            var halo = new HaloProperties(colorShadow, haloThickness);

            // Get the drawing group ?

            let drawingGroup = d3.select("#drawing-group1");
            
            if (!drawingGroup.empty())
            {
                let transformAtr = drawingGroup.attr("transform");
                if (transformAtr !== null)
                {
                    transformStr = transformAtr;
                } 
            }

            // Logic for input transform string
            if (inputTransformStr !== "")
            {
                transformStr = inputTransformStr;
            }

            // D3 color object
            let colorD3 = new ColorD3(d3ColorType, colorFamily, colorScheme, numColor, 
                                    d3ColorDecideType, d3ColorChooseType, inverseColor, isIncreaseContrast);
            
            // Population color object
            let colorPop = new ColorPopulation(popSetColorScheme);

            // Color code
            let colorCode = new ColorCode();

            let crispEdges =  document.getElementById("crisp-edges").checked;

            var otherProperties = new OtherProperties(isHideSingularNode, fudgeX, crispEdges);

            let isActiveSplitstreams = document.getElementById("active-splitstreams").checked
            let ssXLength = parseFloat(document.getElementById("splitstreams-x-length").value);
            let ssXPadding = parseFloat(document.getElementById("splitstreams-x-padding").value);

            let splitStreamProp = new SplitstreamsFeatures(isActiveSplitstreams, ssXLength, ssXPadding);


            image = new TemporalTreemapPlusLib(window[selection], 'container1', 
                                                limitLayerObj, layoutType, scaler, 
                                                colorType, colorDecideType, 
                                                colorHSL, colorCat, colorD3, colorPop, colorCode,
                                                opacityProps, 
                                                paddings,
                                                isDrawAxes, axes, radii, deltaMain,
                                                shadowType, halo, dropShadow, 
                                                otherProperties,
                                                splitStreamProp,
                                                isMoveByOffset,
                                                0
                                            );
            image.drawTree();

            let maxTime = image.xPosition.reduce((max, num) => (num > max ? num : max), image.xPosition[0]);
            maxTime /= (image.scaler.x * image.scaler.allScale);
            // Update the tree info
            maxTime = Math.ceil(maxTime);
            // Time starts at 0
            updateTreeInfo(maxTime + 1);

            // document.querySelectorAll("svg").forEach(applyHoverEffect);

            // image.addEdgeHighlight();
            

            // Get the off set for the second image
            let secondImageOffset;
            if (useInputImageOffset)
            {
                secondImageOffset = imageOffset
            } else 
            {
               secondImageOffset = parseFloat(document.getElementById("second-image-offset").value);
            }
            if (compareSelection !== "None")
            {

                imageCompare = new TemporalTreemapPlusLib(window[compareSelection], 'container2', 
                    limitLayerObj, layoutType, scaler, 
                    colorType, colorDecideType, 
                    colorHSL, colorCat, colorD3, colorPop, colorCode,
                    opacityProps, 
                    paddings,
                    isDrawAxes, axes, radii, deltaMain,
                    shadowType, halo, dropShadow, 
                    otherProperties,
                    splitStreamProp,
                    isMoveByOffset,
                    secondImageOffset,
                    2
                );
                imageCompare.drawTree();
            }
            onChangeHighlight();

            image.svg.call(zoom);
            
            if (imageCompare)
            {
                imageCompare.svg.call(zoom);
            }

            let transformObj = parseTransform(transformStr);
            image.svg.call(zoom.transform, d3.zoomIdentity.translate(transformObj.x, transformObj.y).scale(transformObj.k));
            if (imageCompare)
            {
                imageCompare.svg.call(zoom.transform, d3.zoomIdentity.translate(transformObj.x, transformObj.y).scale(transformObj.k));
            }
        }
    }

    function onExportSetupsClick(svgImg)
    {
        saveSetups(svgImg);
    }

    function onImportButtonClick()
    {
        // Get the input

        // Deactivate the listener
        listenerActive = false;
        const fileInput = document.getElementById("import-files");
        const fileJson = fileInput.files[0];
        if (!fileJson)
        {
            alert("Only JSON files are supported");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const jsonData = JSON.parse(event.target.result); // Read JSON string
                // Get all information from this file
                const fileTransformStr = jsonData.transformStr;
                
                document.getElementById("limit-layers").checked = jsonData.limitLayer.isLimitLayer;
                if (jsonData.limitLayer.minLimitLayer)
                {
                    document.getElementById("min-layer").value = jsonData.limitLayer.minLimitLayer;
                }

                if (jsonData.limitLayer.maxLimitLayer)
                {
                    document.getElementById("max-layer").value = jsonData.limitLayer.maxLimitLayer;
                }

                document.getElementById("hide-singular-nodes").checked = jsonData.hideSingularNodes;
                document.getElementById("layout-type").value = jsonData.layoutType;

                document.getElementById("x-scale").value = jsonData.scale.xScale;
                document.getElementById("y-scale").value = jsonData.scale.yScale;

                document.getElementById("y-padding").value = jsonData.padding.yPaddding;
                document.getElementById("layer-diff").value = jsonData.padding.layerDiff;
                document.getElementById("x-padding").value = jsonData.padding.xPadding;

                document.getElementById("draw-axes").checked = jsonData.axes.isDrawAxes;
                document.getElementById("axes-color").value = jsonData.axes.axesColor;
                document.getElementById("axes-width").value = jsonData.axes.axesWidth;
                document.getElementById("axes-show-time").checked = jsonData.axes.isShowTime;
                document.getElementById("axes-scale").value = jsonData.axes.axesScale;
                document.getElementById("axes-text-size").value = jsonData.axes.textSize;
                document.getElementById("axes-time-start").value = jsonData.axes.timeFrom;
                document.getElementById("axes-distance").value = jsonData.axes.distanceFromAxes;

                if (jsonData.fudgeX)
                {
                    document.getElementById("fudge-x").value = jsonData.fudgeX;
                }

                document.getElementById("x-radius").value = jsonData.birthDeath.xRadius;
                document.getElementById("y-radius").value = jsonData.birthDeath.yRadius;

                document.getElementById("delta-main").value = jsonData.deltaMain;

                
                document.getElementById("color-decide-type").selectedIndex = jsonData.colorDecideType;
                document.getElementById("color-types").value = jsonData.colorType;

                document.getElementById("hsl-decide-type").value = jsonData.colorHSL.hslDecideType;
                document.getElementById("hue").value = jsonData.colorHSL.hue;
                document.getElementById("saturation-min").value = jsonData.colorHSL.minSaturation;
                document.getElementById("saturation-max").value = jsonData.colorHSL.maxSaturation;

                document.getElementById("lightness-min").value = jsonData.colorHSL.minLightness;
                document.getElementById("lightness-max").value = jsonData.colorHSL.maxLightness;


                document.getElementById("preset-cat").selectedIndex = jsonData.colorCat.colorPreset;
                document.getElementById("cat-color-choose-type").value = jsonData.colorCat.chooseType;

                document.getElementById("d3-color-type").value = jsonData.colorD3.colorType;
                document.getElementById("d3-decide-type").value = jsonData.colorD3.decideType;
                let colorFamily;
                if (jsonData.colorD3.colorType === "Continuous")
                {
                    colorFamily = document.getElementById("d3-continuous-family");
                } else 
                {   
                    // Discrete
                    colorFamily = document.getElementById("d3-discrete-family");
                }
                colorFamily = jsonData.colorD3.colorFamily;
                let colorSchemeName = "d3-" + jsonData.colorD3.colorType.toLowerCase() + "-" + colorFamily.toLowerCase();
                

                document.getElementById(colorSchemeName).value = jsonData.colorD3.colorScheme;
                document.getElementById("d3-discrete-num-colors").value = jsonData.colorD3.numColor;
                document.getElementById("d3-discrete-color-choose-type").value = jsonData.colorD3.chooseType;
                document.getElementById("increase-contrast").checked = jsonData.colorD3.increaseContrast;

                document.getElementById("population-color-schema").selectedIndex = jsonData.colorPop.colorScheme;
                document.getElementById("inverse-color").checked = jsonData.colorHSL.inverseColor;

                document.getElementById("shadow-type").value = jsonData.shadowType;
                
                document.getElementById("halo-thickness").value = jsonData.halo.thickness;
                document.getElementById("color-shadow").value = jsonData.dropShadows.color;
                document.getElementById("dx-shadow").value = jsonData.dropShadows.dx;
                document.getElementById("dy-shadow").value = jsonData.dropShadows.dy;
                document.getElementById("std-shadow").value = jsonData.dropShadows.std;
                document.getElementById("opaque-shadow").value = jsonData.dropShadows.opacity;

                document.getElementById("use-opacity").checked = jsonData.opacity.use;
                document.getElementById("opacity-min").value = jsonData.opacity.minOpacity;
                document.getElementById("opacity-max").value = jsonData.opacity.maxOpacity;
                
                document.getElementById("active-splitstreams").checked = jsonData.splitstreams.isUse;
                document.getElementById("splitstreams-x-length").value = jsonData.splitstreams.xMargin;
                document.getElementById("splitstreams-x-padding").value = jsonData.splitstreams.xPadding;

                if (jsonData.crispEdges !== undefined)
                {
                    document.getElementById("crisp-edges").checked = jsonData.crispEdges;
                }

                const secondOffset = jsonData.secondImageOffset;
                onChangeParams(fileTransformStr, true, secondOffset);

            } catch (error)
            {
                alert("Invalide JSON file!");
                console.log(error);
            }
        };

        reader.readAsText(fileJson);
        listenerActive = true;
        
    }


    // Add event listener for the save button
    function onSaveButtonClick() 
    {
        var svgElement = document.getElementById("TTMP1");
        var name = selectField.value;
        saveSVG(svgElement, name);
        //~ savePNG(svgElement, name);
    }

    function onSaveCompareButtonClick() 
    {
        var svgElement = document.getElementById("TTMP2");
        if (svgElement)
        {
            var name = compareField.value;
            saveSVG(svgElement, name);
        }
        //~ savePNG(svgElement, name);
    }

    // Track whether a tree is already chosen 
    var selectedTrees = new Set();
    

    // The current method exploded in file size
    var selectField = document.getElementById('datasets');

    document.getElementById('datasets').addEventListener("input", () => onChangeParams());

    
    var compareField = document.getElementById("datasets-2");
    document.getElementById("datasets-2").addEventListener("input", () => onChangeParams());

    

    // document.getElementById("draw-roots").addEventListener("input", () => onChangeParams());

    // Limit showing some layers only
    document.getElementById("limit-layers").addEventListener("input", () => onChangeParams());
    // document.getElementById("min-layer").addEventListener("input", () => onChangeParams());
    // document.getElementById("max-layer").addEventListener("input", () => onChangeParams());
    document.getElementById("execute-limit-layer-button").addEventListener("click", () => onChangeParams());

    document.getElementById("hide-singular-nodes").addEventListener("input", () => onChangeParams());

    // Color Cat
    document.getElementById("color-types").addEventListener("input", () => onChangeParams());
    document.getElementById("preset-cat").addEventListener("input", () => onChangeParams());
    document.getElementById("cat-color-choose-type").addEventListener("input", () => onChangeParams());

    // Sliders
    // Color HSL
    document.getElementById("hsl-decide-type").addEventListener("input", () => onChangeParams());
    document.getElementById("hue").addEventListener("input", () => onChangeParams());

    document.getElementById("saturation-min").addEventListener("input", () => onChangeParams());
    document.getElementById("saturation-max").addEventListener("input", () => onChangeParams());
    document.getElementById("lightness-min").addEventListener("input",  () => onChangeParams());
    document.getElementById("lightness-max").addEventListener("input",  () => onChangeParams());

    // D3 colors
    document.getElementById("d3-color-type").addEventListener("input", () => onChangeParams());

    document.getElementById("d3-decide-type").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-continuous-family").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-continuous-cyclical").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-continuous-diverging").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-continuous-sequential").addEventListener("input", () => onChangeParams());

    document.getElementById("d3-discrete-num-colors").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-discrete-family").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-discrete-categorical").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-discrete-diverging").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-discrete-sequential").addEventListener("input", () => onChangeParams());
    document.getElementById("d3-discrete-color-choose-type").addEventListener("input", () => onChangeParams());

    // Population sets
    document.getElementById("population-color-schema").addEventListener("input", () => onChangeParams());

    // Opacity
    document.getElementById("use-opacity").addEventListener("input", () => onChangeParams());
    document.getElementById("opacity-min").addEventListener("input", () => onChangeParams());
    document.getElementById("opacity-max").addEventListener("input", () => onChangeParams());

    // Color decide type
    document.getElementById("color-decide-type").addEventListener("input", () => onChangeParams());

    // Is use inverse ?
    document.getElementById("inverse-color").addEventListener("input", () => onChangeParams());

    // Is increase contrast ?
    document.getElementById("increase-contrast").addEventListener("input", () => onChangeParams());

    // Layout
    document.getElementById("layout-type").addEventListener("input", () => onChangeParams());

    document.getElementById("x-scale").addEventListener("keydown", function(event) {
        if (event.key === "Enter")
        {
            onChangeParams();
        }
    });
    document.getElementById("y-scale").addEventListener("input", () => onChangeParams());

    document.getElementById("y-padding").addEventListener("input", () => onChangeParams());
    document.getElementById("layer-diff").addEventListener("input", () => onChangeParams());
    document.getElementById("x-padding").addEventListener("input", () => onChangeParams());

    // Axes
    document.getElementById("draw-axes").addEventListener("input", () => onChangeParams());
    document.getElementById("axes-color").addEventListener("input", () => onChangeParams());
    document.getElementById("axes-width").addEventListener("input", () => onChangeParams());
    document.getElementById("axes-scale").addEventListener("input", () => onChangeParams());

    document.getElementById("axes-show-time").addEventListener("input", () => onChangeParams());
    document.getElementById("axes-text-size").addEventListener("input", () => onChangeParams());
    document.getElementById("axes-time-start").addEventListener("keydown", function(event) {
        if (event.key === "Enter")
        {
            onChangeParams();
        }
    });
    document.getElementById("axes-distance").addEventListener("input", () => onChangeParams());


    // Birth-death events
    document.getElementById("x-radius").addEventListener("input", () => onChangeParams());
    document.getElementById("y-radius").addEventListener("input", () => onChangeParams());

    document.getElementById("delta-main").addEventListener("input", () => onChangeParams());

    // document.getElementById("fudge-x").addEventListener("input", () => onChangeParams());
    document.getElementById("execute-fudge").addEventListener("click", () => onChangeParams());

    // Shadows
    // Halo
    document.getElementById("shadow-type").addEventListener("input", () => onChangeParams());
    document.getElementById("halo-thickness").addEventListener("input", () => onChangeParams());
    // Drop shadow
    document.getElementById("execute-shadow").addEventListener("click", () => onChangeParams());
    
    // Save button
    document.getElementById("save-button").addEventListener("click", onSaveButtonClick);

    document.getElementById("save-button-cmpr").addEventListener("click", onSaveCompareButtonClick);


    document.addEventListener("keydown", function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === "G")
        {
            event.preventDefault();
            onSaveButtonClick();
            onSaveCompareButtonClick();
        }
    });


    // Hide layer button
    document.getElementById("execute-hide-button").addEventListener("click", onHideLayerBtnClick);


    // Splitstreams feature
    document.getElementById("active-splitstreams").addEventListener("input", () => onChangeParams());
    document.getElementById("splitstreams-x-length").addEventListener("input", () => onChangeParams());
    document.getElementById("splitstreams-x-padding").addEventListener("input", () => onChangeParams());

    // Image offset 
    document.getElementById("second-image-offset").addEventListener("input", () => onChangeParams());

    document.getElementById("export-setups-button").addEventListener("click", function(event) {
        onExportSetupsClick(image);
    });
    document.getElementById("import-setups-button").addEventListener("click", onImportButtonClick);

    document.getElementById("crisp-edges").addEventListener("input", () => onChangeParams());

    // Visibility
    document.getElementById("limit-layers").addEventListener("input", function() {
        const limitLayerProps = document.getElementById("limit-layer-props");

        if (!this.checked)
        {
            limitLayerProps.style.display = "none";
        } else {
            limitLayerProps.style.display = "block";
        }
    });

    document.getElementById("color-types").addEventListener("input", function () {
        const hslProps = document.getElementById("hsl-color-properties-div");
        const catProps = document.getElementById("cat-color-properties-div");
        const d3Props = document.getElementById("d3-color-properties-div");
        const popProps = document.getElementById("population-color-properties-div");

        switch (this.value)
        {
            case "Categorical":
                // Show these options when categorical is chosen
                hslProps.style.display = "none";
                catProps.style.display = "block";
                d3Props.style.display = "none";
                popProps.style.display = "none";
                break;
            case "HSL":
                // Hide these options when categorical is chosen
                hslProps.style.display = "block";
                catProps.style.display = "none";
                d3Props.style.display = "none";
                popProps.style.display = "none";
                break;
            case "D3":
                hslProps.style.display = "none";
                catProps.style.display = "none";
                d3Props.style.display = "block";
                popProps.style.display = "none";
                break;
            case "Population":
                hslProps.style.display = "none";
                catProps.style.display = "none";
                d3Props.style.display = "none";
                popProps.style.display = "block";
                break;

            default:
                // Hide all
                hslProps.style.display = "none";
                catProps.style.display = "none";
        }
    });

    document.getElementById("d3-color-type").addEventListener("input", function() {
        const contProps = document.getElementById("d3-continuous-props");
        const discreteProps = document.getElementById("d3-discrete-props");

        switch (this.value)
        {
            case "Continuous":
                contProps.style.display = "block";
                discreteProps.style.display = "none";
                break;
            case "Discrete":
                contProps.style.display = "none";
                discreteProps.style.display = "block";
                break;
            default:
                contProps.style.display = "none";
                discreteProps.style.display = "none";
        }
    });

    document.getElementById("d3-continuous-family").addEventListener("input", function() {
        const cyclicalProps = document.getElementById("d3-continuous-cyclical-container");
        const divergingProps = document.getElementById("d3-continuous-diverging-container");
        const sequentialProps = document.getElementById("d3-continuous-sequential-container");

        switch (this.value)
        {
            case "Cyclical":
                cyclicalProps.style.display = "block";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "none";
                break;
            case "Diverging":
                cyclicalProps.style.display = "none";
                divergingProps.style.display = "block";
                sequentialProps.style.display = "none";
                break;
            case "Sequential":
                cyclicalProps.style.display = "none";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "block";
                break;
            default:
                cyclicalProps.style.display = "none";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "nones";
        }
    });

    document.getElementById("d3-discrete-family").addEventListener("input", function() {
        const catProps = document.getElementById("d3-discrete-categorical-container");
        const divergingProps = document.getElementById("d3-discrete-diverging-container");
        const sequentialProps = document.getElementById("d3-discrete-sequential-container");
        const optionNumColor = document.getElementById("d3-discrete-num-colors-container");

        switch (this.value)
        {
            case "Categorical":
                catProps.style.display = "block";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "none";
                optionNumColor.style.display = "none";
                break;
            case "Diverging":
                catProps.style.display = "none";
                divergingProps.style.display = "block";
                sequentialProps.style.display = "none";
                optionNumColor.style.display = "block";
                break;
            case "Sequential":
                catProps.style.display = "none";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "block";
                optionNumColor.style.display = "block";
                break;
            default:
                catProps.style.display = "none";
                divergingProps.style.display = "none";
                sequentialProps.style.display = "none";
                optionNumColor.style.display = "none";
        }
    });

    document.getElementById("use-opacity").addEventListener("input", function () {
        const opacityRange = document.getElementById("opacity-range");

        if (!this.checked)
        {
            opacityRange.style.display = "none";
        } else {
            opacityRange.style.display = "block";
        }
    });

    document.getElementById("layout-type").addEventListener("input", function () {
        const blockScales = document.getElementById("block-scales");
        const yScaleDiv = document.getElementById("y-scale-div");
        const xScaleDiv = document.getElementById("x-scale-div");
        const yPaddingDiv = document.getElementById("y-padding-div");
        switch (this.value)
        {
            case "(x,y) and width Optimized":
                blockScales.style.display = "none";
                xScaleDiv.style.display = "none";
                yScaleDiv.style.display = "none";
                yPaddingDiv.style.display = "none";
                break;
            case "y and width Optimized":
                yScaleDiv.style.display = "none";
                blockScales.style.display = "block";
                xScaleDiv.style.display = "block";
                yPaddingDiv.style.display = "none";
                break;
            default:
                blockScales.style.display = "block";
                xScaleDiv.style.display = "block";
                yScaleDiv.style.display = "block";
                yPaddingDiv.style.display = "block";
                break;
        }
    });

    document.getElementById("draw-axes").addEventListener("input", function () {
        const axesProp = document.getElementById("axes-props");

        if (!this.checked)
        {
            axesProp.style.display = "none";
        } else {
            axesProp.style.display = "block";
        }
    });

    document.getElementById("shadow-type").addEventListener("input", function () {
        const haloThickness = document.getElementById("halo-thickness-container");
        const shadowColor = document.getElementById("color-shadow-container");
        const dropShadowProps = document.getElementById("shadow-properties-container");

        switch (this.value)
        {
            case "Drop Shadow":
                haloThickness.style.display = "none";
                shadowColor.style.display = "block";
                dropShadowProps.style.display = "block";
                break;

            case "Halo":
                haloThickness.style.display = "block";
                shadowColor.style.display = "block";
                dropShadowProps.style.display = "none";
                break;
            
            case "Drop Shadow with Fudge":
                haloThickness.style.display = "none";
                shadowColor.style.display = "block";
                dropShadowProps.style.display = "block";
                break;

            default:
                haloThickness.style.display = "none";
                shadowColor.style.display = "none";
                dropShadowProps.style.display = "none";
        }
    });

    // document.getElementById("interactive-stroke").addEventListener("input", function () {
    //     const strokeProps = document.getElementById("stroke-highlight-thickness-container");

    //     if (!this.checked)
    //     {
    //         strokeProps.style.display = "none";
    //     } else {
    //         strokeProps.style.display = "block";
    //     }
    // });


    // Initialize
    onChangeParams();
    onChangeHighlight();
    // Initial visibility
    document.getElementById("axes-props").style.display = "none";
    document.getElementById("cat-color-properties-div").style.display = "none";
    document.getElementById("d3-color-properties-div").style.display = "none";
    document.getElementById("d3-continuous-diverging-container").style.display = "none";
    document.getElementById("d3-continuous-sequential-container").style.display = "none";
   
    document.getElementById("d3-discrete-props").style.display = "none";
    document.getElementById("d3-discrete-diverging-container").style.display = "none";
    document.getElementById("d3-discrete-sequential-container").style.display = "none";
    document.getElementById("d3-discrete-num-colors-container").style.display = "none";
    document.getElementById("limit-layer-props").style.display = "none";

    document.getElementById("population-color-properties-div").style.display = "none";

    document.getElementById("halo-thickness-container").style.display = "none";
    document.getElementById("color-shadow-container").style.display = "none";
    document.getElementById("shadow-properties-container").style.display = "none";
    document.getElementById("limit-layer-props").style.display = "none";
    document.getElementById("opacity-range").style.display = "none";

    // Testing 
});



