// TODO once the dashboard gets scrollable , the color is not throughout the section 
// TODO: Add the hints of acceptable values for the inputs 

// Import the dataset loader
import { DatasetLoader } from "./bridges/loadDataset.js";

//Global variable to hold the selected discrete color scheme
let selectedDiscreteColorScheme = null;
let selectedContinuousColorScheme = null;
// Add this single line for maxLayer
let globalMaxLayer = 0;

// Add this new global variable to store custom layer colors
let customLayerColors = {};


// ✅ DYNAMIC DEFAULT: Function to set default scheme based on current layer count
function setDefaultDiscreteScheme() {
  const count = globalMaxLayer + 1;

  // Generate colors for current layer count
  let colors;
  try {
    // Try to get Blues colors for current count
    if (colorSchemes.sequential && colorSchemes.sequential['Blues']) {
      colors = colorSchemes.sequential['Blues'](count);

      // ✅ HANDLE n=2 CASE: If we get undefined for count=2, try count=3 and take extremes
      if (!colors && count === 2) {
        // console.log("Handling n=2 case for Blues scheme");
        const fallback = colorSchemes.sequential['Blues'](3);
        if (fallback && fallback.length >= 3) {
          colors = [fallback[0], fallback[2]]; // Take first and last
        }
      }
    }
  } catch (e) {
    console.warn("Could not generate Blues scheme for count", count);
  }

  // Fallback colors if scheme generation fails
  if (!colors || colors.length === 0) {
    const defaultPalette = ['#deebf7', '#9ecae1', '#3182bd', '#2171b5', '#08519c'];
    colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(defaultPalette[i % defaultPalette.length]);
    }
  }

  selectedDiscreteColorScheme = {
    name: 'Blues',
    family: 'sequential',
    colors: colors
  };

}

// Initialize with default
setDefaultDiscreteScheme();


// Initialize dataset dropdown from configuration
document.addEventListener('DOMContentLoaded', function () {

  // Sidebar toggle logic
  const sidebar = document.querySelector('.right-sidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const triangleIcon = toggleBtn.querySelector('.triangle-icon');

  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
      triangleIcon.textContent = '◀';
    } else {
      triangleIcon.textContent = '▶';
    }
  });



  // Get the dataset dropdown element
  const datasetSelect = document.getElementById('dataset');

  // Get the dataset 2 
  const dataset2Select = document.getElementById("dataset2");

  // Current view state - drives what gets shown / loaded
  let activeView = 'single';
  // Guard so dataset2 is only pre-loaded once when Compare View is first opened
  let compareDatasetPreloaded = false;


  // Populate the datasets

  function populateDropDown(selectedElement, dataList) {
    selectedElement.innerHTML = "";

    dataList.forEach(dataset => {
      const option = document.createElement("option");
      option.value = dataset.id;

      // Extract the meaningful part of the dataset name
      // This handles common patterns in your dataset names
      const fullName = dataset.name;
      let shortName = fullName.substring(0, 30)

      // Use the short name for display, but store full name as title for tooltip
      option.textContent = shortName;
      option.title = fullName; // Shows full name on hover
      
      selectedElement.appendChild(option);
    });

  }

  // Populate the data
  populateDropDown(datasetSelect, DATASET_CONFIG.datasets);
  populateDropDown(dataset2Select, DATASET_CONFIG.datasets_compare);

  // Cache to remember the option 
  let singleViewDataset1Val = DATASET_CONFIG.datasets[0].id;
  let compareViewDataset1Val = DATASET_CONFIG.datasets_compare[0].id;

  // Load helper for dataset 1 to handle the views
  function loadDataset1(datasetId, isCompare) {
    if (!datasetId) return;

    DatasetLoader.loadDataset(datasetId, isCompare)
      .then(datasetData => {
        if (datasetData) {
          const maxLayer = getMaxLayer(datasetData);
          updateLayerList();
        }
      })
      .catch(error => console.error("Error loading dataset"));
  };

  // Load for single view initially 
  datasetSelect.value = singleViewDataset1Val;
  loadDataset1(singleViewDataset1Val, false);


  // Set dataset2 default, not load yet
  if (DATASET_CONFIG.datasets_compare.length > 0) {
    // Default to the second entry if possible
    const defaultDataset2 = DATASET_CONFIG.datasets[1].id;
    dataset2Select.value = defaultDataset2;
  }


  // Listener for dataset changes
  datasetSelect.addEventListener("change", function() {
    if (activeView === "compare") {
      compareViewDataset1Val = this.value;
      loadDataset1(this.value, true);
    } else {
      singleViewDataset1Val = this.value;
      loadDataset1(this.value, false);
    }
  });


  dataset2Select.addEventListener("change", function() {
    // Only load
    DatasetLoader.loadDataset(this.value, true);
  });

  // View toggle logic

  const container2 = document.getElementById("container2");
  const container1 = document.getElementById("container1");
  const dataset2Selection = document.getElementById("dataset2-selection");



  const toggleBtns = document.querySelectorAll(".toggle-view-btns button");
  toggleBtns.forEach(button => {
    button.addEventListener("click", function () {
        // Update styling
        // Deactivate the other option
        toggleBtns.forEach(btn => btn.classList.remove("active"));
        // But keep the current option
        this.classList.add("active");

        if (this.textContent.trim() === "Compare View") {
          activeView = "compare";

          // Show the second option
          container2.style.display = "";
          dataset2Selection.style.display = "";
          container1.classList.add("compare-active");

          // Preload if chosen for the first time
          // Swap dataset 1 to the compare list 
          populateDropDown(datasetSelect, DATASET_CONFIG.datasets_compare);
          datasetSelect.value = compareViewDataset1Val;
          loadDataset1(compareViewDataset1Val, true);

          if (!compareDatasetPreloaded) {
            compareDatasetPreloaded = true;
            DatasetLoader.loadDataset(dataset2Select.value, true)
              .catch(error => console.error("Error reading dataset", error));
          }
          window.UIMapper.forceUpdate();
        } else {
          activeView = "single";
          container2.style.display = "none";
          dataset2Selection.style.display = "none";
          container1.classList.remove("compare-active");
          // Swap back to single view
          populateDropDown(datasetSelect, DATASET_CONFIG.datasets);
          datasetSelect.value = singleViewDataset1Val;
          loadDataset1(compareViewDataset1Val, false);
          window.UIMapper.forceUpdate();
        }

        // Expose the active view
        window.activeView = activeView;
    });
  });

  // Set initial state
  window.activeView = activeView;

});

const sections = [
  { label: "Layers", class: "dropdown-layers" },
  { label: "Colors", class: "dropdown-colors" },
  // { label: "Filters", class: "dropdown-filters"},
  { label: "Layout", class: "dropdown-layout" },
  { label: "Border and Shadows", class: "dropdown-brdr-shdw" },
  { label: "Temporal Axes", class: "dropdown-temporal-axes" },
  // This need to be rewritten a whole lot
  // { label: "Import/Export Settings", class: "dropdown-imp-exp" },
  { label: "Download", class: "dropdown-download" }
];

const list = document.getElementById("variousList");

