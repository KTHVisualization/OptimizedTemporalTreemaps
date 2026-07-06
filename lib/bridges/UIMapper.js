let currentLayerCount = 3;

// Global variable to store transform state
let transformStr = "translate(0,0) scale(1)";

// Make it globally accessible
window.transformStr = transformStr;

// Sync zoom between visualizations (same as setup.js)
function syncZoom(transformEvent) {
  if (window.image) {
    var imageRoot = d3.select("#drawing-group1");
    imageRoot.attr("transform", transformEvent);
  }

  // If you add comparison later
  if (window.imageCompare) {
    var imageCompareRoot = d3.select("#drawing-group2");
    imageCompareRoot.attr("transform", transformEvent);
  }
}

// Parse transform string (same as setup.js)
function parseTransform(transformStr) {
  let translate = transformStr.match(/translate\(([^)]+)\)/);
  let scale = transformStr.match(/scale\(([^)]+)\)/);

  return {
    x: translate ? parseFloat(translate[1].split(",")[0]) : 0,
    y: translate ? parseFloat(translate[1].split(",")[1]) : 0,
    k: scale ? parseFloat(scale[1]) : 1
  };
}

document.addEventListener("DOMContentLoaded", function () {

  // 1. STORAGE: Central place to store all UI values
  let uiState = {};

  // 2. GETTER FUNCTIONS: These collect values from specific UI sections
  // A. Get Dataset Values
  function getDatasetValues() {
    const selectedDataset = document.getElementById("dataset")?.value;

    const selectedDataset2 = document.getElementById("dataset2")?.value;
    const isCompareView = document.getElementById("compareViewBtn")?.classList.contains("active");

    return {
      selectedDataset: selectedDataset,
      selectedDataset2 : selectedDataset2,
      isCompareView : isCompareView
    };
  }

  // B. Get Layer Values
  async function getLayerValues() {
    // Wait for DOM to be fully updated
    return new Promise((resolve) => {
      setTimeout(() => {
        const layerItems = document.querySelectorAll('.layer-item');

        // UPDATE THE GLOBAL VARIABLE
        currentLayerCount = layerItems.length;

        // Get the color scale type to determine if we're using discrete colors
        const colorScale = document.getElementById("colorScaleSelect")?.value;
        const isDiscrete = colorScale === "discrete";

        // Process each layer item and extract all values
        const layers = [];

        layerItems.forEach((item, index) => {
          // Get layer name
          const nameElement = item.querySelector('.layer-name');
          const name = nameElement ? nameElement.textContent.trim() : `Layer ${index + 1}`;

          // Get visibility status - check if Eye.svg (visible) or EyeSlash.svg (hidden)
          const visibilityImg = item.querySelector('.layer-icon.visibility img');
          const isVisible = visibilityImg ? visibilityImg.src.includes('Eye.svg') : true;

          // Get lock status - check if LockSimple.svg (locked) or LockSimpleOpen.svg (unlocked)
          const lockImg = item.querySelector('.layer-icon.lock img');
          const isLocked = lockImg ? lockImg.src.includes('LockSimple.svg') : true;

          // Get layer color (only relevant in discrete mode)
          let color = null;
          if (isDiscrete) {
            const colorInput = item.querySelector('.layer-color-input');
            if (colorInput) {
              color = colorInput.value;
            }
          }

          // Get color swatch background (as backup for color)
          // const colorSwatch = item.querySelector('.layer-color-swatch');
          // const swatchColor = colorSwatch ? 
          //   colorSwatch.style.backgroundColor || 
          //   getComputedStyle(colorSwatch).backgroundColor : null;

          layers.push({
            index: index,
            name: name,
            visible: isVisible,
            locked: isLocked,
            color: color,
            layerNumber: index + 1 // For easier reference (1-based indexing)
          });
        });


        resolve({
          count: layerItems.length,
          layers: layers,
        });
      }, 150); // Increased timeout to ensure DOM is ready
    });
  }

  // C. Get Color Values
  function getColorValues() {

    const colorScale = document.getElementById("colorScaleSelect")?.value;

    let colorSettings = {
      colorScale: colorScale
    };

    if (colorScale === "discrete") {
      colorSettings.discrete = {
        family: document.getElementById("discreteColorFamilySelect")?.value,
        count: currentLayerCount,  // TODO: set by default from backend based on family
        inverseOrder: document.getElementById("discreteInverseColorToggle")?.dataset.state === "on",
        opacityMin: parseInt(document.getElementById("colorOpacityMin")?.value) || 0,
        opacityMax: parseInt(document.getElementById("colorOpacityMax")?.value) || 100,
        selectedScheme: window.getSelectedDiscreteColorScheme ? window.getSelectedDiscreteColorScheme() : null,
        opacityOn: document.getElementById("discreteOpacityToggle")?.dataset.state === "on",
        decideType: document.getElementById("discreteColorDecideTypeSelect").value
      };
    } else if (colorScale === "continuous") {
      colorSettings.continuous = {
        family: document.getElementById("continuousColorFamilySelect")?.value,
        inverseOrder: document.getElementById("continuousInverseColorToggle")?.dataset.state === "on",
        opacityMin: parseInt(document.getElementById("continuousColorOpacityMin")?.value) || 0,
        opacityMax: parseInt(document.getElementById("continuousColorOpacityMax")?.value) || 100,
        selectedScheme: window.getSelectedContinuousColorScheme ? window.getSelectedContinuousColorScheme() : null,
        opacityOn: document.getElementById("continuousOpacityToggle")?.dataset.state === "on",
        decideType: document.getElementById("continuousColorDecideTypeSelect").value
      };
    } else if (colorScale === "special") {
      colorSettings.special = {
        family: document.getElementById("specialColorFamilySelect")?.value
      };
    }
    return colorSettings;
  };

  // D. Get Layout Values
  function getLayoutValues() {

    const wiggleOptimization = document.getElementById("wiggleSelect")?.value || "full";

    let layoutSettings = {
      wiggleOptimization: wiggleOptimization
    };


    if (wiggleOptimization === "none") {
      layoutSettings.none = {
        scale: {
          x: parseFloat(document.getElementById("noneScaleX")?.value) || 2.0,
          y: parseFloat(document.getElementById("noneScaleY")?.value) || 1.0
        },
        yPadding: parseFloat(document.getElementById("noneYPadding")?.value) || 0,
        bezierOffset: parseFloat(document.getElementById("noneBezierOffset")?.value) || 0,
        layerDifference: parseFloat(document.getElementById("noneLayerDifference")?.value) || 0,
        radii: {
          x: parseFloat(document.getElementById("noneRadiiX")?.value) || 2,
          y: parseFloat(document.getElementById("noneRadiiY")?.value) || 6
        }
      };
    } else if (wiggleOptimization === "partial") {
      layoutSettings.partial = {
        scale: {
          x: parseFloat(document.getElementById("partialScaleX")?.value) || 2.0
        },
        bezierOffset: parseFloat(document.getElementById("partialBezierOffset")?.value) || 0,
        radii: {
          x: parseFloat(document.getElementById("partialRadiiX")?.value) || 2,
          y: parseFloat(document.getElementById("partialRadiiY")?.value) || 6
        }
      };
    } else if (wiggleOptimization === "full") {
      layoutSettings.full = {
        bezierOffset: parseFloat(document.getElementById("fullBezierOffset")?.value) || 0,
        radii: {
          x: parseFloat(document.getElementById("fullRadiiX")?.value) || 2,
          y: parseFloat(document.getElementById("fullRadiiY")?.value) || 6
        }
      };
    }
    return layoutSettings;

  };

  // E. Get Border and shadow values
  function getBorderShadowValues() {
    const effectType = document.getElementById("borderShadowSelect")?.value || "none";

    let borderShadowSettings = {
      crispEdges: document.getElementById("crispLabelToggle")?.dataset.state === "on",
      fudgeEdges: parseFloat(document.getElementById("fudgeEdges")?.value) || 0,
      effectType: effectType
    };

    if (effectType === "border") {

      borderShadowSettings.border = {
        weight: parseFloat(document.getElementById("borderWeight")?.value) || 0,
        color: document.getElementById("borderColor")?.value || "#000000",
        opacity: parseInt(document.getElementById("borderOpacity")?.value) || 100
      };
    } else if (effectType === "shadow") {
      borderShadowSettings.shadows = {
        shadowX: parseFloat(document.getElementById("shadowX")?.value) || 0,
        shadowY: parseFloat(document.getElementById("shadowY")?.value) || 0,
        spread: parseFloat(document.getElementById("shadowSpread")?.value) || 0,
        color: document.getElementById("shadowColor")?.value || "#000000",
        opacity: parseInt(document.getElementById("shadowOpacity")?.value) || 50,
      };
    }
    return borderShadowSettings;
  }


  // F. temporal Axis Values
  function getTemporalAxisValues() {

    const showTemporalAxis = document.getElementById("showAxesToggle")?.dataset.state === "on";
    const showTimestamps = document.getElementById("timestampToggle")?.dataset.state === "on";
    const showSplitStreams = document.getElementById("splitStreamsToggle")?.dataset.state === "on";

    let temporalAxisSettings = {
      showTemporalAxis: showTemporalAxis,
      showTimestamps: showTimestamps,
      showSplitStreams: showSplitStreams
    };

    if (showTemporalAxis) {
      temporalAxisSettings.axis = {
        weight: parseFloat(document.getElementById("temporalAxisWeight")?.value) || 1,
        color: document.getElementById("temporalAxisColor")?.value || "#000000"
      };
    }

    if (showTimestamps) {
      temporalAxisSettings.timestamps = {
        timeLabelStart: parseFloat(document.getElementById("timeLabelStart")?.value) || 0,
        timeLabelSteps: parseFloat(document.getElementById("timeLabelSteps")?.value) || 1,
        timestampTextSize: parseFloat(document.getElementById("timestampTextSize")?.value) || 11,
        timestampTextOffset: parseFloat(document.getElementById("timestampTextOffset")?.value) || 0
      };
    }

    if (showSplitStreams) {
      temporalAxisSettings.splitStream = {
        // Add any specific settings for split streams here
        xPadding: parseFloat(document.getElementById("xPaddingStream")?.value) || 0,
        xMargin: parseFloat(document.getElementById("xMarginStream")?.value) || 0
      };
    }

    return temporalAxisSettings;
  }


  // 3. MAIN FUNCTION: Combines all sections into one object
  async function getAllUIValues() {
    const layerValues = await getLayerValues(); // Wait for layers

    return {
      dataset: getDatasetValues(),
      colors: getColorValues(),
      layers: layerValues,
      layout: getLayoutValues(),
      borderShadow: getBorderShadowValues(),
      temporalAxes: getTemporalAxisValues(),
      timestamp: Date.now()
    };
  }

  // 4. UPDATE FUNCTION: This runs every time something changes
  async function updateUIState() {
    const uiState = await getAllUIValues(); // Wait for all values including layers

    await connectToVisualization(uiState);
  }

  // 5. EVENT LISTENERS: These "watch" for changes and call updateUIState()
  function setupEventListeners() {

    // ================================
    // A. DATASET LISTENERS
    // ================================
    const datasetSelect = document.getElementById("dataset");
    const dataset2Select = document.getElementById("dataset2");
  

    if (datasetSelect) {
      datasetSelect.addEventListener("change", updateUIState);
    }

    if (dataset2Select) {
      dataset2Select.addEventListener("change", updateUIState);
    }

    // Watch Color
    // Color dropdowns
    const colorDropdowns = [
      "colorScaleSelect",
      "discreteColorFamilySelect",
      "continuousColorFamilySelect",
      "specialColorFamilySelect"
    ];

    colorDropdowns.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("change", updateUIState);
      }
    });

    // ================================
    // B. COLOR LISTENERS  
    // ================================
    const colorToggles = [
      "discreteInverseColorToggle",
      "continuousInverseColorToggle"
    ];

    colorToggles.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", () => {
          setTimeout(updateUIState, 50);
        });
      }

      // Color sliders/ranges
      const colorSliders = [
        "colorOpacityMin",
        "colorOpacityMax",
        "continuousColorOpacityMin",
        "continuousColorOpacityMax"
      ];

      colorSliders.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("input", updateUIState);
        }
      });

      // ================================
      // C. LAYOUT LISTENERS
      // ================================

      // Layout dropdown
      const layoutDropdowns = ["wiggleSelect"];

      layoutDropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("change", updateUIState);
        }
      });

      // Layout number inputs
      const layoutInputs = [
        // None wiggle inputs
        "noneScaleX", "noneScaleY", "noneYPadding", "noneBezierOffset",
        "noneLayerDifference", "noneRadiiX", "noneRadiiY",

        // Partial wiggle inputs
        "partialScaleX", "partialBezierOffset", "partialRadiiX", "partialRadiiY",

        // Full wiggle inputs
        "fullBezierOffset", "fullRadiiX", "fullRadiiY"
      ];

      layoutInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("input", updateUIState);
        }
      });

      // ================================
      // D. BORDER & SHADOW LISTENERS
      // ================================

      // Border/Shadow dropdown
      const borderShadowDropdowns = ["borderShadowSelect"];

      borderShadowDropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("change", updateUIState);
        }
      });

      // Border/Shadow toggles
      const borderShadowToggles = ["crispLabelToggle"];

      borderShadowToggles.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("click", () => {
            setTimeout(updateUIState, 50);
          });
        }
      });

      // Border/Shadow inputs
      const borderShadowInputs = [
        "fudgeEdges", "borderWeight", "borderOpacity",
        "shadowX", "shadowY", "shadowSpread", "shadowOpacity"
      ];

      borderShadowInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("input", updateUIState);
        }
      });

      // Border/Shadow color inputs
      const borderShadowColors = ["borderColor", "shadowColor"];

      borderShadowColors.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("change", updateUIState);
        }
      });

      // ================================
      // F. LAYER LISTENERS : they are in panel.js
      // ================================


      // ================================
      // E. TEMPORAL AXIS LISTENERS
      // ================================

      // Temporal toggles
      const temporalToggles = ["showAxesToggle", "timestampToggle", "splitStreamsToggle"];

      temporalToggles.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("click", () => {
            setTimeout(updateUIState, 50);
          });
        }
      });
      // Temporal inputs
      const temporalInputs = [
        "temporalAxisWeight", "timeLabelStart", "timeLabelSteps",
        "timestampTextSize", "timestampTextOffset", "xPaddingStream", "xMarginStream"
      ];

      temporalInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("input", updateUIState);
        }
      });

      // Temporal colors
      const temporalColors = ["temporalAxisColor"];

      temporalColors.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("change", updateUIState);
        }
      });

    });

  }

  // 6. INITIALIZE: Set everything up when page loads
  setupEventListeners();
  updateUIState(); // Get the initial state

  // 7. EXPORT: Make functions available to other parts of your app
  window.UIMapper = {
    getAllValues: getAllUIValues,
    getColorValues: getColorValues,
    getLayoutValues: getLayoutValues,
    getDatasetValues: getDatasetValues,
    getBorderShadowValues: getBorderShadowValues,
    getTemporalAxisValues: getTemporalAxisValues,
    getLayerValues: getLayerValues,
    getCurrentState: () => uiState,
    forceUpdate: updateUIState
  };







});




