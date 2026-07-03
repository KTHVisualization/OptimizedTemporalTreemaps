/**
 * Dataset Loader
 * Handles dynamic loading of dataset files on demand
 */

// This part of the code loads dataset files on demand
const DatasetLoader = {
  // Track loaded datasets
  loadedDatasets: {},
  
  // Load a dataset on demand (modern ES6+ method syntax)
  async loadDataset(datasetId, isCompare=false) {
    
    if (this.loadedDatasets[datasetId]) {
      return this.loadedDatasets[datasetId];
    }
    
    try {
      // Load the dataset JS file dynamically
      const folderPath = isCompare ? 'data_compare' : 'data';
      await this.loadScript(`${folderPath}/${datasetId}.js`);
      
      // Check if the global variable was created
      if (window[datasetId]) {
        // Store reference to the loaded global variable
        this.loadedDatasets[datasetId] = window[datasetId];
        return this.loadedDatasets[datasetId];
      } else {
        console.error(`Script loaded but dataset variable ${datasetId} not found`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load dataset: ${datasetId}`, error);
      return null;
    }
  },
  
  // Utility to load script files dynamically (modern ES6+ method syntax)
  loadScript(src) {

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        resolve();
      };
      script.onerror = (err) => {
        console.error(`Script failed to load: ${src}`, err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  },
};

export { DatasetLoader };