sections.forEach(({ label, class: dropdownClass }) => {
  const li = document.createElement("li");
  li.className = "various-section";

  li.innerHTML = `
    <div class="various-section-header">
      <span class="arrow-icon"></span>
      <span class="label">${label}</span>
    </div>
    <div class="dropdown-content ${dropdownClass}"> ${getDropdownContent(dropdownClass)}</div>
  `;

  list.appendChild(li);
});

// Simple function to get maxLayer from dataset
function getMaxLayer(datasetData) {
  // Check if maxLayer is directly available (like in ui-mapper-bridge.js)
  if (datasetData && datasetData.maxLayer !== undefined) {
    globalMaxLayer = datasetData.maxLayer;
    setDefaultDiscreteScheme();
    return datasetData.maxLayer;
  }

  // Fallback: if nodes array exists
  if (datasetData && datasetData.nodes && Array.isArray(datasetData.nodes)) {
    let maxLayer = 0;
    datasetData.nodes.forEach(node => {
      if (node.layer > maxLayer) {
        maxLayer = node.layer;
      }
    });
    globalMaxLayer = maxLayer;
    setDefaultDiscreteScheme();
    return maxLayer;
  }

  // If no valid data structure found
  globalMaxLayer = 0;
  setDefaultDiscreteScheme();
  return 0;
}

function getDropdownContent(type) {
  switch (type) {
    case 'dropdown-layers':
      return getLayerListHTML();
    case 'dropdown-colors':
      return getColorHTML(); // Temporary dummy
    case 'dropdown-layout':
      return getLayoutHTML();
    case 'dropdown-download':
      return getDownloadHTML();
    // case 'dropdown-filters':
    //   return getFilterHTML();
    // case 'dropdown-imp-exp':
    //   return getImportExportHTML();
    case 'dropdown-temporal-axes':
      return getTemporalAxesHTML();
    case 'dropdown-brdr-shdw':
      return getBorderShadowHTML();
    default:
      return `<p>Dummy content for ${type}</p>`;
  }
}


function getColorHTML() {

  return `
    <div class="color-container">
            <div class="color-row">
              <label for="colorScale">Color Scale</label>
              <div class="color-scale-wrapper">
                  <select id="colorScaleSelect">
                    <option value="discrete" selected>Discrete</option>
                    <option value="continuous">Continuous</option>
                    <option value="special">Special</option>
                  </select>
              </div>
            </div>
            <!-- Discrete Color Options - depends on the numbers selected and sequential, diverging, cyclical -->
            <div class="color-discrete-content color-content">
                <div class="color-family-choice">
                    <label>Color Family</label>
                    <div class="color-scale-wrapper">
                          <select id="discreteColorFamilySelect">
                            <option value="sequential">Sequential</option>
                            <option value="diverging">Diverging</option>
                            <option value="cyclical">Cyclical</option>
                          </select>
                    </div>        
                </div>
                <div class="color-scheme-section">
                  <!-- This will be populated dynamically based on the selected family and count -->
                </div>
                <div class="color-discrete-advanced-section">
                      <div class="advanced-header">
                            <img src="lib/icons/advanced-arrow.svg" alt="Arrow" class="advance-arrow" />
                            <span>Advanced Options</span>
                      </div>
                      <div class="advanced-content">
                            <div class="toggle-row advanced-color-toggle-row" id="toggleRow">
                                  <span class="toggle-label">Inverse Color Order</span>
                                  <img 
                                    src="lib/icons/ToggleOn.svg" 
                                    alt="Toggle" 
                                    class="toggle-switch" 
                                    id="discreteInverseColorToggle" 
                                    data-state="on"
                                    style="cursor: pointer;"
                                  />
                            </div>  
                            
                            <div class="color-family-choice">
                              <label>Decide Type</label>
                                <div class="color-scale-wrapper">
                                  <select id="discreteColorDecideTypeSelect">
                                    <option value="Depth" selected>Depth</option>
                                    <option value="Scalar">Scalar</option>
                                  </select>
                                </div>
                            </div>


                            <div class="color-opacity">
                                <div class="toggle-row advanced-color-toggle-row" id="toggleRow">
                                  <span class="opacity-label">Opacity</span>
                                  <img 
                                    src="lib/icons/ToggleOff.svg" 
                                    alt="Toggle" 
                                    class="toggle-switch" 
                                    id="discreteOpacityToggle" 
                                    data-state="off"
                                    style="cursor: pointer;"
                                  />
                                </div>
                                <div class="dual-range-slider">
                                        <input type="range" id="colorOpacityMin" min="0" max="100" value="0" class="range-input" />
                                        <input type="range" id="colorOpacityMax" min="0" max="100" value="100" class="range-input" />
                                        <div class="range-track"></div>
                                </div>
                                <div class="range-values">
                                  <span>MIN: <span id="minValue">0</span></span>
                                  <span>MAX: <span id="maxValue">100</span></span>
                                </div>
                            </div>
                      </div>
                  </div>
            </div>

        <!-- Continuous Color Options -->
              <div class="color-continuous-content color-content color-disabled">
                        <div class="color-family-choice">
                                      <label>Color Family</label>
                                      <div class="color-scale-wrapper">
                                            <select id="continuousColorFamilySelect">
                                              <option value="continuousSequential">Sequential</option>
                                              <option value="continuousDiverging">Diverging</option>
                                              <option value="continuousCyclical">Cyclical</option>
                                            </select>
                                      </div>        
                        </div>
                        <div class="color-scheme-section">
                              <!-- This will be populated dynamically based on the selected family and count -->
                        </div>

                        <div class="color-continuous-advanced-section">
                              <div class="advanced-header">
                                  <img src="lib/icons/advanced-arrow.svg" alt="Arrow" class="advance-arrow" />
                                  <span>Advanced Options</span>
                              </div>
                              <div class="advanced-content">
                                        <div class="toggle-row advanced-color-toggle-row" id="toggleRow">
                                          <span class="toggle-label">Inverse Color Order</span>
                                          <img 
                                            src="lib/icons/ToggleOff.svg" 
                                            alt="Toggle" 
                                            class="toggle-switch" 
                                            id="continuousInverseColorToggle" 
                                            data-state="off"
                                            style="cursor: pointer;"
                                          />
                                        </div>

                                        <div class="color-family-choice">
                                          <label>Decide Type</label>
                                            <div class="color-scale-wrapper">
                                              <select id="continuousColorDecideTypeSelect">
                                                <option value="Depth" selected>Depth</option>
                                                <option value="Scalar">Scalar</option>
                                              </select>
                                            </div>
                                        </div>
                                        <div class="color-opacity">
                                                  <div class="toggle-row advanced-color-toggle-row" id="toggleRow">
                                                    <span class="opacity-label">Opacity</span>
                                                    <img 
                                                      src="lib/icons/ToggleOff.svg" 
                                                      alt="Toggle" 
                                                      class="toggle-switch" 
                                                      id="continuousOpacityToggle" 
                                                      data-state="off"
                                                      style="cursor: pointer;"
                                                    />
                                                  </div>
                                                  <div class="dual-range-slider">
                                                    <input type="range" id="continuousColorOpacityMin" min="0" max="100" value="99" class="range-input" />
                                                    <input type="range" id="continuousColorOpacityMax" min="0" max="100" value="100" class="range-input" />
                                                    <div class="range-track"></div>
                                                  </div>
                                                  <div class="range-values">
                                                    <span>MIN: <span id="continuousMinValue">0</span></span>
                                                    <span>MAX: <span id="continuousMaxValue">100</span></span>
                                                  </div>
                                        </div>
                               </div>
                          </div>
                </div>

                <!-- Special Color Options -->
                <div class="color-special-content color-content color-disabled">
                    <div class="color-family-choice">
                      <label>Special Color for :</label>
                        <div class="color-scale-wrapper">
                              <select id="specialColorFamilySelect">
                                <option value="population">Population</option>
                                <option value="code">Code</option>
                              </select>
                        </div>  
                    </div>
                </div>
    </div>
  `;
}