// Update your connectToVisualization function in ui-mapper-bridge.js:

async function connectToVisualization(uiState) {
  // A. Validate Dataset Selection
  const selectedDataset = uiState.dataset.selectedDataset;

  // Wait for dataset to load before proceeding
  if (!window[selectedDataset]) {
    try {
      // Import the DatasetLoader
      const { DatasetLoader } = await import('./loadDataset.js');

      // Load the dataset and wait for it
      const loadedDataset = await DatasetLoader.loadDataset(selectedDataset);
      if (!loadedDataset) {
        console.error("Failed to load dataset in connectToVisualization:", selectedDataset);
        return;
      }
    } catch (error) {
      console.error("Error loading dataset in connectToVisualization:", error);
      return;
    }
  }

  // C. Validate dataset exists
  if (!window[selectedDataset]) {
    console.error("Dataset not found in connectToVisualization:", selectedDataset);
    return;
  }

  // B. CREATE PARAMETER OBJECTS DIRECTLY (no HTML reading!)   // Continue with your visualization creation...
  try {

    // Initialize transformStr if it doesn't exist
    if (typeof transformStr === 'undefined') {
      transformStr = "translate(0,0) scale(1)";
    }

    // Save current transform state before redrawing
    let drawingGroup = d3.select("#drawing-group1");
    if (!drawingGroup.empty()) {
      let transformAtr = drawingGroup.attr("transform");
      if (transformAtr !== null) {
        transformStr = transformAtr;
      }
    }
    // 1. BASIC DATASET INFO
    const dataset = window[selectedDataset];
    const orgMaxLayer = dataset.maxLayer;

    // 2. CONVERT YOUR UI STATE TO OLD FORMAT
    // a. Dataset selection
    const selection = selectedDataset;

    //IMPORTANT////////////////////////////////////
    //TODO - Do we need this ? Layer limits (using defaults for now)
    const isLimitLayers = false;
    const minLimitLayer = 0;
    const maxLimitLayer = orgMaxLayer;
    const isHideSingularNode = false;


    // b. Layout conversion
    let layoutType = "Non-Optimized";

    if (uiState.layout.wiggleOptimization === "full") {
      layoutType = "(x,y) and width Optimized";
    } else if (uiState.layout.wiggleOptimization === "partial") {
      layoutType = "y and width Optimized";
    } else if (uiState.layout.wiggleOptimization === "none") {
      layoutType = "Non-Optimized";
    }

    // Scale values from your UI  --
    //IMPORTANT////////////////////////////////////
    let xScale = 2.0, yScale = 1.0;
    let yPadding = 0.0, layerDiff = 0.0, xPadding = 0.0;
    let xRadius = 2, yRadius = 6;
    if (uiState.layout.wiggleOptimization === "none" && uiState.layout.none) {
      xScale = uiState.layout.none.scale?.x || 2.0;
      yScale = uiState.layout.none.scale?.y || 1.0;
      // Padding values from your UI
      yPadding = uiState.layout.none?.yPadding || 0.0;
      layerDiff = uiState.layout.none?.layerDifference || 0.0;
      xPadding = uiState.layout.none?.bezierOffset || 0.0; // Default
      xRadius = uiState.layout.none?.radii?.x || 2;
      yRadius = uiState.layout.none?.radii?.y || 6;
    } else if (uiState.layout.wiggleOptimization === "partial" && uiState.layout.partial) {
      xScale = uiState.layout.partial.scale?.x || 2.0;
      xPadding = uiState.layout.partial?.bezierOffset || 0.0; // Default
      xRadius = uiState.layout.partial?.radii?.x || 2;
      yRadius = uiState.layout.partial?.radii?.y || 6;
    } else if (uiState.layout.wiggleOptimization === "full" && uiState.layout.full) {
      xPadding = uiState.layout.full?.bezierOffset || 0.0;
      xRadius = uiState.layout.full?.radii?.x || 2;
      yRadius = uiState.layout.full?.radii?.y || 6;
    }

    // c. Border and Shadow conversion

    const crispEdges = uiState.borderShadow?.crispEdges || false;
    const fudgeX = uiState.borderShadow?.fudgeEdges || 0;


    let shadowType = "None";
    let dxShadow = 0, dyShadow = 0, stdShadow = 0, opaqueShadow = 0, haloThickness = 0;
    let colorShadow = "#000000";
    let borderColorShadow = "#000000";
    shadowType = uiState.borderShadow?.effectType || "none";
    if (uiState.borderShadow.effectType === "border") {
      shadowType = "Halo";
      haloThickness = uiState.borderShadow.border?.weight || 0;
      const borderOpacityPercent = uiState.borderShadow.shadows?.opacity || 0;
      //TODO - check how to adopt the opacity from new ui to old
      opaqueShadow = borderOpacityPercent / 100;
      //Color in here are #000000 format
      borderColorShadow = uiState.borderShadow.shadows?.color || "#000000";
    } else if (uiState.borderShadow.effectType === "shadow") {
      shadowType = "Drop Shadow";
      dxShadow = uiState.borderShadow.shadows?.shadowX || 0;
      dyShadow = uiState.borderShadow.shadows?.shadowY || 0;
      stdShadow = uiState.borderShadow.shadows?.spread || 0;
      const shadowOpacityPercent = uiState.borderShadow.shadows?.opacity || 0;
      opaqueShadow = shadowOpacityPercent / 100;
      //Color in here are #000000 format
      colorShadow = uiState.borderShadow.shadows?.color || "#000000";
    }

    // d. Temporal Axes conversion
    //var axes = new Axes(axesColor, axesWidth, aScale, isShowTime, textSize, timeFrom, distanceFromAxes);


    const isDrawAxes = uiState.temporalAxes?.showTemporalAxis || false;
    const isShowTime = uiState.temporalAxes?.showTimestamps || false;
    const isActiveSplitstreams = uiState.temporalAxes?.showSplitStreams || false;
    let axesColor = "#000000";
    let axesWidth = 1;
    let textSize = 12;
    let timeFrom = 0;
    let timeSteps = 1;
    let distanceFromAxes = 0;
    let ssXLength = 0, ssXPadding = 0;
    let aScale = 0.5; //TODO - new UI does not have this, so using default

    if (isDrawAxes) {
      axesColor = uiState.temporalAxes?.axis?.color || "#000000";
      axesWidth = uiState.temporalAxes?.axis?.weight || 3;

      if (isShowTime) {
        textSize = uiState.temporalAxes?.timestamps?.timestampTextSize || 15;
        timeFrom = uiState.temporalAxes?.timestamps?.timeLabelStart || 0;
        distanceFromAxes = uiState.temporalAxes?.timestamps?.timestampTextOffset || 75;
        timeSteps = uiState.temporalAxes?.timestamps?.timeLabelSteps || 1;

      }

    }

    if (isActiveSplitstreams) {
      ssXLength = uiState.temporalAxes?.splitStream?.xMargin || 0.001;
      ssXPadding = uiState.temporalAxes?.splitStream?.xPadding || 0.001;
    }


    // e. Color conversion
    // colorType, colorDecideType, colorD3, colorPop, colorCode
    const colorScale = uiState.colors?.colorScale || "discrete";
    let family, scheme, count, inverseOrder, opacityMin, opacityMax, decideType;
    let usingOpacity = true;  // maybe true later -TODO 
    let colorProperties;
    let colorArray = [];
    let colorType;

    if (colorScale === "discrete") {
      // Set up discrete color settings
      family = uiState.colors?.discrete?.family || "Diverging";
      scheme = uiState.colors?.discrete?.selectedScheme?.name || "Blues";
      count = uiState.colors?.discrete?.count || 4;
      inverseOrder = uiState.colors?.discrete?.inverseOrder || false;
      usingOpacity = uiState.colors?.discrete?.opacityOn || false;
      opacityMin = uiState.colors?.discrete?.opacityMin || 0;
      opacityMax = uiState.colors?.discrete?.opacityMax || 100;
      decideType = uiState.colors?.discrete?.decideType;
      colorType = colorScale;

      colorArray = window.getAllLayerColors ? window.getAllLayerColors() : [];

      colorProperties = new DiscreteColorProperties(family, scheme, count, inverseOrder, opacityMin, opacityMax, decideType, colorArray);
    } else if (colorScale === "continuous") {

      // Set up continuous color settings
      family = uiState.colors?.continuous?.family || "Diverging";
      scheme = uiState.colors?.continuous?.selectedScheme?.name || "Blues";
      inverseOrder = uiState.colors?.continuous?.inverseOrder || false;
      usingOpacity = uiState.colors?.continuous?.opacityOn || false;
      opacityMin = uiState.colors?.continuous?.opacityMin || 0;
      opacityMax = uiState.colors?.continuous?.opacityMax || 100;
      decideType = uiState.colors?.continuous?.decideType;
      colorType = colorScale;

      colorProperties = new ContiniousColorProperties(family, scheme, inverseOrder, opacityMin, opacityMax, decideType);
    } else if (colorScale === "special") {

      family = uiState.colors?.special?.family || "None";
      colorType = family;
    }


    let colorDecideType = 0;
    //e. Layers 

    // 3. CREATE PARAMETER OBJECTS (using old constructors)

    // Create the remaining color objects (old system needs all of them)
    let colorPop = new ColorPopulation(2);
    let colorCode = new ColorCode();
    

    const opacityProps = new OpacityProperties(usingOpacity, opacityMin, opacityMax);
    const paddings = new PaddingProperties(0.0, yPadding, xPadding, layerDiff);
    const axes = new Axes(axesColor, axesWidth, aScale, isShowTime, textSize, timeFrom, distanceFromAxes, timeSteps);
    const radii = new Radii(xRadius, yRadius);
    const deltaMain = 0.5;  //TODO - new UI does not have this, so using default
    const halo = new HaloProperties(borderColorShadow, haloThickness, 1);

    const dropShadow = new DropShadowProperties("drop-shadow", colorShadow,
      dxShadow, dyShadow, stdShadow, opaqueShadow);
    const otherProperties = new OtherProperties(isHideSingularNode, fudgeX, crispEdges);
    const splitStreamProp = new SplitstreamsFeatures(isActiveSplitstreams, ssXLength, ssXPadding);
    const isMoveByOffset = true; //TODO - new UI does not have this, so using default

    const limitLayerObj = new LimitLayersProperties(isLimitLayers, minLimitLayer, maxLimitLayer, orgMaxLayer);
    const scaler = new SizeScalers(xScale, yScale);





    // D. CREATE VISUALIZATION DIRECTLY
    const image = new TemporalTreemapPlusLib(window[selection], 'container1',
      limitLayerObj, layoutType, scaler,
      colorType, colorDecideType,
      colorProperties, colorPop, colorCode,
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
    // Store globally for other functions
    window.image = image;

    // Create interaction properties (same as setup.js)
    const interactiveHighlight = new InteractionProperties(2);


    // Enable highlighting

    // Single visualization mode
    if (uiState.dataset.isCompareView) {
      image.highlightPath(interactiveHighlight, image, 1, true);
    } else {
      image.highlightPath(interactiveHighlight, image, 1, false);
    }


    // Create the second visualization 
    if (uiState.dataset.isCompareView && uiState.dataset.selectedDataset2) {
      const selection2 = uiState.dataset.selectedDataset2;

      if (!window[selection2]) {
        const {DatasetLoader} = await import("./loadDataset.js")
        await DatasetLoader.loadDataset(selection2);
      }


      document.getElementById("container2").innerHTML="";


      const seconndImageOffset = 0;

      const imageCompare = new TemporalTreemapPlusLib(window[selection2], 'container2',
                        limitLayerObj, layoutType, scaler,
                        colorType, colorDecideType,
                        colorProperties, colorPop, colorCode,
                        opacityProps, 
                        paddings,
                        isDrawAxes, axes, radii, deltaMain,
                        shadowType, halo, dropShadow,
                        otherProperties,
                        splitStreamProp,
                        isMoveByOffset,
                        seconndImageOffset,
                        2
                      );
                      

      imageCompare.drawTree();
      window.imageCompare = imageCompare;

      // add the highlight 
      imageCompare.highlightPath(interactiveHighlight, imageCompare, 2, true);
  
    } else {
      // Clear the container 2 
      document.getElementById("container2").innerHTML = "";
      window.imageCompare = null;
    }

    // Store transform state globally for persistence
    window.transformStr = transformStr;

    // E. SETUP ZOOM FUNCTIONALITY

    // Create zoom behavior (same as setup.js)
    const zoom = d3.zoom().scaleExtent([0.01, 10]).on("zoom", function (event) {
      syncZoom(event.transform);
    });
    // Store zoom globally for other functions
    window.zoom = zoom;

    // Attach zoom to the SVG
    image.svg.call(zoom);

    if (window.imageCompare) {
      window.imageCompare.svg.call(zoom);
    }

    // Restore saved transform state
    const transformObj = parseTransform(transformStr);
    const zoomIdentity = d3.zoomIdentity.translate(transformObj.x, transformObj.y).scale(transformObj.k)
    image.svg.call(zoom.transform, zoomIdentity);

    if (window.imageCompare) {
      window.imageCompare.svg.call(zoom.transform, zoomIdentity);
    }

  } catch (error) {
    console.error("❌ Error creating visualization:", error);
    console.error("Stack trace:", error.stack);
  }
}