// Update for the dual-range slider - for continuous colors
setTimeout(() => {
  const continuousMinSlider = document.getElementById('continuousColorOpacityMin');
  const continuousMaxSlider = document.getElementById('continuousColorOpacityMax');
  const continuousMinValueDisplay = document.getElementById('continuousMinValue');
  const continuousMaxValueDisplay = document.getElementById('continuousMaxValue');
  const continuousRangeTrack = document.querySelector('.range-track');
  const continuousInverseColorToggle = document.getElementById("continuousInverseColorToggle");
  const continuousOpacityToggle = document.getElementById("continuousOpacityToggle");

  const continousDecideType = document.getElementById("continuousColorDecideTypeSelect");
  
  if (continousDecideType) {
    continousDecideType.addEventListener("change", () => {
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        window.UIMapper.forceUpdate();
      }
    });
  }

  if (continuousInverseColorToggle) {
    continuousInverseColorToggle.addEventListener("click", () => {
      const isOn = continuousInverseColorToggle.dataset.state === "off";

      continuousInverseColorToggle.src = `lib/icons/${isOn ? 'ToggleOn' : 'ToggleOff'}.svg`;
      continuousInverseColorToggle.dataset.state = isOn ? 'on' : 'off';

      // Enable or disable the section
      if (isOn) {
        // console.log("Continuous Inverse Color enabled");
      } else {
        // console.log("Continuous Inverse Color disabled");
      }
    });
  }

  if (continuousOpacityToggle) {
    continuousOpacityToggle.addEventListener("click", () => {
      const isOn = continuousOpacityToggle.dataset.state === "off";

      continuousOpacityToggle.src = `lib/icons/${isOn ? 'ToggleOn' : 'ToggleOff'}.svg`;
      continuousOpacityToggle.dataset.state = isOn ? 'on' : 'off';
    });
  }

  if (continuousMinSlider && continuousMaxSlider) {
    // Set initial values - both sliders have full 0-100 range
    continuousMinSlider.min = 0;
    continuousMinSlider.max = 100;
    continuousMinSlider.value = 0;

    continuousMaxSlider.min = 0;
    continuousMaxSlider.max = 100;
    continuousMaxSlider.value = 100;

    function continuousUpdateSlider() {
      let continuousMinVal = parseInt(continuousMinSlider.value);
      let continuousMaxVal = parseInt(continuousMaxSlider.value);

      // Ensure min doesn't exceed max and vice versa
      if (continuousMinVal >= continuousMaxVal) {
        if (this === continuousMinSlider) {
          continuousMaxSlider.value = continuousMinVal + 1;
          continuousMaxVal = continuousMinVal + 1;
        } else {
          continuousMinSlider.value = continuousMaxVal - 1;
          continuousMinVal = continuousMaxVal - 1;
        }
      }

      // Calculate the actual positions of the thumbs as percentages
      const minPercent = (continuousMinVal / 100) * 100;
      const maxPercent = (continuousMaxVal / 100) * 100;

      // Update the track highlight - blue should be ONLY between the thumbs
      if (continuousRangeTrack) {
        continuousRangeTrack.style.background = `linear-gradient(
          to right,
          #ddd 0%,
          #ddd ${minPercent}%,
          #007bff ${minPercent}%,
          #007bff ${maxPercent}%,
          #ddd ${maxPercent}%,
          #ddd 100%
        )`;
      }

      // Update value displays
      if (continuousMinValueDisplay) continuousMinValueDisplay.textContent = continuousMinVal;
      if (continuousMaxValueDisplay) continuousMaxValueDisplay.textContent = continuousMaxVal;
    }

    continuousMinSlider.addEventListener('input', continuousUpdateSlider);
    continuousMaxSlider.addEventListener('input', continuousUpdateSlider);

    // Initialize the slider
    continuousUpdateSlider();
  }
}, 100);





// Update for the dual-range slider - for discrete colors
setTimeout(() => {
  const minSlider = document.getElementById('colorOpacityMin');
  const maxSlider = document.getElementById('colorOpacityMax');
  const minValueDisplay = document.getElementById('minValue');
  const maxValueDisplay = document.getElementById('maxValue');
  const rangeTrack = document.querySelector('.range-track');
  const discreteInverseColorToggle = document.getElementById("discreteInverseColorToggle");
  const discreteOpacityToggle = document.getElementById("discreteOpacityToggle");

  const discreteDecideType = document.getElementById("discreteColorDecideTypeSelect");

  if (discreteDecideType) {
    discreteDecideType.addEventListener("change", () => {
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        window.UIMapper.forceUpdate();
      }
    });
  }

  if (discreteInverseColorToggle) {
    discreteInverseColorToggle.addEventListener("click", () => {
      const isOn = discreteInverseColorToggle.dataset.state === "off";

      discreteInverseColorToggle.src = `lib/icons/${isOn ? 'ToggleOn' : 'ToggleOff'}.svg`;
      discreteInverseColorToggle.dataset.state = isOn ? 'on' : 'off';

      // Enable or disable the section
      if (isOn) {
        // console.log("Discrete Color enabled");
      } else {
        // console.log("Discrete Inverse Color disabled");
      }
    });
  }

  // If activate opacity
  if (discreteOpacityToggle) {
    discreteOpacityToggle.addEventListener("click", () => {
      const isOn = discreteOpacityToggle.dataset.state === "off";

      discreteOpacityToggle.src = `lib/icons/${isOn ? 'ToggleOn' : 'ToggleOff'}.svg`;
      discreteOpacityToggle.dataset.state = isOn ? 'on' : 'off';


    });
  }

  if (minSlider && maxSlider) {
    // Set initial values - both sliders have full 0-100 range
    minSlider.min = 0;
    minSlider.max = 100;
    minSlider.value = 0;

    maxSlider.min = 0;
    maxSlider.max = 100;
    maxSlider.value = 100;

    function updateSlider() {
      let minVal = parseInt(minSlider.value);
      let maxVal = parseInt(maxSlider.value);

      // Ensure min doesn't exceed max and vice versa
      if (minVal >= maxVal) {
        if (this === minSlider) {
          maxSlider.value = minVal + 1;
          maxVal = minVal + 1;
        } else {
          minSlider.value = maxVal - 1;
          minVal = maxVal - 1;
        }
      }

      // Calculate the actual positions of the thumbs as percentages
      const minPercent = (minVal / 100) * 100;
      const maxPercent = (maxVal / 100) * 100;

      // Update the track highlight - blue should be ONLY between the thumbs
      if (rangeTrack) {
        rangeTrack.style.background = `linear-gradient(
          to right,
          #ddd 0%,
          #ddd ${minPercent}%,
          #007bff ${minPercent}%,
          #007bff ${maxPercent}%,
          #ddd ${maxPercent}%,
          #ddd 100%
        )`;
      }

      // Update value displays
      if (minValueDisplay) minValueDisplay.textContent = minVal;
      if (maxValueDisplay) maxValueDisplay.textContent = maxVal;
    }

    minSlider.addEventListener('input', updateSlider);
    maxSlider.addEventListener('input', updateSlider);

    // Initialize the slider
    updateSlider();
  }
}, 100);



// Advanced section expansion
setTimeout(() => {
  // Discrete color advanced section
  const discreteAdvancedHeader = document.querySelector('.color-discrete-advanced-section .advanced-header');
  const discreteAdvancedContent = document.querySelector('.color-discrete-advanced-section .advanced-content');

  if (discreteAdvancedHeader && discreteAdvancedContent) {
    discreteAdvancedHeader.addEventListener('click', () => {
      discreteAdvancedHeader.classList.toggle('active');
      discreteAdvancedContent.classList.toggle('expanded');
    });
  }

  // Also add the continuous section
  const continuousAdvancedHeader = document.querySelector('.color-continuous-advanced-section .advanced-header');
  const continuousAdvancedContent = document.querySelector('.color-continuous-advanced-section .advanced-content');

  if (continuousAdvancedHeader && continuousAdvancedContent) {
    continuousAdvancedHeader.addEventListener('click', () => {
      continuousAdvancedHeader.classList.toggle('active');
      continuousAdvancedContent.classList.toggle('expanded');
    });
  }
}, 0);


// // Advanced section expansion
// setTimeout(() => {
//   const advancedHeader = document.querySelector('.advanced-header');
//   const advancedContent = document.querySelector('.advanced-content');

//   if (advancedHeader && advancedContent) {
//     advancedHeader.addEventListener('click', () => {
//       advancedHeader.classList.toggle('active');
//       advancedContent.classList.toggle('expanded');
//     });
//   }
// }, 0);

setTimeout(() => {

  const colorScaleSelect = document.getElementById("colorScaleSelect");
  const discreteContent = document.querySelector(".color-discrete-content");
  const continuousContent = document.querySelector(".color-continuous-content");
  const specialContent = document.querySelector(".color-special-content");



  if (colorScaleSelect && discreteContent && continuousContent && specialContent) {

    if (colorScaleSelect) {

      colorScaleSelect.addEventListener("change", () => {

        const selectedValue = colorScaleSelect.value;

        if (selectedValue === "discrete") {

          discreteContent.classList.remove("color-disabled");
          continuousContent.classList.add("color-disabled");
          specialContent.classList.add("color-disabled");
        }
        else if (selectedValue === "continuous") {

          continuousContent.classList.remove("color-disabled");
          discreteContent.classList.add("color-disabled");
          specialContent.classList.add("color-disabled");
          updateContinuousColorSwatches();
        }
        else if (selectedValue === "special") {
          specialContent.classList.remove("color-disabled");
          discreteContent.classList.add("color-disabled");
          continuousContent.classList.add("color-disabled");
        }

      });

    }

  }

  const colorFamilySelect = document.getElementById("discreteColorFamilySelect");
  // const colorCountSelect = document.getElementById("discreteCountSelect");



  if (colorFamilySelect) {

    // Add event listeners to both dropdowns
    colorFamilySelect.addEventListener("change", updateColorSwatches);
    // colorCountSelect.addEventListener("change", updateColorSwatches);

    // Call initially to show swatches on page load
    updateColorSwatches();
  }

  // Continuous color swatches
  const continuousColorFamilySelect = document.getElementById("continuousColorFamilySelect");
  if (continuousColorFamilySelect) {
    continuousColorFamilySelect.addEventListener("change", updateContinuousColorSwatches);
  }

}, 0);


// Add support for continuous color swatches
function getContinuousColorSwatches(family) {
  const schemes = colorSchemes[family];
  if (!schemes) return {};

  const result = {};
  Object.keys(schemes).forEach(schemeName => {
    try {
      const interpolator = schemes[schemeName]();
      // Generate a sample of colors for preview (e.g., 10 colors)
      const colors = Array.from({ length: 256 }, (_, i) => interpolator(i / 255));
      result[schemeName] = colors;
    } catch (e) {
      console.warn(`Continuous scheme ${schemeName} error:`, e);
    }
  });

  return result;
}

function getColorSwatches(family, count) {
  const schemes = colorSchemes[family];
  // console.log('Available schemes for family', family, schemes);
  if (!schemes) return {};

  const result = {};
  Object.keys(schemes).forEach(schemeName => {
    try {
      // HANDLE n=2 CASE: If we get undefined/null for count=2, try count=3 and take extremes
      if (count === 2) {
        // console.log(`Trying fallback for ${schemeName} with count=3`);
        const fallbackColors = schemes[schemeName](3);
        // console.log(`Fallback colors for ${schemeName} with count=3:`, fallbackColors);
        if (fallbackColors && fallbackColors.length >= 3) {
          colors = [fallbackColors[0], fallbackColors[2]]; // Take first and last
        }
      }
      const colors = schemes[schemeName](count);
      if (colors && colors.length > 0) {
        result[schemeName] = colors;
      }
    } catch (e) {
      // ADDITIONAL FALLBACK for n=2
      if (count === 2) {
        try {
          const fallbackColors = schemes[schemeName](3);
          if (fallbackColors && fallbackColors.length >= 3) {
            result[schemeName] = [fallbackColors[0], fallbackColors[2]];
          }
        } catch (e2) {
          console.warn(`Scheme ${schemeName} doesn't support count ${count} or 3`);
        }
      } else {
        console.warn(`Scheme ${schemeName} doesn't support count ${count}`);
      }
      // Skip schemes that don't support this count
      console.warn(`Scheme ${schemeName} doesn't support count ${count}`);
    }
  });

  return result;
}


function updateContinuousColorSwatches() {
  const colorFamilySelect = document.getElementById("continuousColorFamilySelect");
  const colorSchemeSection = document.querySelector(".color-continuous-content .color-scheme-section");

  if (colorFamilySelect && colorSchemeSection) {
    const family = colorFamilySelect.value;

    const schemes = getContinuousColorSwatches(family);

    let schemesHTML = '';
    Object.entries(schemes).forEach(([schemeName, colors]) => {
      // Create CSS gradient instead of individual divs
      const gradientColors = colors.join(', ');
      schemesHTML += `
        <div class="swatch-row continuous-clickable-swatch" 
             data-scheme-name="${schemeName}"
             data-scheme-family="${family}"
             data-scheme-interpolator="${schemeName}"
             style="margin-bottom: 8px;
                    margin-top: 16px;  
                    background: #6D6D6D; 
                    border-radius: 4px; 
                    padding: 2px; 
                    overflow: hidden;">
          <div class="gradient-swatch" 
               style="background: linear-gradient(to right, ${gradientColors}); 
                      height: 25px; 
                      width: 100%;
                      border-radius: 4px;"
               title="${schemeName}">
          </div>
        </div>
      `;
    });

    colorSchemeSection.innerHTML = `
      <div class="swatches-scrollable-container" 
           style="max-height: 200px; 
                  overflow-y: auto; 
                  overflow-x: hidden; 
                  border: 1px solid #e0e0e0; 
                  border-radius: 6px; 
                  padding: 8px;
                  margin-top: 10px;">
        ${schemesHTML}
      </div>
    `;

    // Add click listeners after creating the HTML
    addContinuousSwatchClickListeners();
  }
}


// Add this new function for continuous color swatch click listeners
function addContinuousSwatchClickListeners() {
  const swatchRows = document.querySelectorAll('.continuous-clickable-swatch');

  swatchRows.forEach(row => {
    row.addEventListener('click', function () {
      // Remove previous selection styling
      document.querySelectorAll('.continuous-clickable-swatch').forEach(r => {
        r.style.border = 'none';
        r.style.boxShadow = 'none';
      });

      // Add selection styling
      this.style.border = '2px solid #18a0fb';
      this.style.boxShadow = '0 0 8px rgba(24, 160, 251, 0.3)';

      // Get the actual color array from the data attribute or generate it
      const schemeName = this.dataset.schemeName;
      const family = this.dataset.schemeFamily;

      // Generate the color array for storage
      let colors = [];
      try {
        const interpolator = colorSchemes[family][schemeName]();
        colors = Array.from({ length: 10 }, (_, i) => interpolator(i / 9)); // Generate 10 sample colors
      } catch (e) {
        console.warn('Could not generate colors for', schemeName);
      }

      // Store the selection globally so ui-mapper-bridge can access it
      selectedContinuousColorScheme = {
        name: schemeName,
        family: family,
        interpolator: schemeName,
        colors: colors, // Add the actual color array
        type: 'continuous'
      };

      // console.log('Selected continuous color scheme:', selectedContinuousColorScheme);
      // Trigger UI state update
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        window.UIMapper.forceUpdate();
      }
    });

    // Add hover effects
    row.addEventListener('mouseenter', function () {
      if (!this.style.border.includes('#18a0fb')) {
        this.style.transform = 'scale(1.02)';
      }
    });

    row.addEventListener('mouseleave', function () {
      if (!this.style.border.includes('#18a0fb')) {
        this.style.transform = 'scale(1)';
      }
    });
  });
}

// Expose function to get selected continuous scheme
window.getSelectedContinuousColorScheme = function () {
  return selectedContinuousColorScheme;
};


function updateColorSwatches() {

  const colorFamilySelect = document.getElementById("discreteColorFamilySelect");
  // const colorCountSelect = document.getElementById("discreteCountSelect");
  const colorSchemeSection = document.querySelector(".color-scheme-section");

  if (colorFamilySelect && colorSchemeSection) {
    const family = colorFamilySelect.value;
    const count = globalMaxLayer + 1;

    // console.log(`Using layer-based count: ${count} (from globalMaxLayer: ${globalMaxLayer})`);

    // Get swatches using lookup (no if-else needed!)
    const schemes = getColorSwatches(family, count);

    // Generate HTML with full-width swatches
    let schemesHTML = '';
    Object.entries(schemes).forEach(([schemeName, colors]) => {
      const swatchWidth = `${100 / count}%`; // Divide width equally based on count

      const swatchesHTML = colors.map(color =>
        `<div class="color-swatch" 
              style="background: ${color}; 
                     width: ${swatchWidth}; 
                     height: 25px; 
                     display: inline-block; 
                     box-sizing: border-box;"
              title="${schemeName} - ${color}">
         </div>`
      ).join('');

      schemesHTML += `
        <div class="swatch-row clickable-discrete-swatch" 
             data-scheme-name="${schemeName}"
             data-scheme-family="${family}"
             data-scheme-colors='${JSON.stringify(colors)}' 
             style="margin-bottom: 8px;
                    margin-top: 16px;  
                    background: #6D6D6D; 
                    border-radius: 4px; 
                    padding: 2px; 
                    overflow: hidden;">
          <div style="display: flex; 
                      width: 100%;">
            ${swatchesHTML}
          </div>
        </div>
      `;
    });

    colorSchemeSection.innerHTML = `

      <div class="swatches-scrollable-container" 
           style="max-height: 200px; 
                  overflow-y: auto; 
                  overflow-x: hidden; 
                  border: 1px solid #e0e0e0; 
                  border-radius: 6px; 
                  padding: 8px;
                  margin-top: 10px;">
        ${schemesHTML}
      </div>
    `;

    // Add click listeners after creating the HTML
    addDiscreteSwatchClickListeners();

    // ✅ AUTO-HIGHLIGHT the default selected scheme (Blues)
    setTimeout(() => {
      const bluesRow = document.querySelector('.clickable-discrete-swatch[data-scheme-name="Blues"]');
      if (bluesRow && family === 'sequential') {
        bluesRow.style.border = '2px solid #18a0fb';
        bluesRow.style.boxShadow = '0 0 8px rgba(24, 160, 251, 0.3)';
      }
    }, 100);
  }
}

// Add this new function
function addDiscreteSwatchClickListeners() {
  const swatchRows = document.querySelectorAll('.clickable-discrete-swatch');

  swatchRows.forEach(row => {
    row.addEventListener('click', function () {
      // Remove previous selection styling
      document.querySelectorAll('.clickable-discrete-swatch').forEach(r => {
        r.style.border = 'none';
        r.style.boxShadow = 'none';
      });

      // Add selection styling
      this.style.border = '2px solid #18a0fb';
      this.style.boxShadow = '0 0 8px rgba(24, 160, 251, 0.3)';

      // Store the selection globally so ui-mapper-bridge can access it
      selectedDiscreteColorScheme = {
        name: this.dataset.schemeName,
        family: this.dataset.schemeFamily,
        colors: JSON.parse(this.dataset.schemeColors)
      };

      updateLayerColors();

      // console.log('Selected discrete color scheme:', selectedDiscreteColorScheme);
      // ADD THIS LINE: Trigger UI state update
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        window.UIMapper.forceUpdate();
      }
    });

    // Add hover effects
    row.addEventListener('mouseenter', function () {
      if (!this.style.border.includes('#18a0fb')) {
        this.style.transform = 'scale(1.02)';
      }
    });

    row.addEventListener('mouseleave', function () {
      if (!this.style.border.includes('#18a0fb')) {
        this.style.transform = 'scale(1)';
      }
    });
  });
}

// Expose function to get selected scheme
window.getSelectedDiscreteColorScheme = function () {
  return selectedDiscreteColorScheme;
};

// Code for layout 
function getLayoutHTML() {

  return `
 
 <!-- TODO: By default what should be the layout- confirm -->
 <div class="layout-container">
      <div class="wiggle-row">
          <label for="wiggle">Wiggle Optimization</label>
          <div class="wiggle-select-wrapper">
              <select id="wiggleSelect" class="wiggle-dropdown">
                <option class="wiggle-option" value="none">None</option>
                <option class="wiggle-option" value="partial">Partial</option>
                <option class="wiggle-option" value="full" selected>Full</option>
              </select>
          </div>
        </div>

        <div class="none-wiggle-content wiggle-content wiggle-disabled">
          <label>Scale</label>
          <div class="none-scale">
              <label>X <input type="number" id="noneScaleX" placeholder="2" value="2" /></label>
              <label>Y <input type="number" id="noneScaleY" min="0.01" max="1" step="0.01" value="1" placeholder="0.01-1" /></label>
          </div>
          <label>Y Padding <input type="number" id="noneYPadding" min="0" max="2" step="0.001" placeholder="0-2" value="0" /></label>
          <label>Bézier point offset <input type="number" id="noneBezierOffset"  min="0" max="0.499" step="0.01" placeholder="0-0.499" value="0" /></label>
          <label>Layer Difference <input type="number" id="noneLayerDifference" min="0" max="0.5" step="0.001" placeholder="0-0.5" value="0" /></label>
          <label>Radii</label>
          <div class="none-scale">
              <label>X <input type="number" id="noneRadiiX" min="0" max="10" step="0.001" value="2" placeholder="0-10" /></label>
              <label>Y <input type="number" id="noneRadiiY" min="0" max="10" step="0.001" value="6" placeholder="0-10" /></label>
          </div>
        </div>

        <div class="partial-wiggle-content wiggle-content wiggle-disabled">
            <label>Scale X <input type="number" id="partialScaleX" placeholder="2" value="2"/></label>
            <label>Bézier point offset <input type="number" id="partialBezierOffset" min="0" max="0.499" step="0.01" placeholder="0-0.499" value="0" /></label>
            <label>Radii</label>
            <div class="none-scale">
              <label>X <input type="number" id="partialRadiiX" min="0" max="10" step="0.001" value="2" placeholder="0-10" /></label>
              <label>Y <input type="number" id="partialRadiiY" min="0" max="10" step="0.001" value="6" placeholder="0-10" /></label>
            </div>
        </div>

        <div class="full-wiggle-content wiggle-content">
            <label>Bézier point offset <input type="number" id="fullBezierOffset" min="0" max="0.499" step="0.01" placeholder="0-0.499" value="0" /></label>
            <label>Radii</label>
            <div class="none-scale">
              <label>X <input type="number" id="fullRadiiX" min="0" max="10" step="0.001" value="2" placeholder="0-10" /></label>
              <label>Y <input type="number" id="fullRadiiY" min="0" max="10" step="0.001" value="6" placeholder="0-10" /></label>
            </div>

        </div>
  </div>
 `;
}


setTimeout(() => {

  const wiggleSelect = document.getElementById("wiggleSelect");
  const noneWiggleContent = document.querySelector(".none-wiggle-content");
  const partialWiggleContent = document.querySelector(".partial-wiggle-content");
  const fullWiggleContent = document.querySelector(".full-wiggle-content");

  if (wiggleSelect) {
    wiggleSelect.addEventListener("change", () => {


      const selectedValue = wiggleSelect.value;

      if (selectedValue === "none") {

        noneWiggleContent.classList.remove("wiggle-disabled");
        partialWiggleContent.classList.add("wiggle-disabled");
        fullWiggleContent.classList.add("wiggle-disabled");
      }
      else if (selectedValue === "partial") {

        noneWiggleContent.classList.add("wiggle-disabled");
        partialWiggleContent.classList.remove("wiggle-disabled");
        fullWiggleContent.classList.add("wiggle-disabled");
      }
      else if (selectedValue === "full") {
        noneWiggleContent.classList.add("wiggle-disabled");
        partialWiggleContent.classList.add("wiggle-disabled");
        fullWiggleContent.classList.remove("wiggle-disabled");
      }

    })

  }




}, 0);


function getBorderShadowHTML() {

  return `
    <div class="border-container">
      <div class="other-border-options">
        <span class="crisp-label">Crisp Edges
        <img 
          src="lib/icons/ToggleOff.svg" 
          alt="Toggle" 
          class="toggle-switch" 
          id="crispLabelToggle" 
          data-state="off"
          style="cursor: pointer;"
        /></span>
        <!-- TODO: check the min and max values of fudge from proff- 0 to 1000 pixels -->
        <label>Fudge <input type="number" id="fudgeEdges" min="0" max="1000" step="0.1" /></label>
      </div>
       <div class="border-row">
          <label for="borderShadow">Effect Type</label>
          <div class="border-select-wrapper">
              <select id="borderShadowSelect" class="border-dropdown">
               <!-- TODO: complete the dropdown options box from bottom spread-0.01 and x,y- 0  radii- 0.01, weight- 1-->
              <option class="border-option" value="none">None</option>
              <option class="border-option" value="shadow">Shadow</option>
              <option class="border-option" value="border">Border</option>
            </select>
            </div>
          </div>

          <div class="border-content border-disabled">
          <label>Weight <input type="number" id="borderWeight" min="0" step="0.1" /></label>
          <!-- TODO: Change the styling of the color palette -->
          <label>Color <input type="color"  id="borderColor" class="custom-color-style"/></label>
          <label>Opacity % <input type="number" id="borderOpacity" min="0" max="100" /></label>
          </div>

          <div class="shadow-content shadow-disabled">
          <label>Position</label>
          <div class="shadow-position">
          <label>X <input type="number" id="shadowX" min="-20" max="20" value="0" placeholder="-20 to 20" /></label>
          <label>Y <input type="number" id="shadowY" min="-20" max="20" value="0" placeholder="-20 to 20" /></label>
          </div>
          <label>Spread <input type="number" id="shadowSpread" min="0" max="20" value="2" step="0.01" /></label>
          <!-- TODO: Change the styling of the color palette -->
          <label>Color <input type="color" id="shadowColor" class="custom-color-style"/></label>
          <label>Opacity % <input type="number" id="shadowOpacity" min="0" max="100" value="100" step="1"/></label>
          </div>
        </div>
  `;
}

setTimeout(() => {

  const borderShadowSelect = document.getElementById("borderShadowSelect");
  const borderContent = document.querySelector(".border-content");
  const shadowContent = document.querySelector(".shadow-content");
  const crispToggle = document.getElementById("crispLabelToggle");
  if (crispToggle) {
    crispToggle.addEventListener("click", () => {
      const isOn = crispToggle.dataset.state === "off";

      crispToggle.src = `lib/icons/${isOn ? 'ToggleOn' : 'ToggleOff'}.svg`;
      crispToggle.dataset.state = isOn ? 'on' : 'off';

      // Enable or disable the section
      if (isOn) {
        console.log("Crisp Edges enabled");
      } else {
        console.log("Crisp Edges disabled");
      }
    });
  }

  if (borderShadowSelect && borderContent) {
    borderShadowSelect.addEventListener("change", () => {

      const selectedValue = borderShadowSelect.value;

      if (selectedValue === "none") {
        borderContent.classList.add("border-disabled");
        shadowContent.classList.add("shadow-disabled");
      } else if (selectedValue === "border") {
        shadowContent.classList.add("shadow-disabled");
        borderContent.classList.remove("border-disabled");
      }
      else if (selectedValue === "shadow") {
        borderContent.classList.add("border-disabled");
        shadowContent.classList.remove("shadow-disabled");
      }

    });
  }
}, 0);

function getTemporalAxesHTML() {
  return `
    <div class="temporal-axes-container">
      <div class="toggle-row" id="toggleRow">
        <span class="toggle-label">Show Axes</span>
        <img 
          src="lib/icons/ToggleOff.svg" 
          alt="Toggle" 
          class="toggle-switch" 
          id="showAxesToggle" 
          data-state="off"
          style="cursor: pointer;"
        />
      </div>
      <div id="temporalSettings" class="temporal-axes-hidden">
        ${getTemporalSettingsHTML()}
      </div>
      <div class="toggle-row toggle-section-gap" id="toggleStreamsRow">
        <span class="toggle-label">Split Streams</span>
        <img 
          src="lib/icons/ToggleOff.svg" 
          alt="Toggle" 
          class="toggle-switch" 
          id="splitStreamsToggle" 
          data-state="off"
          style="cursor: pointer;"
        />
      </div>
      <div id="splitStreamSettings" class="temporal-axes-hidden">
        ${getSplitStreamsHTML()}
      </div>
    </div>
  `;
}

function getSplitStreamsHTML() {

  return `
    <div class="temporal-settings stream-settings">
      <div id="splitStreamSettingsInput">
      <label>X padding <input type="number" id="xPaddingStream" min="0" max="20" value="0" step="0.001" placeholder="0-20" /></label>
      <label>X Margin <input type="number" id="xMarginStream" min="0" max="50" value="0" step="0.001" placeholder="0-50" /></label>
      </div>
    </div>
  `;


}



function getTemporalSettingsHTML() {
  return `
    <div class="temporal-settings">
      <label>Weight <input type="number" id="temporalAxisWeight" min="0.01" max="10" value="3" step="0.01" placeholder="0.01-10" /></label>
       <!-- TODO: Change the styling of the color palette -->
      <label>Color <input type="color" class="custom-color-style" id="temporalAxisColor" /></label>
      <label>Show timestamp 
        <img src="lib/icons/ToggleOff.svg" 
             id="timestampToggle" 
             data-state="off" 
             style="cursor:pointer; width: 30px;"
        />
      </label>
      <div id="timestampDependentSettings">
      <label>Time label start <input type="number" id="timeLabelStart" placeholder="0" value="0" /></label>
      <label>Time label steps <input type="number" id="timeLabelSteps" /></label>
      <label>Text Size <input type="number" id="timestampTextSize" min="5" max="50" value="15" step="0.1" placeholder="5-50" /></label>
      <label>Text offset <input type="number" id="timestampTextOffset" min="10" max="100" value="75" step="1" placeholder="10-100" /></label>
      </div>
    </div>
  `;
}

setTimeout(() => {
  const timestampToggle = document.getElementById("timestampToggle");
  const dependentSection = document.getElementById("timestampDependentSettings");

  if (timestampToggle && dependentSection) {
    timestampToggle.addEventListener("click", () => {
      const isOn = timestampToggle.dataset.state === "on";

      timestampToggle.src = `lib/icons/${isOn ? 'ToggleOff' : 'ToggleOn'}.svg`;
      timestampToggle.dataset.state = isOn ? 'off' : 'on';

      // Enable or disable the section
      if (isOn) {
        dependentSection.classList.add("disabled-section");
      } else {
        dependentSection.classList.remove("disabled-section");
      }
    });
  }
}, 0);

setTimeout(() => {
  const splitStreamsToggle = document.getElementById("splitStreamsToggle");
  const splitStreamSettings = document.getElementById("splitStreamSettings");

  if (splitStreamsToggle && splitStreamSettings) {
    splitStreamsToggle.addEventListener("click", () => {
      const isOn = splitStreamsToggle.dataset.state === "on";

      splitStreamsToggle.src = `lib/icons/${isOn ? 'ToggleOff' : 'ToggleOn'}.svg`;
      splitStreamsToggle.dataset.state = isOn ? 'off' : 'on';

      splitStreamSettings.classList.toggle("temporal-axes-hidden", isOn);
    });
  }
}, 0);

setTimeout(() => {
  const toggle = document.getElementById("showAxesToggle");
  const settings = document.getElementById("temporalSettings");

  if (toggle && settings) {
    toggle.addEventListener("click", () => {
      const isOn = toggle.dataset.state === "on";

      toggle.src = `lib/icons/${isOn ? 'ToggleOff' : 'ToggleOn'}.svg`;
      toggle.dataset.state = isOn ? 'off' : 'on';

      settings.classList.toggle("temporal-axes-hidden", isOn);
    });
  }
}, 0);


// function getImportExportHTML() {

//   return `
//   <div class="impexp-div">
//   <button class="impexp-btn">Import Settings</button>
//   <button class="impexp-btn">Export Settings</button>
//   </div>
//   `
// }

function getDownloadHTML() {

  return `
  <div class="download-div">
  <span class="download-text">Save as SVG</span>
  <button class="download-btn">Download</button>

  </div>`

}

function getVisualizatoinSVG() {
  const drawingGroup = document.getElementById("drawing-group1");
  return drawingGroup ? drawingGroup.closest("svg") : document.querySelector("svg");
}

setTimeout( () => {
  const downloadBtn = document.querySelector(".download-btn");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {

      const svgElement = getVisualizatoinSVG();

      if (!svgElement) {
        console.error("No SVG elemet found");
        return;
      }
      
      saveSVG(svgElement, "tree");
    });
  }
}, 0);




function getLayerListHTML() {

  // Define color palette for layers
  const layerColors = getAllLayerColors();

  // Use globalMaxLayer + 1 because layers are 0-indexed (layer 0, layer 1, layer 2...)
  const numLayers = globalMaxLayer + 1;


  // Generate layers array dynamically
  const layers = [];
  for (let i = 0; i < numLayers; i++) {

    // Check if we have a custom color for this layer, otherwise use default
    const layerColor = customLayerColors[i] || layerColors[i % layerColors.length];

    layers.push({
      name: `Layer ${i + 1}`, // Display as Layer 1, Layer 2, etc.
      color: layerColor, // Use custom color if available
      visible: true, // Only first layer visible by default
      locked: true // All layers locked by default
    });
  }

  const layerHTML = layers.map((layer, index) => `
    <div class="layer-item">
      <label class="layer-color-label layer-color-display">
        <input type="color" class="layer-color-input" 
               value="${layer.color}" 
               data-layer-index="${index}">
        <span class="layer-color-swatch" 
              style="background-color: ${layer.color};"></span>
      </label>
      <span class="layer-name">${layer.name}</span>
      <span class="layer-icon visibility">
       <img src="lib/icons/${layer.visible ? 'Eye.svg' : 'EyeSlash.svg'}" alt="visibility">
      </span>
      <span class="layer-icon lock">
        <img src="lib/icons/${layer.locked ? 'LockSimple.svg' : 'LockSimpleOpen.svg'}" alt="lock">
      </span>
    </div>
  `).join('');

  // Add hidden color input
  return `
    ${layerHTML}
  `;
}


document.querySelectorAll('.layer-color').forEach(el => {
  el.style.backgroundColor = el.dataset.color;
});


document.querySelectorAll('.arrow-icon').forEach(arrow => {
  arrow.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent bubbling to avoid unexpected behavior
    const section = arrow.closest('.various-section');
    section.classList.toggle('active');
  });
});


// Function to update layer list when dataset changes
function updateLayerList() {
  const layersDropdown = document.querySelector('.dropdown-layers');
  if (layersDropdown) {
    layersDropdown.innerHTML = getLayerListHTML();

    // Re-apply color styles to new elements
    document.querySelectorAll('.layer-color').forEach(el => {
      el.style.backgroundColor = el.dataset.color;
    });

    // Use setTimeout for consistency (like all your other code)
    setTimeout(() => {
      addLayerToggleListeners();
      updateColorSwatches();
    }, 0);
  }
}

setTimeout(() => {
  const colorScaleSelect = document.getElementById("colorScaleSelect");

  if (colorScaleSelect) {
    // Initial toggle based on current selection
    toggleLayerColorsDisplay();

    // Add event listener for future changes
    colorScaleSelect.addEventListener("change", function () {
      toggleLayerColorsDisplay();
    });
  }
}, 0);

function toggleLayerColorsDisplay() {
  const colorScaleSelect = document.getElementById("colorScaleSelect");
  const isDiscrete = colorScaleSelect && colorScaleSelect.value === "discrete";

  // Get all color display elements
  const colorDisplayElements = document.querySelectorAll('.layer-color-display');

  // Toggle visibility based on discrete selection
  colorDisplayElements.forEach(element => {
    if (isDiscrete) {
      element.classList.remove('layer-color-display-none');
    } else {
      element.classList.add('layer-color-display-none');
    }
  });
}

function addLayerToggleListeners() {

  // Check if discrete is selected before adding color change listeners
  const colorScaleSelect = document.getElementById("colorScaleSelect");
  const isDiscrete = !colorScaleSelect || colorScaleSelect.value === "discrete";


  // Only add color input listeners if in discrete mode
  if (isDiscrete) {
    document.querySelectorAll('.layer-color-input').forEach(colorInput => {
      colorInput.addEventListener('change', (e) => {
        const newColor = e.target.value;
        const layerIndex = parseInt(colorInput.dataset.layerIndex);

        // Update the visual swatch
        const swatch = colorInput.nextElementSibling;
        swatch.style.backgroundColor = newColor;

        // Save the custom color
        customLayerColors[layerIndex] = newColor;

        // Log the change
        const layerName = colorInput.closest('.layer-item').querySelector('.layer-name').textContent;
        // console.log(`${layerName} color changed to: ${newColor}`);

        //Trigger UI state update
        if (window.UIMapper && window.UIMapper.forceUpdate) {
          window.UIMapper.forceUpdate();
        }
      });
    });
  }

  // Handle visibility toggle
  document.querySelectorAll('.layer-icon.visibility img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();

      const isVisible = img.src.includes('Eye.svg');
      img.src = `lib/icons/${isVisible ? 'EyeSlash.svg' : 'Eye.svg'}`;

      const layerItem = img.closest('.layer-item');
      const layerName = layerItem.querySelector('.layer-name').textContent;

      // console.log(`${layerName} visibility: ${!isVisible ? 'visible' : 'hidden'}`);

      //Trigger UI state update
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        setTimeout(() => window.UIMapper.forceUpdate(), 50);
      }
    });
  });

  // Handle lock toggle
  document.querySelectorAll('.layer-icon.lock img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();

      const isLocked = img.src.includes('LockSimple.svg');
      img.src = `lib/icons/${isLocked ? 'LockSimpleOpen.svg' : 'LockSimple.svg'}`;

      const layerItem = img.closest('.layer-item');
      const layerName = layerItem.querySelector('.layer-name').textContent;

      // console.log(`${layerName} lock: ${!isLocked ? 'locked' : 'unlocked'}`);

      //Trigger UI state update
      if (window.UIMapper && window.UIMapper.forceUpdate) {
        setTimeout(() => window.UIMapper.forceUpdate(), 50);
      }
    });
  });
}

function updateLayerColors() {
  const newColors = getAllLayerColors();

  document.querySelectorAll('.layer-color-input').forEach((colorInput, index) => {
    // ✅ FIX: Always update to new scheme colors (removes the custom color check)
    const newColor = newColors[index % newColors.length];
    colorInput.value = newColor;

    // Update the visual swatch too
    const swatch = colorInput.nextElementSibling;
    if (swatch) {
      swatch.style.backgroundColor = newColor;
    }

    // ✅ FIX: Remove this layer from customLayerColors since we're updating it
    delete customLayerColors[index];
  });

  // console.log("✅ All layer colors updated to new scheme");
}

// Function to get all layer colors (custom + default)
function getAllLayerColors() {
  const defaultColors = ['#E65077', '#5D7CFA', '#F68C3D', '#181E2E', '#EC5B5B', '#2E8B57', '#FF6347', '#4169E1'];

  // Check if we're using discrete colors and have a selected scheme
  // Add null check for the function


  const colorScaleSelect = document.getElementById("colorScaleSelect");
  const isDiscreteMode = colorScaleSelect && colorScaleSelect.value === "discrete";
  // console.log('Is discrete mode:', isDiscreteMode);

  let sourceColors = defaultColors;

  // If we're in discrete mode and have a selected color scheme, use those colors
  if (isDiscreteMode) {
    const selectedScheme = window.getSelectedDiscreteColorScheme ? window.getSelectedDiscreteColorScheme() : null;
    if (selectedScheme && selectedScheme.colors) {
      sourceColors = selectedScheme.colors;
      // console.log("✅ Using selected discrete color scheme colors for layers:", sourceColors);
    } else {
      // ✅ FIX: If no scheme selected, ensure we have the default scheme
      // console.log("⚠️ No selected scheme, ensuring default scheme exists");
      setDefaultDiscreteScheme(); // This creates selectedDiscreteColorScheme

      // Try again after setting default
      const defaultScheme = window.getSelectedDiscreteColorScheme ? window.getSelectedDiscreteColorScheme() : null;
      if (defaultScheme && defaultScheme.colors) {
        sourceColors = defaultScheme.colors;
        // console.log("✅ Using auto-generated default scheme colors for layers:", sourceColors);
      } else {
        // console.log("❌ Still no scheme available, using hardcoded defaults");
      }
    }
  } else {
    // console.log("Using default colors for layers (not in discrete mode)");
  }



  const allColors = [];

  for (let i = 0; i < globalMaxLayer + 1; i++) {
    // First check for custom colors (user manually changed color)
    // Then use colors from selected scheme, then fall back to defaults
    allColors[i] = customLayerColors[i] || sourceColors[i % sourceColors.length];
  }

  // console.log("Final layer colors:", allColors);
  return allColors;
}

// Expose this function globally
window.getAllLayerColors = getAllLayerColors;